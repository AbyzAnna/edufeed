"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Trash2,
  Edit2,
  FolderPlus,
  FolderMinus,
} from "lucide-react";
import NotebookCard from "./NotebookCard";

interface Notebook {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
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
}

interface NotebookGroup {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  order: number;
  _count: {
    Notebooks: number;
  };
  Notebooks: Notebook[];
}

interface NotebookGroupCardProps {
  group: NotebookGroup;
  onDeleteGroup?: (id: string) => void;
  onEditGroup?: (id: string) => void;
  onDeleteNotebook?: (id: string) => void;
  onEditNotebook?: (id: string) => void;
  onRemoveFromGroup?: (groupId: string, notebookId: string) => void;
}

export default function NotebookGroupCard({
  group,
  onDeleteGroup,
  onEditGroup,
  onDeleteNotebook,
  onEditNotebook,
  onRemoveFromGroup,
}: NotebookGroupCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="mb-6">
      {/* Group Header */}
      <div
        className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/[0.07] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          borderLeftColor: group.color || "#8b5cf6",
          borderLeftWidth: 4,
        }}
      >
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-white/60" />
            ) : (
              <ChevronRight className="w-5 h-5 text-white/60" />
            )}
          </button>
          <span className="text-2xl">{group.emoji || "📁"}</span>
          <div>
            <h3 className="font-semibold text-white text-lg">{group.name}</h3>
            <p className="text-white/50 text-sm">
              {group._count.Notebooks} notebook
              {group._count.Notebooks !== 1 ? "s" : ""}
              {group.description && ` • ${group.description}`}
            </p>
          </div>
        </div>

        {/* Group Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-white/60" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-44 bg-zinc-900 rounded-xl border border-white/10 shadow-xl z-20 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditGroup?.(group.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-white/80 hover:bg-white/10 flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Group
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteGroup?.(group.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Group
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Notebooks in Group */}
      {isExpanded && group.Notebooks.length > 0 && (
        <div className="mt-3 ml-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {group.Notebooks.map((notebook) => (
            <div key={notebook.id} className="relative group/notebook">
              <NotebookCard
                notebook={notebook}
                onDelete={onDeleteNotebook}
                onEdit={onEditNotebook}
              />
              {/* Remove from group button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemoveFromGroup?.(group.id, notebook.id);
                }}
                className="absolute top-2 left-2 p-1.5 bg-zinc-800/90 rounded-lg opacity-0 group-hover/notebook:opacity-100 transition-opacity hover:bg-zinc-700"
                title="Remove from group"
              >
                <FolderMinus className="w-4 h-4 text-white/60" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isExpanded && group.Notebooks.length === 0 && (
        <div className="mt-3 ml-6 p-6 bg-white/5 rounded-xl border border-dashed border-white/10 text-center">
          <p className="text-white/40 text-sm">
            No notebooks in this group yet. Drag notebooks here or use the menu
            to add them.
          </p>
        </div>
      )}
    </div>
  );
}
