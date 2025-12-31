"use client";

import { useAuth } from "@/components/providers/SessionProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import {
  FileText,
  Link as LinkIcon,
  Type,
  Youtube,
  BookOpen,
  Table2,
  Volume2,
  Sparkles,
  Loader2,
  Check,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ContentType = "FLASHCARD_DECK" | "SUMMARY" | "TABLE";

interface Source {
  id: string;
  title: string;
  type: string;
  createdAt: string;
}

interface ContentTypeOption {
  id: ContentType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const contentTypeOptions: ContentTypeOption[] = [
  {
    id: "FLASHCARD_DECK",
    label: "Flashcards",
    description: "Interactive study cards for memorization and active recall",
    icon: <BookOpen className="w-6 h-6" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  {
    id: "SUMMARY",
    label: "Summary",
    description: "Key points, highlights, and concise overview",
    icon: <FileText className="w-6 h-6" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
  },
  {
    id: "TABLE",
    label: "Table",
    description: "Structured data, comparisons, and organized information",
    icon: <Table2 className="w-6 h-6" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
];

function GeneratePageContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedSourceId = searchParams.get("source");

  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<string | null>(preselectedSourceId);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIds, setGeneratedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Generation options
  const [selectedTypes, setSelectedTypes] = useState<ContentType[]>(["SUMMARY", "FLASHCARD_DECK"]);
  const [includeAudio, setIncludeAudio] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced options
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [summaryLength, setSummaryLength] = useState<"short" | "medium" | "long">("medium");
  const [summaryStyle, setSummaryStyle] = useState<"academic" | "casual" | "professional">("professional");
  const [tableType, setTableType] = useState<"comparison" | "timeline" | "definitions" | "data" | "auto">("auto");

  useEffect(() => {
    if (user) {
      fetchSources();
    }
  }, [user]);

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();
      // Ensure we always set an array, even if API returns an error object
      setSources(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching sources:", err);
      setSources([]);
    } finally {
      setIsLoadingSources(false);
    }
  };

  const toggleContentType = (type: ContentType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGenerate = async () => {
    if (!selectedSource) {
      setError("Please select a source");
      return;
    }

    if (selectedTypes.length === 0) {
      setError("Please select at least one content type");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedIds([]);

    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: selectedSource,
          contentTypes: selectedTypes,
          includeAudio,
          flashcardCount,
          summaryLength,
          summaryStyle,
          tableType,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      const data = await res.json();
      setGeneratedIds(data.feedItemIds || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileText className="w-5 h-5" />;
      case "URL":
        return <LinkIcon className="w-5 h-5" />;
      case "YOUTUBE":
        return <Youtube className="w-5 h-5" />;
      default:
        return <Type className="w-5 h-5" />;
    }
  };

  if (isLoading || isLoadingSources) {
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
          <h2 className="text-2xl font-bold mb-4">Sign in to Generate Content</h2>
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
    <div className="min-h-screen p-4 md:p-8 pb-32">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Generate Content</h1>
          <p className="text-gray-400">
            Transform your sources into flashcards, summaries, and tables
          </p>
        </div>

        {/* Source Selection */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">1. Select Source</h2>
          {sources.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No sources yet</p>
              <button
                onClick={() => router.push("/upload")}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors"
              >
                Upload Source
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sources.map((source) => (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                    selectedSource === source.id
                      ? "border-purple-500 bg-purple-500/20"
                      : "border-white/10 hover:border-white/20 bg-white/5"
                  }`}
                >
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                    {getTypeIcon(source.type)}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium truncate">{source.title}</p>
                    <p className="text-sm text-gray-400">
                      {source.type} • {new Date(source.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedSource === source.id && (
                    <Check className="w-5 h-5 text-purple-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Type Selection */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">2. Choose Content Types</h2>
          <div className="space-y-3">
            {contentTypeOptions.map((option) => {
              const isSelected = selectedTypes.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => toggleContentType(option.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isSelected
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 hover:border-white/20 bg-white/5"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl ${option.bgColor} flex items-center justify-center ${option.color}`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected ? "bg-purple-500 border-purple-500" : "border-white/30"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Audio Option */}
          {selectedTypes.includes("SUMMARY") && (
            <div className="mt-4">
              <button
                onClick={() => setIncludeAudio(!includeAudio)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  includeAudio
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-white/10 hover:border-white/20 bg-white/5"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400">
                  <Volume2 className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Voice Narration</p>
                  <p className="text-sm text-gray-400">Add audio narration to your summary</p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    includeAudio ? "bg-orange-500 border-orange-500" : "border-white/30"
                  }`}
                >
                  {includeAudio && <Check className="w-4 h-4 text-white" />}
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Advanced Options */}
        <div className="card p-6 mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            <span>Advanced Options</span>
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-6 pt-4 border-t border-white/10">
              {/* Flashcard Options */}
              {selectedTypes.includes("FLASHCARD_DECK") && (
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Number of Flashcards: <span className="text-purple-400">{flashcardCount}</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    value={flashcardCount}
                    onChange={(e) => setFlashcardCount(parseInt(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5</span>
                    <span>25</span>
                  </div>
                </div>
              )}

              {/* Summary Options */}
              {selectedTypes.includes("SUMMARY") && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-3">Summary Length</label>
                    <div className="flex gap-2">
                      {(["short", "medium", "long"] as const).map((length) => (
                        <button
                          key={length}
                          onClick={() => setSummaryLength(length)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            summaryLength === length
                              ? "bg-purple-600 text-white"
                              : "bg-white/10 text-gray-300 hover:bg-white/20"
                          }`}
                        >
                          {length.charAt(0).toUpperCase() + length.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-3">Writing Style</label>
                    <div className="flex gap-2">
                      {(["casual", "professional", "academic"] as const).map((style) => (
                        <button
                          key={style}
                          onClick={() => setSummaryStyle(style)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                            summaryStyle === style
                              ? "bg-purple-600 text-white"
                              : "bg-white/10 text-gray-300 hover:bg-white/20"
                          }`}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Table Options */}
              {selectedTypes.includes("TABLE") && (
                <div>
                  <label className="block text-sm font-medium mb-3">Table Type</label>
                  <select
                    value={tableType}
                    onChange={(e) => setTableType(e.target.value as typeof tableType)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="auto">Auto-detect best type</option>
                    <option value="comparison">Comparison</option>
                    <option value="timeline">Timeline</option>
                    <option value="definitions">Definitions</option>
                    <option value="data">Data</option>
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
            {error}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedSource || selectedTypes.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/25"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate {selectedTypes.length} Content{selectedTypes.length !== 1 ? "s" : ""}
            </>
          )}
        </button>

        {/* Success Results */}
        {generatedIds.length > 0 && (
          <div className="mt-8 card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Check className="w-6 h-6 text-green-500" />
              Content Generated!
            </h2>
            <p className="text-gray-400 mb-4">
              {generatedIds.length} item{generatedIds.length !== 1 ? "s" : ""} created successfully.
            </p>
            <button
              onClick={() => router.push("/feed")}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors"
            >
              View in Feed
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
