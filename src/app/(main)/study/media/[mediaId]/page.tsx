"use client";

import { useAuth } from "@/components/providers/SessionProvider";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import UniversalPlayer from "@/components/media/player/UniversalPlayer";
import YouTubePlayer from "@/components/media/player/YouTubePlayer";

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

interface MediaData {
  id: string;
  type: "YOUTUBE" | "PODCAST" | "AUDIO" | "VIDEO";
  title: string;
  description?: string | null;
  url: string;
  duration?: number | null;
  chapters: Chapter[];
  notes: Note[];
  bookmarks: Bookmark[];
}

export default function MediaPlayerPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const mediaId = params.mediaId as string;

  const [media, setMedia] = useState<MediaData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && mediaId) {
      fetchMedia();
    }
  }, [user, mediaId]);

  const fetchMedia = async () => {
    try {
      const res = await fetch(`/api/media/${mediaId}`);
      if (!res.ok) throw new Error("Failed to fetch media");
      const data = await res.json();
      setMedia(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading media");
    } finally {
      setPageLoading(false);
    }
  };

  const handleAddBookmark = useCallback(
    async (timestamp: number) => {
      try {
        const res = await fetch(`/api/media/${mediaId}/bookmarks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timestamp }),
        });

        if (!res.ok) throw new Error("Failed to add bookmark");

        const data = await res.json();

        if (data.removed) {
          setMedia((prev) =>
            prev
              ? {
                  ...prev,
                  bookmarks: prev.bookmarks.filter(
                    (b) => b.timestamp !== timestamp
                  ),
                }
              : null
          );
        } else {
          setMedia((prev) =>
            prev
              ? {
                  ...prev,
                  bookmarks: [...prev.bookmarks, data.bookmark].sort(
                    (a, b) => a.timestamp - b.timestamp
                  ),
                }
              : null
          );
        }
      } catch (err) {
        console.error("Error adding bookmark:", err);
      }
    },
    [mediaId]
  );

  const handleAddNote = useCallback(
    async (timestamp: number, content: string) => {
      try {
        const res = await fetch(`/api/media/${mediaId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timestamp, content }),
        });

        if (!res.ok) throw new Error("Failed to add note");

        const data = await res.json();

        setMedia((prev) =>
          prev
            ? {
                ...prev,
                notes: [...prev.notes, data.note].sort(
                  (a, b) => a.timestamp - b.timestamp
                ),
              }
            : null
        );
      } catch (err) {
        console.error("Error adding note:", err);
      }
    },
    [mediaId]
  );

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&\n?#]+)/
    );
    return match ? match[1] : null;
  };

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to View Media</h2>
          <button
            onClick={() => router.push("/login")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push("/study/media")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Back to Media Library
          </button>
        </div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Media not found</h2>
          <button
            onClick={() => router.push("/study/media")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Back to Media Library
          </button>
        </div>
      </div>
    );
  }

  const youtubeVideoId =
    media.type === "YOUTUBE" ? getYouTubeVideoId(media.url) : null;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Title */}
        <h1 className="text-2xl font-bold mb-6">{media.title}</h1>

        {/* Player */}
        {media.type === "YOUTUBE" && youtubeVideoId ? (
          <YouTubePlayer
            videoId={youtubeVideoId}
            title={media.title}
            chapters={media.chapters}
            bookmarks={media.bookmarks}
            notes={media.notes}
            onAddBookmark={handleAddBookmark}
            onAddNote={handleAddNote}
          />
        ) : (
          <UniversalPlayer
            type={media.type}
            url={media.url}
            title={media.title}
            chapters={media.chapters}
            bookmarks={media.bookmarks}
            notes={media.notes}
            duration={media.duration || undefined}
            onAddBookmark={handleAddBookmark}
            onAddNote={handleAddNote}
          />
        )}

        {/* Description */}
        {media.description && (
          <div className="mt-6 p-4 bg-white/5 rounded-xl">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-400 whitespace-pre-wrap">
              {media.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
