"use client";

import { BookOpen, Clock, Sparkles } from "lucide-react";

interface DeckCardProps {
  deck: {
    id: string;
    title: string;
    description?: string | null;
    color?: string | null;
    cardCount: number;
    dueCount: number;
    newCount: number;
    source?: {
      title: string;
      type: string;
    } | null;
    updatedAt: string;
  };
  onClick?: () => void;
}

export default function DeckCard({ deck, onClick }: DeckCardProps) {
  const defaultColor = "#8b5cf6"; // Purple
  const deckColor = deck.color || defaultColor;

  return (
    <div
      onClick={onClick}
      className="group relative bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
    >
      {/* Color accent */}
      <div
        className="absolute top-0 left-0 w-full h-1 rounded-t-2xl"
        style={{ backgroundColor: deckColor }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${deckColor}20` }}
        >
          <BookOpen className="w-6 h-6" style={{ color: deckColor }} />
        </div>

        {deck.dueCount > 0 && (
          <span className="bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            {deck.dueCount} due
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover:text-white transition-colors">
        {deck.title}
      </h3>
      {deck.description && (
        <p className="text-gray-400 text-sm line-clamp-2 mb-4">
          {deck.description}
        </p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>{deck.cardCount} cards</span>
        </div>
        {deck.newCount > 0 && (
          <div className="flex items-center gap-1 text-blue-400">
            <Sparkles className="w-4 h-4" />
            <span>{deck.newCount} new</span>
          </div>
        )}
      </div>

      {/* Source badge */}
      {deck.source && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <span className="text-xs text-gray-500">
            From: {deck.source.title}
          </span>
        </div>
      )}
    </div>
  );
}
