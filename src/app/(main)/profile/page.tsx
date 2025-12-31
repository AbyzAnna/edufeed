"use client";

import { useAuth } from "@/components/providers/SessionProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LogOut, FileText, Video, Settings } from "lucide-react";

interface Stats {
  sourcesCount: number;
  videosCount: number;
  completedVideos: number;
}

export default function ProfilePage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    sourcesCount: 0,
    videosCount: 0,
    completedVideos: 0,
  });

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/user/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Sign in to View Profile</h2>
          <p className="text-gray-400 mb-6">Access your account settings</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>

        {/* User Info */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.full_name || "User"}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-purple-500 flex items-center justify-center">
                <span className="text-3xl font-bold text-white">
                  {user.user_metadata?.full_name?.[0] || user.email?.[0] || "?"}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{user.user_metadata?.full_name || "User"}</h2>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <FileText className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold">{stats.sourcesCount}</p>
            <p className="text-sm text-gray-400">Sources</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Video className="w-5 h-5 text-pink-400" />
            </div>
            <p className="text-2xl font-bold">{stats.videosCount}</p>
            <p className="text-sm text-gray-400">Videos</p>
          </div>
          <div className="card p-4 text-center">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Video className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold">{stats.completedVideos}</p>
            <p className="text-sm text-gray-400">Completed</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/library")}
            className="w-full card p-4 flex items-center gap-4 hover:bg-white/10 transition-colors text-left"
          >
            <FileText className="w-5 h-5 text-gray-400" />
            <span>My Library</span>
          </button>

          <button
            disabled
            className="w-full card p-4 flex items-center gap-4 opacity-50 cursor-not-allowed text-left"
          >
            <Settings className="w-5 h-5 text-gray-400" />
            <span>Settings</span>
            <span className="ml-auto text-xs bg-white/10 px-2 py-1 rounded-full">
              Coming Soon
            </span>
          </button>

          <button
            onClick={() => signOut()}
            className="w-full card p-4 flex items-center gap-4 hover:bg-red-500/20 transition-colors text-left text-red-400"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
