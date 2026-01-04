"use client";

import { useState, useEffect } from "react";
import { X, FolderPlus, Loader2 } from "lucide-react";
import Button from "@/components/ui/Button";

interface NotebookGroup {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  _count: {
    Notebooks: number;
  };
}

interface AddToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: (groupId: string) => void;
  notebookIds: string[];
  currentGroupId?: string | null;
}

export default function AddToGroupModal({
  isOpen,
  onClose,
  onAdded,
  notebookIds,
  currentGroupId,
}: AddToGroupModalProps) {
  const [groups, setGroups] = useState<NotebookGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  const fetchGroups = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/notebook-groups?includeNotebooks=false");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch groups");
      }

      setGroups(data.filter((g: NotebookGroup) => g.id !== currentGroupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const addToGroup = async (groupId: string) => {
    setAdding(groupId);
    setError("");

    try {
      const response = await fetch(`/api/notebook-groups/${groupId}/notebooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add to group");
      }

      onAdded(groupId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(null);
    }
  };

  const removeFromGroup = async () => {
    if (!currentGroupId) return;

    setAdding("remove");
    setError("");

    try {
      const response = await fetch(
        `/api/notebook-groups/${currentGroupId}/notebooks`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notebookIds }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove from group");
      }

      onAdded("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAdding(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-zinc-900 rounded-2xl border border-white/10 w-full max-w-md max-h-[60vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <FolderPlus className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Add to Group</h2>
              <p className="text-white/50 text-sm">
                {notebookIds.length} notebook
                {notebookIds.length !== 1 ? "s" : ""} selected
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
        <div className="p-4 overflow-y-auto max-h-[calc(60vh-80px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-2" />
              <p className="text-white/60 text-sm">Loading groups...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Remove from current group option */}
              {currentGroupId && (
                <button
                  onClick={removeFromGroup}
                  disabled={!!adding}
                  className="w-full p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-3 disabled:opacity-50"
                >
                  {adding === "remove" ? (
                    <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
                  ) : (
                    <span className="text-xl">📤</span>
                  )}
                  <div className="text-left">
                    <h4 className="font-medium text-white">Remove from Group</h4>
                    <p className="text-white/50 text-sm">
                      Move to ungrouped notebooks
                    </p>
                  </div>
                </button>
              )}

              {groups.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/50">No groups available</p>
                  <p className="text-white/40 text-sm mt-1">
                    Create a new group first
                  </p>
                </div>
              ) : (
                groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => addToGroup(group.id)}
                    disabled={!!adding}
                    className="w-full p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-3 disabled:opacity-50"
                    style={{
                      borderLeftColor: group.color || "#8b5cf6",
                      borderLeftWidth: 4,
                    }}
                  >
                    {adding === group.id ? (
                      <Loader2 className="w-6 h-6 text-white/60 animate-spin" />
                    ) : (
                      <span className="text-xl">{group.emoji || "📁"}</span>
                    )}
                    <div className="text-left flex-1">
                      <h4 className="font-medium text-white">{group.name}</h4>
                      <p className="text-white/50 text-sm">
                        {group._count.Notebooks} notebook
                        {group._count.Notebooks !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
