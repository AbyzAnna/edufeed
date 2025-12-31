"use client";

import { useAuth } from "@/components/providers/SessionProvider";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, BookOpen } from "lucide-react";
import FlashcardDeck from "@/components/study/FlashcardDeck";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string | null;
}

interface DeckData {
  id: string;
  title: string;
  description?: string;
  cards: Flashcard[];
  stats: {
    total: number;
    due: number;
    mastered: number;
    learning: number;
  };
}

export default function StudyFlashcardsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const deckId = params.deckId as string;

  const [deck, setDeck] = useState<DeckData | null>(null);
  const [reviewCards, setReviewCards] = useState<Flashcard[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && deckId) {
      fetchDeck();
      fetchReviewCards();
    }
  }, [user, deckId]);

  const fetchDeck = async () => {
    try {
      const res = await fetch(`/api/flashcards/${deckId}`);
      if (!res.ok) throw new Error("Failed to fetch deck");
      const data = await res.json();
      setDeck(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading deck");
    }
  };

  const fetchReviewCards = async () => {
    try {
      const res = await fetch(`/api/flashcards/${deckId}/review?limit=20`);
      if (!res.ok) throw new Error("Failed to fetch cards");
      const data = await res.json();
      setReviewCards(data.cards || []);
    } catch (err) {
      console.error("Error fetching review cards:", err);
    } finally {
      setPageLoading(false);
    }
  };

  const handleReview = useCallback(
    async (cardId: string, quality: number, responseMs: number) => {
      try {
        await fetch(`/api/flashcards/${deckId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId, quality, responseMs }),
        });
      } catch (err) {
        console.error("Error recording review:", err);
      }
    },
    [deckId]
  );

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    // Refresh deck stats
    fetchDeck();
  }, []);

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
          <h2 className="text-2xl font-bold mb-4">Sign in to Study</h2>
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
            onClick={() => router.push("/library")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Deck not found</h2>
          <button
            onClick={() => router.push("/library")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Session Complete!</h1>
          <p className="text-gray-400 mb-8">
            Great job! You&apos;ve reviewed all due cards in this deck.
          </p>

          {deck && (
            <div className="card p-6 mb-8">
              <h3 className="font-semibold mb-4">Deck Stats</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">
                    {deck.stats.total}
                  </p>
                  <p className="text-sm text-gray-400">Total Cards</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {deck.stats.mastered}
                  </p>
                  <p className="text-sm text-gray-400">Mastered</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">
                    {deck.stats.learning}
                  </p>
                  <p className="text-sm text-gray-400">Learning</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setIsComplete(false);
                fetchReviewCards();
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Study More
            </button>
            <button
              onClick={() => router.push("/library")}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Back to Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (reviewCards.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">All caught up!</h2>
            <p className="text-gray-400 mb-8">
              No cards are due for review right now. Come back later!
            </p>
            <button
              onClick={() => router.push("/library")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Back to Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Flashcard Deck */}
        <FlashcardDeck
          cards={reviewCards}
          deckTitle={deck.title}
          onReview={handleReview}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
