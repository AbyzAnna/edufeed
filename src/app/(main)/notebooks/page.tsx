"use client";

import { useState, useEffect } from "react";
import { Plus, Search, BookOpen } from "lucide-react";
import NotebookCard from "@/components/notebook/NotebookCard";
import CreateNotebookModal from "@/components/notebook/CreateNotebookModal";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";

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
  sources: Array<{
    id: string;
    type: string;
    title: string;
    status: string;
  }>;
}

export default function NotebooksPage() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    try {
      const response = await fetch("/api/notebooks");
      if (response.ok) {
        const data = await response.json();
        setNotebooks(data);
      }
    } catch (error) {
      console.error("Failed to fetch notebooks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notebook?")) return;

    try {
      const response = await fetch(`/api/notebooks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setNotebooks((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete notebook:", error);
    }
  };

  const handleCreated = (notebook: unknown) => {
    setNotebooks((prev) => [notebook as Notebook, ...prev]);
  };

  const filteredNotebooks = notebooks.filter(
    (notebook) =>
      notebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notebook.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Notebooks</h1>
            <p className="text-white/60">
              Create notebooks to organize your study materials and chat with AI
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            icon={<Plus className="w-5 h-5" />}
          >
            New Notebook
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notebooks..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loading size="lg" />
          </div>
        ) : filteredNotebooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
              <BookOpen className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? "No notebooks found" : "No notebooks yet"}
            </h2>
            <p className="text-white/60 mb-6 max-w-md">
              {searchQuery
                ? "Try a different search term"
                : "Create your first notebook to start organizing your study materials and chatting with AI about your sources."}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<Plus className="w-5 h-5" />}
              >
                Create Notebook
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                onDelete={handleDelete}
                onEdit={(id) => console.log("Edit", id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateNotebookModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
