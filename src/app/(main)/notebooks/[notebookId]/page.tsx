"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Settings, Share2, Globe, Lock } from "lucide-react";
import Link from "next/link";
import SourcesPanel from "@/components/notebook/SourcesPanel";
import ChatPanel from "@/components/notebook/ChatPanel";
import StudioPanel from "@/components/notebook/StudioPanel";
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
  audioUrl: string | null;
  status: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
  citations?: Array<{
    id: string;
    excerpt: string;
    source: {
      id: string;
      title: string;
      type: string;
    };
  }>;
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
  chatMessages: ChatMessage[];
  _count: {
    sources: number;
    chatMessages: number;
    outputs: number;
  };
}

export default function NotebookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const notebookId = params.notebookId as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

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
          setNotebook((prev) => {
            if (!prev) return null;
            // Update sources and auto-select newly completed ones
            const newlyCompletedIds = sources
              .filter((s: Source) =>
                s.status === "COMPLETED" &&
                prev.sources.find((ps) => ps.id === s.id)?.status !== "COMPLETED"
              )
              .map((s: Source) => s.id);

            if (newlyCompletedIds.length > 0) {
              setSelectedSourceIds((prevSelected) => {
                const next = new Set(prevSelected);
                newlyCompletedIds.forEach((id: string) => next.add(id));
                return next;
              });
            }

            return { ...prev, sources };
          });

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
        // Initially select all completed sources
        const completedSourceIds = data.sources
          .filter((s: Source) => s.status === "COMPLETED")
          .map((s: Source) => s.id);
        setSelectedSourceIds(new Set(completedSourceIds));
        setChatMessages(data.chatMessages || []);
      } else if (response.status === 404) {
        router.push("/notebooks");
      }
    } catch (error) {
      console.error("Failed to fetch notebook:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSourceAdded = useCallback((source: Source) => {
    setNotebook((prev) =>
      prev
        ? {
            ...prev,
            sources: [source, ...prev.sources],
            _count: { ...prev._count, sources: prev._count.sources + 1 },
          }
        : null
    );
  }, []);

  const handleSourceDeleted = useCallback((sourceId: string) => {
    setNotebook((prev) =>
      prev
        ? {
            ...prev,
            sources: prev.sources.filter((s) => s.id !== sourceId),
            _count: { ...prev._count, sources: prev._count.sources - 1 },
          }
        : null
    );
    setSelectedSourceIds((prev) => {
      const next = new Set(prev);
      next.delete(sourceId);
      return next;
    });
  }, []);

  const handleToggleSource = useCallback((sourceId: string) => {
    setSelectedSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  }, []);

  const handleSelectAllSources = useCallback(() => {
    if (!notebook) return;
    const completedSources = notebook.sources.filter((s) => s.status === "COMPLETED");
    const allSelected = completedSources.every((s) => selectedSourceIds.has(s.id));

    if (allSelected) {
      setSelectedSourceIds(new Set());
    } else {
      setSelectedSourceIds(new Set(completedSources.map((s) => s.id)));
    }
  }, [notebook, selectedSourceIds]);

  const handleOutputGenerated = useCallback((output: Output) => {
    setNotebook((prev) =>
      prev
        ? {
            ...prev,
            outputs: [output, ...prev.outputs],
            _count: { ...prev._count, outputs: prev._count.outputs + 1 },
          }
        : null
    );
  }, []);

  const handleNewChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages((prev) => [...prev, message]);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/60 mb-4">Notebook not found</p>
          <Link href="/notebooks" className="text-purple-400 hover:underline">
            Back to notebooks
          </Link>
        </div>
      </div>
    );
  }

  const completedSources = notebook.sources.filter((s) => s.status === "COMPLETED");

  return (
    <div className="h-[calc(100vh-4rem-5rem)] md:h-[calc(100vh-4rem)] bg-[#1a1a1a] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/5 bg-[#1a1a1a]">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/notebooks"
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{notebook.emoji || "📚"}</span>
              <div>
                <h1 className="text-lg font-semibold text-white flex items-center gap-2">
                  {notebook.title}
                  {notebook.isPublic ? (
                    <Globe className="w-4 h-4 text-green-400" />
                  ) : (
                    <Lock className="w-4 h-4 text-white/40" />
                  )}
                </h1>
                <p className="text-sm text-white/50">
                  {notebook._count.sources} sources
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Share2 className="w-5 h-5 text-white/60" />
            </button>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>
      </header>

      {/* Three-Panel Layout */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Sources */}
        <div className="w-[300px] flex-shrink-0 border-r border-white/5 flex flex-col min-h-0 overflow-hidden">
          <SourcesPanel
            notebookId={notebook.id}
            sources={notebook.sources}
            selectedSourceIds={selectedSourceIds}
            onToggleSource={handleToggleSource}
            onSelectAll={handleSelectAllSources}
            onSourceAdded={handleSourceAdded}
            onSourceDeleted={handleSourceDeleted}
          />
        </div>

        {/* Center Panel - Chat */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          <ChatPanel
            notebookId={notebook.id}
            notebookTitle={notebook.title}
            notebookEmoji={notebook.emoji}
            sources={notebook.sources}
            selectedSourceIds={selectedSourceIds}
            messages={chatMessages}
            onNewMessage={handleNewChatMessage}
          />
        </div>

        {/* Right Panel - Studio */}
        <div className="w-[280px] flex-shrink-0 border-l border-white/5 flex flex-col min-h-0 overflow-hidden">
          <StudioPanel
            notebookId={notebook.id}
            outputs={notebook.outputs}
            selectedSourceIds={selectedSourceIds}
            sourcesCount={completedSources.length}
            onOutputGenerated={handleOutputGenerated}
          />
        </div>
      </div>
    </div>
  );
}
