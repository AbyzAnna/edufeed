"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/SessionProvider";
import { GraduationCap, LogOut, BookOpen, Users, MessageCircle, Layers } from "lucide-react";
import NotificationBell from "@/components/social/NotificationBell";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-white/10 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-purple-500" />
          <span className="text-xl font-bold">EduFeed</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/notebooks" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            Notebooks
          </Link>
          <Link href="/study" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
            <Users className="w-4 h-4" />
            Study Rooms
          </Link>
          <Link href="/library" className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
            <Layers className="w-4 h-4" />
            Library
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/messages"
                className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </Link>
              <NotificationBell />
              {user.user_metadata?.avatar_url && (
                <Link href="/profile">
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || "User"}
                    className="w-8 h-8 rounded-full hover:ring-2 hover:ring-purple-500 transition-all"
                  />
                </Link>
              )}
              <span className="text-sm text-gray-300">{user.user_metadata?.full_name || user.email}</span>
              <button
                onClick={() => signOut()}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
