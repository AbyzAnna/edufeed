/**
 * WebRTC Video Calling for Study Rooms
 *
 * This module provides peer-to-peer video/audio calling using WebRTC.
 * Uses Supabase Realtime for signaling.
 */

import { createBrowserClient } from '@supabase/ssr';

// ICE servers for NAT traversal
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export interface Participant {
  id: string;
  peerId: string;
  name: string;
  image?: string;
  stream?: MediaStream;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
}

export interface WebRTCEvents {
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (peerId: string) => void;
  onParticipantUpdated?: (participant: Participant) => void;
  onStreamReceived?: (peerId: string, stream: MediaStream) => void;
  onStreamRemoved?: (peerId: string) => void;
  onConnectionStateChange?: (peerId: string, state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
  onLocalStreamReady?: (stream: MediaStream) => void;
}

export interface MediaSettings {
  audio: boolean;
  video: boolean;
  screenShare: boolean;
}

type SignalType = 'offer' | 'answer' | 'ice-candidate' | 'media-state' | 'join' | 'leave';

interface SignalPayload {
  type: SignalType;
  from: string;
  fromName: string;
  fromImage?: string;
  to?: string;
  data?: RTCSessionDescriptionInit | RTCIceCandidateInit | MediaSettings | null;
}

export class WebRTCClient {
  private roomId: string;
  private peerId: string;
  private peerName: string;
  private peerImage?: string;
  private events: WebRTCEvents;
  private supabase: ReturnType<typeof createBrowserClient>;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private participants: Map<string, Participant> = new Map();
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private channel: ReturnType<ReturnType<typeof createBrowserClient>['channel']> | null = null;
  private mediaSettings: MediaSettings = { audio: false, video: false, screenShare: false };
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();

