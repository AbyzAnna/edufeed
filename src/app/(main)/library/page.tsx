"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/components/providers/SessionProvider";
import { useMusicPlayer, type CuratedVideo, type VideoCategory } from "@/stores/musicPlayer";
import {
  Play,
  Pause,
  Youtube,
  Music2,
  Music,
  Sparkles,
  BookOpen,
  Brain,
  Coffee,
  Moon,
  Zap,
  Radio,
  ChevronLeft,
  ChevronRight,
  Heart,
  Shuffle,
  ListMusic,
} from "lucide-react";

// Curated video collections - relaxing & learning focused
const CURATED_VIDEOS: Record<VideoCategory, CuratedVideo[]> = {
  focus: [
    {
      id: "focus-1",
      title: "Deep Focus Music To Improve Concentration",
      channelName: "Greenred Productions",
      thumbnailUrl: "https://img.youtube.com/vi/lTRiuFIWV54/maxresdefault.jpg",
      videoId: "lTRiuFIWV54",
      platform: "youtube",
      duration: "11:54:56",
      category: "focus",
      viewCount: "25M",
      isLive: true,
    },
    {
      id: "focus-2",
      title: "4 Hours of Ambient Study Music",
      channelName: "Quiet Quest",
      thumbnailUrl: "https://img.youtube.com/vi/sjkrrmBnpGE/maxresdefault.jpg",
      videoId: "sjkrrmBnpGE",
      platform: "youtube",
      duration: "4:00:00",
      category: "focus",
      viewCount: "12M",
    },
    {
      id: "focus-3",
      title: "Productive Morning - Study Music",
      channelName: "The Soul of Wind",
      thumbnailUrl: "https://img.youtube.com/vi/oPVte6aMprI/maxresdefault.jpg",
      videoId: "oPVte6aMprI",
      platform: "youtube",
      duration: "3:28:15",
      category: "focus",
      viewCount: "8M",
    },
    {
      id: "focus-4",
      title: "Brain Power - Focus Music",
      channelName: "Yellow Brick Cinema",
      thumbnailUrl: "https://img.youtube.com/vi/WPni755-Krg/maxresdefault.jpg",
      videoId: "WPni755-Krg",
      platform: "youtube",
      duration: "3:00:12",
      category: "focus",
      viewCount: "45M",
    },
  ],
  relaxing: [
    {
      id: "relax-1",
      title: "Relaxing Sleep Music + Rain Sounds",
      channelName: "Soothing Relaxation",
      thumbnailUrl: "https://img.youtube.com/vi/1fueZCTYkpA/maxresdefault.jpg",
      videoId: "1fueZCTYkpA",
      platform: "youtube",
      duration: "8:00:00",
      category: "relaxing",
      viewCount: "150M",
    },
    {
      id: "relax-2",
      title: "Peaceful Piano & Soft Rain",
      channelName: "OCB Relax Music",
      thumbnailUrl: "https://img.youtube.com/vi/77ZozI0rw7w/maxresdefault.jpg",
      videoId: "77ZozI0rw7w",
      platform: "youtube",
      duration: "3:00:00",
      category: "relaxing",
      viewCount: "22M",
    },
    {
      id: "relax-3",
      title: "Beautiful Relaxing Music for Stress Relief",
      channelName: "Soothing Relaxation",
      thumbnailUrl: "https://img.youtube.com/vi/hlWiI4xVXKY/maxresdefault.jpg",
      videoId: "hlWiI4xVXKY",
      platform: "youtube",
      duration: "3:17:42",
      category: "relaxing",
      viewCount: "85M",
    },
    {
      id: "relax-4",
      title: "Calm Piano Music 24/7",
      channelName: "Relaxing Music",
      thumbnailUrl: "https://img.youtube.com/vi/9Q634rbsypE/maxresdefault.jpg",
      videoId: "9Q634rbsypE",
      platform: "youtube",
      duration: "LIVE",
      category: "relaxing",
      isLive: true,
      viewCount: "2.1M",
    },
  ],
  lofi: [
    {
      id: "lofi-1",
      title: "lofi hip hop radio 📚 beats to relax/study to",
      channelName: "Lofi Girl",
      thumbnailUrl: "https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg",
      videoId: "jfKfPfyJRdk",
      platform: "youtube",
      duration: "LIVE",
      category: "lofi",
      isLive: true,
      viewCount: "41K watching",
    },
    {
      id: "lofi-2",
      title: "lofi hip hop radio 💤 beats to sleep/chill to",
      channelName: "Lofi Girl",
      thumbnailUrl: "https://img.youtube.com/vi/rUxyKA_-grg/maxresdefault.jpg",
      videoId: "rUxyKA_-grg",
      platform: "youtube",
      duration: "LIVE",
      category: "lofi",
      isLive: true,
      viewCount: "15K watching",
    },
    {
      id: "lofi-3",
      title: "Chillhop Radio - jazzy & lofi hip hop beats",
      channelName: "Chillhop Music",
      thumbnailUrl: "https://img.youtube.com/vi/5yx6BWlEVcY/maxresdefault.jpg",
      videoId: "5yx6BWlEVcY",
      platform: "youtube",
      duration: "LIVE",
      category: "lofi",
      isLive: true,
      viewCount: "8K watching",
    },
    {
      id: "lofi-4",
      title: "Coffee Shop Radio ☕ lofi & jazzy beats",
      channelName: "STEEZYASFUCK",
      thumbnailUrl: "https://img.youtube.com/vi/lP26UCnoH9s/maxresdefault.jpg",
      videoId: "lP26UCnoH9s",
      platform: "youtube",
      duration: "LIVE",
      category: "lofi",
      isLive: true,
      viewCount: "5K watching",
    },
  ],
  nature: [
    {
      id: "nature-1",
      title: "Relaxing Ocean Waves",
      channelName: "Relaxing White Noise",
      thumbnailUrl: "https://img.youtube.com/vi/WHPEKLQID4U/maxresdefault.jpg",
      videoId: "WHPEKLQID4U",
      platform: "youtube",
      duration: "10:00:00",
      category: "nature",
      viewCount: "87M",
    },
    {
      id: "nature-2",
      title: "Forest Sounds - Birds Singing",
      channelName: "Nature Sounds",
      thumbnailUrl: "https://img.youtube.com/vi/xNN7iTA57jM/maxresdefault.jpg",
      videoId: "xNN7iTA57jM",
      platform: "youtube",
      duration: "8:00:00",
      category: "nature",
      viewCount: "35M",
    },
    {
      id: "nature-3",
      title: "Rain Sounds for Sleeping",
      channelName: "Rain Sounds",
      thumbnailUrl: "https://img.youtube.com/vi/q76bMs-NwRk/maxresdefault.jpg",
      videoId: "q76bMs-NwRk",
      platform: "youtube",
      duration: "10:00:00",
      category: "nature",
      viewCount: "120M",
    },
    {
      id: "nature-4",
      title: "Thunderstorm Sounds for Sleep",
      channelName: "The Relaxed Guy",
      thumbnailUrl: "https://img.youtube.com/vi/nDq6TstdEi8/maxresdefault.jpg",
      videoId: "nDq6TstdEi8",
      platform: "youtube",
      duration: "8:00:00",
      category: "nature",
      viewCount: "56M",
    },
  ],
  study: [
    {
      id: "study-1",
      title: "How to Study Effectively - Evidence-Based Tips",
      channelName: "Ali Abdaal",
      thumbnailUrl: "https://img.youtube.com/vi/ukLnPbIffxE/maxresdefault.jpg",
      videoId: "ukLnPbIffxE",
      platform: "youtube",
      duration: "12:34",
      category: "study",
      viewCount: "5.2M",
    },
    {
      id: "study-2",
      title: "How I Memorize Everything I Read",
      channelName: "Justin Sung",
      thumbnailUrl: "https://img.youtube.com/vi/Z8Z51no2HLo/maxresdefault.jpg",
      videoId: "Z8Z51no2HLo",
      platform: "youtube",
      duration: "15:42",
      category: "study",
      viewCount: "3.1M",
    },
    {
      id: "study-3",
      title: "The Science of Making & Breaking Habits",
      channelName: "Huberman Lab",
      thumbnailUrl: "https://img.youtube.com/vi/Wcs2PFz5q6g/maxresdefault.jpg",
      videoId: "Wcs2PFz5q6g",
      platform: "youtube",
      duration: "2:21:46",
      category: "study",
      viewCount: "4.5M",
    },
    {
      id: "study-4",
      title: "Learn Faster with The Feynman Technique",
      channelName: "Thomas Frank",
      thumbnailUrl: "https://img.youtube.com/vi/_f-qkGJBPts/maxresdefault.jpg",
      videoId: "_f-qkGJBPts",
      platform: "youtube",
      duration: "5:48",
      category: "study",
      viewCount: "2.8M",
    },
  ],
  shorts: [
    {
      id: "short-1",
      title: "Study hack that actually works 📚",
      channelName: "Study Tips",
      thumbnailUrl: "https://img.youtube.com/vi/0i2p3VL_hWU/maxresdefault.jpg",
      videoId: "0i2p3VL_hWU",
      platform: "youtube",
      duration: "0:58",
      category: "shorts",
      isShort: true,
      viewCount: "12M",
    },
    {
      id: "short-2",
      title: "POV: You found the perfect study spot",
      channelName: "Student Life",
      thumbnailUrl: "https://img.youtube.com/vi/aJ8Lg8VPBuQ/maxresdefault.jpg",
      videoId: "aJ8Lg8VPBuQ",
      platform: "youtube",
      duration: "0:32",
      category: "shorts",
      isShort: true,
      viewCount: "8M",
    },
    {
      id: "short-3",
      title: "How to stay focused while studying",
      channelName: "Productivity Tips",
      thumbnailUrl: "https://img.youtube.com/vi/IlU-zDU6aQ0/maxresdefault.jpg",
      videoId: "IlU-zDU6aQ0",
      platform: "youtube",
      duration: "0:45",
      category: "shorts",
      isShort: true,
      viewCount: "5M",
    },
    {
      id: "short-4",
      title: "Morning routine for students ☀️",
      channelName: "Daily Motivation",
      thumbnailUrl: "https://img.youtube.com/vi/mNK6h1dxAa0/maxresdefault.jpg",
      videoId: "mNK6h1dxAa0",
      platform: "youtube",
      duration: "0:59",
      category: "shorts",
      isShort: true,
      viewCount: "3M",
    },
  ],
  classical: [
    {
      id: "classical-1",
      title: "Beethoven - Moonlight Sonata (Full)",
      channelName: "HALIDONMUSIC",
      thumbnailUrl: "https://img.youtube.com/vi/4Tr0otuiQuU/maxresdefault.jpg",
      videoId: "4Tr0otuiQuU",
      platform: "youtube",
      duration: "15:03",
      category: "classical",
      viewCount: "250M",
    },
    {
      id: "classical-2",
      title: "Mozart - Classical Music for Brain Power",
      channelName: "HALIDONMUSIC",
      thumbnailUrl: "https://img.youtube.com/vi/Rb0UmrCXxVA/maxresdefault.jpg",
      videoId: "Rb0UmrCXxVA",
      platform: "youtube",
      duration: "3:04:46",
      category: "classical",
      viewCount: "45M",
    },
    {
      id: "classical-3",
      title: "Chopin - Nocturnes (Complete)",
      channelName: "Classical Music Only",
      thumbnailUrl: "https://img.youtube.com/vi/WJ8RVjm49hE/maxresdefault.jpg",
      videoId: "WJ8RVjm49hE",
      platform: "youtube",
      duration: "1:55:38",
      category: "classical",
      viewCount: "18M",
    },
    {
      id: "classical-4",
      title: "Bach - Cello Suite No. 1",
      channelName: "Yo-Yo Ma",
      thumbnailUrl: "https://img.youtube.com/vi/1prweT95Mo0/maxresdefault.jpg",
      videoId: "1prweT95Mo0",
      platform: "youtube",
      duration: "2:41:09",
      category: "classical",
      viewCount: "62M",
    },
    {
      id: "classical-5",
      title: "Debussy - Clair de Lune",
      channelName: "Rousseau",
      thumbnailUrl: "https://img.youtube.com/vi/CvFH_6DNRCY/maxresdefault.jpg",
      videoId: "CvFH_6DNRCY",
      platform: "youtube",
      duration: "5:14",
      category: "classical",
      viewCount: "85M",
    },
    {
      id: "classical-6",
      title: "Vivaldi - The Four Seasons",
      channelName: "HALIDONMUSIC",
      thumbnailUrl: "https://img.youtube.com/vi/GRxofEmo3HA/maxresdefault.jpg",
      videoId: "GRxofEmo3HA",
      platform: "youtube",
      duration: "42:35",
      category: "classical",
      viewCount: "180M",
    },
  ],
  frequencies: [
    {
      id: "freq-1",
      title: "432 Hz - Deep Healing Frequency",
      channelName: "Meditative Mind",
      thumbnailUrl: "https://img.youtube.com/vi/NPVX75VIpqg/maxresdefault.jpg",
      videoId: "NPVX75VIpqg",
      platform: "youtube",
      duration: "8:00:00",
      category: "frequencies",
      viewCount: "28M",
    },
    {
      id: "freq-2",
      title: "528 Hz - DNA Repair & Transformation",
      channelName: "PowerThoughts Meditation Club",
      thumbnailUrl: "https://img.youtube.com/vi/dCIA6XVe2nc/maxresdefault.jpg",
      videoId: "dCIA6XVe2nc",
      platform: "youtube",
      duration: "3:00:00",
      category: "frequencies",
      viewCount: "15M",
    },
    {
      id: "freq-3",
      title: "40 Hz Gamma Binaural Beats - Focus & Memory",
      channelName: "Brainwave Music",
      thumbnailUrl: "https://img.youtube.com/vi/LXKRsJWqORc/maxresdefault.jpg",
      videoId: "LXKRsJWqORc",
      platform: "youtube",
      duration: "2:00:00",
      category: "frequencies",
      viewCount: "5.2M",
    },
    {
      id: "freq-4",
      title: "Alpha Waves 10 Hz - Relaxation & Creativity",
      channelName: "Greenred Productions",
      thumbnailUrl: "https://img.youtube.com/vi/WTr9xnvnLKo/maxresdefault.jpg",
      videoId: "WTr9xnvnLKo",
      platform: "youtube",
      duration: "3:00:00",
      category: "frequencies",
      viewCount: "8M",
    },
    {
      id: "freq-5",
      title: "963 Hz - Crown Chakra Activation",
      channelName: "Meditative Mind",
      thumbnailUrl: "https://img.youtube.com/vi/SyUXGfS4NyY/maxresdefault.jpg",
      videoId: "SyUXGfS4NyY",
      platform: "youtube",
      duration: "2:00:00",
      category: "frequencies",
      viewCount: "12M",
    },
    {
      id: "freq-6",
      title: "Theta Waves 6 Hz - Deep Meditation & Sleep",
      channelName: "Solfeggio Frequencies",
      thumbnailUrl: "https://img.youtube.com/vi/tJlODWp3Dso/maxresdefault.jpg",
      videoId: "tJlODWp3Dso",
      platform: "youtube",
      duration: "8:00:00",
      category: "frequencies",
      viewCount: "22M",
    },
  ],
};

