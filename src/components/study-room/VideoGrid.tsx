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
  Grid,
  User,
  LayoutGrid,
} from "lucide-react";
import type { Participant } from "@/lib/study-room/webrtc";

// View modes like Zoom
type ViewMode = "speaker" | "gallery" | "side-by-side";

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
  size?: "tiny" | "small" | "medium" | "large" | "fullscreen";
  showControls?: boolean;
  priority?: boolean; // For screen share or active speaker
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
  showControls = true,
  priority = false,
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

    try {
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
    } catch (e) {
      // AudioContext might not be available in some environments
      console.warn('Audio analysis not available:', e);
    }
  }, [stream, isMuted]);

  const sizeClasses: Record<typeof size, string> = {
    tiny: "w-20 h-14 md:w-24 md:h-16",
    small: "w-28 h-20 md:w-36 md:h-24",
    medium: "w-48 h-36 md:w-56 md:h-40",
    large: "w-full h-full min-h-[200px]",
    fullscreen: "w-full h-full",
  };

  const hasVideo = stream && !isVideoOff && stream.getVideoTracks().length > 0;

  // Avatar sizing based on tile size
  const avatarSizeClasses: Record<typeof size, string> = {
    tiny: "w-8 h-8 text-sm",
    small: "w-10 h-10 text-base",
    medium: "w-16 h-16 text-xl",
    large: "w-24 h-24 text-3xl",
    fullscreen: "w-32 h-32 text-4xl",
  };

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900 ${sizeClasses[size]} ${
        isSpeaking ? "ring-2 ring-green-500 shadow-lg shadow-green-500/20" : ""
      } ${isPinned ? "ring-2 ring-purple-500 shadow-lg shadow-purple-500/20" : ""} ${
        priority ? "ring-2 ring-blue-500" : ""
      } transition-all duration-200 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video element */}
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${isLocal && !isScreenSharing ? "scale-x-[-1]" : ""}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {image ? (
            <img
              src={image}
              alt={name}
              className={`${avatarSizeClasses[size]} rounded-full object-cover ring-2 ring-white/10`}
            />
          ) : (
            <div className={`${avatarSizeClasses[size]} rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center font-semibold text-white ring-2 ring-white/10`}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Screen sharing badge */}
      {isScreenSharing && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/90 text-white text-xs font-medium shadow-lg">
          <Monitor className="w-3 h-3" />
          <span>Sharing Screen</span>
        </div>
      )}

      {/* Name and status overlay - shown on hover or always for larger sizes */}
      {showControls && (
        <div className={`absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity ${
          size === 'tiny' || size === 'small' ? (isHovered ? 'opacity-100' : 'opacity-0') : 'opacity-100'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`font-medium text-white truncate ${size === 'tiny' ? 'text-xs max-w-[60px]' : size === 'small' ? 'text-xs max-w-[80px]' : 'text-sm max-w-[120px]'}`}>
                {isLocal ? "You" : name}
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {isMuted ? (
                <div className="p-1 rounded-full bg-red-500/90 shadow-sm">
                  <MicOff className={size === 'tiny' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                </div>
              ) : isSpeaking ? (
                <div className="p-1 rounded-full bg-green-500/90 animate-pulse shadow-sm">
                  <Mic className={size === 'tiny' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                </div>
              ) : (
                <div className="p-1 rounded-full bg-white/20">
                  <Mic className={size === 'tiny' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                </div>
              )}
              {isVideoOff && (
                <div className="p-1 rounded-full bg-red-500/90 shadow-sm">
                  <VideoOff className={size === 'tiny' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pin button (hover) - only for medium+ sizes */}
      {onPin && !isLocal && size !== 'tiny' && size !== 'small' && (
        <button
          onClick={onPin}
          className={`absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white transition-all ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          } hover:bg-black/80`}
        >
          {isPinned ? (
            <PinOff className="w-4 h-4" />
          ) : (
            <Pin className="w-4 h-4" />
          )}
        </button>
      )}

      {/* Local indicator */}
      {isLocal && !isScreenSharing && (
        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full bg-purple-600/90 text-white font-medium shadow-sm ${size === 'tiny' ? 'text-[10px]' : 'text-xs'}`}>
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
  screenShareStream?: MediaStream | null;
}

