"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  ChevronUp,
  ChevronDown,
  ExternalLink,
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
  } = useMusicPlayer();

  const playerRef = useRef<YTPlayer | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const lastVideoIdRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Give Zustand time to hydrate from localStorage
    const timer = setTimeout(() => setIsHydrated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Load YouTube IFrame API
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (existingScript) {
      const checkReady = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setIsApiReady(true);
          clearInterval(checkReady);
        }
      }, 100);
      return () => clearInterval(checkReady);
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, []);

  // Destroy player when video changes to force fresh iframe
  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error("Error destroying player:", e);
      }
      playerRef.current = null;
    }
    setIsPlayerReady(false);
  }, []);

  // Initialize/update player when video changes
  useEffect(() => {
    if (!isApiReady || !currentVideo || !mounted || !isHydrated || !playerContainerRef.current)
      return;

    // If same video, just ensure it's playing
    if (lastVideoIdRef.current === currentVideo.videoId && playerRef.current) {
      return;
    }

    setPlayerError(false);
    lastVideoIdRef.current = currentVideo.videoId;

    // Destroy existing player to start fresh
    destroyPlayer();

    // Clear container and create new player div
    playerContainerRef.current.innerHTML = "";
    const playerDiv = document.createElement("div");
    playerDiv.id = "yt-player-" + Date.now();
    playerContainerRef.current.appendChild(playerDiv);

    try {
      playerRef.current = new window.YT.Player(playerDiv, {
        videoId: currentVideo.videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: isPlaying ? 1 : 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0, // Disable fullscreen button (we handle it)
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          // These help with embedding restrictions
          iv_load_policy: 3, // Hide annotations
          cc_load_policy: 0, // Hide captions by default
        },
        events: {
          onReady: (event) => {
            console.log("YouTube player ready for:", currentVideo.videoId);
            setIsPlayerReady(true);
            setPlayerError(false);
            event.target.setVolume(volume);
            if (isMuted) {
              event.target.mute();
            }
            // Small delay before playing to ensure iframe is fully loaded
            // Only auto-play if the store state says we should be playing
            setTimeout(() => {
              try {
                if (isPlaying) {
                  event.target.playVideo();
                }
              } catch (e) {
                console.error("Error playing video:", e);
              }
            }, 100);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              playNext();
            }
            if (event.data === window.YT.PlayerState.PLAYING) {
              setPlayerError(false);
              try {
                setDuration(event.target.getDuration());
              } catch (e) {}
            }
            // Handle unplayable video
            if (event.data === window.YT.PlayerState.UNSTARTED) {
              // Give it some time to start
              setTimeout(() => {
                if (playerRef.current) {
                  try {
                    const state = playerRef.current.getPlayerState();
                    if (state === window.YT.PlayerState.UNSTARTED) {
                      console.log("Video stuck in unstarted state");
                    }
                  } catch (e) {}
                }
              }, 3000);
            }
          },
          onError: (event) => {
            console.error("YouTube Player Error:", event.data);
            // Error codes: 2 = invalid param, 5 = HTML5 error, 100 = not found, 101/150 = embedding disabled
            if (event.data === 101 || event.data === 150) {
              console.log("Embedding disabled for this video");
            }
            setPlayerError(true);
          },
        },
      });
    } catch (e) {
      console.error("Error creating YouTube player:", e);
      setPlayerError(true);
    }
  }, [isApiReady, currentVideo?.videoId, mounted, isHydrated, destroyPlayer]);

  // Sync play/pause state
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (e) {
      console.error("Error toggling play:", e);
    }
  }, [isPlaying, isPlayerReady]);

  // Sync mute state
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    } catch (e) {
      console.error("Error toggling mute:", e);
    }
  }, [isMuted, isPlayerReady]);

  // Sync volume
  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      playerRef.current.setVolume(volume);
    } catch (e) {
      console.error("Error setting volume:", e);
    }
  }, [volume, isPlayerReady]);

  // Update current time
  useEffect(() => {
    if (!isPlaying || !playerRef.current || !isPlayerReady) return;
    const interval = setInterval(() => {
      try {
        if (playerRef.current) {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
      } catch (e) {}
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isPlayerReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      destroyPlayer();
    };
  }, [destroyPlayer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const openInYouTube = () => {
    if (currentVideo) {
      window.open(
        `https://www.youtube.com/watch?v=${currentVideo.videoId}`,
        "_blank"
      );
    }
  };

  const showPlayer = currentVideo && (isMinimized || isExpanded);

  if (!mounted) return null;

  return (
    <>
      {/* Hidden player container - always rendered with fixed size for YouTube to work */}
      <div
        ref={playerContainerRef}
        className="bg-black"
        style={{
          position: "fixed",
          // Keep player visible but hidden when not showing
          // YouTube requires visible iframe to work properly
          ...(showPlayer && isExpanded
            ? {
                top: "60px",
                left: "16px",
                right: "16px",
                bottom: "140px",
                zIndex: 101,
                borderRadius: "12px",
                overflow: "hidden",
              }
            : showPlayer && isMinimized && showMiniPlayer
              ? {
                  bottom: "120px",
                  right: "16px",
                  width: "320px",
                  height: "180px",
                  zIndex: 70,
                  borderRadius: "12px",
                  overflow: "hidden",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }
              : {
                  // Hidden but still valid - position off screen but keep dimensions
                  bottom: "-500px",
                  right: "16px",
                  width: "320px",
                  height: "180px",
                  zIndex: -1,
                  opacity: 0,
                  pointerEvents: "none" as const,
                }),
        }}
      />

      {/* Expanded Full Screen Player - Backdrop and Controls */}
      {isExpanded && currentVideo && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black z-[100]" />

          {/* Header */}
          <div className="fixed top-0 left-0 right-0 flex items-center justify-between p-4 bg-black/90 backdrop-blur z-[102]">
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

          {/* Error overlay for expanded view */}
          {playerError && (
            <div className="fixed top-[60px] left-4 right-4 bottom-[140px] flex flex-col items-center justify-center bg-gray-900 rounded-xl z-[103]">
              <Youtube className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-white text-lg mb-2">
                This video cannot be embedded
              </p>
              <p className="text-gray-400 text-sm mb-4">
                The content owner has disabled playback on other websites
              </p>
              <button
                onClick={openInYouTube}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors text-white"
              >
                <ExternalLink className="w-5 h-5" />
                Watch on YouTube
              </button>
            </div>
          )}

          {/* Video Info at bottom */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/90 backdrop-blur z-[102]">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-lg md:text-xl font-bold text-white mb-1 line-clamp-2">
                {currentVideo.title}
              </h1>
              <p className="text-gray-400 text-sm">{currentVideo.channelName}</p>

              {!currentVideo.isLive && duration > 0 && (
                <div className="w-full max-w-md mx-auto mt-4">
                  <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              )}

              {currentVideo.isLive && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500 rounded-full text-sm font-medium">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    LIVE
                  </span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Floating Mini Video Player Overlay Controls */}
      {!isExpanded && showPlayer && isMinimized && showMiniPlayer && currentVideo && (
        <div
          className="fixed z-[71] pointer-events-none"
          style={{
            bottom: "120px",
            right: "16px",
            width: "320px",
            height: "180px",
          }}
        >
          {/* Error overlay for mini player */}
          {playerError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-xl text-center p-4 pointer-events-auto">
              <Youtube className="w-10 h-10 text-red-500 mb-2" />
              <p className="text-white text-xs mb-2">Cannot embed this video</p>
              <button
                onClick={openInYouTube}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 transition-colors text-xs text-white"
              >
                <ExternalLink className="w-3 h-3" />
                Open YouTube
              </button>
            </div>
          )}

          {/* Overlay controls */}
          <div className="absolute top-2 right-2 flex gap-2 z-10 pointer-events-auto">
            <button
              onClick={() => setShowMiniPlayer(false)}
              className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
              title="Hide video"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={expandPlayer}
              className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={closePlayer}
              className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {currentVideo.isLive && (
            <div className="absolute top-2 left-2 pointer-events-none">
              <span className="px-2 py-0.5 bg-red-500 rounded text-xs font-bold">
                LIVE
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mini player bar at bottom */}
      {showPlayer && isMinimized && currentVideo && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-gradient-to-t from-black via-gray-900/98 to-gray-900/95 backdrop-blur-xl border-t border-white/10 z-[60]">
          {!currentVideo.isLive && duration > 0 && (
            <div className="h-1 bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <div
                className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group"
                onClick={() => {
                  setShowMiniPlayer(true);
                  expandPlayer();
                }}
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

              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  setShowMiniPlayer(true);
                  expandPlayer();
                }}
              >
                <h4 className="font-medium text-sm text-white truncate">
                  {currentVideo.title}
                </h4>
                <p className="text-xs text-gray-400 truncate">
                  {currentVideo.channelName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Show/hide mini player toggle */}
                <button
                  onClick={() => setShowMiniPlayer(!showMiniPlayer)}
                  className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors"
                  title={showMiniPlayer ? "Hide video" : "Show video"}
                >
                  {showMiniPlayer ? (
                    <Minimize2 className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-gray-400" />
                  )}
                </button>

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

                <button
                  onClick={playPrevious}
                  disabled={queueIndex <= 0}
                  className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

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

                <button
                  onClick={playNext}
                  disabled={queueIndex >= queue.length - 1}
                  className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-30"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={openInYouTube}
                  className="hidden md:block p-2 hover:bg-white/10 rounded-full transition-colors"
                  title="Open in YouTube"
                >
                  <Youtube className="w-5 h-5 text-red-500" />
                </button>

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
      )}
    </>
  );
}
