"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/SessionProvider";
import {
  ArrowLeft,
  Send,
  Copy,
  Bot,
  FileText,
  Users,
  MessageSquare,
  Settings,
  X,
  Monitor,
} from "lucide-react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import VideoGrid from "./VideoGrid";
import MediaControls from "./MediaControls";
import { useWebRTCRoom } from "@/lib/study-room/useWebRTCRoom";

interface Message {
  id: string;
  type: string;
  content: string;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface StudyRoom {
  id: string;
  title: string;
  description: string | null;
  code: string;
  isActive: boolean;
  hostId: string;
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
  notebook?: {
    id: string;
    title: string;
    emoji: string | null;
    sources: Array<{
      id: string;
      title: string;
      type: string;
      status: string;
    }>;
  } | null;
  participants: Array<{
    id: string;
    userId: string;
    role: string;
    status: string;
    isAudioOn: boolean;
    isVideoOn: boolean;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }>;
  messages: Message[];
  settings: {
    allowAudio: boolean;
    allowVideo: boolean;
    allowChat: boolean;
    allowAnnotations: boolean;
  };
}

interface StudyRoomViewProps {
  roomId: string;
}

type PanelType = "chat" | "participants" | "materials" | null;

export default function StudyRoomView({ roomId }: StudyRoomViewProps) {
  const { user } = useAuth();
  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelType>("chat");
  const [copied, setCopied] = useState(false);
  const [showPreJoin, setShowPreJoin] = useState(true);
  const [preJoinAudio, setPreJoinAudio] = useState(true);
  const [preJoinVideo, setPreJoinVideo] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const previewStreamRef = useRef<MediaStream | null>(null);

  // WebRTC hook
  const webrtc = useWebRTCRoom({
    roomId,
    userId: user?.id || "",
    userName: user?.user_metadata?.name || user?.email?.split("@")[0] || "Anonymous",
    userImage: user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined,
    autoJoin: false,
    initialMediaSettings: { audio: preJoinAudio, video: preJoinVideo },
  });

  // Fetch room data
  useEffect(() => {
    fetchRoom();
  }, [roomId]);

  // Poll for messages (until we have full realtime)
  useEffect(() => {
    if (!webrtc.isJoined) return;

    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [roomId, webrtc.isJoined]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle preview video stream for pre-join screen
  useEffect(() => {
    if (!showPreJoin || !preJoinVideo) {
      // Stop preview stream when not needed
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(track => track.stop());
        previewStreamRef.current = null;
      }
      return;
    }

    // Check if mediaDevices is available (requires HTTPS or localhost)
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia not available - requires HTTPS or localhost');
      return;
    }

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        previewStreamRef.current = stream;
        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.warn('Failed to get preview video:', error);
      });

    return () => {
      cancelled = true;
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(track => track.stop());
        previewStreamRef.current = null;
      }
    };
  }, [showPreJoin, preJoinVideo]);

  const fetchRoom = async () => {
    try {
      const response = await fetch(`/api/study-rooms/${roomId}`);
      if (response.ok) {
        const data = await response.json();
        setRoom(data);
        setMessages(data.messages?.reverse() || []);
      }
    } catch (error) {
      console.error("Failed to fetch room:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/study-rooms/${roomId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || sending) return;

    setSending(true);
    const content = messageInput.trim();
    setMessageInput("");

    try {
      const response = await fetch(`/api/study-rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          type: content.startsWith("/ask") ? "QUESTION" : "TEXT",
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleJoinCall = async () => {
    await webrtc.join({ audio: preJoinAudio, video: preJoinVideo });
    setShowPreJoin(false);

    // Update status in DB
    await fetch(`/api/study-rooms/${roomId}/participants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "ONLINE",
        isAudioOn: preJoinAudio,
        isVideoOn: preJoinVideo,
      }),
    });
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave the call?")) return;

    await webrtc.leave();

    // Update status in DB
    await fetch(`/api/study-rooms/${roomId}/participants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "leave" }),
    });

    window.location.href = "/study-rooms";
  };

  const handleToggleScreenShare = async () => {
    if (webrtc.isScreenSharing) {
      webrtc.stopScreenShare();
    } else {
      await webrtc.startScreenShare();
    }
  };

  const copyCode = async () => {
    if (room) {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const togglePanel = (panel: PanelType) => {
    setActivePanel(activePanel === panel ? null : panel);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Room not found</p>
          <Link href="/study-rooms" className="text-purple-400 hover:underline">
            Back to Study Rooms
          </Link>
        </div>
      </div>
    );
  }

  const onlineDbParticipants = (room.participants || []).filter((p) => p.status === "ONLINE");

  // Pre-join screen
  if (showPreJoin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">{room.title}</h1>
            <p className="text-white/60">Get ready to join the study session</p>
          </div>

          {/* Preview */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden mb-6">
            <div className="aspect-video bg-gray-800 flex items-center justify-center">
              {preJoinVideo ? (
                <video
                  ref={previewVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center text-4xl font-semibold text-white">
                  {(user?.user_metadata?.name || user?.email)?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>

            {/* Media toggles */}
            <div className="flex items-center justify-center gap-4 p-4 bg-gray-800/50">
              <button
                onClick={() => setPreJoinAudio(!preJoinAudio)}
                className={`p-4 rounded-xl transition-colors ${
                  preJoinAudio
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                }`}
              >
                {preJoinAudio ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => setPreJoinVideo(!preJoinVideo)}
                className={`p-4 rounded-xl transition-colors ${
                  preJoinVideo
                    ? "bg-white/10 text-white hover:bg-white/20"
                    : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                }`}
              >
                {preJoinVideo ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Room Code</span>
              <button
                onClick={copyCode}
                className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors"
              >
                <span className="font-mono text-lg">{room.code}</span>
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="text-white/60 text-sm">
              {onlineDbParticipants.length} participant{onlineDbParticipants.length !== 1 ? "s" : ""} in the room
            </div>
          </div>

          {/* Join button */}
          <button
            onClick={handleJoinCall}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-semibold text-lg transition-colors"
          >
            Join Call
          </button>

          {/* Back link */}
          <div className="text-center mt-4">
            <Link href="/study-rooms" className="text-white/60 hover:text-white transition-colors text-sm">
              ← Back to Study Rooms
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Connection status indicator
  const getConnectionStatusInfo = () => {
    if (webrtc.error) {
      return { color: 'bg-red-500', text: 'Error' };
    }
    switch (webrtc.connectionState) {
      case 'connecting':
        return { color: 'bg-yellow-500', text: 'Connecting...' };
      case 'connected':
        return { color: 'bg-green-500', text: 'Connected' };
      case 'disconnected':
        return { color: 'bg-orange-500', text: 'Reconnecting...' };
      case 'failed':
        return { color: 'bg-red-500', text: 'Connection failed' };
      case 'closed':
        return { color: 'bg-gray-500', text: 'Disconnected' };
      default:
        return { color: 'bg-green-500', text: 'Live' };
    }
  };

  const connectionStatus = getConnectionStatusInfo();

  // Main call view
  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {/* Error banner */}
      {webrtc.error && (
        <div className="bg-red-500/20 border-b border-red-500/30 px-4 py-2 text-red-400 text-sm text-center">
          {webrtc.error.message}
        </div>
      )}

      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/10 bg-black/80 backdrop-blur-xl z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/study-rooms"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                {room.title}
                <span className="relative flex h-2 w-2" title={connectionStatus.text}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${connectionStatus.color} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${connectionStatus.color}`}></span>
                </span>
              </h1>
              <div className="flex items-center gap-3 text-sm text-white/50">
                <span>{webrtc.participants.length + 1} in call</span>
                <button
                  onClick={copyCode}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <span className="font-mono">{room.code}</span>
                  <Copy className="w-3 h-3" />
                  {copied && <span className="text-green-400 text-xs">Copied!</span>}
                </button>
              </div>
            </div>
          </div>

          {/* Notebook link */}
          {room.notebook && (
            <Link
              href={`/notebook/${room.notebook.id}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors"
            >
              <span>{room.notebook.emoji || "📚"}</span>
              <span className="text-sm font-medium hidden md:block">{room.notebook.title}</span>
              <FileText className="w-4 h-4 md:hidden" />
            </Link>
          )}
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 p-2 md:p-4">
          <VideoGrid
            localStream={webrtc.localStream}
            localName={user?.user_metadata?.name || user?.email?.split("@")[0] || "You"}
            localImage={user?.user_metadata?.avatar_url || user?.user_metadata?.picture || undefined}
            isLocalAudioOn={webrtc.isAudioOn}
            isLocalVideoOn={webrtc.isVideoOn}
            isLocalScreenSharing={webrtc.isScreenSharing}
            participants={webrtc.participants}
            screenShareStream={webrtc.screenShareStream}
          />
        </div>

        {/* Side panel */}
        {activePanel && (
          <div className="w-80 border-l border-white/10 flex flex-col bg-black/50">
            {/* Panel header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <span className="font-medium text-white capitalize">{activePanel}</span>
              <button
                onClick={() => setActivePanel(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-y-auto">
              {activePanel === "chat" && (
                <div className="flex flex-col h-full">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center px-4">
                        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-3">
                          <MessageSquare className="w-6 h-6 text-purple-400" />
                        </div>
                        <p className="text-white/60 text-sm font-medium">No messages yet</p>
                        <p className="text-white/40 text-xs mt-1">Start the conversation!</p>
                        <p className="text-purple-400/60 text-xs mt-2">Tip: Type /ask to chat with AI</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isOwnMessage = msg.user?.id === user?.id;
                        const messageTime = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        if (msg.type === "SYSTEM") {
                          return (
                            <div key={msg.id} className="flex justify-center py-1">
                              <span className="text-white/40 text-xs bg-white/5 px-3 py-1 rounded-full">
                                {msg.content}
                              </span>
                            </div>
                          );
                        }

                        if (msg.type === "AI_RESPONSE") {
                          return (
                            <div key={msg.id} className="flex gap-2">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg">
                                <Bot className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-purple-400">AI Assistant</span>
                                  <span className="text-[10px] text-white/30">{messageTime}</span>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-2xl rounded-tl-sm px-3 py-2 border border-purple-500/20">
                                  <p className="text-sm text-white/90 whitespace-pre-wrap">{msg.content}</p>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        // Regular user message
                        return (
                          <div key={msg.id} className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                            {!isOwnMessage && (
                              <div className="flex-shrink-0">
                                {msg.user?.image ? (
                                  <img
                                    src={msg.user.image}
                                    alt=""
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white/10"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-sm font-medium text-white ring-2 ring-white/10">
                                    {msg.user?.name?.charAt(0).toUpperCase() || "?"}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className={`flex-1 min-w-0 ${isOwnMessage ? 'flex flex-col items-end' : ''}`}>
                              {!isOwnMessage && (
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-medium text-white/70">{msg.user?.name || "Unknown"}</span>
                                  <span className="text-[10px] text-white/30">{messageTime}</span>
                                </div>
                              )}
                              <div className={`max-w-[85%] ${
                                isOwnMessage
                                  ? 'bg-purple-600 rounded-2xl rounded-tr-sm'
                                  : 'bg-white/10 rounded-2xl rounded-tl-sm'
                              } px-3 py-2`}>
                                <p className="text-sm text-white whitespace-pre-wrap break-words">{msg.content}</p>
                              </div>
                              {isOwnMessage && (
                                <span className="text-[10px] text-white/30 mt-1 mr-1">{messageTime}</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form onSubmit={sendMessage} className="p-3 border-t border-white/10 bg-black/30">
                    <div className="relative">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message... (/ask for AI)"
                        className="w-full px-4 py-2.5 pr-12 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/40 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || sending}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                          messageInput.trim() && !sending
                            ? 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20'
                            : 'bg-white/10 text-white/30'
                        }`}
                      >
                        <Send className={`w-4 h-4 ${messageInput.trim() && !sending ? 'text-white' : 'text-white/30'}`} />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activePanel === "participants" && (
                <div className="p-3 space-y-1">
                  {/* Header with count */}
                  <div className="flex items-center justify-between px-2 py-2 mb-2">
                    <span className="text-xs font-medium text-white/50 uppercase tracking-wider">In this call</span>
                    <span className="text-xs font-semibold text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
                      {webrtc.participants.length + 1}
                    </span>
                  </div>

                  {/* Local user */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="relative flex-shrink-0">
                      {(user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                        <img src={user.user_metadata.avatar_url || user.user_metadata.picture} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white font-semibold ring-2 ring-purple-500/30">
                          {(user?.user_metadata?.name || user?.email)?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black bg-green-500 shadow-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{user?.user_metadata?.name || user?.email?.split("@")[0]}</span>
                        <span className="text-[10px] text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded font-medium">You</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${webrtc.isAudioOn ? 'text-green-400' : 'text-red-400'}`}>
                          {webrtc.isAudioOn ? 'Mic on' : 'Muted'}
                        </span>
                        <span className="text-white/20">•</span>
                        <span className={`text-xs ${webrtc.isVideoOn ? 'text-green-400' : 'text-red-400'}`}>
                          {webrtc.isVideoOn ? 'Camera on' : 'Camera off'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remote participants */}
                  {webrtc.participants.map((participant) => (
                    <div
                      key={participant.peerId}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <div className="relative flex-shrink-0">
                        {participant.image ? (
                          <img src={participant.image} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center text-white font-semibold ring-2 ring-white/10">
                            {participant.name?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black bg-green-500 shadow-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-white truncate block">{participant.name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs ${participant.isAudioOn ? 'text-green-400' : 'text-red-400'}`}>
                            {participant.isAudioOn ? 'Mic on' : 'Muted'}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className={`text-xs ${participant.isVideoOn ? 'text-green-400' : 'text-red-400'}`}>
                            {participant.isVideoOn ? 'Camera on' : 'Camera off'}
                          </span>
                          {participant.isScreenSharing && (
                            <>
                              <span className="text-white/20">•</span>
                              <span className="text-xs text-green-400 flex items-center gap-1">
                                <Monitor className="w-3 h-3" />
                                Sharing
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* No other participants */}
                  {webrtc.participants.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-white/30" />
                      </div>
                      <p className="text-white/50 text-sm">No other participants yet</p>
                      <p className="text-white/30 text-xs mt-1">Share the room code to invite others</p>
                    </div>
                  )}
                </div>
              )}

              {activePanel === "materials" && room.notebook && (
                <div className="p-3 space-y-2">
                  <Link
                    href={`/notebook/${room.notebook.id}`}
                    target="_blank"
                    className="flex items-center gap-3 p-3 rounded-xl bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 transition-colors"
                  >
                    <span className="text-2xl">{room.notebook.emoji || "📚"}</span>
                    <div>
                      <div className="font-medium text-white">{room.notebook.title}</div>
                      <div className="text-sm text-white/60">
                        {room.notebook.sources?.length || 0} sources
                      </div>
                    </div>
                  </Link>

                  {room.notebook.sources?.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                    >
                      <span className="text-xl">
                        {source.type === "PDF" && "📄"}
                        {source.type === "URL" && "🔗"}
                        {source.type === "YOUTUBE" && "🎬"}
                        {source.type === "TEXT" && "📝"}
                      </span>
                      <span className="text-sm text-white/80 truncate">{source.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <MediaControls
        isAudioOn={webrtc.isAudioOn}
        isVideoOn={webrtc.isVideoOn}
        isScreenSharing={webrtc.isScreenSharing}
        isJoined={webrtc.isJoined}
        participantCount={webrtc.participants.length + 1}
        messageCount={messages.filter((m) => m.type !== "SYSTEM").length}
        onToggleAudio={webrtc.toggleAudio}
        onToggleVideo={webrtc.toggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
        onLeave={handleLeave}
        onOpenChat={() => togglePanel("chat")}
        onOpenParticipants={() => togglePanel("participants")}
        allowAudio={room.settings.allowAudio}
        allowVideo={room.settings.allowVideo}
      />
    </div>
  );
}