const CATEGORY_CONFIG: Record<VideoCategory, { icon: React.ReactNode; label: string; gradient: string; description: string }> = {
  focus: {
    icon: <Brain className="w-5 h-5" />,
    label: "Deep Focus",
    gradient: "from-purple-600 to-indigo-600",
    description: "Concentration & productivity music",
  },
  relaxing: {
    icon: <Moon className="w-5 h-5" />,
    label: "Relaxing",
    gradient: "from-blue-600 to-cyan-600",
    description: "Calm your mind & reduce stress",
  },
  lofi: {
    icon: <Coffee className="w-5 h-5" />,
    label: "Lofi Beats",
    gradient: "from-orange-500 to-pink-500",
    description: "Chill beats to study/relax to",
  },
  nature: {
    icon: <Sparkles className="w-5 h-5" />,
    label: "Nature Sounds",
    gradient: "from-green-600 to-emerald-600",
    description: "Rain, ocean, forest & more",
  },
  study: {
    icon: <BookOpen className="w-5 h-5" />,
    label: "Study Tips",
    gradient: "from-violet-600 to-purple-600",
    description: "Learn how to learn better",
  },
  shorts: {
    icon: <Zap className="w-5 h-5" />,
    label: "Quick Tips",
    gradient: "from-red-500 to-rose-500",
    description: "Bite-sized motivation & tips",
  },
  classical: {
    icon: <Music className="w-5 h-5" />,
    label: "Classical",
    gradient: "from-amber-600 to-yellow-500",
    description: "Timeless compositions for focus",
  },
  frequencies: {
    icon: <Radio className="w-5 h-5" />,
    label: "Frequencies",
    gradient: "from-teal-500 to-cyan-400",
    description: "Binaural beats & healing Hz",
  },
};

