"use client";

import { useAuth } from "@/components/providers/SessionProvider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LogOut,
  FileText,
  Video,
  Settings,
  ChevronRight,
  User,
  Bell,
  Shield,
  HelpCircle,
  BookOpen,
  Layers,
  Users,
  Heart,
  Bookmark,
  CheckCircle2,
  Mail,
  Trash2,
  ExternalLink,
} from "lucide-react";

interface Stats {
  sourcesCount: number;
  videosCount: number;
  completedVideos: number;
}

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  variant?: "default" | "danger";
  external?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function ProfilePage() {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    sourcesCount: 0,
    videosCount: 0,
    completedVideos: 0,
  });
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "DELETE",
      });
      if (res.ok) {
        await signOut();
      }
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="spinner w-8 h-8" />
          <p className="text-gray-400 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Sign in to View Profile</h2>
          <p className="text-gray-400 mb-8">
            Access your account, view your learning progress, and manage your settings.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 rounded-xl transition-all duration-200 font-medium shadow-lg shadow-purple-500/25"
          >
            Sign In
          </button>
          <p className="text-gray-500 text-sm mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-purple-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const menuSections: MenuSection[] = [
    {
      title: "Content",
      items: [
        {
          icon: BookOpen,
          label: "Notebooks",
          description: "Your AI-powered study notebooks",
          href: "/notebooks",
        },
        {
          icon: Layers,
          label: "Library",
          description: "Saved sources and content",
          href: "/library",
        },
        {
          icon: Users,
          label: "Study Rooms",
          description: "Collaborative learning spaces",
          href: "/study",
        },
        {
          icon: Bookmark,
          label: "Bookmarks",
          description: "Saved videos for later",
          href: "/library",
        },
        {
          icon: Heart,
          label: "Liked Videos",
          description: "Videos you've liked",
          href: "/library",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: Settings,
          label: "Settings",
          description: "App preferences and configuration",
          badge: "Coming Soon",
        },
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage notification preferences",
          badge: "Coming Soon",
        },
        {
          icon: Shield,
          label: "Privacy & Security",
          description: "Account security settings",
          badge: "Coming Soon",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help & Support",
          description: "Get help with using EduFeed",
          href: "/support",
        },
        {
          icon: Mail,
          label: "Contact Us",
          description: "Reach out to our team",
          href: "mailto:support@edufeed.io",
          external: true,
        },
      ],
    },
    {
      title: "Legal",
      items: [
        {
          icon: FileText,
          label: "Terms of Service",
          description: "Our terms and conditions",
          href: "/terms",
        },
        {
          icon: Shield,
          label: "Privacy Policy",
          description: "How we handle your data",
          href: "/privacy",
        },
      ],
    },
    {
      title: "Danger Zone",
      items: [
        {
          icon: Trash2,
          label: "Delete Account",
          description: "Permanently delete your account and data",
          onClick: () => setShowDeleteConfirm(true),
          variant: "danger",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/30 to-transparent">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-8 md:pt-8">
          {/* Profile Card */}
          <div className="card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar */}
              <div className="relative group">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.full_name || "User"}
                    className="w-24 h-24 md:w-28 md:h-28 rounded-full ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center ring-4 ring-purple-500/30 group-hover:ring-purple-500/50 transition-all">
                    <span className="text-4xl md:text-5xl font-bold text-white">
                      {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
                        user.email?.[0]?.toUpperCase() ||
                        "?"}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full border-4 border-black flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl md:text-3xl font-bold mb-1">
                  {user.user_metadata?.full_name || "User"}
                </h1>
                <p className="text-gray-400 mb-4">{user.email}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full">
                    <BookOpen className="w-3.5 h-3.5" />
                    {stats.sourcesCount} sources
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/20 text-pink-300 text-sm rounded-full">
                    <Video className="w-3.5 h-3.5" />
                    {stats.videosCount} videos
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="card p-4 text-center hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-1">{stats.sourcesCount}</p>
              <p className="text-xs md:text-sm text-gray-400">Sources</p>
            </div>
            <div className="card p-4 text-center hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-pink-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Video className="w-6 h-6 text-pink-400" />
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-1">{stats.videosCount}</p>
              <p className="text-xs md:text-sm text-gray-400">Videos</p>
            </div>
            <div className="card p-4 text-center hover:bg-white/10 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-2xl md:text-3xl font-bold mb-1">{stats.completedVideos}</p>
              <p className="text-xs md:text-sm text-gray-400">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="max-w-2xl mx-auto px-4 space-y-6">
        {menuSections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h2>
            <div className="card divide-y divide-white/5 overflow-hidden">
              {section.items.map((item, index) => {
                const Icon = item.icon;
                const isDisabled = !!item.badge;
                const isDanger = item.variant === "danger";

                const content = (
                  <>
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isDanger
                          ? "bg-red-500/10"
                          : "bg-white/5"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isDanger ? "text-red-400" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            isDanger ? "text-red-400" : "text-white"
                          }`}
                        >
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] uppercase font-semibold bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {item.external && (
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 truncate">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 flex-shrink-0 ${
                        isDisabled ? "text-gray-600" : "text-gray-500"
                      }`}
                    />
                  </>
                );

                const className = `w-full p-4 flex items-center gap-4 text-left transition-colors ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : isDanger
                    ? "hover:bg-red-500/10"
                    : "hover:bg-white/5"
                }`;

                if (item.href && !isDisabled) {
                  if (item.external) {
                    return (
                      <a
                        key={index}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                      >
                        {content}
                      </a>
                    );
                  }
                  return (
                    <Link key={index} href={item.href} className={className}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={index}
                    onClick={item.onClick}
                    disabled={isDisabled}
                    className={className}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full card p-4 flex items-center justify-center gap-3 hover:bg-red-500/10 transition-colors text-red-400 font-medium disabled:opacity-50"
        >
          {isSigningOut ? (
            <>
              <div className="spinner w-5 h-5 border-red-400/30 border-t-red-400" />
              Signing out...
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              Sign Out
            </>
          )}
        </button>

        {/* App Version */}
        <p className="text-center text-gray-600 text-sm pb-4">
          EduFeed v1.0.0
        </p>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="card p-6 max-w-sm w-full animate-slide-up">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Delete Account?</h3>
            <p className="text-gray-400 text-center mb-6">
              This action cannot be undone. All your data, including notebooks, videos, and progress will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
