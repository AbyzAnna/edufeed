"use client";

import { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  Settings,
  MoreVertical,
  MessageSquare,
  Users,
} from "lucide-react";

interface MediaControlsProps {
  isAudioOn: boolean;
  isVideoOn: boolean;
  isJoined: boolean;
  participantCount: number;
  messageCount?: number;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onLeave: () => void;
  onOpenChat?: () => void;
  onOpenParticipants?: () => void;
  onOpenSettings?: () => void;
  allowAudio?: boolean;
  allowVideo?: boolean;
}

export default function MediaControls({
  isAudioOn,
  isVideoOn,
  isJoined,
  participantCount,
  messageCount,
  onToggleAudio,
  onToggleVideo,
  onLeave,
  onOpenChat,
  onOpenParticipants,
  onOpenSettings,
  allowAudio = true,
  allowVideo = true,
}: MediaControlsProps) {
  const [showMore, setShowMore] = useState(false);

  const buttonBase =
    "relative p-3 md:p-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black";

  const activeButton = `${buttonBase} bg-white/10 hover:bg-white/20 text-white focus:ring-white/50`;
  const inactiveButton = `${buttonBase} bg-red-500/20 hover:bg-red-500/30 text-red-400 focus:ring-red-500/50`;
  const leaveButton = `${buttonBase} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500`;

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3 p-4 bg-black/80 backdrop-blur-xl border-t border-white/10">
      {/* Main controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Microphone */}
        <button
          onClick={onToggleAudio}
          disabled={!allowAudio || !isJoined}
          className={isAudioOn ? activeButton : inactiveButton}
          title={isAudioOn ? "Mute microphone" : "Unmute microphone"}
        >
          {isAudioOn ? (
            <Mic className="w-5 h-5 md:w-6 md:h-6" />
          ) : (
            <MicOff className="w-5 h-5 md:w-6 md:h-6" />
          )}
          <span className="sr-only">
            {isAudioOn ? "Mute microphone" : "Unmute microphone"}
          </span>
        </button>

        {/* Camera */}
        <button
          onClick={onToggleVideo}
          disabled={!allowVideo || !isJoined}
          className={isVideoOn ? activeButton : inactiveButton}
          title={isVideoOn ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoOn ? (
            <Video className="w-5 h-5 md:w-6 md:h-6" />
          ) : (
            <VideoOff className="w-5 h-5 md:w-6 md:h-6" />
          )}
          <span className="sr-only">
            {isVideoOn ? "Turn off camera" : "Turn on camera"}
          </span>
        </button>

        {/* Note: Screen sharing removed - this is a collaboration-only platform */}
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-white/20 mx-2" />

      {/* Secondary controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Participants */}
        {onOpenParticipants && (
          <button
            onClick={onOpenParticipants}
            className={activeButton}
            title="View participants"
          >
            <Users className="w-5 h-5 md:w-6 md:h-6" />
            {participantCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-purple-600 text-white text-xs rounded-full">
                {participantCount}
              </span>
            )}
          </button>
        )}

        {/* Chat */}
        {onOpenChat && (
          <button
            onClick={onOpenChat}
            className={activeButton}
            title="Open chat"
          >
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
            {messageCount && messageCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-red-500 text-white text-xs rounded-full">
                {messageCount > 99 ? "99+" : messageCount}
              </span>
            )}
          </button>
        )}

        {/* Settings - hidden on mobile, in more menu */}
        <div className="hidden md:block">
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={activeButton}
              title="Settings"
            >
              <Settings className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          )}
        </div>

        {/* More menu for mobile */}
        <div className="relative md:hidden">
          <button
            onClick={() => setShowMore(!showMore)}
            className={activeButton}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMore && (
            <div className="absolute bottom-full right-0 mb-2 p-2 bg-gray-800 rounded-xl border border-white/10 shadow-xl">
              {onOpenSettings && (
                <button
                  onClick={() => {
                    onOpenSettings();
                    setShowMore(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-8 w-px bg-white/20 mx-2" />

      {/* Leave button */}
      <button
        onClick={onLeave}
        className={leaveButton}
        title="Leave call"
      >
        <Phone className="w-5 h-5 md:w-6 md:h-6 rotate-[135deg]" />
        <span className="sr-only">Leave call</span>
      </button>
    </div>
  );
}