// Video Card Component
function VideoCard({
  video,
  onPlay,
  onAddToQueue,
  isCurrentlyPlaying,
  size = "normal"
}: {
  video: CuratedVideo;
  onPlay: (video: CuratedVideo) => void;
  onAddToQueue: (video: CuratedVideo) => void;
  isCurrentlyPlaying: boolean;
  size?: "normal" | "large" | "short";
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    normal: "w-72 flex-shrink-0",
    large: "w-80 flex-shrink-0",
    short: "w-40 flex-shrink-0",
  };

  const aspectClasses = {
    normal: "aspect-video",
    large: "aspect-video",
    short: "aspect-[9/16]",
  };

  return (
    <div
      className={`${sizeClasses[size]} group cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div
        className={`relative ${aspectClasses[size]} rounded-xl overflow-hidden bg-white/5`}
        onClick={() => onPlay(video)}
      >
        {!imgError ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-indigo-900/50">
            <Music2 className="w-12 h-12 text-white/50" />
          </div>
        )}

        {/* Overlay on hover */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isHovered || isCurrentlyPlaying ? 'opacity-100' : 'opacity-0'}`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isCurrentlyPlaying ? 'bg-purple-500' : 'bg-white/90'}`}>
            {isCurrentlyPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-gray-900 ml-1" />
            )}
          </div>
        </div>

        {/* Currently playing indicator */}
        {isCurrentlyPlaying && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-500 text-white text-xs font-medium">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Playing
            </div>
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${video.isLive ? 'bg-red-500 text-white' : 'bg-black/70 text-white'}`}>
            {video.isLive ? '● LIVE' : video.duration}
          </span>
        </div>

        {/* Platform badge */}
        <div className="absolute top-2 left-2">
          <div className="w-6 h-6 rounded bg-black/50 flex items-center justify-center">
            <Youtube className="w-4 h-4 text-red-500" />
          </div>
        </div>

        {/* Add to queue button */}
        {isHovered && !isCurrentlyPlaying && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(video);
            }}
            className="absolute bottom-2 left-2 p-2 rounded-full bg-black/70 hover:bg-black/90 transition-colors"
            title="Add to queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 px-1">
        <h3 className="font-medium text-sm line-clamp-2 text-white group-hover:text-purple-400 transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
          <span>{video.channelName}</span>
          {video.viewCount && (
            <>
              <span>•</span>
              <span>{video.viewCount} views</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Horizontal scroll section
function VideoSection({
  category,
  videos,
  currentVideoId,
  onPlay,
  onPlayAll,
  onAddToQueue,
}: {
  category: VideoCategory;
  videos: CuratedVideo[];
  currentVideoId: string | null;
  onPlay: (video: CuratedVideo) => void;
  onPlayAll: (videos: CuratedVideo[]) => void;
  onAddToQueue: (video: CuratedVideo) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const config = CATEGORY_CONFIG[category];

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
            {config.icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{config.label}</h2>
            <p className="text-xs text-gray-400">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPlayAll(videos)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm"
          >
            <Play className="w-4 h-4" />
            Play All
          </button>
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onPlay={onPlay}
            onAddToQueue={onAddToQueue}
            isCurrentlyPlaying={currentVideoId === video.videoId}
            size={category === "shorts" ? "short" : "normal"}
          />
        ))}
      </div>
    </div>
  );
}

