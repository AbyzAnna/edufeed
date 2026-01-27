"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Settings,
  Share2,
  FileText,
  Sparkles,
  Users,
  Trash2,
  RefreshCw,
  ExternalLink,
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import NotebookChat from "@/components/notebook/NotebookChat";
import AddSourceModal from "@/components/notebook/AddSourceModal";
import EditSourceModal from "@/components/notebook/EditSourceModal";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";

interface Source {
  id: string;
  type: string;
  title: string;
  originalUrl: string | null;
  content: string | null;
  wordCount: number | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

interface Output {
  id: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  status: string;
  createdAt: string;
}

interface Notebook {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  isPublic: boolean;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  sources: Source[];
  outputs: Output[];
  _count: {
    sources: number;
    chatMessages: number;
    outputs: number;
  };
}

const OUTPUT_TYPES = [
  { type: "SUMMARY", label: "Summary", icon: "📝" },
  { type: "STUDY_GUIDE", label: "Study Guide", icon: "📖" },
  { type: "FAQ", label: "FAQ", icon: "❓" },
  { type: "FLASHCARD_DECK", label: "Flashcards", icon: "🗂️" },
  { type: "QUIZ", label: "Quiz", icon: "📋" },
  { type: "MIND_MAP", label: "Mind Map", icon: "🧠" },
  { type: "AUDIO_OVERVIEW", label: "Audio Overview", icon: "🎙️" },
  { type: "DATA_TABLE", label: "Data Table", icon: "📊" },
];

export default function NotebookPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.notebookId as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSource, setShowAddSource] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sources" | "outputs">("sources");
  const [generatingOutput, setGeneratingOutput] = useState<string | null>(null);

  useEffect(() => {
    fetchNotebook();
  }, [notebookId]);

  // Poll for status updates when there are processing sources
  useEffect(() => {
    const hasProcessingSources = notebook?.sources.some(
      (s) => s.status === "PROCESSING" || s.status === "PENDING"
    );

    if (!hasProcessingSources) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/notebooks/${notebookId}/sources`);
        if (response.ok) {
          const sources = await response.json();
          setNotebook((prev) =>
            prev ? { ...prev, sources } : null
          );

          // Stop polling if no more processing sources
          const stillProcessing = sources.some(
            (s: Source) => s.status === "PROCESSING" || s.status === "PENDING"
          );
          if (!stillProcessing) {
            clearInterval(pollInterval);
          }
        }
      } catch (error) {
        console.error("Failed to poll sources:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [notebookId, notebook?.sources]);

  const fetchNotebook = async () => {
    try {
      const response = await fetch(`/api/notebooks/${notebookId}`);
      if (response.ok) {
        const data = await response.json();
        setNotebook(data);
      } else if (response.status === 404) {
        router.push("/notebooks");
      }
    } catch (error) {
      console.error("Failed to fetch notebook:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceAdded = (source: unknown) => {
    setNotebook((prev) =>
      prev
        ? {
            ...prev,
            sources: [source as Source, ...prev.sources],
            _count: { ...prev._count, sources: prev._count.sources + 1 },
          }
        : null
    );
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Delete this source?")) return;

    try {
      const response = await fetch(
        `/api/notebooks/${notebookId}/sources?sourceId=${sourceId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setNotebook((prev) =>
          prev
            ? {
                ...prev,
                sources: prev.sources.filter((s) => s.id !== sourceId),
                _count: { ...prev._count, sources: prev._count.sources - 1 },
              }
            : null
        );
      }
    } catch (error) {
      console.error("Failed to delete source:", error);
    }
  };

  const handleSourceUpdated = (updatedSource: Source) => {
    setNotebook((prev) =>
      prev
        ? {
            ...prev,
            sources: prev.sources.map((s) =>
              s.id === updatedSource.id ? updatedSource : s
            ),
          }
        : null
    );
  };

  const toggleSourceExpanded = (sourceId: string) => {
    setExpandedSourceId((prev) => (prev === sourceId ? null : sourceId));
  };

  const handleGenerateOutput = async (type: string) => {
    setGeneratingOutput(type);

    try {
      const response = await fetch(`/api/notebooks/${notebookId}/outputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const output = await response.json();
        setNotebook((prev) =>
          prev
            ? {
                ...prev,
                outputs: [output as Output, ...prev.outputs],
                _count: { ...prev._count, outputs: prev._count.outputs + 1 },
              }
            : null
        );
        setActiveTab("outputs");
      }
    } catch (error) {
      console.error("Failed to generate output:", error);
    } finally {
      setGeneratingOutput(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/60">Notebook not found</p>
      </div>
    );
  }

  const completedSources = notebook.sources.filter(
    (s) => s.status === "COMPLETED"
  ).length;

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/notebooks"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{notebook.emoji || "📚"}</span>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  {notebook.title}
                </h1>
                <p className="text-sm text-white/50">
                  {notebook._count.sources} sources · {completedSources} ready
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" icon={<Share2 className="w-4 h-4" />}>
              Share
            </Button>
            <Link
              href={`/study-rooms?notebookId=${notebook.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-xl text-white font-medium transition-colors"
            >
              <Users className="w-4 h-4" />
              Study Room
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-180px)]">
          {/* Left panel - Sources & Outputs */}
          <div className="flex flex-col bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab("sources")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "sources"
                    ? "text-white border-b-2 border-purple-500"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Sources ({notebook._count.sources})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("outputs")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "outputs"
                    ? "text-white border-b-2 border-purple-500"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generated ({notebook._count.outputs})
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === "sources" ? (
                <div className="space-y-3">
                  {/* Add source button */}
                  <button
                    onClick={() => setShowAddSource(true)}
                    className="w-full p-4 border-2 border-dashed border-white/20 rounded-xl text-white/60 hover:text-white hover:border-purple-500/50 hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Source
                  </button>

                  {/* Source list */}
                  {notebook.sources.map((source) => {
                    const isExpanded = expandedSourceId === source.id;
                    return (
                      <div
                        key={source.id}
                        className="bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors group overflow-hidden"
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className="flex items-start gap-3 flex-1 cursor-pointer"
                              onClick={() => toggleSourceExpanded(source.id)}
                            >
                              <span className="text-xl">
                                {source.type === "PDF" && "📄"}
                                {source.type === "URL" && "🔗"}
                                {source.type === "YOUTUBE" && "🎬"}
                                {source.type === "TEXT" && "📝"}
                                {source.type === "IMAGE" && "🖼️"}
                                {source.type === "AUDIO" && "🎵"}
                                {source.type === "GOOGLE_DOC" && "📑"}
                              </span>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-white truncate">
                                  {source.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {source.status === "COMPLETED" && (
                                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                                      Ready
                                    </span>
                                  )}
                                  {source.status === "PROCESSING" && (
                                    <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1">
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      Processing
                                    </span>
                                  )}
                                  {source.status === "PENDING" && (
                                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                      Pending
                                    </span>
                                  )}
                                  {source.status === "FAILED" && (
                                    <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                                      Failed
                                    </span>
                                  )}
                                  {source.wordCount && (
                                    <span className="text-xs text-white/40">
                                      {source.wordCount.toLocaleString()} words
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button className="p-1 text-white/40 hover:text-white/60">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {source.originalUrl && (
                                <a
                                  href={source.originalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 hover:bg-white/10 rounded-lg"
                                  title="Open source URL"
                                >
                                  <ExternalLink className="w-4 h-4 text-white/60" />
                                </a>
                              )}
                              <button
                                onClick={() => setEditingSource(source)}
                                className="p-2 hover:bg-white/10 rounded-lg"
                                title="Edit source"
                              >
                                <Pencil className="w-4 h-4 text-white/60" />
                              </button>
                              <button
                                onClick={() => handleDeleteSource(source.id)}
                                className="p-2 hover:bg-red-500/20 rounded-lg"
                                title="Delete source"
                              >
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </div>

                          {source.errorMessage && (
                            <p className="mt-2 text-sm text-red-400">
                              {source.errorMessage}
                            </p>
                          )}
                        </div>

                        {/* Expanded content preview */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 border-t border-white/10">
                            <div className="mt-3 space-y-2">
                              {source.originalUrl && (
                                <div className="text-xs">
                                  <span className="text-white/40">URL: </span>
                                  <a
                                    href={source.originalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-400 hover:underline break-all"
                                  >
                                    {source.originalUrl}
                                  </a>
                                </div>
                              )}
                              {source.content && (
                                <div>
                                  <p className="text-xs text-white/40 mb-1">
                                    Content Preview:
                                  </p>
                                  <div className="p-3 bg-black/30 rounded-lg text-sm text-white/70 max-h-40 overflow-y-auto">
                                    <p className="whitespace-pre-wrap">
                                      {source.content.slice(0, 500)}
                                      {source.content.length > 500 && "..."}
                                    </p>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-white/40 pt-2">
                                <span>
                                  Added:{" "}
                                  {new Date(
                                    source.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                <span>Type: {source.type}</span>
                              </div>
                              <button
                                onClick={() => setEditingSource(source)}
                                className="mt-2 text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit source details
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {notebook.sources.length === 0 && (
                    <div className="text-center py-8 text-white/40">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No sources yet</p>
                      <p className="text-sm">
                        Add URLs, PDFs, or text to get started
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Generate buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {OUTPUT_TYPES.map(({ type, label, icon }) => (
                      <button
                        key={type}
                        onClick={() => handleGenerateOutput(type)}
                        disabled={completedSources === 0 || generatingOutput !== null}
                        className="p-3 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span>{icon}</span>
                          <span className="text-sm text-white/80">{label}</span>
                          {generatingOutput === type && (
                            <RefreshCw className="w-3 h-3 animate-spin ml-auto text-purple-400" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {completedSources === 0 && (
                    <p className="text-sm text-white/40 text-center py-2">
                      Add and process sources first to generate outputs
                    </p>
                  )}

                  {/* Output list */}
                  {notebook.outputs.map((output) => (
                    <div
                      key={output.id}
                      className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>
                            {OUTPUT_TYPES.find((t) => t.type === output.type)?.icon}
                          </span>
                          <span className="font-medium text-white">
                            {output.title}
                          </span>
                        </div>
                        {output.status === "COMPLETED" ? (
                          <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                            Ready
                          </span>
                        ) : output.status === "PROCESSING" ? (
                          <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Generating
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                            Failed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {notebook.outputs.length === 0 && (
                    <div className="text-center py-8 text-white/40">
                      <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No generated content yet</p>
                      <p className="text-sm">
                        Click a button above to generate content
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right panel - Chat */}
          <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
            <NotebookChat
              notebookId={notebook.id}
              sourcesCount={completedSources}
            />
          </div>
        </div>
      </div>

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={showAddSource}
        onClose={() => setShowAddSource(false)}
        notebookId={notebook.id}
        onSourceAdded={handleSourceAdded}
      />

      {/* Edit Source Modal */}
      <EditSourceModal
        isOpen={editingSource !== null}
        onClose={() => setEditingSource(null)}
        notebookId={notebook.id}
        source={editingSource}
        onSourceUpdated={handleSourceUpdated}
      />
    </div>
  );
}
