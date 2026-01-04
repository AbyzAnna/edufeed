"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  MessageSquare,
  MoreVertical,
  Trash2,
  Edit2,
  Share2,
  Users,
} from "lucide-react";

interface NotebookCardProps {
  notebook: {
    id: string;
    title: string;
    description?: string | null;
    emoji?: string | null;
    color?: string | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
      sources: number;
      chatMessages: number;
      outputs: number;
    };
    sources?: Array<{
      id: string;
      type: string;
      title: string;
      status: string;
    }>;
  };
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function NotebookCard({
  notebook,
  onDelete,
  onEdit,
}: NotebookCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.right - 160, // 160px = menu width (w-40)
      });
    }
  }, [showMenu]);

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  return (
    <div
      className="relative bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden group"
      style={{ borderTopColor: notebook.color || "#6366f1", borderTopWidth: 3 }}
    >
      {/* Header */}
      <Link href={`/notebooks/${notebook.id}`} className="block p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{notebook.emoji || "📚"}</span>
            <div>
              <h3 className="font-semibold text-white text-lg group-hover:text-purple-400 transition-colors">
                {notebook.title}
              </h3>
              <p className="text-white/50 text-sm">
                Updated {formatDate(notebook.updatedAt)}
              </p>
            </div>
          </div>

          {/* Menu button */}
          <div className="relative">
            <button
              ref={buttonRef}
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
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div
                  className="fixed w-40 bg-zinc-900 rounded-xl border border-white/10 shadow-xl z-50 overflow-hidden"
                  style={{ top: menuPosition.top, left: menuPosition.left }}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onEdit?.(notebook.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Handle share
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onDelete?.(notebook.id);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {notebook.description && (
          <p className="text-white/60 text-sm mb-4 line-clamp-2">
            {notebook.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-white/50">
          <div className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>{notebook._count.sources} sources</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            <span>{notebook._count.chatMessages} chats</span>
          </div>
          {notebook.isPublic && (
            <div className="flex items-center gap-1.5 text-green-400">
              <Users className="w-4 h-4" />
              <span>Public</span>
            </div>
          )}
        </div>
      </Link>

      {/* Source previews */}
      {notebook.sources && notebook.sources.length > 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {notebook.sources.slice(0, 3).map((source) => (
            <span
              key={source.id}
              className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-xs text-white/60"
            >
              {source.type === "PDF" && "📄"}
              {source.type === "URL" && "🔗"}
              {source.type === "YOUTUBE" && "🎬"}
              {source.type === "TEXT" && "📝"}
              {source.title.length > 20
                ? source.title.substring(0, 20) + "..."
                : source.title}
            </span>
          ))}
          {notebook._count.sources > 3 && (
            <span className="inline-flex items-center px-2 py-1 text-xs text-white/40">
              +{notebook._count.sources - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}
