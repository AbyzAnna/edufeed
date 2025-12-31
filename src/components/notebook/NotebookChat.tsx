"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Quote,
  RefreshCw,
  Trash2,
} from "lucide-react";

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
  citations?: Citation[];
  createdAt: string;
}

interface NotebookChatProps {
  notebookId: string;
  initialMessages?: ChatMessage[];
  sourcesCount: number;
}

export default function NotebookChat({
  notebookId,
  initialMessages = [],
  sourcesCount,
}: NotebookChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    // Add user message optimistically
    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "USER",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`/api/notebooks/${notebookId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();

      // Update with real messages
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        return [...filtered, data.userMessage, data.assistantMessage];
      });
    } catch (error) {
      console.error("Chat error:", error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "ASSISTANT",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear the chat history?")) return;

    try {
      await fetch(`/api/notebooks/${notebookId}/chat`, {
        method: "DELETE",
      });
      setMessages([]);
    } catch (error) {
      console.error("Failed to clear chat:", error);
    }
  };

  const toggleCitation = (messageId: string) => {
    setExpandedCitations((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestedQuestions = [
    "What are the main topics covered?",
    "Summarize the key points",
    "What are the important terms to know?",
    "Create a study guide",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-white">AI Assistant</span>
          <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-white/60">
            {sourcesCount} sources loaded
          </span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot className="w-16 h-16 text-purple-400/50 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Ask me anything about your sources
            </h3>
            <p className="text-white/50 text-sm mb-6 max-w-md">
              I can help you understand, summarize, and explore your notebook
              materials. All my answers are grounded in your sources.
            </p>

            {/* Suggested questions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestedQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => setInput(question)}
                  className="px-3 py-2 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-lg text-sm text-white/70 hover:text-white transition-all"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "USER" ? "justify-end" : ""
              }`}
            >
              {message.role !== "USER" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-purple-400" />
                </div>
              )}

              <div
                className={`max-w-[80%] ${
                  message.role === "USER"
                    ? "bg-purple-600 rounded-2xl rounded-tr-md"
                    : "bg-white/5 rounded-2xl rounded-tl-md"
                } px-4 py-3`}
              >
                <p className="text-white whitespace-pre-wrap">{message.content}</p>

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => toggleCitation(message.id)}
                      className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                    >
                      <Quote className="w-4 h-4" />
                      {expandedCitations.has(message.id)
                        ? "Hide sources"
                        : `View ${message.citations.length} source${message.citations.length > 1 ? "s" : ""}`}
                    </button>

                    {expandedCitations.has(message.id) && (
                      <div className="mt-2 space-y-2">
                        {message.citations.map((citation) => (
                          <div
                            key={citation.id}
                            className="p-3 bg-black/20 rounded-lg text-sm"
                          >
                            <div className="flex items-center gap-2 text-white/60 mb-1">
                              {citation.source.type === "PDF" && "📄"}
                              {citation.source.type === "URL" && "🔗"}
                              {citation.source.type === "YOUTUBE" && "🎬"}
                              {citation.source.type === "TEXT" && "📝"}
                              <span>{citation.source.title}</span>
                            </div>
                            <p className="text-white/80 italic">
                              &quot;{citation.excerpt}&quot;
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {message.role === "USER" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-white/60" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="bg-white/5 rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex items-center gap-2 text-white/60">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your sources..."
            rows={1}
            disabled={sourcesCount === 0}
            className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 transition-colors resize-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || sourcesCount === 0}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </form>
        {sourcesCount === 0 && (
          <p className="mt-2 text-sm text-white/40 text-center">
            Add some sources to start chatting
          </p>
        )}
      </div>
    </div>
  );
}
