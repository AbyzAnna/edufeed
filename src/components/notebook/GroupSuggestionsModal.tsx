"use client";

import { useState, useEffect } from "react";
import { X, Lightbulb, Check, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

interface SuggestedNotebook {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  similarity: number;
}

interface Suggestion {
  name: string;
  description: string;
  emoji: string;
  color: string;
  notebooks: SuggestedNotebook[];
  matchReason: string;
}

interface GroupSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied: () => void;
}

export default function GroupSuggestionsModal({
  isOpen,
  onClose,
  onApplied,
}: GroupSuggestionsModalProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [totalUngrouped, setTotalUngrouped] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/notebook-groups/suggestions");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch suggestions");
      }

      setSuggestions(data.suggestions || []);
      setTotalUngrouped(data.totalUngrouped || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async (suggestion: Suggestion) => {
    setApplying(suggestion.name);
    setError("");

    try {
      const response = await fetch("/api/notebook-groups/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: suggestion.name,
          description: suggestion.description,
          emoji: suggestion.emoji,
          color: suggestion.color,
          notebookIds: suggestion.notebooks.map((n) => n.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply suggestion");
      }

      // Remove applied suggestion from list
      setSuggestions((prev) => prev.filter((s) => s.name !== suggestion.name));
      setTotalUngrouped((prev) => prev - suggestion.notebooks.length);
      onApplied();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setApplying(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Smart Grouping Suggestions
              </h2>
              <p className="text-white/50 text-sm">
                {totalUngrouped} ungrouped notebook
                {totalUngrouped !== 1 ? "s" : ""} analyzed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-4" />
              <p className="text-white/60">Analyzing your notebooks...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchSuggestions}
                className="mt-2 text-sm text-red-300 underline"
              >
                Try again
              </button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Lightbulb className="w-8 h-8 text-white/40" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                No Suggestions Available
              </h3>
              <p className="text-white/50 max-w-sm">
                {totalUngrouped === 0
                  ? "All your notebooks are already grouped!"
                  : "We couldn't find any natural groupings. Try adding more notebooks with similar topics."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.name}
                  className="p-4 bg-white/5 rounded-xl border border-white/10"
                  style={{
                    borderLeftColor: suggestion.color,
                    borderLeftWidth: 4,
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{suggestion.emoji}</span>
                      <div>
                        <h4 className="font-semibold text-white">
                          {suggestion.name}
                        </h4>
                        <p className="text-white/50 text-sm">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => applySuggestion(suggestion)}
                      loading={applying === suggestion.name}
                      disabled={!!applying}
                      icon={<Check className="w-4 h-4" />}
                    >
                      Apply
                    </Button>
                  </div>

                  <p className="text-xs text-white/40 mb-3">
                    {suggestion.matchReason}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {suggestion.notebooks.map((notebook) => (
                      <div
                        key={notebook.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg"
                      >
                        <span className="text-sm">{notebook.emoji || "📚"}</span>
                        <span className="text-sm text-white/80 truncate max-w-[150px]">
                          {notebook.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