export default function VideoGrid({
  localStream,
  localName,
  localImage,
  isLocalAudioOn,
  isLocalVideoOn,
  isLocalScreenSharing,
  participants,
  screenShareStream,
}: VideoGridProps) {
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("speaker");
  const gridRef = useRef<HTMLDivElement>(null);

  const totalParticipants = participants.length + 1; // +1 for local

  // Find anyone who is screen sharing
  const screenSharingParticipant = participants.find(p => p.isScreenSharing);
  const anyoneScreenSharing = isLocalScreenSharing || screenSharingParticipant;

  // Auto-switch to speaker view when screen sharing starts
  useEffect(() => {
    if (anyoneScreenSharing && viewMode === "gallery") {
      setViewMode("speaker");
    }
  }, [anyoneScreenSharing, viewMode]);

  const toggleFullscreen = async () => {
    if (!gridRef.current) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await gridRef.current.requestFullscreen();
      }
      setIsFullscreen(!isFullscreen);
    } catch (e) {
      console.warn('Fullscreen not supported:', e);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Determine grid layout for gallery view
  const getGalleryGridClasses = () => {
    if (totalParticipants === 1) return "grid-cols-1";
    if (totalParticipants === 2) return "grid-cols-2";
    if (totalParticipants <= 4) return "grid-cols-2";
    if (totalParticipants <= 6) return "grid-cols-3";
    if (totalParticipants <= 9) return "grid-cols-3";
    if (totalParticipants <= 12) return "grid-cols-4";
    return "grid-cols-4 md:grid-cols-5";
  };

  const pinnedParticipant = pinnedPeerId
    ? participants.find(p => p.peerId === pinnedPeerId)
    : null;

  const unpinnedParticipants = pinnedPeerId
    ? participants.filter(p => p.peerId !== pinnedPeerId)
    : participants;

  // Render the participant strip (thumbnails)
  const renderParticipantStrip = (orientation: 'horizontal' | 'vertical' = 'horizontal') => {
    const isVertical = orientation === 'vertical';

    return (
      <div className={`${isVertical ? 'flex flex-col w-32 md:w-40' : 'flex flex-row h-20 md:h-24'} gap-2 p-2 overflow-auto bg-black/30 backdrop-blur-sm rounded-xl`}>
        {/* Local user thumbnail */}
        {!isLocalScreenSharing && (
          <VideoTile
            stream={localStream}
            isLocal={true}
            name={localName}
            image={localImage}
            isMuted={!isLocalAudioOn}
            isVideoOff={!isLocalVideoOn}
            isScreenSharing={false}
            size="small"
            showControls={true}
          />
        )}

        {/* Other participants */}
        {unpinnedParticipants.filter(p => !p.isScreenSharing).map(participant => (
          <VideoTile
            key={participant.peerId}
            participant={participant}
            stream={participant.stream}
            name={participant.name}
            image={participant.image}
            isMuted={!participant.isAudioOn}
            isVideoOff={!participant.isVideoOn}
            isScreenSharing={false}
            onPin={() => setPinnedPeerId(participant.peerId)}
            size="small"
            showControls={true}
          />
        ))}
      </div>
    );
  };

  // Render screen share view (Zoom-like)
  const renderScreenShareView = () => {
    const sharingStream = isLocalScreenSharing ? screenShareStream || localStream : screenSharingParticipant?.stream;
    const sharerName = isLocalScreenSharing ? "You" : screenSharingParticipant?.name || "Unknown";
    const sharerImage = isLocalScreenSharing ? localImage : screenSharingParticipant?.image;

    return (
      <div className="flex flex-col h-full">
        {/* Main screen share area */}
        <div className="flex-1 relative p-2">
          <div className="w-full h-full bg-gray-900 rounded-xl overflow-hidden relative">
            {sharingStream ? (
              <video
                autoPlay
                playsInline
                muted={isLocalScreenSharing}
                className="w-full h-full object-contain bg-black"
                ref={(el) => {
                  if (el) el.srcObject = sharingStream;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/60">
                <Monitor className="w-16 h-16" />
              </div>
            )}

            {/* Screen share info overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/90 text-white text-sm font-medium shadow-lg">
              <Monitor className="w-4 h-4" />
              <span>{sharerName} is presenting</span>
            </div>
          </div>
        </div>

        {/* Participant strip at bottom */}
        <div className="flex-shrink-0 p-2">
          {renderParticipantStrip('horizontal')}
        </div>
      </div>
    );
  };

  // Render speaker view (one large, others small)
  const renderSpeakerView = () => {
    // Determine who should be the main speaker
    const mainParticipant = pinnedParticipant ||
      (participants.length > 0 ? participants[0] : null);

    if (!mainParticipant && participants.length === 0) {
      // Only local user - show them large
      return (
        <div className="flex flex-col h-full">
          <div className="flex-1 p-2">
            <VideoTile
              stream={localStream}
              isLocal={true}
              name={localName}
              image={localImage}
              isMuted={!isLocalAudioOn}
              isVideoOff={!isLocalVideoOn}
              isScreenSharing={isLocalScreenSharing}
              size="fullscreen"
              showControls={true}
            />
          </div>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
            <p className="text-white/80 text-sm">
              Waiting for others to join...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full">
        {/* Main speaker area */}
        <div className="flex-1 p-2">
          {mainParticipant ? (
            <VideoTile
              participant={mainParticipant}
              stream={mainParticipant.stream}
              name={mainParticipant.name}
              image={mainParticipant.image}
              isMuted={!mainParticipant.isAudioOn}
              isVideoOff={!mainParticipant.isVideoOn}
              isScreenSharing={mainParticipant.isScreenSharing}
              isPinned={pinnedPeerId === mainParticipant.peerId}
              onPin={() => setPinnedPeerId(pinnedPeerId === mainParticipant.peerId ? null : mainParticipant.peerId)}
              size="fullscreen"
              showControls={true}
            />
          ) : (
            <VideoTile
              stream={localStream}
              isLocal={true}
              name={localName}
              image={localImage}
              isMuted={!isLocalAudioOn}
              isVideoOff={!isLocalVideoOn}
              isScreenSharing={isLocalScreenSharing}
              size="fullscreen"
              showControls={true}
            />
          )}
        </div>

        {/* Side strip with other participants */}
        <div className="w-36 md:w-44 flex-shrink-0 p-2">
          <div className="flex flex-col gap-2 h-full overflow-y-auto">
            {/* Local user if not main */}
            {mainParticipant && (
              <VideoTile
                stream={localStream}
                isLocal={true}
                name={localName}
                image={localImage}
                isMuted={!isLocalAudioOn}
                isVideoOff={!isLocalVideoOn}
                isScreenSharing={isLocalScreenSharing}
                size="small"
                showControls={true}
              />
            )}

            {/* Other participants not in main view */}
            {participants
              .filter(p => p.peerId !== mainParticipant?.peerId)
              .map(participant => (
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
                  showControls={true}
                />
              ))}
          </div>
        </div>
      </div>
    );
  };

  // Render gallery view (equal-sized grid)
  const renderGalleryView = () => {
    return (
      <div className={`grid ${getGalleryGridClasses()} gap-2 p-4 h-full auto-rows-fr place-items-center`}>
        {/* Local video */}
        <VideoTile
          stream={localStream}
          isLocal={true}
          name={localName}
          image={localImage}
          isMuted={!isLocalAudioOn}
          isVideoOff={!isLocalVideoOn}
          isScreenSharing={isLocalScreenSharing}
          size={totalParticipants <= 4 ? "large" : "medium"}
          showControls={true}
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
            size={totalParticipants <= 4 ? "large" : "medium"}
            showControls={true}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      ref={gridRef}
      className="relative h-full bg-gradient-to-br from-gray-900 via-gray-850 to-black rounded-2xl overflow-hidden"
    >
      {/* View mode controls */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg p-1">
        <button
          onClick={() => setViewMode("speaker")}
          className={`p-2 rounded-md transition-colors ${viewMode === "speaker" ? "bg-purple-600 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}
          title="Speaker View"
        >
          <User className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode("gallery")}
          className={`p-2 rounded-md transition-colors ${viewMode === "gallery" ? "bg-purple-600 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}
          title="Gallery View"
          disabled={!!anyoneScreenSharing}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
      </div>

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white/60 hover:text-white hover:bg-black/80 transition-all"
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? (
          <Minimize2 className="w-5 h-5" />
        ) : (
          <Maximize2 className="w-5 h-5" />
        )}
      </button>

      {/* Main content */}
      <div className="h-full">
        {anyoneScreenSharing ? (
          renderScreenShareView()
        ) : viewMode === "gallery" ? (
          renderGalleryView()
        ) : (
          renderSpeakerView()
        )}
      </div>

      {/* No participants message - only show when alone in gallery view */}
      {totalParticipants === 1 && viewMode === "gallery" && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center">
          <div className="bg-black/60 backdrop-blur-sm px-4 py-3 rounded-xl">
            <p className="text-white/80 text-sm font-medium">
              Waiting for others to join...
            </p>
            <p className="text-white/50 text-xs mt-1">
              Share the room code to invite participants
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
