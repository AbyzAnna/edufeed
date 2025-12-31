"use client";

import { useState } from "react";
import {
  Heart,
  Bookmark,
  Share2,
  Volume2,
  VolumeX,
  BookOpen,
  FileText,
  Table2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  MessageCircle,
} from "lucide-react";
import CommentSection from "@/components/social/CommentSection";
import ShareModal from "@/components/social/ShareModal";

// Types
interface FeedItemBase {
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

interface FeedCardProps {
  item: FeedItemBase;
  isActive: boolean;
}

export default function FeedCard({ item, isActive }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [isBookmarked, setIsBookmarked] = useState(item.isBookmarked);
  const [likeCount, setLikeCount] = useState(item.likeCount);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleLike = async () => {
    try {
      const res = await fetch(`/api/feed/${item.id}/like`, { method: "POST" });
      const data = await res.json();
      setIsLiked(data.liked);
      setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch (error) {
      console.error("Error liking:", error);
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await fetch(`/api/feed/${item.id}/bookmark`, { method: "POST" });
      const data = await res.json();
      setIsBookmarked(data.bookmarked);
    } catch (error) {
      console.error("Error bookmarking:", error);
    }
  };

  const toggleAudio = () => {
    if (!item.audioUrl) return;

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      const audio = new Audio(item.audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case "FLASHCARD_DECK":
        return <BookOpen className="w-5 h-5" />;
      case "SUMMARY":
      case "AUDIO_SUMMARY":
        return <FileText className="w-5 h-5" />;
      case "TABLE":
        return <Table2 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case "FLASHCARD_DECK":
        return "Flashcard Deck";
      case "SUMMARY":
        return "Summary";
      case "AUDIO_SUMMARY":
        return "Audio Summary";
      case "TABLE":
        return "Table";
      default:
        return "Content";
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case "FLASHCARD_DECK":
        return "from-purple-500 to-indigo-600";
      case "SUMMARY":
        return "from-emerald-500 to-teal-600";
      case "AUDIO_SUMMARY":
        return "from-orange-500 to-amber-600";
      case "TABLE":
        return "from-blue-500 to-cyan-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getTypeColor()} flex items-center justify-center`}>
            {getTypeIcon()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{item.user.name || "Anonymous"}</p>
            <p className="text-xs text-gray-400">{getTypeLabel()}</p>
          </div>
        </div>
        {item.audioUrl && (
          <button
            onClick={toggleAudio}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden px-4">
        {item.type === "FLASHCARD_DECK" && item.flashcardDeck && (
          <FlashcardDeckContent deck={item.flashcardDeck} />
        )}
        {(item.type === "SUMMARY" || item.type === "AUDIO_SUMMARY") && item.summary && (
          <SummaryContent summary={item.summary} title={item.title} />
        )}
        {item.type === "TABLE" && item.contentTable && (
          <TableContent table={item.contentTable} />
        )}
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {item.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 bg-white/10 rounded-full text-xs text-gray-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center justify-between border-t border-white/10">
        <div className="flex items-center gap-6">
          <button
            onClick={handleLike}
            className="flex items-center gap-2 transition-colors"
          >
            <Heart
              className={`w-6 h-6 ${isLiked ? "fill-red-500 text-red-500" : "text-white"}`}
            />
            <span className="text-sm text-gray-300">{likeCount}</span>
          </button>
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-2 transition-colors"
          >
            <MessageCircle className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={handleBookmark}
            className="flex items-center gap-2 transition-colors"
          >
            <Bookmark
              className={`w-6 h-6 ${isBookmarked ? "fill-yellow-500 text-yellow-500" : "text-white"}`}
            />
          </button>
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 transition-colors"
          >
            <Share2 className="w-6 h-6 text-white" />
          </button>
        </div>
        <div className="text-sm text-gray-400">
          {item.source.title}
        </div>
      </div>

      {/* Comment Section Modal */}
      <CommentSection
        feedItemId={item.id}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      {/* Share Modal */}
      <ShareModal
        feedItemId={item.id}
        feedItemTitle={item.title}
        isOpen={showShare}
        onClose={() => setShowShare(false)}
      />
    </div>
  );
}

// Flashcard Deck Content
function FlashcardDeckContent({ deck }: { deck: NonNullable<FeedItemBase["flashcardDeck"]> }) {
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const cards = deck.cards;
  const totalCards = deck._count.cards;

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1) % cards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev - 1 + cards.length) % cards.length);
  };

  if (cards.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400">No preview cards available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-bold text-white mb-2">{deck.title}</h2>
      {deck.description && (
        <p className="text-sm text-gray-400 mb-4">{deck.description}</p>
      )}

      <div className="flex-1 flex items-center justify-center">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="w-full max-w-sm aspect-[3/2] cursor-pointer perspective-1000"
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* Front */}
            <div
              className="absolute inset-0 rounded-2xl p-6 flex items-center justify-center text-center backface-hidden"
              style={{
                backgroundColor: deck.color || "#6366f1",
                backfaceVisibility: "hidden",
              }}
            >
              <p className="text-lg font-medium text-white">{cards[currentCard].front}</p>
            </div>
            {/* Back */}
            <div
              className="absolute inset-0 rounded-2xl p-6 flex items-center justify-center text-center bg-white"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <p className="text-lg text-gray-800">{cards[currentCard].back}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between py-4">
        <button
          onClick={prevCard}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Card {currentCard + 1} of {cards.length}
          </p>
          <p className="text-xs text-gray-500">{totalCards} cards in deck</p>
        </div>
        <button
          onClick={nextCard}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5 text-white" />
        </button>
      </div>

      <p className="text-center text-xs text-gray-500 mb-2">Tap card to flip</p>
    </div>
  );
}

// Summary Content
function SummaryContent({
  summary,
  title,
}: {
  summary: NonNullable<FeedItemBase["summary"]>;
  title: string;
}) {
  return (
    <div className="h-full overflow-y-auto hide-scrollbar">
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>

      <p className="text-gray-300 leading-relaxed mb-6">{summary.content}</p>

      {summary.keyPoints.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-3">
            Key Points
          </h3>
          <ul className="space-y-2">
            {summary.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.highlights.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">
            Highlights
          </h3>
          <div className="space-y-3">
            {summary.highlights.map((highlight, i) => (
              <div
                key={i}
                className="pl-4 border-l-2 border-amber-500 py-1"
              >
                <p className="text-gray-300 text-sm italic">&ldquo;{highlight}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.readTime && (
        <p className="text-xs text-gray-500 mt-4">
          ~{Math.ceil(summary.readTime / 60)} min read
        </p>
      )}
    </div>
  );
}

// Table Content
function TableContent({ table }: { table: NonNullable<FeedItemBase["contentTable"]> }) {
  return (
    <div className="h-full overflow-hidden flex flex-col">
      <h2 className="text-xl font-bold text-white mb-2">{table.tableTitle}</h2>
      {table.caption && (
        <p className="text-sm text-gray-400 mb-4">{table.caption}</p>
      )}

      <div className="flex-1 overflow-auto hide-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {table.headers.map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-sm font-semibold text-white bg-white/10 first:rounded-tl-lg last:rounded-tr-lg"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(table.rows as string[][]).map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-3 text-sm text-gray-300"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
