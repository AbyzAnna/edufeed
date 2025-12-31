"use client";

import Link from "next/link";
import { GraduationCap, BookOpen, Users, Brain, ArrowRight, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if there's an auth error or token in the URL hash
    // Supabase sometimes redirects here with auth data in the hash
    const hash = window.location.hash;
    if (hash && (hash.includes("error=") || hash.includes("access_token="))) {
      // Redirect to the auth confirm page to handle it properly
      router.replace(`/auth/confirm${hash}`);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold">EduFeed</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-12">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-400 px-4 py-2 rounded-full text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Learning Platform</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Study Smarter with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              AI-Powered Notebooks
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Create notebooks, chat with AI about your sources, generate flashcards,
            and study together in real-time rooms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/notebooks"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl transition-colors"
            >
              View Notebooks
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24">
          <div className="card p-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Notebooks</h3>
            <p className="text-gray-400">
              Add sources (PDFs, URLs, videos) and chat with AI to understand
              your materials better.
            </p>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Flashcards</h3>
            <p className="text-gray-400">
              Generate flashcards, summaries, and quizzes from your content
              with spaced repetition.
            </p>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Study Rooms</h3>
            <p className="text-gray-400">
              Join live study sessions with video, chat, and shared materials
              for collaborative learning.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-500" />
            <span className="font-semibold">EduFeed</span>
          </div>
          <p className="text-gray-500 text-sm">
            © 2024 EduFeed. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
