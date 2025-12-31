"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Check,
  X,
  Brain,
  Zap,
} from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string | null;
}

interface FlashcardDeckProps {
  cards: Flashcard[];
  deckTitle: string;
  onReview: (cardId: string, quality: number, responseMs: number) => void;
  onComplete?: () => void;
}

const QUALITY_OPTIONS = [
  { value: 0, label: "Again", color: "bg-red-600 hover:bg-red-700", icon: X },
  { value: 3, label: "Hard", color: "bg-orange-600 hover:bg-orange-700", icon: Brain },
  { value: 4, label: "Good", color: "bg-blue-600 hover:bg-blue-700", icon: Check },
  { value: 5, label: "Easy", color: "bg-green-600 hover:bg-green-700", icon: Zap },
];

export default function FlashcardDeck({
  cards,
  deckTitle,
  onReview,
  onComplete,
}: FlashcardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const startTimeRef = useRef<number>(0);
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  // Initialize startTime on mount and when card changes
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [currentIndex]);

  const currentCard = cards[currentIndex];
  const progress = (reviewed.size / cards.length) * 100;

  const handleFlip = useCallback(() => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setShowHint(false);
    }
  }, [isFlipped]);

  const handleReview = useCallback(
    (quality: number) => {
      if (!currentCard) return;

      const responseMs = Date.now() - startTimeRef.current;
      onReview(currentCard.id, quality, responseMs);

      // Mark as reviewed
      setReviewed((prev) => new Set(prev).add(currentCard.id));

      // Move to next card or complete
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setShowHint(false);
      } else {
        onComplete?.();
      }
    },
    [currentCard, currentIndex, cards.length, onReview, onComplete]
  );

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex, cards.length]);

  if (!currentCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Check className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">All done!</h2>
        <p className="text-gray-400">You&apos;ve reviewed all cards in this deck.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="w-full mb-6">
        <h2 className="text-xl font-semibold text-center mb-2">{deckTitle}</h2>
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span>{reviewed.size} reviewed</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="relative w-full aspect-[3/2] cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div
          className={`absolute inset-0 transition-transform duration-500 transform-style-preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden">
            <div className="w-full h-full bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center">
              <p className="text-xl md:text-2xl text-center font-medium">
                {currentCard.front}
              </p>
              <p className="text-gray-400 text-sm mt-4">Tap to reveal answer</p>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 backface-hidden rotate-y-180">
            <div className="w-full h-full bg-gradient-to-br from-blue-900/50 to-cyan-900/50 rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center">
              <p className="text-xl md:text-2xl text-center font-medium">
                {currentCard.back}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hint button */}
      {currentCard.hint && !isFlipped && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowHint(!showHint);
          }}
          className="mt-4 flex items-center gap-2 text-yellow-500 hover:text-yellow-400 transition-colors"
        >
          <Lightbulb className="w-5 h-5" />
          <span>{showHint ? "Hide hint" : "Show hint"}</span>
        </button>
      )}

      {/* Hint display */}
      {showHint && currentCard.hint && (
        <div className="mt-2 p-4 bg-yellow-900/30 border border-yellow-600/30 rounded-xl text-yellow-200 text-center">
          {currentCard.hint}
        </div>
      )}

      {/* Rating buttons (shown after flip) */}
      {isFlipped && (
        <div className="mt-6 w-full">
          <p className="text-center text-gray-400 text-sm mb-3">
            How well did you know this?
          </p>
          <div className="grid grid-cols-4 gap-2">
            {QUALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleReview(option.value)}
                className={`${option.color} py-3 px-2 rounded-xl flex flex-col items-center gap-1 transition-colors`}
              >
                <option.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => {
            setIsFlipped(false);
            setShowHint(false);
          }}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="p-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <p className="mt-4 text-xs text-gray-500">
        Press Space to flip, 1-4 to rate, Arrow keys to navigate
      </p>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
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
