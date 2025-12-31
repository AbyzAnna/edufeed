"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  BookmarkPlus,
  MessageSquarePlus,
  List,
  ChevronDown,
  Maximize,
} from "lucide-react";

interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime?: number | null;
}

interface Bookmark {
  id: string;
  timestamp: number;
  label?: string | null;
}

interface Note {
  id: string;
  timestamp: number;
  content: string;
}

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  chapters?: Chapter[];
  bookmarks?: Bookmark[];
  notes?: Note[];
  startTime?: number;
  onAddBookmark?: (timestamp: number) => void;
  onAddNote?: (timestamp: number, content: string) => void;
  onTimeUpdate?: (time: number) => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

// YouTube Player API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: Record<string, (event: { data: number; target: YouTubePlayer }) => void>;
        }
      ) => YouTubePlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  destroy: () => void;
}

export default function YouTubePlayer({
  videoId,
  title,
  chapters = [],
  bookmarks = [],
  notes = [],
  startTime = 0,
  onAddBookmark,
  onAddNote,
  onTimeUpdate,
}: YouTubePlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const timeUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState(0);

  // Load YouTube API
  useEffect(() => {
    if (window.YT) {
      initPlayer();
      return;
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = initPlayer;

    return () => {
      if (timeUpdateInterval.current) {
        clearInterval(timeUpdateInterval.current);
      }
      playerRef.current?.destroy();
    };
  }, [videoId]);

  const initPlayer = () => {
    if (!window.YT || playerRef.current) return;

    playerRef.current = new window.YT.Player(`youtube-player-${videoId}`, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        start: startTime,
      },
      events: {
        onReady: () => {
          setIsReady(true);
          setDuration(playerRef.current?.getDuration() || 0);
          setVolume(playerRef.current?.getVolume() || 100);

          // Start time update interval
          timeUpdateInterval.current = setInterval(() => {
            if (playerRef.current) {
              const time = playerRef.current.getCurrentTime();
              setCurrentTime(time);
              onTimeUpdate?.(time);
            }
          }, 1000);
        },
        onStateChange: (event) => {
          setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
        },
      },
    });
  };

  // Format time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getCurrentChapter = useCallback(() => {
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (currentTime >= chapters[i].startTime) {
        return chapters[i];
      }
    }
    return null;
  }, [chapters, currentTime]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const seek = (time: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(Math.max(0, Math.min(time, duration)), true);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seek(percent * duration);
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
    } else {
      playerRef.current.mute();
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!playerRef.current) return;
    const newVolume = parseInt(e.target.value);
    playerRef.current.setVolume(newVolume);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSpeedChange = (speed: number) => {
    if (!playerRef.current) return;
    playerRef.current.setPlaybackRate(speed);
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const handleAddBookmark = () => {
    onAddBookmark?.(Math.floor(currentTime));
  };

  const handleOpenNoteInput = () => {
    setNoteTimestamp(Math.floor(currentTime));
    setShowNoteInput(true);
  };

  const handleSubmitNote = () => {
    if (noteContent.trim()) {
      onAddNote?.(noteTimestamp, noteContent.trim());
      setNoteContent("");
      setShowNoteInput(false);
    }
  };

  const goToChapter = (chapter: Chapter) => {
    seek(chapter.startTime);
    setShowChapters(false);
  };

  const currentChapter = getCurrentChapter();

  return (
    <div className="w-full bg-gray-900 rounded-2xl overflow-hidden">
      {/* YouTube iframe container */}
      <div ref={containerRef} className="relative aspect-video bg-black">
        <div id={`youtube-player-${videoId}`} className="absolute inset-0" />

        {/* Custom overlay for play button when not ready or paused */}
        {!isPlaying && isReady && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
            onClick={togglePlay}
          >
            <button className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
              <Play className="w-10 h-10 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-4">
        <div
          ref={progressRef}
          className="relative h-2 bg-white/20 rounded-full cursor-pointer group"
          onClick={handleProgressClick}
        >
          {/* Played progress */}
          <div
            className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />

          {/* Chapter markers */}
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className="absolute w-1 h-full bg-white/50 rounded-full"
              style={{ left: `${(chapter.startTime / duration) * 100}%` }}
              title={chapter.title}
            />
          ))}

          {/* Bookmark markers */}
          {bookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="absolute w-2 h-2 bg-yellow-500 rounded-full -top-0.5 transform -translate-x-1/2"
              style={{ left: `${(bookmark.timestamp / duration) * 100}%` }}
              title={bookmark.label || `Bookmark at ${formatTime(bookmark.timestamp)}`}
            />
          ))}

          {/* Scrubber handle */}
          <div
            className="absolute w-4 h-4 bg-white rounded-full -top-1 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            style={{ left: `${(currentTime / duration) * 100}%` }}
          />
        </div>

        {/* Time and chapter display */}
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>{formatTime(currentTime)}</span>
          {currentChapter && (
            <span className="text-purple-400 truncate mx-4">{currentChapter.title}</span>
          )}
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => seek(currentTime - 10)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Back 10s"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => seek(currentTime + 10)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Forward 10s"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Speed control */}
        <div className="relative">
          <button
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium flex items-center gap-1"
          >
            {playbackSpeed}x
            <ChevronDown className="w-4 h-4" />
          </button>

          {showSpeedMenu && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 border border-white/10 rounded-xl shadow-xl overflow-hidden z-10">
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`w-full px-4 py-2 text-sm hover:bg-white/10 transition-colors ${
                    playbackSpeed === speed ? "text-purple-400" : ""
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 accent-purple-500"
            />
          </div>

          {onAddBookmark && (
            <button
              onClick={handleAddBookmark}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Add bookmark"
            >
              <BookmarkPlus className="w-5 h-5" />
            </button>
          )}

          {onAddNote && (
            <button
              onClick={handleOpenNoteInput}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Add note"
            >
              <MessageSquarePlus className="w-5 h-5" />
            </button>
          )}

          {chapters.length > 0 && (
            <button
              onClick={() => setShowChapters(!showChapters)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Chapters"
            >
              <List className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Chapters panel */}
      {showChapters && chapters.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-white/5 rounded-xl p-3 max-h-48 overflow-y-auto">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => goToChapter(chapter)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-white/10 transition-colors ${
                  currentChapter?.id === chapter.id ? "bg-purple-500/20" : ""
                }`}
              >
                <span className="text-gray-400 text-sm w-12">
                  {formatTime(chapter.startTime)}
                </span>
                <span className="flex-1 truncate">{chapter.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Note input */}
      {showNoteInput && (
        <div className="px-4 pb-4">
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-sm text-gray-400 mb-2">
              Note at {formatTime(noteTimestamp)}
            </p>
            <textarea
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Add your note..."
              className="w-full bg-white/10 border border-white/10 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-purple-500"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowNoteInput(false)}
                className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNote}
                className="px-3 py-1.5 rounded-lg text-sm bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes display */}
      {notes.length > 0 && !showNoteInput && (
        <div className="px-4 pb-4">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Notes</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => seek(note.timestamp)}
                className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <span className="text-purple-400 text-xs">
                  {formatTime(note.timestamp)}
                </span>
                <p className="text-sm line-clamp-2">{note.content}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
