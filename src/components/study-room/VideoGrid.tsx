"use client";

import { useRef, useEffect, useState } from "react";
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor,
  Pin,
  PinOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { Participant } from "@/lib/study-room/webrtc";

interface VideoTileProps {
  participant?: Participant;
  stream?: MediaStream | null;
  isLocal?: boolean;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isScreenSharing?: boolean;
  name: string;
  image?: string;
  isPinned?: boolean;
  onPin?: () => void;
  size?: "small" | "medium" | "large";
}

function VideoTile({
  participant,
  stream,
  isLocal = false,
  isMuted = false,
  isVideoOff = false,
  isScreenSharing = false,
  name,
  image,
  isPinned = false,
  onPin,
  size = "medium",
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Audio level detection for speaking indicator
  useEffect(() => {
    if (!stream || isMuted) {
      setIsSpeaking(false);
      return;
    }

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationFrame: number;

    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setIsSpeaking(average > 30);
      animationFrame = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();

    return () => {
      cancelAnimationFrame(animationFrame);
      audioContext.close();
    };
  }, [stream, isMuted]);

  const sizeClasses = {
    small: "w-24 h-24 md:w-32 md:h-32",
    medium: "w-40 h-40 md:w-48 md:h-48",
    large: "w-full h-full",
  };

  const hasVideo = stream && !isVideoOff && stream.getVideoTracks().length > 0;

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gray-900 ${sizeClasses[size]} ${
        isSpeaking ? "ring-2 ring-green-500" : ""
      } ${isPinned ? "ring-2 ring-purple-500" : ""}`}
    >
      {/* Video element */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-purple-600 flex items-center justify-center text-2xl md:text-3xl font-semibold text-white">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Name and status overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate max-w-[100px]">
              {isLocal ? "You" : name}
            </span>
            {isScreenSharing && (
              <Monitor className="w-3 h-3 text-green-400" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {isMuted ? (
              <div className="p-1 rounded bg-red-500/80">
                <MicOff className="w-3 h-3 text-white" />
              </div>
            ) : (
              <div className={`p-1 rounded ${isSpeaking ? "bg-green-500/80" : "bg-white/20"}`}>
                <Mic className="w-3 h-3 text-white" />
              </div>
            )}
            {isVideoOff && (
              <div className="p-1 rounded bg-red-500/80">
                <VideoOff className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pin button (hover) */}
      {onPin && !isLocal && (
        <button
          onClick={onPin}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
        >
          {isPinned ? (
            <PinOff className="w-4 h-4 text-white" />
          ) : (
            <Pin className="w-4 h-4 text-white" />
          )}
        </button>
      )}

      {/* Local indicator */}
      {isLocal && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-purple-600 text-xs text-white font-medium">
          You
        </div>
      )}
    </div>
  );
}

interface VideoGridProps {
  localStream: MediaStream | null;
  localName: string;
  localImage?: string;
  isLocalAudioOn: boolean;
  isLocalVideoOn: boolean;
  isLocalScreenSharing: boolean;
  participants: Participant[];
}

export default function VideoGrid({
  localStream,
  localName,
  localImage,
  isLocalAudioOn,
  isLocalVideoOn,
  isLocalScreenSharing,
  participants,
}: VideoGridProps) {
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const totalParticipants = participants.length + 1; // +1 for local

  const toggleFullscreen = async () => {
    if (!gridRef.current) return;

    if (isFullscreen) {
      await document.exitFullscreen();
    } else {
      await gridRef.current.requestFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Determine grid layout
  const getGridClasses = () => {
    if (pinnedPeerId) {
      // Pinned view: one large, rest small on the side
      return "grid-cols-1";
    }

    if (totalParticipants === 1) return "grid-cols-1 place-items-center";
    if (totalParticipants === 2) return "grid-cols-2 place-items-center";
    if (totalParticipants <= 4) return "grid-cols-2";
    if (totalParticipants <= 6) return "grid-cols-3";
    if (totalParticipants <= 9) return "grid-cols-3";
    return "grid-cols-4";
  };

  const pinnedParticipant = pinnedPeerId
    ? participants.find(p => p.peerId === pinnedPeerId)
    : null;

  const unpinnedParticipants = pinnedPeerId
    ? participants.filter(p => p.peerId !== pinnedPeerId)
    : participants;

  return (
    <div
      ref={gridRef}
      className="relative h-full bg-black rounded-2xl overflow-hidden"
    >
      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 hover:bg-black/70 transition-colors"
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5 text-white" />
        ) : (
          <Maximize2 className="w-5 h-5 text-white" />
        )}
      </button>

      {pinnedPeerId && pinnedParticipant ? (
        // Pinned layout
        <div className="flex h-full">
          {/* Main pinned video */}
          <div className="flex-1 p-4">
            <VideoTile
              participant={pinnedParticipant}
              stream={pinnedParticipant.stream}
              name={pinnedParticipant.name}
              image={pinnedParticipant.image}
              isMuted={!pinnedParticipant.isAudioOn}
              isVideoOff={!pinnedParticipant.isVideoOn}
              isScreenSharing={pinnedParticipant.isScreenSharing}
              isPinned={true}
              onPin={() => setPinnedPeerId(null)}
              size="large"
            />
          </div>

          {/* Side strip with other participants */}
          <div className="w-36 md:w-44 flex flex-col gap-2 p-2 overflow-y-auto bg-gray-900/50">
            {/* Local */}
            <VideoTile
              stream={localStream}
              isLocal={true}
              name={localName}
              image={localImage}
              isMuted={!isLocalAudioOn}
              isVideoOff={!isLocalVideoOn}
              isScreenSharing={isLocalScreenSharing}
              size="small"
            />

            {/* Other unpinned participants */}
            {unpinnedParticipants.map(participant => (
              <VideoTile
                key={participant.peerId}
                participant={participant}
                stream={participant.stream}
                name={participant.name}
                image={participant.image}
                isMuted={!participant.isAudioOn}
                isVideoOff={!participant.isVideoOn}
                isScreenSharing={participant.isScreenSharing}
                onPin={() => setPinnedPeerId(participant.peerId)}
                size="small"
              />
            ))}
          </div>
        </div>
      ) : (
        // Grid layout
        <div className={`grid gap-2 p-4 h-full ${getGridClasses()}`}>
          {/* Local video */}
          <VideoTile
            stream={localStream}
            isLocal={true}
            name={localName}
            image={localImage}
            isMuted={!isLocalAudioOn}
            isVideoOff={!isLocalVideoOn}
            isScreenSharing={isLocalScreenSharing}
            size={totalParticipants <= 2 ? "large" : "medium"}
          />

          {/* Remote participants */}
          {participants.map(participant => (
            <VideoTile
              key={participant.peerId}
              participant={participant}
              stream={participant.stream}
              name={participant.name}
              image={participant.image}
              isMuted={!participant.isAudioOn}
              isVideoOff={!participant.isVideoOn}
              isScreenSharing={participant.isScreenSharing}
              onPin={() => setPinnedPeerId(participant.peerId)}
              size={totalParticipants <= 2 ? "large" : "medium"}
            />
          ))}
        </div>
      )}

      {/* No participants message */}
      {totalParticipants === 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center">
          <p className="text-white/60 text-sm">
            Waiting for others to join...
          </p>
          <p className="text-white/40 text-xs mt-1">
            Share the room code to invite participants
          </p>
        </div>
      )}
    </div>
  );
}
