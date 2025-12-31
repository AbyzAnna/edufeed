"use client";

import { useState } from "react";
import {
  Mic,
  Video,
  Brain,
  FileText,
  BookOpen,
  HelpCircle,
  Pencil,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  MoreVertical,
  Trash2,
  Download,
  ExternalLink,
} from "lucide-react";

interface Output {
  id: string;
  type: string;
  title: string;
  content: Record<string, unknown>;
  audioUrl: string | null;
  status: string;
  createdAt: string;
}

interface StudioPanelProps {
  notebookId: string;
  outputs: Output[];
  selectedSourceIds: Set<string>;
  sourcesCount: number;
  onOutputGenerated: (output: Output) => void;
}

const STUDIO_TOOLS = [
  {
    type: "AUDIO_OVERVIEW",
    label: "Audio Overview",
    icon: Mic,
    color: "#8b5cf6",
    description: "Generate a podcast-style overview",
  },
  {
    type: "VIDEO_OVERVIEW",
    label: "Video Overview",
    icon: Video,
    color: "#ec4899",
    description: "Create a video summary",
  },
  {
    type: "MIND_MAP",
    label: "Mind Map",
    icon: Brain,
    color: "#f59e0b",
    description: "Visualize connections",
  },
  {
    type: "SUMMARY",
    label: "Reports",
    icon: FileText,
    color: "#3b82f6",
    description: "Generate detailed reports",
  },
  {
    type: "FLASHCARD_DECK",
    label: "Flashcards",
    icon: BookOpen,
    color: "#8b5cf6",
    description: "Create study flashcards",
  },
  {
    type: "QUIZ",
    label: "Quiz",
    icon: HelpCircle,
    color: "#10b981",
    description: "Generate practice questions",
  },
];

function StudioToolButton({
  tool,
  generating,
  disabled,
  onClick,
}: {
  tool: (typeof STUDIO_TOOLS)[0];
  generating: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = tool.icon;

  return (
    <button
      onClick={onClick}
      disabled={disabled || generating}
      className={`relative group p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        generating ? "animate-pulse" : ""
      }`}
    >
      {/* Edit Icon */}
      <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil className="w-3 h-3 text-white/40" />
      </div>

      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
        style={{ backgroundColor: `${tool.color}20` }}
      >
        {generating ? (
          <RefreshCw className="w-4 h-4 animate-spin" style={{ color: tool.color }} />
        ) : (
          <Icon className="w-4 h-4" style={{ color: tool.color }} />
        )}
      </div>

      {/* Label */}
      <p className="text-xs text-white/70 text-center leading-tight">{tool.label}</p>
    </button>
  );
}

function GeneratedNoteCard({
  output,
  onDelete,
}: {
  output: Output;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const tool = STUDIO_TOOLS.find((t) => t.type === output.type);
  const Icon = tool?.icon || FileText;
  const color = tool?.color || "#6b7280";

  const isCompleted = output.status === "COMPLETED";
  const isProcessing = output.status === "PROCESSING" || output.status === "PENDING";
  const isFailed = output.status === "FAILED";

  // Get audio URL from output - check both direct audioUrl and content.audioUrl
  const audioUrl = output.audioUrl || (output.content as Record<string, unknown>)?.audioUrl as string | undefined;

  const handlePlayAudio = () => {
    if (!audioUrl) return;

    if (isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      // Create new audio element if needed
      const audio = audioElement || new Audio(audioUrl);
      if (!audioElement) {
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          console.error("Audio playback error");
          setIsPlaying(false);
        };
        setAudioElement(audio);
      }
      audio.play().then(() => setIsPlaying(true)).catch((e) => console.error("Play failed:", e));
    }
  };

  return (
    <div className="group relative flex items-center gap-3 p-3 bg-white/5 hover:bg-white/8 rounded-lg transition-colors">
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/90 truncate">{output.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {isCompleted && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <CheckCircle className="w-3 h-3" />
              Ready
            </span>
          )}
          {isProcessing && (
            <span className="flex items-center gap-1 text-xs text-yellow-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Generating
            </span>
          )}
          {isFailed && (
            <span className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle className="w-3 h-3" />
              Failed
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center">
        {isCompleted && audioUrl && (
          <button
            onClick={handlePlayAudio}
            className={`p-1.5 rounded transition-colors ${isPlaying ? "text-purple-400 bg-purple-500/20" : "text-white/40 hover:text-white hover:bg-white/10"}`}
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-36 bg-[#242424] border border-white/10 rounded-lg shadow-xl z-20 py-1">
                {isCompleted && (
                  <button
                    onClick={() => {
                      // View/open the output
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View
                  </button>
                )}
                {isCompleted && output.audioUrl && (
                  <button
                    onClick={() => {
                      // Download audio
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                )}
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StudioPanel({
  notebookId,
  outputs,
  selectedSourceIds,
  sourcesCount,
  onOutputGenerated,
}: StudioPanelProps) {
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const handleGenerate = async (type: string) => {
    if (sourcesCount === 0) return;

    setGeneratingType(type);

    try {
      const response = await fetch(`/api/notebooks/${notebookId}/outputs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          sourceIds: Array.from(selectedSourceIds),
        }),
      });

      if (response.ok) {
        const output = await response.json();
        onOutputGenerated(output);
      }
    } catch (error) {
      console.error("Failed to generate output:", error);
    } finally {
      setGeneratingType(null);
    }
  };

  const handleDeleteOutput = async (outputId: string) => {
    if (!confirm("Delete this generated content?")) return;

    try {
      // API call to delete output
      // For now, just log
      console.log("Delete output:", outputId);
    } catch (error) {
      console.error("Failed to delete output:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white mb-1">Studio</h2>
        <p className="text-xs text-white/40">
          {sourcesCount > 0
            ? `Generate from ${selectedSourceIds.size || sourcesCount} source${(selectedSourceIds.size || sourcesCount) > 1 ? "s" : ""}`
            : "Add sources to generate content"}
        </p>
      </div>

      {/* Tools Grid */}
      <div className="flex-shrink-0 p-4 border-b border-white/5">
        <div className="grid grid-cols-2 gap-2">
          {STUDIO_TOOLS.map((tool) => (
            <StudioToolButton
              key={tool.type}
              tool={tool}
              generating={generatingType === tool.type}
              disabled={sourcesCount === 0}
              onClick={() => handleGenerate(tool.type)}
            />
          ))}
        </div>
      </div>

      {/* Generated Notes */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider">
              Generated Notes
            </h3>
            <button
              className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Add note"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {outputs.length > 0 ? (
            <div className="space-y-2">
              {outputs.map((output) => (
                <GeneratedNoteCard
                  key={output.id}
                  output={output}
                  onDelete={() => handleDeleteOutput(output.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-white/30" />
              </div>
              <p className="text-sm text-white/50 mb-1">No generated content</p>
              <p className="text-xs text-white/30">
                Click a tool above to generate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
