"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Heart,
  Send,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  image: string | null;
  username: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: User;
  isLiked: boolean;
  likeCount: number;
  replyCount: number;
  replies?: Comment[];
}

interface CommentSectionProps {
  feedItemId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentSection({
  feedItemId,
  isOpen,
  onClose,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/feed/${feedItemId}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  }, [feedItemId]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, fetchComments]);

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/feed/${feedItemId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          parentId: replyingTo,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (replyingTo) {
          // Add reply to parent comment
          setComments((prev) =>
            prev.map((c) =>
              c.id === replyingTo
                ? {
                    ...c,
                    replies: [...(c.replies || []), data.comment],
                    replyCount: c.replyCount + 1,
                  }
                : c
            )
          );
          setExpandedReplies((prev) => new Set([...prev, replyingTo]));
        } else {
          setComments((prev) => [data.comment, ...prev]);
        }
        setNewComment("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Error posting comment:", error);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
      });
      const data = await res.json();

      const updateComment = (c: Comment): Comment => {
        if (c.id === commentId) {
          return {
            ...c,
            isLiked: data.liked,
            likeCount: data.liked ? c.likeCount + 1 : c.likeCount - 1,
          };
        }
        if (c.replies) {
          return { ...c, replies: c.replies.map(updateComment) };
        }
        return c;
      };

      setComments((prev) => prev.map(updateComment));
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Comment Sheet */}
      <div className="relative w-full max-w-lg bg-gray-900 rounded-t-3xl max-h-[80vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Comments</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                {/* Main Comment */}
                <div className="flex gap-3">
                  <img
                    src={comment.user.image || "/default-avatar.png"}
                    alt={comment.user.name || "User"}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-sm">
                        {comment.user.name ||
                          comment.user.username ||
                          "Anonymous"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mt-1">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            comment.isLiked
                              ? "fill-red-500 text-red-500"
                              : ""
                          }`}
                        />
                        {comment.likeCount > 0 && comment.likeCount}
                      </button>
                      <button
                        onClick={() =>
                          setReplyingTo(
                            replyingTo === comment.id ? null : comment.id
                          )
                        }
                        className="text-xs text-gray-400 hover:text-white"
                      >
                        Reply
                      </button>
                      {comment.replyCount > 0 && (
                        <button
                          onClick={() => toggleReplies(comment.id)}
                          className="flex items-center gap-1 text-xs text-purple-400"
                        >
                          {expandedReplies.has(comment.id) ? (
                            <>
                              <ChevronUp className="w-3 h-3" />
                              Hide replies
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3" />
                              {comment.replyCount}{" "}
                              {comment.replyCount === 1 ? "reply" : "replies"}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reply Input */}
                {replyingTo === comment.id && (
                  <div className="ml-11 flex gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`Reply to ${comment.user.name || "user"}...`}
                      className="flex-1 bg-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSubmitComment();
                      }}
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!newComment.trim()}
                      className="p-2 rounded-full bg-purple-600 text-white disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Replies */}
                {expandedReplies.has(comment.id) && comment.replies && (
                  <div className="ml-11 space-y-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3">
                        <img
                          src={reply.user.image || "/default-avatar.png"}
                          alt={reply.user.name || "User"}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white text-sm">
                              {reply.user.name ||
                                reply.user.username ||
                                "Anonymous"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm mt-1">
                            {reply.content}
                          </p>
                          <button
                            onClick={() => handleLikeComment(reply.id)}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white mt-1"
                          >
                            <Heart
                              className={`w-3 h-3 ${
                                reply.isLiked
                                  ? "fill-red-500 text-red-500"
                                  : ""
                              }`}
                            />
                            {reply.likeCount > 0 && reply.likeCount}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* New Comment Input */}
        {!replyingTo && (
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-white/10 rounded-full px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmitComment();
                }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="p-3 rounded-full bg-purple-600 text-white disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
