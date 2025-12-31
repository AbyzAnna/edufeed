"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import VideoPlayer from "./VideoPlayer";
import { X, Sparkles } from "lucide-react";

interface Video {
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
}

interface VideoFeedProps {
  initialVideos: Video[];
}

export default function VideoFeed({ initialVideos }: VideoFeedProps) {
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic");

  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset videos when topic changes
  useEffect(() => {
    const fetchVideos = async () => {
      setIsLoading(true);
      try {
        const url = topic
          ? `/api/videos?topic=${encodeURIComponent(topic)}`
          : "/api/videos";
        const res = await fetch(url);
        const newVideos = await res.json();
        setVideos(newVideos);
        setActiveIndex(0);
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we have a topic, otherwise use initialVideos
    if (topic) {
      fetchVideos();
    } else if (initialVideos.length > 0) {
      setVideos(initialVideos);
    }
  }, [topic, initialVideos]);

  const loadMoreVideos = useCallback(async () => {
    if (isLoading || videos.length === 0) return;
    setIsLoading(true);

    try {
      const lastVideo = videos[videos.length - 1];
      let url = `/api/videos?cursor=${lastVideo?.id}`;
      if (topic) {
        url += `&topic=${encodeURIComponent(topic)}`;
      }
      const res = await fetch(url);
      const newVideos = await res.json();
      if (newVideos.length > 0) {
        setVideos((prev) => [...prev, ...newVideos]);
      }
    } catch (error) {
      console.error("Error loading more videos:", error);
    } finally {
      setIsLoading(false);
    }
  }, [videos, isLoading, topic]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const itemHeight = container.clientHeight;
      const newIndex = Math.round(scrollTop / itemHeight);

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
      }

      if (newIndex >= videos.length - 2) {
        loadMoreVideos();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, videos.length, loadMoreVideos]);

  if (videos.length === 0 && !isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          {topic ? (
            <>
              <p className="text-gray-400 text-lg mb-2">
                No videos found for &quot;{topic}&quot;
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Be the first to create content on this topic!
              </p>
            </>
          ) : (
            <p className="text-gray-400 text-lg mb-4">No videos yet</p>
          )}
          <a
            href="/upload"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Create your first video
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Topic filter indicator */}
      {topic && (
        <div className="fixed top-4 left-4 right-4 z-40 flex justify-center pointer-events-none">
          <div className="bg-black/80 backdrop-blur-lg border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 pointer-events-auto">
            <span className="text-sm text-gray-300">Showing:</span>
            <span className="text-sm font-medium text-purple-400">{topic}</span>
            <a
              href="/feed"
              className="ml-2 w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className="h-screen snap-container hide-scrollbar"
      >
        {videos.map((video, index) => (
          <div key={video.id} className="h-screen snap-item">
            <VideoPlayer video={video} isActive={index === activeIndex} />
          </div>
        ))}
        {isLoading && (
          <div className="h-24 flex items-center justify-center">
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  );
}
