"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Quote,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Source {
  id: string;
  type: string;
  title: string;
  originalUrl: string | null;
  content: string | null;
  wordCount: number | null;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

interface Citation {
  id: string;
  excerpt: string;
  source: {
    id: string;
    title: string;
    type: string;
  };
}

interface ChatMessage {
  id: string;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
  citations?: Citation[];
}

interface ChatPanelProps {
  notebookId: string;
  notebookTitle: string;
  notebookEmoji: string | null;
  sources: Source[];
  selectedSourceIds: Set<string>;
  messages: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
}

const SUGGESTED_QUESTIONS = [
  "What are the main topics covered?",
  "Summarize the key points",
  "What are the important terms to know?",
  "Create a study guide",
  "What are the main arguments?",
  "Explain the key concepts",
];

function AIOverview({
  sources,
  notebookTitle,
  notebookEmoji,
}: {
  sources: Source[];
  notebookTitle: string;
  notebookEmoji: string | null;
}) {
  const completedSources = sources.filter((s) => s.status === "COMPLETED");
  const totalWords = completedSources.reduce((acc, s) => acc + (s.wordCount || 0), 0);

  // Group sources by type
  const sourcesByType = completedSources.reduce(
    (acc, source) => {
      acc[source.type] = (acc[source.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const sourceTypeSummary = Object.entries(sourcesByType)
    .map(([type, count]) => `${count} ${type.toLowerCase()}${count > 1 ? "s" : ""}`)
    .join(", ");

  if (completedSources.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-4 mb-4 border border-purple-500/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{notebookEmoji || "📚"}</span>
        <h2 className="text-lg font-semibold text-white">{notebookTitle}</h2>
      </div>
      <p className="text-sm text-white/70 mb-3">
        This notebook contains {completedSources.length} sources ({sourceTypeSummary}) with
        approximately {totalWords.toLocaleString()} words of content.
      </p>
      <div className="flex items-center gap-2 text-xs text-white/50">
        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
        <span>AI-powered research assistant ready to help</span>
      </div>
    </div>
  );
}

function ChatMessageItem({
  message,
  onCopy,
}: {
  message: ChatMessage;
  onCopy: (content: string) => void;
}) {
  const [showCitations, setShowCitations] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const isUser = message.role === "USER";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-white/10" : "bg-purple-500/20"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white/60" />
        ) : (
          <Bot className="w-4 h-4 text-purple-400" />
        )}
      </div>

      {/* Message */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-purple-600 rounded-tr-md"
              : "bg-white/5 rounded-tl-md"
          }`}
        >
          <p className={`text-sm whitespace-pre-wrap ${isUser ? "text-white" : "text-white/90"}`}>
            {message.content}
          </p>

          {/* Citations */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <button
                onClick={() => setShowCitations(!showCitations)}
                className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Quote className="w-3 h-3" />
                {showCitations ? "Hide" : "View"} {message.citations.length} source
                {message.citations.length > 1 ? "s" : ""}
                {showCitations ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>

              {showCitations && (
                <div className="mt-2 space-y-2">
                  {message.citations.map((citation) => (
                    <div
                      key={citation.id}
                      className="p-2.5 bg-black/20 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-white/50 mb-1">
                        {citation.source.type === "PDF" && "📄"}
                        {citation.source.type === "URL" && "🔗"}
                        {citation.source.type === "YOUTUBE" && "🎬"}
                        {citation.source.type === "TEXT" && "📝"}
                        <span className="truncate">{citation.source.title}</span>
                      </div>
                      <p className="text-white/70 italic">
                        &quot;{citation.excerpt}&quot;
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions (AI messages only) */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1.5 px-1">
            <button
              onClick={() => onCopy(message.content)}
              className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded transition-colors"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFeedback(feedback === "up" ? null : "up")}
              className={`p-1.5 rounded transition-colors ${
                feedback === "up"
                  ? "text-green-400 bg-green-500/10"
                  : "text-white/30 hover:text-white/60 hover:bg-white/5"
              }`}
              title="Good response"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setFeedback(feedback === "down" ? null : "down")}
              className={`p-1.5 rounded transition-colors ${
                feedback === "down"
                  ? "text-red-400 bg-red-500/10"
                  : "text-white/30 hover:text-white/60 hover:bg-white/5"
              }`}
              title="Bad response"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button
              className="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded transition-colors"
              title="Save to note"
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({
  notebookId,
  notebookTitle,
  notebookEmoji,
  sources,
  selectedSourceIds,
  messages,
  onNewMessage,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const completedSources = sources.filter((s) => s.status === "COMPLETED");
  const selectedCount = selectedSourceIds.size;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Optimistically add user message
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    onNewMessage(tempUserMessage);

    try {
      const response = await fetch(`/api/notebooks/${notebookId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sourceIds: Array.from(selectedSourceIds),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Add assistant message
      onNewMessage(data.assistantMessage);
    } catch (error) {
      console.error("Chat error:", error);
      onNewMessage({
        id: `error-${Date.now()}`,
        role: "ASSISTANT",
        content: "Sorry, I encountered an error processing your request. Please try again.",
        createdAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1a1a]">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-3 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white">Chat</h2>
        <p className="text-xs text-white/40">
          {selectedCount > 0
            ? `Chatting with ${selectedCount} selected source${selectedCount > 1 ? "s" : ""}`
            : `${completedSources.length} sources available`}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* AI Overview */}
        <AIOverview
          sources={sources}
          notebookTitle={notebookTitle}
          notebookEmoji={notebookEmoji}
        />

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              Ask me anything about your sources
            </h3>
            <p className="text-sm text-white/50 max-w-md mb-6">
              I can help you understand, summarize, and explore your notebook
              materials. All my answers are grounded in your sources.
            </p>

            {/* Suggested Questions */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED_QUESTIONS.slice(0, 4).map((question) => (
                <button
                  key={question}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="px-3 py-2 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-lg text-sm text-white/70 hover:text-white transition-all"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessageItem
                key={message.id}
                message={message}
                onCopy={handleCopy}
              />
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
                <div className="bg-white/5 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-white/5">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              completedSources.length === 0
                ? "Add sources to start chatting..."
                : "Start typing..."
            }
            rows={1}
            disabled={completedSources.length === 0}
            className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || completedSources.length === 0}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </form>
        <p className="text-xs text-white/30 text-center mt-2">
          {selectedCount} sources selected
          {selectedCount === 0 && completedSources.length > 0 && " • Select sources to focus your chat"}
        </p>
      </div>
    </div>
  );
}
