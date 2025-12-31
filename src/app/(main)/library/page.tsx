"use client";

import { useAuth } from "@/components/providers/SessionProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Link as LinkIcon,
  Type,
  Sparkles,
  BookOpen,
  Table2,
  Volume2,
  MoreVertical,
  Youtube,
} from "lucide-react";

interface Source {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  feedItems?: {
    id: string;
    title: string;
    type: string;
    status: string;
  }[];
}

export default function LibraryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSources();
    }
  }, [user]);

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/sources");
      const data = await res.json();
      setSources(data);
    } catch (error) {
      console.error("Error fetching sources:", error);
    } finally {
      setPageLoading(false);
    }
  };

  if (isLoading || pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to View Library</h2>
          <p className="text-gray-400 mb-6">Access your sources and generated videos</p>
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

  const handleQuickGenerate = async (
    sourceId: string,
    types: ("FLASHCARD_DECK" | "SUMMARY" | "TABLE")[]
  ) => {
    setIsGenerating(sourceId);
    setOpenMenuId(null);

    try {
      const res = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId,
          contentTypes: types,
          includeAudio: types.includes("SUMMARY"),
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      // Navigate to feed to see generated content
      router.push("/feed");
    } catch (error) {
      console.error("Error generating:", error);
    } finally {
      setIsGenerating(null);
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "FLASHCARD_DECK":
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      case "SUMMARY":
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case "AUDIO_SUMMARY":
        return <Volume2 className="w-4 h-4 text-orange-400" />;
      case "TABLE":
        return <Table2 className="w-4 h-4 text-blue-400" />;
      default:
        return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "PROCESSING":
        return <Loader2 className="w-4 h-4 text-yellow-500 animate-spin" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Library</h1>
            <p className="text-gray-400">
              {sources.length} source{sources.length !== 1 ? "s" : ""} uploaded
            </p>
          </div>
          <button
            onClick={() => router.push("/upload")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-colors"
          >
            Upload New
          </button>
        </div>

        {sources.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No sources yet</h3>
            <p className="text-gray-400 mb-6">
              Upload your first PDF, URL, or topic to get started
            </p>
            <button
              onClick={() => router.push("/upload")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
            >
              Upload Source
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sources.map((source) => (
              <div key={source.id} className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    {getTypeIcon(source.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {source.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="bg-white/10 px-2 py-0.5 rounded">
                            {source.type}
                          </span>
                          <span>
                            {new Date(source.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Generate Menu */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setOpenMenuId(openMenuId === source.id ? null : source.id)
                          }
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          disabled={isGenerating === source.id}
                        >
                          {isGenerating === source.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-purple-400" />
                          )}
                        </button>

                        {openMenuId === source.id && (
                          <div className="absolute right-0 top-full mt-2 w-52 bg-gray-900 border border-white/10 rounded-xl shadow-xl z-10 overflow-hidden">
                            <button
                              onClick={() => handleQuickGenerate(source.id, ["FLASHCARD_DECK"])}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                            >
                              <BookOpen className="w-4 h-4 text-purple-400" />
                              <span>Create Flashcards</span>
                            </button>
                            <button
                              onClick={() => handleQuickGenerate(source.id, ["SUMMARY"])}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                            >
                              <FileText className="w-4 h-4 text-emerald-400" />
                              <span>Create Summary</span>
                            </button>
                            <button
                              onClick={() => handleQuickGenerate(source.id, ["TABLE"])}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                            >
                              <Table2 className="w-4 h-4 text-blue-400" />
                              <span>Create Table</span>
                            </button>
                            <div className="border-t border-white/10" />
                            <button
                              onClick={() => handleQuickGenerate(source.id, ["SUMMARY", "FLASHCARD_DECK", "TABLE"])}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                            >
                              <Sparkles className="w-4 h-4 text-pink-400" />
                              <span>Generate All</span>
                            </button>
                            <div className="border-t border-white/10" />
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                router.push(`/generate?source=${source.id}`);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                              <span>Advanced Options</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Feed Items */}
                    {source.feedItems && source.feedItems.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {source.feedItems.map((item) => (
                          <div
                            key={item.id}
                            className={`bg-white/5 rounded-lg p-3 flex items-center gap-3 ${
                              item.status === "COMPLETED"
                                ? "cursor-pointer hover:bg-white/10"
                                : ""
                            }`}
                            onClick={() => {
                              if (item.status === "COMPLETED") {
                                router.push("/feed");
                              }
                            }}
                          >
                            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {getContentTypeIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {item.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(item.status)}
                                <span className="text-xs text-gray-400 capitalize">
                                  {item.status.toLowerCase()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
