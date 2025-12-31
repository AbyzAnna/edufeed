"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  CheckSquare,
  Square,
  FileText,
  Link as LinkIcon,
  Youtube,
  Type,
  Image,
  Mic,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle,
  Trash2,
  ExternalLink,
  Globe,
} from "lucide-react";
import AddSourceModal from "./AddSourceModal";

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

interface SourcesPanelProps {
  notebookId: string;
  sources: Source[];
  selectedSourceIds: Set<string>;
  onToggleSource: (sourceId: string) => void;
  onSelectAll: () => void;
  onSourceAdded: (source: Source) => void;
  onSourceDeleted: (sourceId: string) => void;
}

const SOURCE_ICONS: Record<string, typeof FileText> = {
  PDF: FileText,
  URL: LinkIcon,
  YOUTUBE: Youtube,
  TEXT: Type,
  IMAGE: Image,
  AUDIO: Mic,
  GOOGLE_DOC: FileSpreadsheet,
};

const SOURCE_COLORS: Record<string, string> = {
  PDF: "#ef4444",
  URL: "#3b82f6",
  YOUTUBE: "#ef4444",
  TEXT: "#10b981",
  IMAGE: "#f59e0b",
  AUDIO: "#8b5cf6",
  GOOGLE_DOC: "#4285f4",
};

function SourceItem({
  source,
  selected,
  onToggle,
  onDelete,
}: {
  source: Source;
  selected: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const Icon = SOURCE_ICONS[source.type] || FileText;
  const color = SOURCE_COLORS[source.type] || "#6b7280";
  const isCompleted = source.status === "COMPLETED";
  const isProcessing = source.status === "PROCESSING" || source.status === "PENDING";
  const isFailed = source.status === "FAILED";

  return (
    <div
      className="group flex items-start gap-2 px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        disabled={!isCompleted}
        className={`mt-0.5 flex-shrink-0 ${!isCompleted ? "opacity-40" : ""}`}
      >
        {selected ? (
          <CheckSquare className="w-4 h-4 text-purple-400" />
        ) : (
          <Square className="w-4 h-4 text-white/40" />
        )}
      </button>

      {/* Icon */}
      <div
        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate" title={source.title}>
          {source.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {isProcessing && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Processing
            </span>
          )}
          {isFailed && (
            <span className="flex items-center gap-1 text-xs text-red-400" title={source.errorMessage || ""}>
              <AlertCircle className="w-3 h-3" />
              Failed
            </span>
          )}
          {isCompleted && source.wordCount && (
            <span className="text-xs text-white/40">
              {source.wordCount.toLocaleString()} words
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={`flex-shrink-0 flex items-center gap-1 ${showActions ? "opacity-100" : "opacity-0"} transition-opacity`}>
        {source.originalUrl && (
          <a
            href={source.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 hover:bg-white/10 rounded"
            title="Open source"
          >
            <ExternalLink className="w-3.5 h-3.5 text-white/40" />
          </a>
        )}
        <button
          onClick={onDelete}
          className="p-1 hover:bg-red-500/20 rounded"
          title="Delete source"
        >
          <Trash2 className="w-3.5 h-3.5 text-white/40 hover:text-red-400" />
        </button>
      </div>
    </div>
  );
}

export default function SourcesPanel({
  notebookId,
  sources,
  selectedSourceIds,
  onToggleSource,
  onSelectAll,
  onSourceAdded,
  onSourceDeleted,
}: SourcesPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const completedSources = sources.filter((s) => s.status === "COMPLETED");
  const allSelected = completedSources.length > 0 && completedSources.every((s) => selectedSourceIds.has(s.id));

  const filteredSources = sources.filter((source) =>
    source.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (sourceId: string) => {
    if (!confirm("Delete this source?")) return;

    setDeletingId(sourceId);
    try {
      const response = await fetch(
        `/api/notebooks/${notebookId}/sources?sourceId=${sourceId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        onSourceDeleted(sourceId);
      }
    } catch (error) {
      console.error("Failed to delete source:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white mb-3">Sources</h2>

        {/* Add Sources Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-purple-500/50 rounded-lg transition-all text-sm text-white/70 hover:text-white"
        >
          <Plus className="w-4 h-4" />
          Add sources
        </button>

        {/* Web Search */}
        <div className="mt-3 relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search the web for new sources"
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Source Filter */}
      {sources.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter sources..."
              className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </div>
      )}

      {/* Select All */}
      {completedSources.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-b border-white/5">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            {allSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <Square className="w-3.5 h-3.5" />
            )}
            Select all sources
          </button>
        </div>
      )}

      {/* Source List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredSources.length > 0 ? (
          <div className="space-y-0.5">
            {filteredSources.map((source) => (
              <SourceItem
                key={source.id}
                source={source}
                selected={selectedSourceIds.has(source.id)}
                onToggle={() => onToggleSource(source.id)}
                onDelete={() => handleDelete(source.id)}
              />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-white/30" />
            </div>
            <p className="text-sm text-white/50 mb-1">No sources yet</p>
            <p className="text-xs text-white/30">
              Add URLs, PDFs, or text to get started
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <p className="text-sm text-white/50">No matching sources</p>
          </div>
        )}
      </div>

      {/* Source Count */}
      {sources.length > 0 && (
        <div className="flex-shrink-0 px-4 py-2 border-t border-white/5">
          <p className="text-xs text-white/40 text-center">
            {selectedSourceIds.size} of {completedSources.length} sources selected
          </p>
        </div>
      )}

      {/* Add Source Modal */}
      <AddSourceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        notebookId={notebookId}
        onSourceAdded={(source) => {
          onSourceAdded(source as Source);
          setShowAddModal(false);
        }}
      />
    </div>
  );
}
