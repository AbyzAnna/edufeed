"use client";

import { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  Send,
  Search,
  Link2,
  MessageCircle,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  isFollowing: boolean;
}

interface ShareModalProps {
  feedItemId: string;
  feedItemTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({
  feedItemId,
  feedItemTitle,
  isOpen,
  onClose,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setUsers([]);
      setSent(new Set());
      setCopied(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers();
    } else {
      setUsers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      // Record the share
      await fetch(`/api/feed/${feedItemId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareType: "COPY_LINK" }),
      });

      const shareUrl = `${window.location.origin}/feed/${feedItemId}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const handleShareToUser = async (userId: string) => {
    setSending(userId);
    try {
      await fetch(`/api/feed/${feedItemId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareType: "INTERNAL",
          sharedToUserId: userId,
        }),
      });
      setSent((prev) => new Set([...prev, userId]));
    } catch (error) {
      console.error("Error sharing:", error);
    } finally {
      setSending(null);
    }
  };

  const handleExternalShare = async (platform: string) => {
    try {
      const res = await fetch(`/api/feed/${feedItemId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shareType: "EXTERNAL",
          externalPlatform: platform,
        }),
      });
      const data = await res.json();
      const shareUrl = data.shareUrl;
      const text = `Check out: ${feedItemTitle}`;

      let url = "";
      switch (platform) {
        case "twitter":
          url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
          break;
        case "whatsapp":
          url = `https://wa.me/?text=${encodeURIComponent(text + " " + shareUrl)}`;
          break;
        case "telegram":
          url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`;
          break;
        case "email":
          url = `mailto:?subject=${encodeURIComponent(feedItemTitle)}&body=${encodeURIComponent(text + "\n\n" + shareUrl)}`;
          break;
      }

      if (url) {
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error sharing externally:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-gray-900 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Share</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
              {copied ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Link2 className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-white">
                {copied ? "Link copied!" : "Copy link"}
              </p>
              <p className="text-sm text-gray-400">Share via link</p>
            </div>
            <Copy className="w-5 h-5 text-gray-400" />
          </button>

          {/* External Share Options */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleExternalShare("twitter")}
              className="w-12 h-12 rounded-full bg-[#1DA1F2] flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            <button
              onClick={() => handleExternalShare("whatsapp")}
              className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
            <button
              onClick={() => handleExternalShare("telegram")}
              className="w-12 h-12 rounded-full bg-[#0088cc] flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
            </button>
            <button
              onClick={() => handleExternalShare("email")}
              className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-sm text-gray-400">or send to</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* User Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* User List */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            ) : users.length > 0 ? (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5"
                >
                  <img
                    src={user.image || "/default-avatar.png"}
                    alt={user.name || "User"}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white">
                      {user.name || user.username || "User"}
                    </p>
                    {user.username && (
                      <p className="text-sm text-gray-400">@{user.username}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleShareToUser(user.id)}
                    disabled={sending === user.id || sent.has(user.id)}
                    className={`p-2 rounded-full transition-colors ${
                      sent.has(user.id)
                        ? "bg-green-600"
                        : "bg-purple-600 hover:bg-purple-700"
                    } disabled:opacity-50`}
                  >
                    {sending === user.id ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : sent.has(user.id) ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <Send className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
              ))
            ) : searchQuery.length >= 2 ? (
              <p className="text-center text-gray-400 py-4">No users found</p>
            ) : (
              <p className="text-center text-gray-400 py-4">
                Type to search for users
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
