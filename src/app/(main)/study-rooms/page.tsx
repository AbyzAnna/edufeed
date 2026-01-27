"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/SessionProvider";
import { Plus, Search, Users, UserPlus, Globe, Lock } from "lucide-react";
import StudyRoomCard from "@/components/study-room/StudyRoomCard";
import CreateRoomModal from "@/components/study-room/CreateRoomModal";
import JoinRoomModal from "@/components/study-room/JoinRoomModal";
import Button from "@/components/ui/Button";
import Loading from "@/components/ui/Loading";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [publicRooms, setPublicRooms] = useState<StudyRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPublic, setLoadingPublic] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [publicSearchQuery, setPublicSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "ended" | "scheduled">(
    "all"
  );
  const [activeTab, setActiveTab] = useState<"my-rooms" | "discover">("my-rooms");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  useEffect(() => {
    if (activeTab === "discover") {
      fetchPublicRooms();
    }
  }, [activeTab, publicSearchQuery]);

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

  const fetchPublicRooms = async () => {
    setLoadingPublic(true);
    try {
      const params = new URLSearchParams();
      if (publicSearchQuery) params.set("search", publicSearchQuery);
      const response = await fetch(`/api/study-rooms/public?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setPublicRooms(data.rooms);
      }
    } catch (error) {
      console.error("Failed to fetch public rooms:", error);
    } finally {
      setLoadingPublic(false);
    }
  };

  const joinPublicRoom = async (roomCode: string) => {
    setJoiningRoom(roomCode);
    try {
      const response = await fetch("/api/study-rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: roomCode }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/study-room/${data.roomId}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to join room");
      }
    } catch (error) {
      console.error("Failed to join room:", error);
      alert("Failed to join room");
    } finally {
      setJoiningRoom(null);
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

        {/* Main Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab("my-rooms")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === "my-rooms"
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Lock className="w-4 h-4" />
            My Rooms
          </button>
          <button
            onClick={() => setActiveTab("discover")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === "discover"
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Globe className="w-4 h-4" />
            Discover Public Rooms
          </button>
        </div>

        {/* Search & Filters - for My Rooms tab */}
        {activeTab === "my-rooms" && (
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
        )}

        {/* Search for Discover tab */}
        {activeTab === "discover" && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={publicSearchQuery}
                onChange={(e) => setPublicSearchQuery(e.target.value)}
                placeholder="Search public rooms..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === "my-rooms" ? (
          // My Rooms Content
          loading ? (
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
          )
        ) : (
          // Discover Public Rooms Content
          loadingPublic ? (
            <div className="flex items-center justify-center py-20">
              <Loading size="lg" />
            </div>
          ) : publicRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-6">
                <Globe className="w-10 h-10 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                {publicSearchQuery ? "No public rooms found" : "No public rooms available"}
              </h2>
              <p className="text-white/60 mb-6 max-w-md">
                {publicSearchQuery
                  ? "Try a different search term"
                  : "There are no active public rooms right now. Be the first to create one!"}
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                icon={<Plus className="w-5 h-5" />}
              >
                Create Public Room
              </Button>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Active Public Rooms ({publicRooms.length})
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {publicRooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-purple-500/50 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {room.title}
                        </h3>
                        {room.description && (
                          <p className="text-white/60 text-sm line-clamp-2">
                            {room.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-green-400 text-sm bg-green-500/10 px-2 py-1 rounded-full">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Live
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-sm text-white/60">
                      <div className="flex items-center gap-2">
                        {room.host.image ? (
                          <img
                            src={room.host.image}
                            alt={room.host.name || "Host"}
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-xs text-purple-300">
                            {room.host.name?.[0] || "?"}
                          </div>
                        )}
                        <span>Hosted by {room.host.name || "Anonymous"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {room._count.participants}/{room.maxParticipants}
                        </span>
                      </div>
                    </div>

                    {room.notebook && (
                      <div className="flex items-center gap-2 text-sm text-purple-400 mb-4 bg-purple-500/10 px-3 py-1.5 rounded-lg inline-flex">
                        <span>{room.notebook.emoji || "📚"}</span>
                        <span>{room.notebook.title}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {/* Online participants preview */}
                      <div className="flex -space-x-2">
                        {room.participants.slice(0, 3).map((p) => (
                          <div
                            key={p.id}
                            className="w-8 h-8 rounded-full border-2 border-black overflow-hidden"
                            title={p.user.name || "Participant"}
                          >
                            {p.user.image ? (
                              <img
                                src={p.user.image}
                                alt={p.user.name || ""}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-purple-500/30 flex items-center justify-center text-xs text-purple-300">
                                {p.user.name?.[0] || "?"}
                              </div>
                            )}
                          </div>
                        ))}
                        {room.participants.length > 3 && (
                          <div className="w-8 h-8 rounded-full border-2 border-black bg-white/10 flex items-center justify-center text-xs text-white">
                            +{room.participants.length - 3}
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => joinPublicRoom(room.code)}
                        disabled={joiningRoom === room.code || room._count.participants >= room.maxParticipants}
                      >
                        {joiningRoom === room.code
                          ? "Joining..."
                          : room._count.participants >= room.maxParticipants
                          ? "Room Full"
                          : "Join Room"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
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
