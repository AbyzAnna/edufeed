"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  TrendingUp,
  BookOpen,
  Code,
  Beaker,
  Calculator,
  Globe,
  Brain,
  Palette,
  Music,
  Dumbbell,
  DollarSign,
  Briefcase,
  Heart,
} from "lucide-react";

const TOPICS = [
  {
    id: "programming",
    name: "Programming",
    icon: Code,
    color: "from-blue-500 to-cyan-500",
    description: "Web dev, algorithms, languages",
  },
  {
    id: "science",
    name: "Science",
    icon: Beaker,
    color: "from-green-500 to-emerald-500",
    description: "Physics, chemistry, biology",
  },
  {
    id: "math",
    name: "Mathematics",
    icon: Calculator,
    color: "from-purple-500 to-pink-500",
    description: "Calculus, statistics, algebra",
  },
  {
    id: "languages",
    name: "Languages",
    icon: Globe,
    color: "from-orange-500 to-yellow-500",
    description: "English, Spanish, Japanese",
  },
  {
    id: "psychology",
    name: "Psychology",
    icon: Brain,
    color: "from-pink-500 to-rose-500",
    description: "Cognitive, behavioral, social",
  },
  {
    id: "history",
    name: "History",
    icon: BookOpen,
    color: "from-amber-500 to-orange-500",
    description: "World history, civilizations",
  },
  {
    id: "art",
    name: "Art & Design",
    icon: Palette,
    color: "from-fuchsia-500 to-purple-500",
    description: "Drawing, UI/UX, photography",
  },
  {
    id: "music",
    name: "Music",
    icon: Music,
    color: "from-indigo-500 to-blue-500",
    description: "Theory, instruments, production",
  },
  {
    id: "fitness",
    name: "Health & Fitness",
    icon: Dumbbell,
    color: "from-red-500 to-orange-500",
    description: "Exercise, nutrition, wellness",
  },
  {
    id: "finance",
    name: "Finance",
    icon: DollarSign,
    color: "from-emerald-500 to-teal-500",
    description: "Investing, budgeting, crypto",
  },
  {
    id: "business",
    name: "Business",
    icon: Briefcase,
    color: "from-slate-500 to-gray-500",
    description: "Marketing, management, startups",
  },
  {
    id: "selfhelp",
    name: "Personal Growth",
    icon: Heart,
    color: "from-rose-500 to-pink-500",
    description: "Productivity, mindfulness",
  },
];

const TRENDING_SEARCHES = [
  "Machine Learning basics",
  "React hooks explained",
  "Quantum physics",
  "Spanish for beginners",
  "Data structures",
  "World War 2",
  "Psychology of habits",
  "Financial planning",
];

export default function DiscoverPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/feed?topic=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleTopicClick = (topicId: string) => {
    router.push(`/feed?topic=${topicId}`);
  };

  const handleTrendingClick = (query: string) => {
    setSearchQuery(query);
    router.push(`/feed?topic=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover</h1>
          <p className="text-gray-400">
            Find educational content on topics you love
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, courses, concepts..."
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
        </form>

        {/* Trending */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold">Trending Now</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {TRENDING_SEARCHES.map((query) => (
              <button
                key={query}
                onClick={() => handleTrendingClick(query)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>

        {/* Topics Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Browse Topics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.id)}
                  className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {/* Background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${topic.color} opacity-20 group-hover:opacity-30 transition-opacity`}
                  />
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />

                  {/* Content */}
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center mb-3`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{topic.name}</h3>
                    <p className="text-sm text-gray-400">{topic.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 p-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl border border-white/10">
          <h3 className="font-semibold mb-2">Can&apos;t find what you&apos;re looking for?</h3>
          <p className="text-gray-400 text-sm mb-4">
            Create your own educational video from any source - articles, PDFs,
            YouTube videos, or just a topic name.
          </p>
          <button
            onClick={() => router.push("/upload")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl transition-colors"
          >
            Create Content
          </button>
        </div>
      </div>
    </div>
  );
}
