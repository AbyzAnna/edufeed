import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test types
interface NotebookSource {
  id: string;
  type: string;
  title: string;
  originalUrl?: string;
  content?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  wordCount?: number;
}

interface Notebook {
  id: string;
  title: string;
  description?: string;
  emoji: string;
  color: string;
  isPublic: boolean;
  sources: NotebookSource[];
  outputs: any[];
  chatMessages: any[];
}

// Mock API helper
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Notebook API', () => {
  const baseUrl = 'http://localhost:3000';
  const testUserId = 'test-user-anton';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Notebook CRUD Operations', () => {
    it('should create a new notebook', async () => {
      const mockNotebook: Notebook = {
        id: 'notebook-1',
        title: 'Test Notebook',
        description: 'A test notebook',
        emoji: '📚',
        color: '#8b5cf6',
        isPublic: false,
        sources: [],
        outputs: [],
        chatMessages: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotebook,
      });

      const response = await fetch(`${baseUrl}/api/notebooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Notebook',
          description: 'A test notebook',
          emoji: '📚',
          color: '#8b5cf6',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.title).toBe('Test Notebook');
      expect(data.emoji).toBe('📚');
    });

    it('should list user notebooks', async () => {
      const mockNotebooks: Notebook[] = [
        {
          id: 'notebook-1',
          title: 'Notebook 1',
          emoji: '📚',
          color: '#8b5cf6',
          isPublic: false,
          sources: [],
          outputs: [],
          chatMessages: [],
        },
        {
          id: 'notebook-2',
          title: 'Notebook 2',
          emoji: '📖',
          color: '#ec4899',
          isPublic: true,
          sources: [],
          outputs: [],
          chatMessages: [],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotebooks,
      });

      const response = await fetch(`${baseUrl}/api/notebooks`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveLength(2);
    });

    it('should get notebook by ID', async () => {
      const mockNotebook: Notebook = {
        id: 'notebook-1',
        title: 'Test Notebook',
        emoji: '📚',
        color: '#8b5cf6',
        isPublic: false,
        sources: [],
        outputs: [],
        chatMessages: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotebook,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.id).toBe('notebook-1');
    });

    it('should update notebook', async () => {
      const updatedNotebook: Notebook = {
        id: 'notebook-1',
        title: 'Updated Title',
        emoji: '🎓',
        color: '#8b5cf6',
        isPublic: true,
        sources: [],
        outputs: [],
        chatMessages: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedNotebook,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Title',
          isPublic: true,
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.title).toBe('Updated Title');
      expect(data.isPublic).toBe(true);
    });

    it('should delete notebook', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1`, {
        method: 'DELETE',
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Notebook Sources', () => {
    it('should add URL source', async () => {
      const mockSource: NotebookSource = {
        id: 'source-1',
        type: 'URL',
        title: 'Wikipedia Article',
        originalUrl: 'https://en.wikipedia.org/wiki/Machine_learning',
        status: 'PENDING',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSource,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'URL',
          url: 'https://en.wikipedia.org/wiki/Machine_learning',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('URL');
      expect(data.status).toBe('PENDING');
    });

    it('should add TEXT source', async () => {
      const mockSource: NotebookSource = {
        id: 'source-2',
        type: 'TEXT',
        title: 'My Notes',
        content: 'These are my study notes about machine learning...',
        status: 'COMPLETED',
        wordCount: 150,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSource,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TEXT',
          title: 'My Notes',
          content: 'These are my study notes about machine learning...',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('TEXT');
      expect(data.status).toBe('COMPLETED');
    });

    it('should add YOUTUBE source', async () => {
      const mockSource: NotebookSource = {
        id: 'source-3',
        type: 'YOUTUBE',
        title: 'ML Tutorial',
        originalUrl: 'https://youtube.com/watch?v=abc123',
        status: 'PROCESSING',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSource,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'YOUTUBE',
          url: 'https://youtube.com/watch?v=abc123',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('YOUTUBE');
    });

    it('should delete source', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const response = await fetch(
        `${baseUrl}/api/notebooks/notebook-1/sources?sourceId=source-1`,
        { method: 'DELETE' }
      );

      expect(response.ok).toBe(true);
    });
  });

  describe('Notebook Chat (RAG)', () => {
    it('should send chat message and get AI response', async () => {
      const mockChatResponse = {
        id: 'chat-1',
        role: 'ASSISTANT',
        content: 'Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed.',
        citations: [
          { sourceId: 'source-1', text: 'ML is a branch of AI...', page: 1 },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChatResponse,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What is machine learning?',
          sourceIds: ['source-1', 'source-2'],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.role).toBe('ASSISTANT');
      expect(data.content).toBeTruthy();
    });

    it('should get chat history', async () => {
      const mockHistory = [
        { id: 'msg-1', role: 'USER', content: 'What is ML?' },
        { id: 'msg-2', role: 'ASSISTANT', content: 'ML is...' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1/chat`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveLength(2);
    });
  });

  describe('Notebook Outputs (Content Generation)', () => {
    it('should generate summary', async () => {
      const mockOutput = {
        id: 'output-1',
        type: 'SUMMARY',
        title: 'Summary of Sources',
        content: {
          overview: 'This notebook covers...',
          keyPoints: ['Point 1', 'Point 2', 'Point 3'],
        },
        status: 'COMPLETED',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOutput,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1/outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SUMMARY',
          sourceIds: ['source-1'],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('SUMMARY');
    });

    it('should generate flashcards', async () => {
      const mockOutput = {
        id: 'output-2',
        type: 'FLASHCARD_DECK',
        title: 'Flashcards',
        content: {
          cards: [
            { front: 'What is ML?', back: 'Machine Learning is...' },
            { front: 'Types of ML?', back: 'Supervised, Unsupervised...' },
          ],
        },
        status: 'COMPLETED',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOutput,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1/outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'FLASHCARD_DECK',
          sourceIds: ['source-1', 'source-2'],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('FLASHCARD_DECK');
      expect(data.content.cards).toHaveLength(2);
    });

    it('should generate quiz', async () => {
      const mockOutput = {
        id: 'output-3',
        type: 'QUIZ',
        title: 'Quiz',
        content: {
          questions: [
            {
              question: 'What is machine learning?',
              options: ['A', 'B', 'C', 'D'],
              correctAnswer: 0,
            },
          ],
        },
        status: 'COMPLETED',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOutput,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1/outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'QUIZ',
          sourceIds: ['source-1'],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('QUIZ');
    });

    it('should generate mind map', async () => {
      const mockOutput = {
        id: 'output-4',
        type: 'MIND_MAP',
        title: 'Mind Map',
        content: {
          central: 'Machine Learning',
          branches: [
            { topic: 'Supervised Learning', subtopics: ['Classification', 'Regression'] },
            { topic: 'Unsupervised Learning', subtopics: ['Clustering', 'Dimensionality Reduction'] },
          ],
        },
        status: 'COMPLETED',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOutput,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1/outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'MIND_MAP',
          sourceIds: ['source-1'],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('MIND_MAP');
    });

    it('should generate audio overview (podcast)', async () => {
      const mockOutput = {
        id: 'output-5',
        type: 'AUDIO_OVERVIEW',
        title: 'Audio Overview',
        audioUrl: 'https://storage.example.com/audio/podcast.mp3',
        content: {
          transcript: 'Welcome to this overview of machine learning...',
          duration: 300,
        },
        status: 'COMPLETED',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOutput,
      });

      const response = await fetch(`${baseUrl}/api/notebooks/notebook-1/outputs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'AUDIO_OVERVIEW',
          sourceIds: ['source-1'],
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.type).toBe('AUDIO_OVERVIEW');
      expect(data.audioUrl).toBeTruthy();
    });
  });
});

describe('Cloudflare Worker AI Integration', () => {
  const workerUrl = 'https://edufeed-ai-worker.steep-mouse-b843.workers.dev';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check worker health', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok', timestamp: Date.now() }),
    });

    const response = await fetch(`${workerUrl}/health`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  it('should test AI endpoint', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        response: { message: 'Hello' },
      }),
    });

    const response = await fetch(`${workerUrl}/api/test-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Say hello' }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should generate direct summary', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: 'Summary',
        content: 'This is a summary...',
        keyPoints: ['Point 1', 'Point 2'],
        highlights: ['Highlight 1'],
        readTime: 5,
      }),
    });

    const response = await fetch(`${workerUrl}/api/content/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Some long text content...',
        title: 'Test Document',
        length: 'medium',
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.keyPoints).toBeTruthy();
  });

  it('should generate direct flashcards', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        flashcards: [
          { front: 'Q1', back: 'A1' },
          { front: 'Q2', back: 'A2' },
        ],
        metadata: { totalGenerated: 2, difficulty: 'medium' },
      }),
    });

    const response = await fetch(`${workerUrl}/api/content/flashcards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Some content to create flashcards from...',
        title: 'Test',
        count: 10,
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.flashcards).toBeTruthy();
    expect(data.flashcards.length).toBeGreaterThan(0);
  });
});
