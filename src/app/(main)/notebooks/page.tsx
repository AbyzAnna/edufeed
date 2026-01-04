"use client";

import { useState, useEffect } from "react";
import { Plus, Search, BookOpen, FolderPlus, Lightbulb } from "lucide-react";
import NotebookCard from "@/components/notebook/NotebookCard";
import NotebookGroupCard from "@/components/notebook/NotebookGroupCard";
import CreateNotebookModal from "@/components/notebook/CreateNotebookModal";
import CreateGroupModal from "@/components/notebook/CreateGroupModal";
import GroupSuggestionsModal from "@/components/notebook/GroupSuggestionsModal";
import AddToGroupModal from "@/components/notebook/AddToGroupModal";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";

interface Notebook {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  color: string | null;
  isPublic: boolean;
  groupId: string | null;
  createdAt: string;
  updatedAt: string;
  NotebookGroup?: {
    id: string;
    name: string;
    emoji: string | null;
    color: string | null;
  } | null;
  _count: {
    NotebookSource: number;
    NotebookChat: number;
    NotebookOutput: number;
  };
  NotebookSource: Array<{
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
  Notebooks: Array<{
    id: string;
    title: string;
    description: string | null;
    emoji: string | null;
    color: string | null;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
      NotebookSource: number;
      NotebookChat: number;
      NotebookOutput: number;
    };
    NotebookSource?: Array<{
      id: string;
      type: string;
      title: string;
      status: string;
    }>;
  }>;
}

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [groups, setGroups] = useState<NotebookGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<NotebookGroup | null>(null);
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notebooksRes, groupsRes] = await Promise.all([
        fetch("/api/notebooks"),
        fetch("/api/notebook-groups"),
      ]);

      if (notebooksRes.ok) {
        const data = await notebooksRes.json();
        setNotebooks(data);
      }

      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotebook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notebook?")) return;

    try {
      const response = await fetch(`/api/notebooks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotebooks((prev) => prev.filter((n) => n.id !== id));
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            Notebooks: g.Notebooks.filter((n) => n.id !== id),
            _count: {
              ...g._count,
              Notebooks: g.Notebooks.filter((n) => n.id !== id).length,
            },
          }))
        );
      }
    } catch (error) {
      console.error("Failed to delete notebook:", error);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this group? Notebooks will be moved to ungrouped."
      )
    )
      return;

    try {
      const response = await fetch(`/api/notebook-groups/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Move notebooks back to ungrouped
        const group = groups.find((g) => g.id === id);
        if (group) {
          setNotebooks((prev) =>
            prev.map((n) => (n.groupId === id ? { ...n, groupId: null } : n))
          );
        }
        setGroups((prev) => prev.filter((g) => g.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const handleRemoveFromGroup = async (groupId: string, notebookId: string) => {
    try {
      const response = await fetch(`/api/notebook-groups/${groupId}/notebooks`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookIds: [notebookId] }),
      });

      if (response.ok) {
        // Update local state
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  Notebooks: g.Notebooks.filter((n) => n.id !== notebookId),
                  _count: {
                    ...g._count,
                    Notebooks: g.Notebooks.filter((n) => n.id !== notebookId)
                      .length,
                  },
                }
              : g
          )
        );
        setNotebooks((prev) =>
          prev.map((n) =>
            n.id === notebookId ? { ...n, groupId: null } : n
          )
        );
      }
    } catch (error) {
      console.error("Failed to remove from group:", error);
    }
  };

  const handleNotebookCreated = (notebook: unknown) => {
    setNotebooks((prev) => [notebook as Notebook, ...prev]);
  };

  const handleGroupCreated = (group: Omit<NotebookGroup, "Notebooks">) => {
    if (editingGroup) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id ? { ...group, Notebooks: g.Notebooks } : g
        )
      );
    } else {
      setGroups((prev) => [...prev, { ...group, Notebooks: [] }]);
    }
    setEditingGroup(null);
  };

  // Separate ungrouped notebooks
  const ungroupedNotebooks = notebooks.filter((n) => !n.groupId);

  // Transform notebook data to match NotebookCard expected format
  const transformNotebook = (n: Notebook | NotebookGroup["Notebooks"][0]) => {
    const count = n._count as Record<string, number>;
    return {
      id: n.id,
      title: n.title,
      description: n.description,
      emoji: n.emoji,
      color: n.color,
      isPublic: n.isPublic,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      _count: {
        sources: count.NotebookSource ?? count.sources ?? 0,
        chatMessages: count.NotebookChat ?? count.chatMessages ?? 0,
        outputs: count.NotebookOutput ?? count.outputs ?? 0,
      },
      sources:
        "NotebookSource" in n
          ? n.NotebookSource
          : [],
    };
  };

  // Filter based on search
  const filterBySearch = (title: string, description: string | null) =>
    !searchQuery ||
    title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    description?.toLowerCase().includes(searchQuery.toLowerCase());

  const filteredGroups = groups
    .map((g) => ({
      ...g,
      Notebooks: g.Notebooks.filter((n) =>
        filterBySearch(n.title, n.description)
      ),
    }))
    .filter((g) => g.Notebooks.length > 0 || !searchQuery);

  const filteredUngrouped = ungroupedNotebooks.filter((n) =>
    filterBySearch(n.title, n.description)
  );

  const hasUngroupedNotebooks = ungroupedNotebooks.length > 0;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Notebooks</h1>
            <p className="text-white/60">
              Organize your study materials and chat with AI about your sources
            </p>
          </div>
          <div className="flex gap-2">
            {hasUngroupedNotebooks && (
              <Button
                variant="secondary"
                onClick={() => setShowSuggestionsModal(true)}
                icon={<Lightbulb className="w-5 h-5" />}
              >
                Smart Group
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                setEditingGroup(null);
                setShowCreateGroupModal(true);
              }}
              icon={<FolderPlus className="w-5 h-5" />}
            >
              New Group
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-5 h-5" />}
            >
              New Notebook
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notebooks and groups..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loading size="lg" />
          </div>
        ) : groups.length === 0 && notebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No notebooks yet
            </h2>
            <p className="text-white/60 mb-6 max-w-md">
              Create your first notebook to start organizing your study materials
              and chatting with AI about your sources.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-5 h-5" />}
            >
              Create Notebook
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Groups */}
            {filteredGroups.map((group) => (
              <NotebookGroupCard
                key={group.id}
                group={{
                  ...group,
                  Notebooks: group.Notebooks.map((n) => transformNotebook(n)),
                }}
                onDeleteGroup={handleDeleteGroup}
                onEditGroup={(id) => {
                  const g = groups.find((g) => g.id === id);
                  if (g) {
                    setEditingGroup(g);
                    setShowCreateGroupModal(true);
                  }
                }}
                onDeleteNotebook={handleDeleteNotebook}
                onEditNotebook={(id) => console.log("Edit", id)}
                onRemoveFromGroup={handleRemoveFromGroup}
              />
            ))}

            {/* Ungrouped Notebooks */}
            {filteredUngrouped.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-white/60 mb-4 flex items-center gap-2">
                  <span>📋</span> Ungrouped Notebooks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUngrouped.map((notebook) => (
                    <div key={notebook.id} className="relative group/notebook">
                      <NotebookCard
                        notebook={transformNotebook(notebook)}
                        onDelete={handleDeleteNotebook}
                        onEdit={(id) => console.log("Edit", id)}
                      />
                      {/* Add to group button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedNotebook(notebook.id);
                          setShowAddToGroupModal(true);
                        }}
                        className="absolute top-2 left-2 p-1.5 bg-zinc-800/90 rounded-lg opacity-0 group-hover/notebook:opacity-100 transition-opacity hover:bg-zinc-700"
                        title="Add to group"
                      >
                        <FolderPlus className="w-4 h-4 text-white/60" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No results message */}
            {searchQuery &&
              filteredGroups.length === 0 &&
              filteredUngrouped.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <h2 className="text-xl font-semibold text-white mb-2">
                    No notebooks found
                  </h2>
                  <p className="text-white/60">
                    Try a different search term
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateNotebookModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleNotebookCreated}
      />

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => {
          setShowCreateGroupModal(false);
          setEditingGroup(null);
        }}
        onCreated={handleGroupCreated}
        existingGroup={editingGroup}
      />

      <GroupSuggestionsModal
        isOpen={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        onApplied={fetchData}
      />

      <AddToGroupModal
        isOpen={showAddToGroupModal}
        onClose={() => {
          setShowAddToGroupModal(false);
          setSelectedNotebook(null);
        }}
        onAdded={() => fetchData()}
        notebookIds={selectedNotebook ? [selectedNotebook] : []}
        currentGroupId={
          selectedNotebook
            ? notebooks.find((n) => n.id === selectedNotebook)?.groupId
            : null
        }
      />
    </div>
  );
}
