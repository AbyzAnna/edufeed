"use client";

import { useAuth } from "@/components/providers/SessionProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Loader2,
  Plus,
  Podcast,
  RefreshCw,
  ChevronRight,
  Clock,
  Calendar,
  Search,
  X,
  Trash2,
} from "lucide-react";

interface PodcastEpisode {
  id: string;
  guid: string;
  title: string;
  description?: string | null;
  audioUrl: string;
  duration?: number | null;
  publishedAt?: string | null;
}

interface PodcastFeed {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  author?: string | null;
  feedUrl: string;
  lastFetched?: string | null;
  episodes: PodcastEpisode[];
  _count: {
    episodes: number;
  };
}

export default function PodcastsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [feeds, setFeeds] = useState<PodcastFeed[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedFeed, setExpandedFeed] = useState<string | null>(null);
  const [refreshingFeed, setRefreshingFeed] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchFeeds();
    }
  }, [user]);

  const fetchFeeds = async () => {
    try {
      const res = await fetch("/api/podcasts");
      const data = await res.json();
      setFeeds(data);
    } catch (error) {
      console.error("Error fetching feeds:", error);
    } finally {
      setPageLoading(false);
    }
  };

  const handleRefresh = async (feedId: string) => {
    setRefreshingFeed(feedId);
    try {
      const res = await fetch(`/api/podcasts/${feedId}`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchFeeds();
      }
    } catch (error) {
      console.error("Error refreshing feed:", error);
    } finally {
      setRefreshingFeed(null);
    }
  };

  const handleUnsubscribe = async (feedId: string) => {
    if (!confirm("Are you sure you want to unsubscribe from this podcast?")) {
      return;
    }

    try {
      const res = await fetch(`/api/podcasts/${feedId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setFeeds((prev) => prev.filter((f) => f.id !== feedId));
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const playEpisode = (episode: PodcastEpisode, feed: PodcastFeed) => {
    // Navigate to media player with podcast episode
    // First, we need to add it as media content
    router.push(
      `/study/media?type=PODCAST&url=${encodeURIComponent(
        episode.audioUrl
      )}&title=${encodeURIComponent(episode.title)}`
    );
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
          <h2 className="text-2xl font-bold mb-4">Sign in to Access Podcasts</h2>
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
            <h1 className="text-3xl font-bold mb-2">Podcasts</h1>
            <p className="text-gray-400">
              {feeds.length} subscription{feeds.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Subscribe
          </button>
        </div>

        {/* Content */}
        {feeds.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Podcast className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No podcasts yet</h3>
            <p className="text-gray-400 mb-6">
              Subscribe to educational podcasts to learn on the go
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Subscribe to Podcast
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {feeds.map((feed) => (
              <div key={feed.id} className="card overflow-hidden">
                {/* Feed header */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() =>
                    setExpandedFeed(expandedFeed === feed.id ? null : feed.id)
                  }
                >
                  <div className="flex items-start gap-4">
                    {/* Cover */}
                    <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {feed.imageUrl ? (
                        <img
                          src={feed.imageUrl}
                          alt={feed.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Podcast className="w-8 h-8 text-purple-500" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-1">{feed.title}</h3>
                      {feed.author && (
                        <p className="text-sm text-gray-400">{feed.author}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                        <span>{feed._count.episodes} episodes</span>
                        {feed.lastFetched && (
                          <span>Updated {formatDate(feed.lastFetched)}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefresh(feed.id);
                        }}
                        disabled={refreshingFeed === feed.id}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${
                            refreshingFeed === feed.id ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnsubscribe(feed.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Unsubscribe"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          expandedFeed === feed.id ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Episodes (expanded) */}
                {expandedFeed === feed.id && (
                  <div className="border-t border-white/10">
                    {feed.episodes.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        No episodes available
                      </div>
                    ) : (
                      <div className="divide-y divide-white/10">
                        {feed.episodes.map((episode) => (
                          <button
                            key={episode.id}
                            onClick={() => playEpisode(episode, feed)}
                            className="w-full p-4 text-left hover:bg-white/5 transition-colors"
                          >
                            <h4 className="font-medium line-clamp-1">
                              {episode.title}
                            </h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                              {episode.duration && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(episode.duration)}
                                </span>
                              )}
                              {episode.publishedAt && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(episode.publishedAt)}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddPodcastModal
          onClose={() => setShowAddModal(false)}
          onAdded={fetchFeeds}
        />
      )}
    </div>
  );
}

interface AddPodcastModalProps {
  onClose: () => void;
  onAdded: () => void;
}

function AddPodcastModal({ onClose, onAdded }: AddPodcastModalProps) {
  const [feedUrl, setFeedUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { feedUrl: string; title: string; author: string; imageUrl: string }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"url" | "search">("search");

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setError("");

    try {
      const res = await fetch(
        `/api/podcasts/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data);
    } catch (err) {
      setError("Failed to search podcasts");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubscribe = async (url: string) => {
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/podcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedUrl: url }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to subscribe");
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
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Subscribe to Podcast</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "search"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Search Podcasts
          </button>
          <button
            onClick={() => setActiveTab("url")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "url"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Enter RSS URL
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "search" ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search for podcasts..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSubscribe(result.feedUrl)}
                      disabled={isSubmitting}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 transition-colors text-left disabled:opacity-50"
                    >
                      <img
                        src={result.imageUrl}
                        alt={result.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-1">{result.title}</p>
                        <p className="text-sm text-gray-400 line-clamp-1">
                          {result.author}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  RSS Feed URL
                </label>
                <input
                  type="url"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder="https://feeds.example.com/podcast.xml"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={() => handleSubscribe(feedUrl)}
                disabled={isSubmitting || !feedUrl}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