  constructor(
    roomId: string,
    peerId: string,
    peerName: string,
    peerImage: string | undefined,
    events: WebRTCEvents
  ) {
    this.roomId = roomId;
    this.peerId = peerId;
    this.peerName = peerName;
    this.peerImage = peerImage;
    this.events = events;

    this.supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  /**
   * Initialize local media and join the room
   */
  async join(settings: MediaSettings): Promise<void> {
    this.mediaSettings = settings;

    // Get local media stream
    if (settings.audio || settings.video) {
      // Check if mediaDevices is available (requires HTTPS or localhost)
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        console.warn('getUserMedia not available - requires HTTPS or localhost');
        this.events.onError?.(new Error('Camera/microphone access requires HTTPS or localhost'));
      } else {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            audio: settings.audio ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            } : false,
            video: settings.video ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              facingMode: 'user',
            } : false,
          });
          this.events.onLocalStreamReady?.(this.localStream);
        } catch (error) {
          console.error('Failed to get local media:', error);
          this.events.onError?.(error instanceof Error ? error : new Error('Failed to access camera/microphone'));
        }
      }
    }

    // Subscribe to signaling channel
    this.channel = this.supabase.channel(`study-room:${this.roomId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: this.peerId },
      },
    });

    this.channel
      .on('broadcast', { event: 'signal' }, ({ payload }: { payload: SignalPayload }) => {
        this.handleSignal(payload);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: { user_id: string; name: string; image?: string }[] }) => {
        if (key !== this.peerId && newPresences.length > 0) {
          const presence = newPresences[0];
          this.handleParticipantJoined(key, presence.name, presence.image);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        if (key !== this.peerId) {
          this.handleParticipantLeft(key);
        }
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          await this.channel?.track({
            user_id: this.peerId,
            name: this.peerName,
            image: this.peerImage,
            online_at: new Date().toISOString(),
          });

          // Broadcast join to existing participants
          this.broadcast({
            type: 'join',
            from: this.peerId,
            fromName: this.peerName,
            fromImage: this.peerImage,
          });
        }
      });
  }

  /**
   * Leave the room and cleanup
   */
  async leave(): Promise<void> {
    // Broadcast leave
    this.broadcast({
      type: 'leave',
      from: this.peerId,
      fromName: this.peerName,
    });

    // Close all peer connections
    this.peerConnections.forEach((pc, peerId) => {
      pc.close();
      this.events.onParticipantLeft?.(peerId);
    });
    this.peerConnections.clear();
    this.remoteStreams.clear();
    this.participants.clear();
    this.pendingCandidates.clear();

    // Stop local streams
    this.stopLocalStream();
    this.stopScreenShare();

    // Unsubscribe from channel
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
  }

  /**
   * Toggle audio on/off
   */
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.mediaSettings.audio = audioTrack.enabled;
        this.broadcastMediaState();
        return audioTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Toggle video on/off
   */
  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.mediaSettings.video = videoTrack.enabled;
        this.broadcastMediaState();
        return videoTrack.enabled;
      }
    }
    return false;
  }

  /**
   * Start screen sharing
   */
  async startScreenShare(): Promise<MediaStream | null> {
    // Check if getDisplayMedia is available
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      console.warn('getDisplayMedia not available');
      return null;
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      // Handle screen share end (user clicks "Stop sharing")
      this.screenStream.getVideoTracks()[0].onended = () => {
        this.stopScreenShare();
      };

      // Replace video track in all peer connections
      const videoTrack = this.screenStream.getVideoTracks()[0];
      this.peerConnections.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender && videoTrack) {
          sender.replaceTrack(videoTrack);
        }
      });

      this.mediaSettings.screenShare = true;
      this.broadcastMediaState();
      return this.screenStream;
    } catch (error) {
      console.error('Failed to start screen share:', error);
      return null;
    }
  }

  /**
   * Stop screen sharing
   */
  stopScreenShare(): void {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());

      // Restore camera video track
      if (this.localStream) {
        const cameraTrack = this.localStream.getVideoTracks()[0];
        if (cameraTrack) {
          this.peerConnections.forEach((pc) => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(cameraTrack);
            }
          });
        }
      }

      this.screenStream = null;
      this.mediaSettings.screenShare = false;
      this.broadcastMediaState();
    }
  }

  /**
   * Get current media settings
   */
  getMediaSettings(): MediaSettings {
    return { ...this.mediaSettings };
  }

  /**
   * Get local stream
   */
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get all participants
   */
  getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  // Private methods

  private stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  private broadcast(payload: SignalPayload): void {
    this.channel?.send({
      type: 'broadcast',
      event: 'signal',
      payload,
    });
  }

  private broadcastMediaState(): void {
    this.broadcast({
      type: 'media-state',
      from: this.peerId,
      fromName: this.peerName,
      data: this.mediaSettings,
    });
  }

  private handleSignal(payload: SignalPayload): void {
    // Ignore messages from self
    if (payload.from === this.peerId) return;

    // If message is targeted, ignore if not for us
    if (payload.to && payload.to !== this.peerId) return;

    switch (payload.type) {
      case 'join':
        this.handleParticipantJoined(payload.from, payload.fromName, payload.fromImage);
        break;
      case 'leave':
        this.handleParticipantLeft(payload.from);
        break;
      case 'offer':
        this.handleOffer(payload.from, payload.fromName, payload.fromImage, payload.data as RTCSessionDescriptionInit);
        break;
      case 'answer':
        this.handleAnswer(payload.from, payload.data as RTCSessionDescriptionInit);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(payload.from, payload.data as RTCIceCandidateInit);
        break;
      case 'media-state':
        this.handleMediaState(payload.from, payload.data as MediaSettings);
        break;
    }
  }

  private async handleParticipantJoined(peerId: string, name: string, image?: string): Promise<void> {
    if (this.peerConnections.has(peerId)) return;

    // Create participant entry
    const participant: Participant = {
      id: peerId,
      peerId,
      name,
      image,
      isAudioOn: false,
      isVideoOn: false,
      isScreenSharing: false,
      isSpeaking: false,
    };
    this.participants.set(peerId, participant);
    this.events.onParticipantJoined?.(participant);

    // Create offer as the newer peer (we just received their join)
    await this.createPeerConnection(peerId, true, name, image);
  }

  private handleParticipantLeft(peerId: string): void {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    this.remoteStreams.delete(peerId);
    this.participants.delete(peerId);
    this.pendingCandidates.delete(peerId);
    this.events.onParticipantLeft?.(peerId);
    this.events.onStreamRemoved?.(peerId);
  }

  private async createPeerConnection(
    peerId: string,
    createOffer: boolean,
    name: string,
    image?: string
  ): Promise<RTCPeerConnection> {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peerConnections.set(peerId, pc);

    // Add local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.broadcast({
          type: 'ice-candidate',
          from: this.peerId,
          fromName: this.peerName,
          to: peerId,
          data: event.candidate.toJSON(),
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if (stream) {
        this.remoteStreams.set(peerId, stream);
        const participant = this.participants.get(peerId);
        if (participant) {
          participant.stream = stream;
          this.events.onParticipantUpdated?.(participant);
        }
        this.events.onStreamReceived?.(peerId, stream);
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      this.events.onConnectionStateChange?.(peerId, pc.connectionState);

      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        // Try to reconnect
        this.reconnect(peerId, name, image);
      }
    };

    // Create offer if we're the initiator
    if (createOffer) {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      this.broadcast({
        type: 'offer',
        from: this.peerId,
        fromName: this.peerName,
        fromImage: this.peerImage,
        to: peerId,
        data: pc.localDescription!,
      });
    }

    return pc;
  }

  private async handleOffer(
    peerId: string,
    name: string,
    image: string | undefined,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    // Create participant entry if not exists
    if (!this.participants.has(peerId)) {
      const participant: Participant = {
        id: peerId,
        peerId,
        name,
        image,
        isAudioOn: false,
        isVideoOn: false,
        isScreenSharing: false,
        isSpeaking: false,
      };
      this.participants.set(peerId, participant);
      this.events.onParticipantJoined?.(participant);
    }

    let pc = this.peerConnections.get(peerId);
    if (!pc) {
      pc = await this.createPeerConnection(peerId, false, name, image);
    }

    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Apply any pending ICE candidates
    const pending = this.pendingCandidates.get(peerId) || [];
    for (const candidate of pending) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
    this.pendingCandidates.delete(peerId);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    this.broadcast({
      type: 'answer',
      from: this.peerId,
      fromName: this.peerName,
      to: peerId,
      data: pc.localDescription!,
    });
  }

  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (pc && pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      // Apply any pending ICE candidates
      const pending = this.pendingCandidates.get(peerId) || [];
      for (const candidate of pending) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      this.pendingCandidates.delete(peerId);
    }
  }

  private async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(peerId);
    if (pc && pc.remoteDescription) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } else {
      // Queue the candidate for later
      const pending = this.pendingCandidates.get(peerId) || [];
      pending.push(candidate);
      this.pendingCandidates.set(peerId, pending);
    }
  }

  private handleMediaState(peerId: string, settings: MediaSettings): void {
    const participant = this.participants.get(peerId);
    if (participant) {
      participant.isAudioOn = settings.audio;
      participant.isVideoOn = settings.video;
      participant.isScreenSharing = settings.screenShare;
      this.events.onParticipantUpdated?.(participant);
    }
  }

  private async reconnect(peerId: string, name: string, image?: string): Promise<void> {
    const oldPc = this.peerConnections.get(peerId);
    if (oldPc) {
      oldPc.close();
      this.peerConnections.delete(peerId);
    }

    // Wait a bit before reconnecting
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Only reconnect if still in room
    if (this.channel) {
      await this.createPeerConnection(peerId, true, name, image);
    }
  }
}

/**
 * React hook for WebRTC client
 */
export function useWebRTC(
  roomId: string | null,
  userId: string | null,
  userName: string | null,
  userImage: string | undefined,
  events: WebRTCEvents
): WebRTCClient | null {
  if (!roomId || !userId || !userName) return null;
  return new WebRTCClient(roomId, userId, userName, userImage, events);
}
