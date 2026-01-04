"use client";

import { useEffect, useRef, useState } from "react";
import { useMusicPlayer } from "@/stores/musicPlayer";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  SkipBack,
  SkipForward,
  Youtube,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Music2,
} from "lucide-react";
import type { YTPlayer } from "@/types/youtube";

export default function GlobalMusicPlayer() {
  const {
    currentVideo,
    isPlaying,
    isMuted,
    volume,
    isExpanded,
    isMinimized,
    queue,
    queueIndex,
    togglePlay,
    toggleMute,
    setVolume,
    expandPlayer,
    minimizePlayer,
    closePlayer,
    playNext,
    playPrevious,
    pauseVideo,
    resumeVideo,
  } = useMusicPlayer();

  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window !== "undefined" && !window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsApiReady(true);
      };
    } else if (window.YT) {
      setIsApiReady(true);
    }
  }, []);

  // Initialize/update player when video changes
  useEffect(() => {
    if (!isApiReady || !currentVideo) return;

    // If player exists, load new video
    if (playerRef.current) {
      playerRef.current.loadVideoById(currentVideo.videoId);
      return;
    }

    // Create new player
    playerRef.current = new window.YT.Player("youtube-player", {
      videoId: currentVideo.videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 0,
        playsinline: 1,
      },
      events: {
        onReady: (event) => {
          setIsPlayerReady(true);
          event.target.setVolume(volume);
          if (isMuted) {
            event.target.mute();
          }
          if (isPlaying) {
            event.target.playVideo();
          }
        },
        onStateChange: (event) => {
          // Video ended - play next in queue
          if (event.data === window.YT.PlayerState.ENDED) {
            playNext();
          }
          // Update duration when video is cued/playing
          if (event.data === window.YT.PlayerState.PLAYING) {
            setDuration(event.target.getDuration());
          }
        },
        onError: (event) => {
          console.error("YouTube Player Error:", event.data);
        },
      },
    });

    return () => {
      // Don't destroy player on unmount - we want it to persist
    };
  }, [isApiReady, currentVideo?.videoId]);

  // Sync play/pause state with player
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;

    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying, isPlayerReady]);

  // Sync mute state
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;

    if (isMuted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unMute();
    }
  }, [isMuted, isPlayerReady]);

  // Sync volume
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    playerRef.current.setVolume(volume);
  }, [volume, isPlayerReady]);

  // Update current time periodically
  useEffect(() => {
    if (!isPlaying || !playerRef.current || !isPlayerReady) return;

    const interval = setInterval(() => {
      if (playerRef.current) {
        setCurrentTime(playerRef.current.getCurrentTime());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isPlayerReady]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Don't render if no video
  if (!currentVideo || (!isMinimized && !isExpanded)) {
    return (
      // Hidden player container - always present for YouTube API
      <div className="hidden">
        <div id="youtube-player" />
      </div>
    );
  }

  // Expanded full-screen player
  if (isExpanded) {
    return (
      <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col">
        {/* Hidden YouTube player */}
        <div className="absolute opacity-0 pointer-events-none">
          <div id="youtube-player" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <button
            onClick={minimizePlayer}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          <h2 className="text-sm font-medium text-gray-400">Now Playing</h2>
          <button
            onClick={closePlayer}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          {/* Album art / Thumbnail */}
          <div className="w-72 h-72 md:w-96 md:h-96 rounded-2xl overflow-hidden shadow-2xl mb-8">
            <img
              src={currentVideo.thumbnailUrl}
              alt={currentVideo.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Title & Channel */}
          <div className="text-center max-w-lg mb-8">
            <h1 className="text-2xl font-bold text-white mb-2 line-clamp-2">
              {currentVideo.title}
            </h1>
            <p className="text-gray-400">{currentVideo.channelName}</p>
          </div>

          {/* Progress bar */}
          {!currentVideo.isLive && (
            <div className="w-full max-w-lg mb-6">
              <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button
              onClick={playPrevious}
              disabled={queueIndex <= 0}
              className="p-3 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
            >
              <SkipBack className="w-6 h-6" />
            </button>

            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 text-gray-900" />
              ) : (
                <Play className="w-7 h-7 text-gray-900 ml-1" />
              )}
            </button>

            <button
              onClick={playNext}
              disabled={queueIndex >= queue.length - 1}
              className="p-3 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 mt-8">
            <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-full">
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-32 accent-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-center">
          <a
            href={`https://www.youtube.com/watch?v=${currentVideo.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors text-sm"
          >
            <Youtube className="w-4 h-4" />
            Watch on YouTube
          </a>
        </div>
      </div>
    );
  }

  // Minimized bottom bar player
  return (
    <>
      {/* Hidden YouTube player */}
      <div className="fixed opacity-0 pointer-events-none -z-10">
        <div id="youtube-player" />
      </div>

      {/* Mini player bar */}
      <div
        ref={containerRef}
        className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-gradient-to-t from-black via-gray-900/98 to-gray-900/95 backdrop-blur-xl border-t border-white/10 z-[60]"
      >
        {/* Progress bar at top */}
        {!currentVideo.isLive && (
          <div className="h-1 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div
              className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group"
              onClick={expandPlayer}
            >
              <img
                src={currentVideo.thumbnailUrl}
                alt={currentVideo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ChevronUp className="w-5 h-5" />
              </div>
              {currentVideo.isLive && (
                <div className="absolute bottom-0.5 right-0.5">
                  <span className="px-1 py-0.5 bg-red-500 rounded text-[8px] font-bold">
                    LIVE
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={expandPlayer}>
              <h4 className="font-medium text-sm text-white truncate">
                {currentVideo.title}
              </h4>
              <p className="text-xs text-gray-400 truncate">{currentVideo.channelName}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Volume - hidden on mobile */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-20 accent-purple-500"
                />
              </div>

              {/* Skip buttons - hidden on mobile */}
              <button
                onClick={playPrevious}
                disabled={queueIndex <= 0}
                className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-gray-900" />
                ) : (
                  <Play className="w-5 h-5 text-gray-900 ml-0.5" />
                )}
              </button>

              {/* Skip buttons - hidden on mobile */}
              <button
                onClick={playNext}
                disabled={queueIndex >= queue.length - 1}
                className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Expand */}
              <button
                onClick={expandPlayer}
                className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Maximize2 className="w-5 h-5" />
              </button>

              {/* Close */}
              <button
                onClick={closePlayer}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
