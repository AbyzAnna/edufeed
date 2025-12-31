'use client';

import { useState } from 'react';

/**
 * React hook for AI generation features
 * Use this in your client components to generate content
 */

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  response: string;
  sources: Array<{
    sourceId: string;
    chunk: string;
    relevance: number;
  }>;
}

export function useChat(sourceId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: ChatMessage = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, message }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data: ChatResponse = await response.json();

      // Add assistant message
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.response,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    sendMessage,
    clearChat,
    isLoading,
    error,
  };
}

export function useFlashcardGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFlashcards = async (
    sourceId: string,
    options?: {
      count?: number;
      difficulty?: 'easy' | 'medium' | 'hard';
      topics?: string[];
    }
  ) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/flashcards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, ...options }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateFlashcards,
    isGenerating,
    error,
  };
}

export function useStudyGuide() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStudyGuide = async (
    sourceId: string,
    options?: {
      focusAreas?: string[];
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
    }
  ) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/study-guide/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, ...options }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate study guide');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateStudyGuide,
    isGenerating,
    error,
  };
}

export function useAudioOverview() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generateAudioOverview = async (
    sourceId: string,
    options?: {
      style?: 'conversational' | 'lecture' | 'debate';
      duration?: number;
    }
  ) => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress (in real implementation, use WebSockets or polling)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 1000);

      const response = await fetch('/api/ai/audio-overview/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId, ...options }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Failed to generate audio overview');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAudioOverview,
    isGenerating,
    progress,
    error,
  };
}

/**
 * Combined hook for all AI features
 */
export function useAIGeneration(sourceId: string) {
  const chat = useChat(sourceId);
  const flashcards = useFlashcardGeneration();
  const studyGuide = useStudyGuide();
  const audioOverview = useAudioOverview();

  return {
    chat,
    flashcards,
    studyGuide,
    audioOverview,
  };
}
