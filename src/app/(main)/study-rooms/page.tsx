"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/SessionProvider";
import { Plus, Search, Users, UserPlus } from "lucide-react";
import StudyRoomCard from "@/components/study-room/StudyRoomCard";
import CreateRoomModal from "@/components/study-room/CreateRoomModal";
import JoinRoomModal from "@/components/study-room/JoinRoomModal";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";

interface Participant {
  id: string;
  status: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface StudyRoom {
  id: string;
  title: string;
  description: string | null;
  code: string;
  isActive: boolean;
  isPrivate: boolean;
  maxParticipants: number;
  scheduledFor: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
  notebook: {
    id: string;
    title: string;
    emoji: string | null;
  } | null;
  participants: Participant[];
  _count: {
    participants: number;
    messages: number;
  };
}

export default function StudyRoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "ended" | "scheduled">(
    "all"
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  const fetchRooms = async () => {
    try {
      const queryParams = filter !== "all" ? `?status=${filter}` : "";
      const response = await fetch(`/api/study-rooms${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const room = rooms.find((r) => r.id === id);
    const action = room?.isActive ? "end" : "delete";

    if (
      !confirm(
        action === "end"
          ? "Are you sure you want to end this room?"
          : "Are you sure you want to delete this room?"
      )
    )
      return;

    try {
      const response = await fetch(`/api/study-rooms/${id}?action=${action}`, {
        method: "DELETE",
      });

      if (response.ok) {
        if (action === "delete") {
          setRooms((prev) => prev.filter((r) => r.id !== id));
        } else {
          // Update room to show as ended
          setRooms((prev) =>
            prev.map((r) =>
              r.id === id
                ? { ...r, isActive: false, endedAt: new Date().toISOString() }
                : r
            )
          );
        }
      }
    } catch (error) {
      console.error("Failed to delete room:", error);
    }
  };

  const handleCreated = (room: unknown) => {
    setRooms((prev) => [room as StudyRoom, ...prev]);
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeRooms = filteredRooms.filter(
    (r) => r.isActive && !r.endedAt
  );
  const endedRooms = filteredRooms.filter((r) => r.endedAt);

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Study Rooms</h1>
            <p className="text-white/60">
              Collaborate with others in real-time study sessions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowJoinModal(true)}
              icon={<UserPlus className="w-5 h-5" />}
            >
              Join Room
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-5 h-5" />}
            >
              Create Room
            </Button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms..."
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            {(["all", "active", "scheduled", "ended"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl font-medium transition-colors capitalize ${
                  filter === f
                    ? "bg-purple-600 text-white"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loading size="lg" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              {searchQuery ? "No rooms found" : "No study rooms yet"}
            </h2>
            <p className="text-white/60 mb-6 max-w-md">
              {searchQuery
                ? "Try a different search term"
                : "Create a study room to collaborate with others in real-time, or join an existing room with a code."}
            </p>
            {!searchQuery && (
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowJoinModal(true)}
                  icon={<UserPlus className="w-5 h-5" />}
                >
                  Join Room
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  icon={<Plus className="w-5 h-5" />}
                >
                  Create Room
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Rooms */}
            {activeRooms.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  Active Rooms
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeRooms.map((room) => (
                    <StudyRoomCard
                      key={room.id}
                      room={room}
                      currentUserId={user?.id || ""}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Rooms */}
            {endedRooms.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white/60 mb-4">
                  Past Sessions
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {endedRooms.map((room) => (
                    <StudyRoomCard
                      key={room.id}
                      room={room}
                      currentUserId={user?.id || ""}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleCreated}
      />
      <JoinRoomModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </div>
  );
}
