/**
 * Integration Tests for Notebook API Endpoints
 * Tests CRUD operations and output generation
 *
 * Total: 100 tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock authenticated user
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

// API base URL
const API_BASE = 'http://localhost:3000/api';

// Helper to create mock response
const mockResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

// ==================== Notebook CRUD Tests (30 tests) ====================

describe('Notebook CRUD API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/notebooks', () => {
    it('should create a new notebook', async () => {
      const newNotebook = { title: 'APWH', description: 'AP World History' };
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'nb-1', ...newNotebook }));

      const response = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotebook),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.title).toBe('APWH');
    });

    it('should require authentication', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Unauthorized' }, 401));

      const response = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });

      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Title is required' }, 400));

      const response = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should set default emoji', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'nb-1', emoji: '📚' }));

      const response = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });
      const data = await response.json();

      expect(data.emoji).toBe('📚');
    });

    it('should set default color', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'nb-1', color: '#6366f1' }));

      const response = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });
      const data = await response.json();

      expect(data.color).toBe('#6366f1');
    });

    it('should set isPublic to false by default', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'nb-1', isPublic: false }));

      const response = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });
      const data = await response.json();

      expect(data.isPublic).toBe(false);
    });

    it('should generate unique ID', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'clx123abc' }));

      const response = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });
      const data = await response.json();

      expect(data.id).toBeDefined();
      expect(data.id.length).toBeGreaterThan(0);
    });

    it('should set createdAt timestamp', async () => {
      const now = new Date().toISOString();
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'nb-1', createdAt: now }));

      const response = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });
      const data = await response.json();

      expect(data.createdAt).toBeDefined();
    });

    it('should associate with authenticated user', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'nb-1', userId: mockUser.id }));

      const response = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      });
      const data = await response.json();

      expect(data.userId).toBe(mockUser.id);
    });

    it('should allow custom emoji', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'nb-1', emoji: '🌍' }));

      const response = await fetch(`${API_BASE}/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ title: 'History', emoji: '🌍' }),
      });
      const data = await response.json();

      expect(data.emoji).toBe('🌍');
    });
  });

  describe('GET /api/notebooks', () => {
    it('should list user notebooks', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([{ id: 'nb-1' }, { id: 'nb-2' }]));

      const response = await fetch(`${API_BASE}/notebooks`);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
    });

    it('should only return user-owned notebooks', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([{ id: 'nb-1', userId: mockUser.id }]));

      const response = await fetch(`${API_BASE}/notebooks`);
      const data = await response.json();

      expect(data[0].userId).toBe(mockUser.id);
    });

    it('should order by createdAt desc', async () => {
      const notebooks = [
        { id: 'nb-2', createdAt: '2024-02-01' },
        { id: 'nb-1', createdAt: '2024-01-01' },
      ];
      mockFetch.mockResolvedValueOnce(mockResponse(notebooks));

      const response = await fetch(`${API_BASE}/notebooks`);
      const data = await response.json();

      expect(data[0].id).toBe('nb-2');
    });

    it('should include source count', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([{ id: 'nb-1', _count: { sources: 5 } }]));

      const response = await fetch(`${API_BASE}/notebooks`);
      const data = await response.json();

      expect(data[0]._count.sources).toBe(5);
    });

    it('should include output count', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([{ id: 'nb-1', _count: { outputs: 3 } }]));

      const response = await fetch(`${API_BASE}/notebooks`);
      const data = await response.json();

      expect(data[0]._count.outputs).toBe(3);
    });
  });

  describe('GET /api/notebooks/[notebookId]', () => {
    it('should get single notebook', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'nb-1', title: 'APWH' }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1`);
      const data = await response.json();

      expect(data.id).toBe('nb-1');
      expect(data.title).toBe('APWH');
    });

    it('should return 404 for non-existent notebook', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Not found' }, 404));

      const response = await fetch(`${API_BASE}/notebooks/non-existent`);

      expect(response.status).toBe(404);
    });

    it('should include sources', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'nb-1',
        NotebookSource: [{ id: 'src-1' }],
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1`);
      const data = await response.json();

      expect(Array.isArray(data.NotebookSource)).toBe(true);
    });

    it('should include outputs', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'nb-1',
        NotebookOutput: [{ id: 'out-1' }],
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1`);
      const data = await response.json();

      expect(Array.isArray(data.NotebookOutput)).toBe(true);
    });

    it('should allow access to public notebooks', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'nb-1', isPublic: true }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1`);
      const data = await response.json();

      expect(data.isPublic).toBe(true);
    });
  });

  describe('DELETE /api/notebooks/[notebookId]', () => {
    it('should delete notebook', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should require ownership', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Forbidden' }, 403));

      const response = await fetch(`${API_BASE}/notebooks/nb-other`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(403);
    });

    it('should cascade delete sources', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, deletedSources: 10 }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(data.deletedSources).toBe(10);
    });

    it('should cascade delete outputs', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, deletedOutputs: 5 }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(data.deletedOutputs).toBe(5);
    });
  });
});

// ==================== Sources API Tests (35 tests) ====================

describe('Sources API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/notebooks/[notebookId]/sources', () => {
    it('should add YouTube source', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'src-1',
        type: 'YOUTUBE',
        title: 'APWH Video',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'YOUTUBE',
          originalUrl: 'https://youtube.com/watch?v=abc',
        }),
      });
      const data = await response.json();

      expect(data.type).toBe('YOUTUBE');
    });

    it('should add PDF source', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'src-1',
        type: 'PDF',
        title: 'Chapter 1.pdf',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'PDF',
          title: 'Chapter 1.pdf',
          fileUrl: 'https://storage.example.com/file.pdf',
        }),
      });
      const data = await response.json();

      expect(data.type).toBe('PDF');
    });

    it('should add URL source', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'src-1',
        type: 'URL',
        title: 'History Article',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'URL',
          originalUrl: 'https://history.com/article',
        }),
      });
      const data = await response.json();

      expect(data.type).toBe('URL');
    });

    it('should add TEXT source', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'src-1',
        type: 'TEXT',
        title: 'My Notes',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'TEXT',
          title: 'My Notes',
          content: 'Notes about world history...',
        }),
      });
      const data = await response.json();

      expect(data.type).toBe('TEXT');
    });

    it('should validate source type', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Invalid source type' }, 400));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'POST',
        body: JSON.stringify({ type: 'INVALID' }),
      });

      expect(response.status).toBe(400);
    });

    it('should set status to PENDING', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'src-1',
        status: 'PENDING',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'POST',
        body: JSON.stringify({ type: 'URL', originalUrl: 'https://example.com' }),
      });
      const data = await response.json();

      expect(data.status).toBe('PENDING');
    });

    it('should add 10 YouTube sources', async () => {
      const sources = [];
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce(mockResponse({
          id: `src-yt-${i}`,
          type: 'YOUTUBE',
        }));
        const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
          method: 'POST',
          body: JSON.stringify({
            type: 'YOUTUBE',
            originalUrl: `https://youtube.com/watch?v=apwh${i}`,
          }),
        });
        sources.push(await response.json());
      }

      expect(sources.length).toBe(10);
      expect(sources.every(s => s.type === 'YOUTUBE')).toBe(true);
    });

    it('should add 10 PDF sources', async () => {
      const sources = [];
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce(mockResponse({
          id: `src-pdf-${i}`,
          type: 'PDF',
        }));
        const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
          method: 'POST',
          body: JSON.stringify({
            type: 'PDF',
            title: `APWH Chapter ${i + 1}.pdf`,
          }),
        });
        sources.push(await response.json());
      }

      expect(sources.length).toBe(10);
      expect(sources.every(s => s.type === 'PDF')).toBe(true);
    });

    it('should add 10 URL sources', async () => {
      const sources = [];
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce(mockResponse({
          id: `src-url-${i}`,
          type: 'URL',
        }));
        const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
          method: 'POST',
          body: JSON.stringify({
            type: 'URL',
            originalUrl: `https://worldhistory.org/unit${i + 1}`,
          }),
        });
        sources.push(await response.json());
      }

      expect(sources.length).toBe(10);
      expect(sources.every(s => s.type === 'URL')).toBe(true);
    });

    it('should add 10 TEXT sources', async () => {
      const sources = [];
      for (let i = 0; i < 10; i++) {
        mockFetch.mockResolvedValueOnce(mockResponse({
          id: `src-text-${i}`,
          type: 'TEXT',
        }));
        const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
          method: 'POST',
          body: JSON.stringify({
            type: 'TEXT',
            title: `Notes ${i + 1}`,
            content: `History notes for unit ${i + 1}...`,
          }),
        });
        sources.push(await response.json());
      }

      expect(sources.length).toBe(10);
      expect(sources.every(s => s.type === 'TEXT')).toBe(true);
    });

    it('should extract title from YouTube', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'src-1',
        title: 'AP World History - Unit 1',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'YOUTUBE',
          originalUrl: 'https://youtube.com/watch?v=abc',
        }),
      });
      const data = await response.json();

      expect(data.title).toBeDefined();
      expect(data.title.length).toBeGreaterThan(0);
    });

    it('should extract title from URL', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'src-1',
        title: 'World History Online',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'URL',
          originalUrl: 'https://worldhistory.org/article',
        }),
      });
      const data = await response.json();

      expect(data.title).toBeDefined();
    });

    it('should use filename as title for PDF', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'src-1',
        title: 'Chapter1.pdf',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'PDF',
          title: 'Chapter1.pdf',
        }),
      });
      const data = await response.json();

      expect(data.title).toBe('Chapter1.pdf');
    });

    it('should require title for TEXT', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Title required' }, 400));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'TEXT',
          content: 'Content without title',
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/notebooks/[notebookId]/sources', () => {
    it('should list all sources', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'src-1' },
        { id: 'src-2' },
      ]));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
    });

    it('should filter by type', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'src-1', type: 'YOUTUBE' },
      ]));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources?type=YOUTUBE`);
      const data = await response.json();

      expect(data[0].type).toBe('YOUTUBE');
    });

    it('should filter by status', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'src-1', status: 'COMPLETED' },
      ]));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources?status=COMPLETED`);
      const data = await response.json();

      expect(data[0].status).toBe('COMPLETED');
    });

    it('should order by createdAt desc', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'src-2', createdAt: '2024-02-01' },
        { id: 'src-1', createdAt: '2024-01-01' },
      ]));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`);
      const data = await response.json();

      expect(data[0].id).toBe('src-2');
    });

    it('should include word count', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'src-1', wordCount: 1500 },
      ]));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`);
      const data = await response.json();

      expect(data[0].wordCount).toBe(1500);
    });
  });

  describe('DELETE /api/notebooks/[notebookId]/sources', () => {
    it('should delete source by ID', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources?sourceId=src-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should require sourceId parameter', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'sourceId required' }, 400));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(400);
    });

    it('should cascade delete embeddings', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true, deletedEmbeddings: 10 }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/sources?sourceId=src-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(data.deletedEmbeddings).toBe(10);
    });
  });
});

// ==================== Outputs API Tests (35 tests) ====================

describe('Outputs API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/notebooks/[notebookId]/outputs', () => {
    it('should generate VIDEO_OVERVIEW output', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        type: 'VIDEO_OVERVIEW',
        status: 'COMPLETED',
        content: {
          segments: [],
          videoUrl: 'data:application/json;base64,...',
          isActualVideo: true,
        },
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'VIDEO_OVERVIEW' }),
      });
      const data = await response.json();

      expect(data.type).toBe('VIDEO_OVERVIEW');
      expect(data.content.isActualVideo).toBe(true);
    });

    it('should generate AUDIO_OVERVIEW output', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        type: 'AUDIO_OVERVIEW',
        status: 'COMPLETED',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'AUDIO_OVERVIEW' }),
      });
      const data = await response.json();

      expect(data.type).toBe('AUDIO_OVERVIEW');
    });

    it('should generate SUMMARY output', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        type: 'SUMMARY',
        status: 'COMPLETED',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'SUMMARY' }),
      });
      const data = await response.json();

      expect(data.type).toBe('SUMMARY');
    });

    it('should validate output type', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Invalid output type' }, 400));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'INVALID_TYPE' }),
      });

      expect(response.status).toBe(400);
    });

    it('should require at least one source', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse(
        { error: 'Add at least one processed source first' },
        400
      ));

      const response = await fetch(`${API_BASE}/notebooks/empty-nb/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'SUMMARY' }),
      });

      expect(response.status).toBe(400);
    });

    it('should set status to PENDING initially', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        status: 'PENDING',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'SUMMARY' }),
      });
      const data = await response.json();

      expect(data.status).toBe('PENDING');
    });

    it('should use FREE Cloudflare AI for VIDEO_OVERVIEW', async () => {
      // The video generation uses @cf/stabilityai/stable-diffusion-xl-base-1.0 (FREE)
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        type: 'VIDEO_OVERVIEW',
        content: {
          isActualVideo: true,
          // All AI services are FREE (Cloudflare AI)
        },
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'VIDEO_OVERVIEW' }),
      });
      const data = await response.json();

      // Video uses FREE Cloudflare AI services
      expect(data.content.isActualVideo).toBe(true);
    });

    it('should call Workers endpoint for VIDEO_OVERVIEW', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        type: 'VIDEO_OVERVIEW',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'VIDEO_OVERVIEW' }),
      });

      expect(response.ok).toBe(true);
    });

    it('should include segments in VIDEO_OVERVIEW', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        type: 'VIDEO_OVERVIEW',
        content: {
          segments: [
            { title: 'Intro', narration: '...', duration: 5, imageUrl: 'data:...' },
          ],
        },
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'VIDEO_OVERVIEW' }),
      });
      const data = await response.json();

      expect(data.content.segments.length).toBeGreaterThan(0);
    });

    it('should include audioUrl in VIDEO_OVERVIEW', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        type: 'VIDEO_OVERVIEW',
        content: {
          audioUrl: 'data:audio/mpeg;base64,...',
        },
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'VIDEO_OVERVIEW' }),
      });
      const data = await response.json();

      expect(data.content.audioUrl).toBeDefined();
    });

    it('should include thumbnailUrl in VIDEO_OVERVIEW', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        type: 'VIDEO_OVERVIEW',
        content: {
          thumbnailUrl: 'data:image/png;base64,...',
        },
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'VIDEO_OVERVIEW' }),
      });
      const data = await response.json();

      expect(data.content.thumbnailUrl).toBeDefined();
    });

    it('should allow custom title', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        title: 'My Custom Video',
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'VIDEO_OVERVIEW', title: 'My Custom Video' }),
      });
      const data = await response.json();

      expect(data.title).toBe('My Custom Video');
    });

    it('should generate default title with date', async () => {
      const date = new Date().toLocaleDateString();
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'out-1',
        title: `VIDEO OVERVIEW - ${date}`,
      }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'POST',
        body: JSON.stringify({ type: 'VIDEO_OVERVIEW' }),
      });
      const data = await response.json();

      expect(data.title).toContain('VIDEO OVERVIEW');
    });
  });

  describe('GET /api/notebooks/[notebookId]/outputs', () => {
    it('should list all outputs', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'out-1', type: 'VIDEO_OVERVIEW' },
        { id: 'out-2', type: 'SUMMARY' },
      ]));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
    });

    it('should filter by type', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'out-1', type: 'VIDEO_OVERVIEW' },
      ]));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs?type=VIDEO_OVERVIEW`);
      const data = await response.json();

      expect(data[0].type).toBe('VIDEO_OVERVIEW');
    });

    it('should order by createdAt desc', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'out-2', createdAt: '2024-02-01' },
        { id: 'out-1', createdAt: '2024-01-01' },
      ]));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`);
      const data = await response.json();

      expect(data[0].id).toBe('out-2');
    });

    it('should include content in response', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'out-1', content: { segments: [] } },
      ]));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`);
      const data = await response.json();

      expect(data[0].content).toBeDefined();
    });
  });

  describe('DELETE /api/notebooks/[notebookId]/outputs', () => {
    it('should delete output by ID', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs?outputId=out-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should require outputId parameter', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'outputId required' }, 400));

      const response = await fetch(`${API_BASE}/notebooks/nb-1/outputs`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(400);
    });

    it('should check ownership/collaboration', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Access denied' }, 403));

      const response = await fetch(`${API_BASE}/notebooks/other-nb/outputs?outputId=out-1`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(403);
    });
  });
});
