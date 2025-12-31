"use client";

import { useState, useEffect, useCallback } from "react";
import { X, RotateCcw, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
import { getQualityLabel, getQualityColor } from "@/lib/flashcards/sm2";

interface Card {
  id: string;
  front: string;
  back: string;
  hint?: string | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
}

interface StudySessionProps {
  deckId: string;
  deckTitle: string;
  cards: Card[];
  onClose: () => void;
  onComplete: (stats: StudyStats) => void;
}

interface StudyStats {
  total: number;
  reviewed: number;
  correct: number;
  incorrect: number;
  averageQuality: number;
}

export default function StudySession({
  deckId,
  deckTitle,
  cards,
  onClose,
  onComplete,
}: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<
    Map<string, { quality: number; responseMs: number }>
  >(new Map());
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  // Reset state when card changes
  useEffect(() => {
    setIsFlipped(false);
    setShowHint(false);
    setStartTime(Date.now());
  }, [currentIndex]);

  const submitReview = useCallback(
    async (quality: number) => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const responseMs = Date.now() - startTime;

      try {
        await fetch(`/api/flashcards/decks/${deckId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardId: currentCard.id,
            quality,
            responseMs,
          }),
        });

        // Track locally
        setReviewedCards((prev) => {
          const newMap = new Map(prev);
          newMap.set(currentCard.id, { quality, responseMs });
          return newMap;
        });

        // Move to next card or complete
        if (currentIndex < cards.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Calculate stats
          const reviewed = reviewedCards.size + 1;
          const qualities = Array.from(reviewedCards.values()).map(
            (r) => r.quality
          );
          qualities.push(quality);

          const stats: StudyStats = {
            total: cards.length,
            reviewed,
            correct: qualities.filter((q) => q >= 3).length,
            incorrect: qualities.filter((q) => q < 3).length,
            averageQuality:
              qualities.reduce((a, b) => a + b, 0) / qualities.length,
          };

          onComplete(stats);
        }
      } catch (error) {
        console.error("Error submitting review:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [currentCard, currentIndex, cards.length, deckId, reviewedCards, startTime, onComplete, isSubmitting]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === "Escape") {
        onClose();
      } else if (isFlipped && e.key >= "0" && e.key <= "5") {
        submitReview(parseInt(e.key));
      } else if (e.key === "h" && !isFlipped) {
        setShowHint(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFlipped, onClose, submitReview]);

  if (!currentCard) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="text-gray-400">No cards to study</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="font-medium">{deckTitle}</h2>
          <p className="text-sm text-gray-400">
            {currentIndex + 1} / {cards.length}
          </p>
        </div>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full max-w-lg aspect-[3/4] cursor-pointer perspective-1000"
        >
          <div
            className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 border border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              {currentCard.imageUrl && (
                <img
                  src={currentCard.imageUrl}
                  alt=""
                  className="max-h-40 rounded-xl mb-6 object-contain"
                />
              )}
              <p className="text-2xl font-medium leading-relaxed">
                {currentCard.front}
              </p>

              {/* Hint */}
              {currentCard.hint && showHint && (
                <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
                  <p className="text-yellow-200 text-sm flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    {currentCard.hint}
                  </p>
                </div>
              )}

              {currentCard.hint && !showHint && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHint(true);
                  }}
                  className="mt-6 text-sm text-gray-400 hover:text-white flex items-center gap-1"
                >
                  <Lightbulb className="w-4 h-4" />
                  Show hint
                </button>
              )}

              <p className="absolute bottom-6 text-sm text-gray-400">
                Tap to flip
              </p>
            </div>

            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-green-900/50 to-blue-900/50 border border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <p className="text-2xl font-medium leading-relaxed">
                {currentCard.back}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons (shown when flipped) */}
      {isFlipped && (
        <div className="px-4 pb-8">
          <p className="text-center text-gray-400 mb-4 text-sm">
            How well did you know this?
          </p>
          <div className="grid grid-cols-6 gap-2 max-w-lg mx-auto">
            {[0, 1, 2, 3, 4, 5].map((quality) => (
              <button
                key={quality}
                onClick={() => submitReview(quality)}
                disabled={isSubmitting}
                className="flex flex-col items-center p-3 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                style={{
                  backgroundColor: `${getQualityColor(quality)}20`,
                  borderColor: getQualityColor(quality),
                  borderWidth: 2,
                }}
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: getQualityColor(quality) }}
                >
                  {quality}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {getQualityLabel(quality)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation (when not flipped) */}
      {!isFlipped && (
        <div className="flex items-center justify-between px-4 pb-8">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="p-4 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={() => setIsFlipped(true)}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
          >
            Show Answer
          </button>

          <button
            onClick={() =>
              setCurrentIndex((prev) => Math.min(cards.length - 1, prev + 1))
            }
            disabled={currentIndex === cards.length - 1}
            className="p-4 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* CSS for 3D flip effect */}
      <style jsx global>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
