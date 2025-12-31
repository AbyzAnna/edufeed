"use client";

import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/components/providers/SessionProvider";
import {
  Play,
  Volume2,
  VolumeX,
  Share2,
  Heart,
  Bookmark,
  ExternalLink,
} from "lucide-react";

interface VideoPlayerProps {
  video: {
    id: string;
    title: string;
    description?: string | null;
    videoUrl?: string | null;
    thumbnailUrl?: string | null;
    youtubeVideoId?: string | null;
    youtubeStart?: number | null;
    youtubeEnd?: number | null;
    topic?: string | null;
    tags?: string[];
    viewCount?: number;
    user: {
      name?: string | null;
      image?: string | null;
    };
    source: {
      title: string;
      type: string;
    };
    _count?: {
      likes: number;
      bookmarks: number;
    };
    isLiked?: boolean;
    isBookmarked?: boolean;
  };
  isActive: boolean;
}

export default function VideoPlayer({ video, isActive }: VideoPlayerProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(video.isLiked || false);
  const [bookmarked, setBookmarked] = useState(video.isBookmarked || false);
  const [likeCount, setLikeCount] = useState(video._count?.likes || 0);

  const isYouTube = !!video.youtubeVideoId;

  useEffect(() => {
    if (!isActive) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    if (videoRef.current && video.videoUrl) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [isActive, video.videoUrl]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentProgress =
      (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(currentProgress);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/video/${video.id}`;
    if (navigator.share) {
      await navigator.share({
        title: video.title,
        text: video.description || "",
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(shareUrl);
    }
  };

  const handleLike = async () => {
    if (!user) return;

    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    try {
      await fetch(`/api/videos/${video.id}/like`, {
        method: newLiked ? "POST" : "DELETE",
      });
    } catch {
      setLiked(!newLiked);
      setLikeCount((prev) => (newLiked ? prev - 1 : prev + 1));
    }
  };

  const handleBookmark = async () => {
    if (!user) return;

    const newBookmarked = !bookmarked;
    setBookmarked(newBookmarked);

    try {
      await fetch(`/api/videos/${video.id}/bookmark`, {
        method: newBookmarked ? "POST" : "DELETE",
      });
    } catch {
      setBookmarked(!newBookmarked);
    }
  };

  const getYouTubeEmbedUrl = () => {
    if (!video.youtubeVideoId) return "";
    let url = `https://www.youtube.com/embed/${video.youtubeVideoId}?autoplay=${
      isActive ? 1 : 0
    }&mute=1&rel=0&modestbranding=1&playsinline=1`;
    if (video.youtubeStart) url += `&start=${video.youtubeStart}`;
    if (video.youtubeEnd) url += `&end=${video.youtubeEnd}`;
    return url;
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {/* YouTube Embed */}
      {isYouTube ? (
        <div className="w-full h-full">
          <iframe
            src={getYouTubeEmbedUrl()}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div className="absolute top-4 right-4">
            <a
              href={`https://youtube.com/watch?v=${video.youtubeVideoId}${
                video.youtubeStart ? `&t=${video.youtubeStart}` : ""
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-full text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              YouTube
            </a>
          </div>
        </div>
      ) : video.videoUrl ? (
        <>
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl || undefined}
            className="w-full h-full object-contain"
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
            onTimeUpdate={handleTimeUpdate}
          />
          <button
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center"
          >
            {!isPlaying && (
              <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
            )}
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-pink-900/50">
          <div className="text-center p-8">
            <div className="w-24 h-24 relative mx-auto mb-6">
              <div className="absolute inset-0 bg-white/10 rounded-full animate-ping" />
              <div className="absolute inset-2 bg-white/20 rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
            <p className="text-gray-400 text-sm mb-4">Generating your video...</p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}

      {/* Right side actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5">
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1 group"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              liked
                ? "bg-red-500 scale-110"
                : "bg-black/50 group-hover:bg-black/70"
            }`}
          >
            <Heart
              className={`w-6 h-6 transition-transform group-active:scale-90 ${
                liked ? "text-white fill-white" : "text-white"
              }`}
            />
          </div>
          <span className="text-xs font-medium">{formatCount(likeCount)}</span>
        </button>

        <button
          onClick={handleBookmark}
          className="flex flex-col items-center gap-1 group"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              bookmarked
                ? "bg-yellow-500 scale-110"
                : "bg-black/50 group-hover:bg-black/70"
            }`}
          >
            <Bookmark
              className={`w-6 h-6 transition-transform group-active:scale-90 ${
                bookmarked ? "text-white fill-white" : "text-white"
              }`}
            />
          </div>
          <span className="text-xs font-medium">Save</span>
        </button>

        <button
          onClick={handleShare}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="w-12 h-12 bg-black/50 group-hover:bg-black/70 rounded-full flex items-center justify-center transition-all">
            <Share2 className="w-6 h-6 text-white transition-transform group-active:scale-90" />
          </div>
          <span className="text-xs font-medium">Share</span>
        </button>

        {!isYouTube && video.videoUrl && (
          <button
            onClick={toggleMute}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 bg-black/50 group-hover:bg-black/70 rounded-full flex items-center justify-center transition-all">
              {isMuted ? (
                <VolumeX className="w-6 h-6 text-white" />
              ) : (
                <Volume2 className="w-6 h-6 text-white" />
              )}
            </div>
            <span className="text-xs font-medium">{isMuted ? "Unmute" : "Mute"}</span>
          </button>
        )}
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-4 left-4 right-20 pointer-events-none">
        <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20 -mx-4 px-4 -mb-4 pb-4">
          <div className="flex items-center gap-3 mb-3 pointer-events-auto">
            {video.user.image ? (
              <img
                src={video.user.image}
                alt={video.user.name || "User"}
                className="w-10 h-10 rounded-full border-2 border-white/50"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-semibold">
                  {video.user.name?.[0] || "?"}
                </span>
              </div>
            )}
            <span className="font-semibold">{video.user.name || "Anonymous"}</span>
          </div>

          <h3 className="text-lg font-semibold mb-1 line-clamp-2">{video.title}</h3>

          {video.description && (
            <p className="text-sm text-gray-300 line-clamp-2 mb-2">
              {video.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
              {video.source.type}
            </span>
            {video.topic && (
              <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full">
                #{video.topic}
              </span>
            )}
            {video.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-white/10 px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
            {video.viewCount !== undefined && video.viewCount > 0 && (
              <span className="text-xs text-gray-400">
                {formatCount(video.viewCount)} views
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
