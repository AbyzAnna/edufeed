"use client";

import { useState, useEffect } from "react";
import { X, Lock, Globe, Users, Calendar, Notebook } from "lucide-react";
import Button from "@/components/ui/Button";

interface NotebookOption {
  id: string;
  title: string;
  emoji: string | null;
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (room: unknown) => void;
}

export default function CreateRoomModal({
  isOpen,
  onClose,
  onCreated,
}: CreateRoomModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notebookId, setNotebookId] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notebooks, setNotebooks] = useState<NotebookOption[]>([]);
  const [loadingNotebooks, setLoadingNotebooks] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotebooks();
    }
  }, [isOpen]);

  const fetchNotebooks = async () => {
    setLoadingNotebooks(true);
    try {
      const response = await fetch("/api/notebooks");
      if (response.ok) {
        const data = await response.json();
        setNotebooks(data);
      }
    } catch (err) {
      console.error("Failed to fetch notebooks:", err);
    } finally {
      setLoadingNotebooks(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a room title");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/study-rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          notebookId,
          isPrivate,
          maxParticipants,
          scheduledFor: scheduledFor || null,
          settings: {
            allowAudio: true,
            allowVideo: true,
            allowChat: true,
            allowAnnotations: true,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create room");
      }

      const room = await response.json();
      onCreated(room);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setNotebookId(null);
    setIsPrivate(false);
    setMaxParticipants(10);
    setScheduledFor("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">
            Create Study Room
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Room Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Biology Study Session"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Description{" "}
              <span className="text-white/40 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you be studying?"
              rows={2}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Notebook Selection */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <div className="flex items-center gap-2">
                <Notebook className="w-4 h-4" />
                Attach Notebook{" "}
                <span className="text-white/40 font-normal">(optional)</span>
              </div>
            </label>
            <select
              value={notebookId || ""}
              onChange={(e) => setNotebookId(e.target.value || null)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
              disabled={loadingNotebooks}
            >
              <option value="">No notebook</option>
              {notebooks.map((notebook) => (
                <option key={notebook.id} value={notebook.id}>
                  {notebook.emoji || "📚"} {notebook.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-white/40">
              Share study materials with participants
            </p>
          </div>

          {/* Privacy */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Room Access
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  !isPrivate
                    ? "bg-purple-500/20 border-purple-500"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <Globe
                  className={`w-5 h-5 ${!isPrivate ? "text-purple-400" : "text-white/60"}`}
                />
                <div className="text-left">
                  <div className={`font-medium ${!isPrivate ? "text-white" : "text-white/80"}`}>
                    Public
                  </div>
                  <div className="text-xs text-white/50">Anyone with code</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`p-4 rounded-xl border transition-all flex items-center gap-3 ${
                  isPrivate
                    ? "bg-purple-500/20 border-purple-500"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
              >
                <Lock
                  className={`w-5 h-5 ${isPrivate ? "text-purple-400" : "text-white/60"}`}
                />
                <div className="text-left">
                  <div className={`font-medium ${isPrivate ? "text-white" : "text-white/80"}`}>
                    Private
                  </div>
                  <div className="text-xs text-white/50">Invite only</div>
                </div>
              </button>
            </div>
          </div>

          {/* Max Participants */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Max Participants
              </div>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={2}
                max={50}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                className="flex-1 accent-purple-500"
              />
              <span className="w-12 text-center text-white font-medium">
                {maxParticipants}
              </span>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule for Later{" "}
                <span className="text-white/40 font-normal">(optional)</span>
              </div>
            </label>
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
            <p className="mt-1 text-xs text-white/40">
              Leave empty to start immediately
            </p>
          </div>

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
              className="flex-1"
            >
              {scheduledFor ? "Schedule Room" : "Create & Join"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
