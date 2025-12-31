"use client";

import Link from "next/link";
import { Play, Upload, Sparkles, ArrowRight } from "lucide-react";
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
            <Play className="w-8 h-8 text-purple-500 fill-purple-500" />
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
            <span>AI-Powered Learning Videos</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Transform Any Content Into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              Engaging Videos
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Upload PDFs, paste links, or describe topics — our AI creates
            TikTok-style educational videos that make learning addictive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Start Creating
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/feed"
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl transition-colors"
            >
              Explore Feed
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24">
          <div className="card p-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <Upload className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Sources</h3>
            <p className="text-gray-400">
              Drop PDFs, paste URLs, or type course topics. Our AI extracts the
              key information.
            </p>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Generates Videos</h3>
            <p className="text-gray-400">
              Choose slideshow, AI avatar, or cinematic style. Videos are
              auto-generated with narration.
            </p>
          </div>

          <div className="card p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Scroll & Learn</h3>
            <p className="text-gray-400">
              Swipe through an endless feed of bite-sized educational content,
              just like your favorite apps.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-purple-500 fill-purple-500" />
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
