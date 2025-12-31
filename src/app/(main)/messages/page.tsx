"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Send,
  Search,
  MessageCircle,
  Image,
  Paperclip,
} from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
}

interface Message {
  id: string;
  content: string | null;
  createdAt: string;
  senderId: string;
  sender: User;
  sharedFeedItem: {
    id: string;
    title: string;
    type: string;
    thumbnailUrl: string | null;
  } | null;
}

interface Conversation {
  id: string;
  otherUser: User | null;
  lastMessage: {
    id: string;
    content: string | null;
    createdAt: string;
    senderId: string;
  } | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);
    setMessages([]); // Clear previous messages
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);

      // Update unread count
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);
    try {
      const res = await fetch(
        `/api/conversations/${selectedConversation}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: newMessage }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");

        // Update last message in conversations
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation
              ? {
                  ...c,
                  lastMessage: {
                    id: data.message.id,
                    content: data.message.content,
                    createdAt: data.message.createdAt,
                    senderId: data.message.senderId,
                  },
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const selectedConv = conversations.find((c) => c.id === selectedConversation);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Conversations List */}
      <div
        className={`w-full md:w-80 border-r border-white/10 flex flex-col ${
          selectedConversation ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <h1 className="text-xl font-bold text-white">Messages</h1>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full bg-white/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start a conversation by sharing content!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors ${
                  selectedConversation === conv.id ? "bg-white/10" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={conv.otherUser?.image || "/default-avatar.png"}
                    alt={conv.otherUser?.name || "User"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full text-xs text-white flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-white truncate">
                      {conv.otherUser?.name || conv.otherUser?.username || "User"}
                    </p>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-sm text-gray-400 truncate">
                      {conv.lastMessage.content || "Shared content"}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat View */}
      <div
        className={`flex-1 flex flex-col ${
          selectedConversation ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedConversation && selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <button
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 rounded-full hover:bg-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <img
                src={selectedConv.otherUser?.image || "/default-avatar.png"}
                alt={selectedConv.otherUser?.name || "User"}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-white">
                  {selectedConv.otherUser?.name ||
                    selectedConv.otherUser?.username ||
                    "User"}
                </p>
                {selectedConv.otherUser?.username && (
                  <p className="text-sm text-gray-400">
                    @{selectedConv.otherUser.username}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 py-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.sender.id !== selectedConv.otherUser?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] ${
                          isOwn
                            ? "bg-purple-600 rounded-2xl rounded-br-md"
                            : "bg-white/10 rounded-2xl rounded-bl-md"
                        } p-3`}
                      >
                        {message.sharedFeedItem && (
                          <Link
                            href={`/feed/${message.sharedFeedItem.id}`}
                            className="block mb-2 p-2 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
                          >
                            <p className="text-xs text-gray-300 uppercase">
                              Shared {message.sharedFeedItem.type.replace("_", " ")}
                            </p>
                            <p className="text-sm text-white font-medium truncate">
                              {message.sharedFeedItem.title}
                            </p>
                          </Link>
                        )}
                        {message.content && (
                          <p className="text-white">{message.content}</p>
                        )}
                        <p className="text-xs text-gray-300 mt-1 text-right">
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-full hover:bg-white/10 text-gray-400">
                  <Image className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white/10 rounded-full px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-3 rounded-full bg-purple-600 text-white disabled:opacity-50 hover:bg-purple-700 transition-colors"
                >
                  {sendingMessage ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm mt-1">Choose from your existing conversations</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
