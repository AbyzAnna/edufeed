"use client";

import { useAuth } from "@/components/providers/SessionProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Loader2,
  Plus,
  Youtube,
  Headphones,
  Video,
  Podcast,
  ChevronRight,
  Clock,
  StickyNote,
  Bookmark,
} from "lucide-react";

interface MediaContent {
  id: string;
  type: "YOUTUBE" | "PODCAST" | "AUDIO" | "VIDEO";
  title: string;
  description?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  duration?: number | null;
  chapters: { id: string }[];
  _count: {
    notes: number;
    bookmarks: number;
  };
  createdAt: string;
}

export default function MediaLibraryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [mediaContents, setMediaContents] = useState<MediaContent[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMedia();
    }
  }, [user, activeFilter]);

  const fetchMedia = async () => {
    try {
      const url = activeFilter
        ? `/api/media?type=${activeFilter}`
        : "/api/media";
      const res = await fetch(url);
      const data = await res.json();
      setMediaContents(data);
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "YOUTUBE":
        return <Youtube className="w-5 h-5 text-red-500" />;
      case "PODCAST":
        return <Podcast className="w-5 h-5 text-purple-500" />;
      case "AUDIO":
        return <Headphones className="w-5 h-5 text-blue-500" />;
      case "VIDEO":
        return <Video className="w-5 h-5 text-green-500" />;
      default:
        return <Video className="w-5 h-5" />;
    }
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
          <h2 className="text-2xl font-bold mb-4">Sign in to Access Media</h2>
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

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Media Library</h1>
            <p className="text-gray-400">
              {mediaContents.length} item{mediaContents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Media
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-colors ${
              activeFilter === null
                ? "bg-purple-600 text-white"
                : "bg-white/10 hover:bg-white/20"
            }`}
          >
            All
          </button>
          {["YOUTUBE", "PODCAST", "AUDIO", "VIDEO"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`px-4 py-2 rounded-xl whitespace-nowrap flex items-center gap-2 transition-colors ${
                activeFilter === type
                  ? "bg-purple-600 text-white"
                  : "bg-white/10 hover:bg-white/20"
              }`}
            >
              {getTypeIcon(type)}
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Content */}
        {mediaContents.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No media yet</h3>
            <p className="text-gray-400 mb-6">
              Add YouTube videos, podcasts, or audio files to study with the
              enhanced player
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Media
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {mediaContents.map((media) => (
              <button
                key={media.id}
                onClick={() => router.push(`/study/media/${media.id}`)}
                className="w-full card p-4 hover:bg-white/10 transition-colors text-left"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-16 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {media.thumbnailUrl ? (
                      <img
                        src={media.thumbnailUrl}
                        alt={media.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getTypeIcon(media.type)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold line-clamp-1">
                          {media.title}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            {getTypeIcon(media.type)}
                            {media.type.charAt(0) +
                              media.type.slice(1).toLowerCase()}
                          </span>
                          {media.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDuration(media.duration)}
                            </span>
                          )}
                          {media.chapters.length > 0 && (
                            <span>{media.chapters.length} chapters</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </div>

                    {/* Stats */}
                    {(media._count.notes > 0 || media._count.bookmarks > 0) && (
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {media._count.notes > 0 && (
                          <span className="flex items-center gap-1 text-yellow-500">
                            <StickyNote className="w-4 h-4" />
                            {media._count.notes} notes
                          </span>
                        )}
                        {media._count.bookmarks > 0 && (
                          <span className="flex items-center gap-1 text-purple-400">
                            <Bookmark className="w-4 h-4" />
                            {media._count.bookmarks} bookmarks
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Media Modal */}
      {showAddModal && (
        <AddMediaModal onClose={() => setShowAddModal(false)} onAdded={fetchMedia} />
      )}
    </div>
  );
}

interface AddMediaModalProps {
  onClose: () => void;
  onAdded: () => void;
}

function AddMediaModal({ onClose, onAdded }: AddMediaModalProps) {
  const [type, setType] = useState<"YOUTUBE" | "PODCAST" | "AUDIO" | "VIDEO">(
    "YOUTUBE"
  );
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!url) {
      setError("URL is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          url,
          title: title || url,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add media");
      }

      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold">Add Media</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {(["YOUTUBE", "PODCAST", "AUDIO", "VIDEO"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                    type === t
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  {t === "YOUTUBE" && <Youtube className="w-5 h-5" />}
                  {t === "PODCAST" && <Podcast className="w-5 h-5" />}
                  {t === "AUDIO" && <Headphones className="w-5 h-5" />}
                  {t === "VIDEO" && <Video className="w-5 h-5" />}
                  <span className="text-xs">
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium mb-2">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                type === "YOUTUBE"
                  ? "https://youtube.com/watch?v=..."
                  : "https://..."
              }
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Auto-detected from URL"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Adding..." : "Add Media"}
          </button>
        </div>
      </div>
    </div>
  );
}
