"use client";

import { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";

interface GenerateModalProps {
  deckId: string;
  deckTitle: string;
  hasSource: boolean;
  onClose: () => void;
  onGenerated: () => void;
}

export default function GenerateModal({
  deckId,
  deckTitle,
  hasSource,
  onClose,
  onGenerated,
}: GenerateModalProps) {
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [cardStyle, setCardStyle] = useState<"definition" | "question" | "cloze" | "mixed">("mixed");
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch(`/api/flashcards/decks/${deckId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          difficulty,
          cardStyle,
          ...(topic && { topic }),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate");
      }

      onGenerated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold">Generate Flashcards</h3>
              <p className="text-sm text-gray-400">{deckTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Topic (if no source) */}
          {!hasSource && (
            <div>
              <label className="block text-sm font-medium mb-2">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., World War 2, Machine Learning, Spanish Vocabulary"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a topic to generate flashcards about
              </p>
            </div>
          )}

          {/* Count */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Number of cards: {count}
            </label>
            <input
              type="range"
              min="5"
              max="30"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5</span>
              <span>30</span>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "medium", "hard"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`py-2 px-4 rounded-xl border transition-all capitalize ${
                    difficulty === d
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-white/10 hover:border-white/30 text-gray-400"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Card Style */}
          <div>
            <label className="block text-sm font-medium mb-2">Card Style</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "mixed", label: "Mixed" },
                { value: "question", label: "Q&A" },
                { value: "definition", label: "Definitions" },
                { value: "cloze", label: "Fill-in-blank" },
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => setCardStyle(style.value as typeof cardStyle)}
                  className={`py-2 px-4 rounded-xl border transition-all ${
                    cardStyle === style.value
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-white/10 hover:border-white/30 text-gray-400"
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || (!hasSource && !topic)}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate {count} Cards
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
