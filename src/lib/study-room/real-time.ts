/**
 * Real-time collaboration utilities for Study Rooms
 *
 * This module provides a foundation for real-time collaboration.
 * In production, you would upgrade this to use WebSockets (Socket.io, Ably, Pusher, etc.)
 *
 * Current implementation uses polling as a fallback, but the interfaces
 * are designed to be easily swapped for WebSocket implementations.
 */

export type MessageType =
  | "user_joined"
  | "user_left"
  | "chat_message"
  | "cursor_update"
  | "annotation_added"
  | "annotation_removed"
  | "room_updated"
  | "typing_start"
  | "typing_stop";

export interface RealTimeMessage {
  type: MessageType;
  roomId: string;
  userId: string;
  payload: unknown;
  timestamp: number;
}

export interface CursorPosition {
  userId: string;
  sourceId?: string;
  offset?: number;
  x?: number;
  y?: number;
}

export interface TypingIndicator {
  userId: string;
  isTyping: boolean;
}

// Connection state
export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

// Event handlers
export interface RealTimeHandlers {
  onMessage?: (message: RealTimeMessage) => void;
  onUserJoined?: (userId: string, userName: string) => void;
  onUserLeft?: (userId: string) => void;
  onCursorUpdate?: (cursor: CursorPosition) => void;
  onTypingUpdate?: (typing: TypingIndicator) => void;
  onConnectionChange?: (state: ConnectionState) => void;
  onError?: (error: Error) => void;
}

/**
 * Simple polling-based real-time client
 * Replace with WebSocket implementation for production
 */
export class StudyRoomClient {
  private roomId: string;
  private userId: string;
  private handlers: RealTimeHandlers;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastTimestamp: number = 0;
  private connectionState: ConnectionState = "disconnected";

  constructor(roomId: string, userId: string, handlers: RealTimeHandlers) {
    this.roomId = roomId;
    this.userId = userId;
    this.handlers = handlers;
  }

  async connect(): Promise<void> {
    this.setConnectionState("connecting");

    try {
      // Join the room
      await fetch(`/api/study-rooms/${this.roomId}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ONLINE" }),
      });

      this.setConnectionState("connected");
      this.startPolling();
    } catch (error) {
      this.setConnectionState("error");
      this.handlers.onError?.(error instanceof Error ? error : new Error("Connection failed"));
    }
  }

  disconnect(): void {
    this.stopPolling();

    // Leave the room
    fetch(`/api/study-rooms/${this.roomId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave" }),
    }).catch(console.error);

    this.setConnectionState("disconnected");
  }

  private startPolling(): void {
    // Poll every 2 seconds
    this.pollInterval = setInterval(() => {
      this.poll();
    }, 2000);

    // Initial poll
    this.poll();
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async poll(): Promise<void> {
    try {
      const response = await fetch(
        `/api/study-rooms/${this.roomId}/messages?since=${this.lastTimestamp}`
      );

      if (response.ok) {
        const messages = await response.json();

        for (const msg of messages) {
          const createdAt = new Date(msg.createdAt).getTime();
          if (createdAt > this.lastTimestamp) {
            this.lastTimestamp = createdAt;
            this.handleMessage({
              type: msg.type === "SYSTEM" ? "user_joined" : "chat_message",
              roomId: this.roomId,
              userId: msg.userId,
              payload: msg,
              timestamp: createdAt,
            });
          }
        }
      }
    } catch (error) {
      console.error("Polling error:", error);
    }
  }

  private handleMessage(message: RealTimeMessage): void {
    this.handlers.onMessage?.(message);

    switch (message.type) {
      case "user_joined":
        this.handlers.onUserJoined?.(message.userId, "");
        break;
      case "user_left":
        this.handlers.onUserLeft?.(message.userId);
        break;
      case "cursor_update":
        this.handlers.onCursorUpdate?.(message.payload as CursorPosition);
        break;
      case "typing_start":
      case "typing_stop":
        this.handlers.onTypingUpdate?.({
          userId: message.userId,
          isTyping: message.type === "typing_start",
        });
        break;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.handlers.onConnectionChange?.(state);
  }

  // Send methods
  async sendMessage(content: string, type: "TEXT" | "QUESTION" = "TEXT"): Promise<void> {
    try {
      await fetch(`/api/study-rooms/${this.roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type }),
      });
    } catch (error) {
      this.handlers.onError?.(error instanceof Error ? error : new Error("Failed to send message"));
    }
  }

  async updateCursor(position: Partial<CursorPosition>): Promise<void> {
    try {
      await fetch(`/api/study-rooms/${this.roomId}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cursorPosition: position }),
      });
    } catch (error) {
      // Cursor updates can fail silently
      console.error("Cursor update error:", error);
    }
  }

  async setTyping(isTyping: boolean): Promise<void> {
    // In production, this would be sent via WebSocket
    // For now, we don't persist typing status
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
}

/**
 * React hook for using the real-time client
 */
export function useStudyRoomClient(
  roomId: string | null,
  userId: string | null,
  handlers: RealTimeHandlers
): StudyRoomClient | null {
  if (!roomId || !userId) return null;

  // In a real implementation, you'd use useEffect to manage the client lifecycle
  // and useMemo to create the client instance

  return new StudyRoomClient(roomId, userId, handlers);
}

/**
 * WebSocket implementation placeholder
 *
 * To upgrade to WebSockets, you would:
 * 1. Set up a WebSocket server (Socket.io, ws, etc.)
 * 2. Replace the polling logic with WebSocket connection
 * 3. Handle reconnection and heartbeats
 * 4. Implement room channels/namespaces
 *
 * Example with Socket.io:
 *
 * ```typescript
 * import { io, Socket } from "socket.io-client";
 *
 * export class WebSocketStudyRoomClient {
 *   private socket: Socket;
 *
 *   constructor(roomId: string, userId: string, handlers: RealTimeHandlers) {
 *     this.socket = io("/study-rooms", {
 *       query: { roomId, userId },
 *     });
 *
 *     this.socket.on("connect", () => handlers.onConnectionChange?.("connected"));
 *     this.socket.on("disconnect", () => handlers.onConnectionChange?.("disconnected"));
 *     this.socket.on("message", handlers.onMessage);
 *     this.socket.on("user_joined", ({ userId, name }) => handlers.onUserJoined?.(userId, name));
 *     this.socket.on("user_left", ({ userId }) => handlers.onUserLeft?.(userId));
 *     this.socket.on("cursor_update", handlers.onCursorUpdate);
 *     this.socket.on("typing", handlers.onTypingUpdate);
 *   }
 *
 *   connect(): void {
 *     this.socket.connect();
 *   }
 *
 *   disconnect(): void {
 *     this.socket.disconnect();
 *   }
 *
 *   sendMessage(content: string): void {
 *     this.socket.emit("chat_message", { content });
 *   }
 *
 *   updateCursor(position: CursorPosition): void {
 *     this.socket.emit("cursor_update", position);
 *   }
 *
 *   setTyping(isTyping: boolean): void {
 *     this.socket.emit("typing", { isTyping });
 *   }
 * }
 * ```
 */
