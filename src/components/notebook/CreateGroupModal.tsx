"use client";

import { useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/ui/Button";

interface NotebookGroupBase {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  order: number;
  _count: {
    Notebooks: number;
  };
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (group: NotebookGroupBase) => void;
  existingGroup?: NotebookGroupBase | null;
}

const EMOJI_OPTIONS = ["📁", "📚", "🎓", "📝", "🔬", "🌍", "🧮", "💻", "🎨", "🎵", "📊", "🧬"];
const COLOR_OPTIONS = [
  "#8b5cf6", // Purple
  "#6366f1", // Indigo
  "#3b82f6", // Blue
  "#0ea5e9", // Sky
  "#14b8a6", // Teal
  "#10b981", // Emerald
  "#22c55e", // Green
  "#eab308", // Yellow
  "#f59e0b", // Amber
  "#f97316", // Orange
  "#ef4444", // Red
  "#ec4899", // Pink
];

export default function CreateGroupModal({
  isOpen,
  onClose,
  onCreated,
  existingGroup,
}: CreateGroupModalProps) {
  const [name, setName] = useState(existingGroup?.name || "");
  const [description, setDescription] = useState(existingGroup?.description || "");
  const [emoji, setEmoji] = useState(existingGroup?.emoji || "📁");
  const [color, setColor] = useState(existingGroup?.color || "#8b5cf6");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!existingGroup;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Group name is required");
      return;
    }

    setLoading(true);

    try {
      const url = isEditing
        ? `/api/notebook-groups/${existingGroup.id}`
        : "/api/notebook-groups";

      const response = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          emoji,
          color,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save group");
      }

      onCreated(data);
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setEmoji("📁");
    setColor("#8b5cf6");
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-md p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? "Edit Group" : "Create New Group"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AP World History"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this group"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-all ${
                    emoji === e
                      ? "bg-purple-500/30 border-2 border-purple-500"
                      : "bg-white/5 border border-white/10 hover:bg-white/10"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-offset-zinc-900 ring-white"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/80 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <Button type="submit" loading={loading} className="flex-1">
              {isEditing ? "Save Changes" : "Create Group"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