// Now Playing Bar
function NowPlayingBar({
  video,
  isPlaying,
  onTogglePlay,
  onClose
}: {
  video: CuratedVideo;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}) {
  const [isMuted, setIsMuted] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-gray-900/95 to-gray-900/90 backdrop-blur-lg border-t border-white/10 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              {video.isLive && (
                <span className="px-1.5 py-0.5 bg-red-500 rounded text-[10px] font-medium">LIVE</span>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-white truncate">{video.title}</h4>
            <p className="text-xs text-gray-400 truncate">{video.channelName}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={onTogglePlay}
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-gray-900" />
              ) : (
                <Play className="w-5 h-5 text-gray-900 ml-0.5" />
              )}
            </button>
            <a
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress bar placeholder */}
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            style={{ width: video.isLive ? '100%' : '35%' }}
          />
        </div>
      </div>
    </div>
  );
}

// Video Player Modal
function VideoPlayerModal({
  video,
  onClose
}: {
  video: CuratedVideo;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white truncate pr-4">{video.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">{video.channelName}</span>
            {video.viewCount && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">{video.viewCount} views</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm">
              <Heart className="w-4 h-4" />
              Save
            </button>
            <a
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors text-sm"
            >
              <Youtube className="w-4 h-4" />
              Watch on YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const { user, isLoading } = useAuth();
  const {
    currentVideo,
    isMinimized,
    playVideo,
    setQueue,
    addToQueue,
  } = useMusicPlayer();
  const [activeCategory, setActiveCategory] = useState<VideoCategory | "all">("all");

  const handlePlayVideo = (video: CuratedVideo) => {
    playVideo(video);
  };

  const handlePlayAll = (videos: CuratedVideo[]) => {
    setQueue(videos, 0);
  };

  const handleAddToQueue = (video: CuratedVideo) => {
    addToQueue(video);
  };

  const handleShufflePlay = () => {
    const allVideos = Object.values(CURATED_VIDEOS).flat();
    const shuffled = [...allVideos].sort(() => Math.random() - 0.5);
    setQueue(shuffled, 0);
  };

  const categories: VideoCategory[] = ["lofi", "focus", "relaxing", "nature", "classical", "frequencies", "study", "shorts"];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-24 ${isMinimized ? 'pb-40' : ''}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-900 via-gray-900 to-transparent pb-4 pt-6 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Music2 className="w-7 h-7 text-purple-400" />
                Music & Videos
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Curated content for studying & relaxation
                {currentVideo && (
                  <span className="ml-2 text-purple-400">• Music continues while you browse</span>
                )}
              </p>
            </div>
            <button
              onClick={handleShufflePlay}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-sm"
            >
              <Shuffle className="w-4 h-4" />
              Shuffle Play
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === "all"
                  ? "bg-white text-gray-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                  activeCategory === cat
                    ? "bg-white text-gray-900"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {CATEGORY_CONFIG[cat].icon}
                {CATEGORY_CONFIG[cat].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto mt-4">
        {/* Featured Section */}
        {activeCategory === "all" && (
          <div className="mb-10 px-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900/50 to-indigo-900/50 p-8">
              <div className="absolute inset-0 bg-[url('https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg')] bg-cover bg-center opacity-20" />
              <div className="relative z-10 flex items-center gap-6">
                <div className="flex-1">
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-500 text-white mb-3 inline-block">
                    ● LIVE NOW
                  </span>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    lofi hip hop radio 📚 beats to relax/study to
                  </h2>
                  <p className="text-gray-300 mb-4">Lofi Girl • 41K watching</p>
                  <button
                    onClick={() => handlePlayVideo(CURATED_VIDEOS.lofi[0])}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-gray-900 font-medium hover:scale-105 transition-transform"
                  >
                    <Play className="w-5 h-5" />
                    Listen Now
                  </button>
                </div>
                <div className="hidden md:block w-64 h-36 rounded-xl overflow-hidden">
                  <img
                    src="https://img.youtube.com/vi/jfKfPfyJRdk/maxresdefault.jpg"
                    alt="Featured"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Sections */}
        {activeCategory === "all" ? (
          categories.map((category) => (
            <VideoSection
              key={category}
              category={category}
              videos={CURATED_VIDEOS[category]}
              currentVideoId={currentVideo?.videoId || null}
              onPlay={handlePlayVideo}
              onPlayAll={handlePlayAll}
              onAddToQueue={handleAddToQueue}
            />
          ))
        ) : (
          <VideoSection
            category={activeCategory}
            videos={CURATED_VIDEOS[activeCategory]}
            currentVideoId={currentVideo?.videoId || null}
            onPlay={handlePlayVideo}
            onPlayAll={handlePlayAll}
            onAddToQueue={handleAddToQueue}
          />
        )}
      </div>
    </div>
  );
}
