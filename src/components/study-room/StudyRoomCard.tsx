"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  MoreVertical,
  Copy,
  Trash2,
  ExternalLink,
  Video,
  Calendar,
  Clock,
} from "lucide-react";

interface Participant {
  id: string;
  status: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface StudyRoomCardProps {
  room: {
    id: string;
    title: string;
    description?: string | null;
    code: string;
    isActive: boolean;
    isPrivate: boolean;
    maxParticipants: number;
    scheduledFor?: string | null;
    startedAt?: string | null;
    endedAt?: string | null;
    createdAt: string;
    host: {
      id: string;
      name: string | null;
      image: string | null;
    };
    notebook?: {
      id: string;
      title: string;
      emoji: string | null;
    } | null;
    participants: Participant[];
    _count: {
      participants: number;
      messages: number;
    };
  };
  currentUserId: string;
  onDelete?: (id: string) => void;
}

export default function StudyRoomCard({
  room,
  currentUserId,
  onDelete,
}: StudyRoomCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const isHost = room.host?.id === currentUserId;
  const onlineParticipants = (room.participants || []).filter(
    (p) => p.status === "ONLINE"
  );

  const copyCode = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`relative bg-white/5 rounded-2xl border transition-all duration-300 overflow-hidden group ${
        room.isActive && !room.endedAt
          ? "border-green-500/30 hover:border-green-500/50"
          : "border-white/10 hover:border-white/20"
      }`}
    >
      {/* Status indicator */}
      {room.isActive && !room.endedAt && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-400 font-medium">LIVE</span>
        </div>
      )}

      <Link href={`/study-room/${room.id}`} className="block p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3 pr-16">
          <div>
            <h3 className="font-semibold text-white text-lg group-hover:text-purple-400 transition-colors">
              {room.title}
            </h3>
            <div className="flex items-center gap-2 text-white/50 text-sm mt-1">
              <span>Hosted by {isHost ? "you" : room.host?.name || "Unknown"}</span>
              {room.isPrivate && (
                <span className="px-1.5 py-0.5 bg-white/10 rounded text-xs">
                  Private
                </span>
              )}
            </div>
          </div>

          {/* Menu button - only for host */}
          {isHost && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="w-4 h-4 text-white/60" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete?.(room.id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {room.isActive ? "End Room" : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {room.description && (
          <p className="text-white/60 text-sm mb-4 line-clamp-2">
            {room.description}
          </p>
        )}

        {/* Notebook info */}
        {room.notebook && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-white/5 rounded-lg">
            <span>{room.notebook.emoji || "📚"}</span>
            <span className="text-sm text-white/70">{room.notebook.title}</span>
          </div>
        )}

        {/* Room code */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
            <span className="text-white/50 text-sm">Room Code:</span>
            <span className="font-mono font-bold text-white tracking-wider">
              {room.code}
            </span>
          </div>
          <button
            onClick={copyCode}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            title="Copy code"
          >
            <Copy className={`w-4 h-4 ${copied ? "text-green-400" : "text-white/60"}`} />
          </button>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {onlineParticipants.slice(0, 4).map((participant) => (
                <div
                  key={participant.id}
                  className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-white/10 flex items-center justify-center overflow-hidden"
                  title={participant.user.name || "User"}
                >
                  {participant.user.image ? (
                    <img
                      src={participant.user.image}
                      alt={participant.user.name || ""}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-white/60">
                      {participant.user.name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
              ))}
              {onlineParticipants.length > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-zinc-900 bg-purple-500/20 flex items-center justify-center">
                  <span className="text-xs text-purple-400">
                    +{onlineParticipants.length - 4}
                  </span>
                </div>
              )}
            </div>
            <span className="text-sm text-white/50">
              {onlineParticipants.length} / {room.maxParticipants} online
            </span>
          </div>

          {/* Stats/timing */}
          <div className="flex items-center gap-3 text-sm text-white/40">
            {room.scheduledFor && !room.startedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(room.scheduledFor)}</span>
              </div>
            )}
            {room._count.messages > 0 && (
              <span>{room._count.messages} messages</span>
            )}
          </div>
        </div>
      </Link>

      {/* Join button for active rooms */}
      {room.isActive && !room.endedAt && (
        <div className="px-5 pb-5">
          <Link
            href={`/study-room/${room.id}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 hover:bg-green-700 rounded-xl font-medium text-white transition-colors"
          >
            <Video className="w-4 h-4" />
            Join Room
          </Link>
        </div>
      )}
    </div>
  );
}
