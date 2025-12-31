"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import FeedCard from "./FeedCard";
import { X, Sparkles, BookOpen, FileText, Table2, Filter } from "lucide-react";

interface FeedItem {
  id: string;
  type: "FLASHCARD_DECK" | "SUMMARY" | "TABLE" | "AUDIO_SUMMARY";
  title: string;
  description?: string | null;
  audioUrl?: string | null;
  topic?: string | null;
  tags?: string[];
  viewCount?: number;
  likeCount: number;
  bookmarkCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  user: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
  source: {
    id: string;
    title: string;
    type: string;
  };
  summary?: {
    content: string;
    keyPoints: string[];
    highlights: string[];
    readTime?: number | null;
  } | null;
  contentTable?: {
    tableTitle: string;
    headers: string[];
    rows: string[][];
    caption?: string | null;
  } | null;
  flashcardDeck?: {
    id: string;
    title: string;
    description?: string | null;
    color?: string | null;
    cards: Array<{
      id: string;
      front: string;
      back: string;
    }>;
    _count: {
      cards: number;
    };
  } | null;
}

interface ContentFeedProps {
  initialItems: FeedItem[];
}

const typeFilters = [
  { value: "", label: "All", icon: Sparkles },
  { value: "FLASHCARD_DECK", label: "Flashcards", icon: BookOpen },
  { value: "SUMMARY", label: "Summaries", icon: FileText },
  { value: "TABLE", label: "Tables", icon: Table2 },
];

export default function ContentFeed({ initialItems }: ContentFeedProps) {
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic");

  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeType, setActiveType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch items when filters change
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = "/api/feed";
      const params = new URLSearchParams();

      if (topic) params.set("topic", topic);
      if (activeType) params.set("type", activeType);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const newItems = await res.json();
      setItems(Array.isArray(newItems) ? newItems : []);
      setActiveIndex(0);
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [topic, activeType]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const loadMoreItems = useCallback(async () => {
    if (isLoading || items.length === 0) return;
    setIsLoading(true);

    try {
      const lastItem = items[items.length - 1];
      const params = new URLSearchParams();
      params.set("cursor", lastItem.id);

      if (topic) params.set("topic", topic);
      if (activeType) params.set("type", activeType);

      const res = await fetch(`/api/feed?${params.toString()}`);
      const newItems = await res.json();
      if (Array.isArray(newItems) && newItems.length > 0) {
        setItems((prev) => [...prev, ...newItems]);
      }
    } catch (error) {
      console.error("Error loading more items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [items, isLoading, topic, activeType]);

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

      if (newIndex >= items.length - 2) {
        loadMoreItems();
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeIndex, items.length, loadMoreItems]);

  // Card size varies by type for mixed timeline effect
  const getCardHeight = (type: string) => {
    switch (type) {
      case "FLASHCARD_DECK":
        return "h-screen"; // Full height for interactive flashcards
      case "SUMMARY":
      case "AUDIO_SUMMARY":
        return "h-screen"; // Full height for reading
      case "TABLE":
        return "h-screen"; // Full height for table viewing
      default:
        return "h-screen";
    }
  };

  if (items.length === 0 && !isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>
          {topic ? (
            <>
              <p className="text-gray-400 text-lg mb-2">
                No content found for &quot;{topic}&quot;
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Be the first to create content on this topic!
              </p>
            </>
          ) : (
            <p className="text-gray-400 text-lg mb-4">No content yet</p>
          )}
          <a
            href="/upload"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Create content from your sources
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-900">
      {/* Top bar with filters */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/80 to-transparent pt-4 pb-8 px-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Topic indicator */}
          {topic && (
            <div className="bg-black/60 backdrop-blur-lg border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2">
              <span className="text-xs text-gray-400">Topic:</span>
              <span className="text-xs font-medium text-purple-400">{topic}</span>
              <a
                href="/feed"
                className="w-5 h-5 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`ml-auto bg-black/60 backdrop-blur-lg border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-2 transition-colors ${
              showFilters ? "bg-purple-600/20 border-purple-500/50" : ""
            }`}
          >
            <Filter className="w-4 h-4 text-white" />
            <span className="text-xs text-white">Filter</span>
          </button>
        </div>

        {/* Filter pills */}
        {showFilters && (
          <div className="flex justify-center gap-2 mt-3 max-w-lg mx-auto">
            {typeFilters.map((filter) => {
              const Icon = filter.icon;
              const isActive = activeType === filter.value;
              return (
                <button
                  key={filter.value}
                  onClick={() => setActiveType(filter.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Feed container */}
      <div
        ref={containerRef}
        className="h-screen snap-container hide-scrollbar"
      >
        {items.map((item, index) => (
          <div key={item.id} className={`${getCardHeight(item.type)} snap-item`}>
            <FeedCard item={item} isActive={index === activeIndex} />
          </div>
        ))}
        {isLoading && (
          <div className="h-24 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <div className="fixed bottom-24 right-4 z-40">
        <div className="bg-black/60 backdrop-blur-lg rounded-full px-3 py-1.5">
          <span className="text-xs text-gray-400">
            {activeIndex + 1} / {items.length}
          </span>
        </div>
      </div>
    </div>
  );
}
