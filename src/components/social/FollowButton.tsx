"use client";

import { useState } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  initialIsFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: "default" | "compact";
  className?: string;
}

export default function FollowButton({
  userId,
  initialIsFollowing,
  onFollowChange,
  variant = "default",
  className = "",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      const data = await res.json();
      setIsFollowing(data.following);
      onFollowChange?.(data.following);
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleFollow}
        disabled={loading}
        className={`p-2 rounded-full transition-colors ${
          isFollowing
            ? "bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400"
            : "bg-purple-600 hover:bg-purple-700 text-white"
        } disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isFollowing ? (
          <UserMinus className="w-5 h-5" />
        ) : (
          <UserPlus className="w-5 h-5" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 ${
        isFollowing
          ? "bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400"
          : "bg-purple-600 hover:bg-purple-700 text-white"
      } disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}
