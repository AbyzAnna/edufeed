/**
 * React Hook for WebRTC Study Room
 *
 * Manages the WebRTC client lifecycle and provides
 * reactive state for video calling.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { WebRTCClient, Participant, MediaSettings, WebRTCEvents } from './webrtc';

export interface UseWebRTCRoomOptions {
  roomId: string;
  userId: string;
  userName: string;
  userImage?: string;
  autoJoin?: boolean;
  initialMediaSettings?: Partial<MediaSettings>;
}

export interface UseWebRTCRoomReturn {
  // Connection state
  isJoined: boolean;
  isJoining: boolean;
  error: Error | null;

  // Local media
  localStream: MediaStream | null;
  isAudioOn: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;

  // Remote participants
  participants: Participant[];

  // Actions
  join: (settings?: Partial<MediaSettings>) => Promise<void>;
  leave: () => Promise<void>;
  toggleAudio: () => boolean;
  toggleVideo: () => boolean;
  startScreenShare: () => Promise<MediaStream | null>;
  stopScreenShare: () => void;
}

export function useWebRTCRoom(options: UseWebRTCRoomOptions): UseWebRTCRoomReturn {
  const { roomId, userId, userName, userImage, autoJoin = false, initialMediaSettings } = options;

  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioOn, setIsAudioOn] = useState(initialMediaSettings?.audio ?? false);
  const [isVideoOn, setIsVideoOn] = useState(initialMediaSettings?.video ?? false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const clientRef = useRef<WebRTCClient | null>(null);
  const isMountedRef = useRef(true);

  // Create event handlers
  const events: WebRTCEvents = {
    onLocalStreamReady: (stream) => {
      if (isMountedRef.current) {
        setLocalStream(stream);
      }
    },
    onParticipantJoined: (participant) => {
      if (isMountedRef.current) {
        setParticipants(prev => {
          // Avoid duplicates
          if (prev.find(p => p.peerId === participant.peerId)) return prev;
          return [...prev, participant];
        });
      }
    },
    onParticipantLeft: (peerId) => {
      if (isMountedRef.current) {
        setParticipants(prev => prev.filter(p => p.peerId !== peerId));
      }
    },
    onParticipantUpdated: (participant) => {
      if (isMountedRef.current) {
        setParticipants(prev =>
          prev.map(p => (p.peerId === participant.peerId ? participant : p))
        );
      }
    },
    onStreamReceived: (peerId, stream) => {
      if (isMountedRef.current) {
        setParticipants(prev =>
          prev.map(p => (p.peerId === peerId ? { ...p, stream } : p))
        );
      }
    },
    onStreamRemoved: (peerId) => {
      if (isMountedRef.current) {
        setParticipants(prev =>
          prev.map(p => (p.peerId === peerId ? { ...p, stream: undefined } : p))
        );
      }
    },
    onError: (err) => {
      if (isMountedRef.current) {
        setError(err);
      }
    },
  };

  // Initialize client
  useEffect(() => {
    isMountedRef.current = true;
    clientRef.current = new WebRTCClient(roomId, userId, userName, userImage, events);

    if (autoJoin) {
      join(initialMediaSettings);
    }

    return () => {
      isMountedRef.current = false;
      if (clientRef.current) {
        clientRef.current.leave();
        clientRef.current = null;
      }
    };
  }, [roomId, userId]);

  const join = useCallback(async (settings?: Partial<MediaSettings>) => {
    if (!clientRef.current || isJoined || isJoining) return;

    setIsJoining(true);
    setError(null);

    const mediaSettings: MediaSettings = {
      audio: settings?.audio ?? isAudioOn,
      video: settings?.video ?? isVideoOn,
      screenShare: false,
    };

    try {
      await clientRef.current.join(mediaSettings);
      setIsAudioOn(mediaSettings.audio);
      setIsVideoOn(mediaSettings.video);
      setIsJoined(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to join room'));
    } finally {
      setIsJoining(false);
    }
  }, [isJoined, isJoining, isAudioOn, isVideoOn]);

  const leave = useCallback(async () => {
    if (!clientRef.current || !isJoined) return;

    try {
      await clientRef.current.leave();
      setIsJoined(false);
      setLocalStream(null);
      setParticipants([]);
      setIsAudioOn(false);
      setIsVideoOn(false);
      setIsScreenSharing(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to leave room'));
    }
  }, [isJoined]);

  const toggleAudio = useCallback(() => {
    if (!clientRef.current || !isJoined) return false;
    const newState = clientRef.current.toggleAudio();
    setIsAudioOn(newState);
    return newState;
  }, [isJoined]);

  const toggleVideo = useCallback(() => {
    if (!clientRef.current || !isJoined) return false;
    const newState = clientRef.current.toggleVideo();
    setIsVideoOn(newState);
    return newState;
  }, [isJoined]);

  const startScreenShare = useCallback(async () => {
    if (!clientRef.current || !isJoined) return null;
    const stream = await clientRef.current.startScreenShare();
    if (stream) {
      setIsScreenSharing(true);
    }
    return stream;
  }, [isJoined]);

  const stopScreenShare = useCallback(() => {
    if (!clientRef.current || !isJoined) return;
    clientRef.current.stopScreenShare();
    setIsScreenSharing(false);
  }, [isJoined]);

  return {
    isJoined,
    isJoining,
    error,
    localStream,
    isAudioOn,
    isVideoOn,
    isScreenSharing,
    participants,
    join,
    leave,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
  };
}
