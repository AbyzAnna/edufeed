"use client";

import { useState, useEffect } from "react";
import {
  X,
  Link as LinkIcon,
  FileText,
  Youtube,
  Type,
  AlertCircle,
  ExternalLink,
  Image,
  Mic,
  FileSpreadsheet,
} from "lucide-react";
import Button from "@/components/ui/Button";

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
  fileUrl?: string | null;
}

interface EditSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId: string;
  source: Source | null;
  onSourceUpdated: (source: Source) => void;
}

const getSourceIcon = (type: string) => {
  switch (type) {
    case "URL":
      return <LinkIcon className="w-5 h-5" />;
    case "PDF":
      return <FileText className="w-5 h-5" />;
    case "YOUTUBE":
      return <Youtube className="w-5 h-5" />;
    case "TEXT":
      return <Type className="w-5 h-5" />;
    case "IMAGE":
      return <Image className="w-5 h-5" />;
    case "AUDIO":
      return <Mic className="w-5 h-5" />;
    case "GOOGLE_DOC":
      return <FileSpreadsheet className="w-5 h-5" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
};

const getSourceTypeName = (type: string) => {
  switch (type) {
    case "URL":
      return "Website";
    case "PDF":
      return "PDF Document";
    case "YOUTUBE":
      return "YouTube Video";
    case "TEXT":
      return "Text Note";
    case "IMAGE":
      return "Image";
    case "AUDIO":
      return "Audio";
    case "GOOGLE_DOC":
      return "Google Doc";
    default:
      return "Source";
  }
};

export default function EditSourceModal({
  isOpen,
  onClose,
  notebookId,
  source,
  onSourceUpdated,
}: EditSourceModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when source changes
  useEffect(() => {
    if (source) {
      setTitle(source.title || "");
      setContent(source.content || "");
      setError("");
    }
  }, [source]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source) return;

    setLoading(true);
    setError("");

    try {
      const updateData: { title?: string; content?: string } = {};

      if (title.trim() !== source.title) {
        updateData.title = title.trim();
      }

      if (source.type === "TEXT" && content !== source.content) {
        updateData.content = content;
      }

      if (Object.keys(updateData).length === 0) {
        handleClose();
        return;
      }

      const response = await fetch(
        `/api/notebooks/${notebookId}/sources?sourceId=${source.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update source");
      }

      const updatedSource = await response.json();
      onSourceUpdated(updatedSource);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setError("");
    onClose();
  };

  if (!isOpen || !source) return null;

  const isTextSource = source.type === "TEXT";
  const hasChanges =
    title.trim() !== source.title ||
    (isTextSource && content !== source.content);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              {getSourceIcon(source.type)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Edit Source</h2>
              <p className="text-sm text-white/50">
                {getSourceTypeName(source.type)}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Source title"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Source URL (read-only for URL/YouTube) */}
            {source.originalUrl && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Source URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={source.originalUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 cursor-not-allowed"
                  />
                  <a
                    href={source.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                  >
                    <ExternalLink className="w-5 h-5 text-white/60" />
                  </a>
                </div>
                <p className="mt-1 text-xs text-white/40">
                  URL cannot be changed after creation
                </p>
              </div>
            )}

            {/* Content (editable for TEXT type) */}
            {isTextSource && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your text content..."
                  rows={10}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none font-mono text-sm"
                />
                <p className="mt-1 text-sm text-white/40">
                  {content.split(/\s+/).filter(Boolean).length} words
                </p>
              </div>
            )}

            {/* Content preview (read-only for non-TEXT types) */}
            {!isTextSource && source.content && (
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Extracted Content Preview
                </label>
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 max-h-48 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap line-clamp-10">
                    {source.content.slice(0, 1000)}
                    {source.content.length > 1000 && "..."}
                  </p>
                </div>
                {source.wordCount && (
                  <p className="mt-1 text-sm text-white/40">
                    {source.wordCount.toLocaleString()} words total
                  </p>
                )}
              </div>
            )}

            {/* Status info */}
            <div className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
              <div>
                <p className="text-xs text-white/40">Status</p>
                <p className="text-sm text-white">
                  {source.status === "COMPLETED" && (
                    <span className="text-green-400">Ready</span>
                  )}
                  {source.status === "PROCESSING" && (
                    <span className="text-yellow-400">Processing</span>
                  )}
                  {source.status === "PENDING" && (
                    <span className="text-blue-400">Pending</span>
                  )}
                  {source.status === "FAILED" && (
                    <span className="text-red-400">Failed</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">Added</p>
                <p className="text-sm text-white">
                  {new Date(source.createdAt).toLocaleDateString()}
                </p>
              </div>
              {source.wordCount && (
                <div>
                  <p className="text-xs text-white/40">Words</p>
                  <p className="text-sm text-white">
                    {source.wordCount.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {source.errorMessage && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400/80 mb-1">Error</p>
                <p className="text-sm text-red-400">{source.errorMessage}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!hasChanges}
                className="flex-1"
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
