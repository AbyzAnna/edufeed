"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Users, AlertCircle } from "lucide-react";
import Button from "@/components/ui/Button";

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinRoomModal({ isOpen, onClose }: JoinRoomModalProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleanCode.length !== 6) {
      setError("Please enter a valid 6-character room code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/study-rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: cleanCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to join room");
      }

      // Navigate to the room
      router.push(`/study-room/${data.roomId}`);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setError("");
    onClose();
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format as user types (uppercase, letters and numbers only)
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length <= 6) {
      setCode(value);
    }
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
      <div className="relative w-full max-w-md bg-zinc-900 rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Join Study Room</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Enter Room Code
            </label>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white text-center text-2xl font-mono tracking-[0.5em] placeholder-white/30 focus:outline-none focus:border-purple-500 transition-colors uppercase"
              autoFocus
              maxLength={6}
            />
            <p className="mt-2 text-sm text-white/50 text-center">
              Ask the host for the 6-character room code
            </p>
          </div>

          {/* Code display with boxes */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className={`w-10 h-12 rounded-lg border flex items-center justify-center text-lg font-mono font-bold transition-all ${
                  code[i]
                    ? "border-purple-500 bg-purple-500/20 text-white"
                    : "border-white/10 bg-white/5 text-white/20"
                }`}
              >
                {code[i] || "-"}
              </div>
            ))}
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
              disabled={code.length !== 6}
              className="flex-1"
            >
              Join Room
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
