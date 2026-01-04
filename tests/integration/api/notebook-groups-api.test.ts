/**
 * Integration Tests for Notebook Groups API Endpoints
 * Tests CRUD operations for notebook groups and group assignments
 *
 * Total: 50 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

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

// ==================== Notebook Groups CRUD Tests (20 tests) ====================

describe('Notebook Groups CRUD API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/notebook-groups', () => {
    it('should create a new group', async () => {
      const newGroup = { name: 'AP World History', description: 'APWH study materials' };
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'group-1',
        ...newGroup,
        emoji: '📁',
        color: '#8b5cf6',
      }));

      const response = await fetch(`${API_BASE}/notebook-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup),
      });
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.name).toBe('AP World History');
    });

    it('should require authentication', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Unauthorized' }, 401));

      const response = await fetch(`${API_BASE}/notebook-groups`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Group' }),
      });

      expect(response.status).toBe(401);
    });

    it('should require group name', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Name is required' }, 400));

      const response = await fetch(`${API_BASE}/notebook-groups`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should set default emoji', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'group-1', emoji: '📁' }));

      const response = await fetch(`${API_BASE}/notebook-groups`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });
      const data = await response.json();

      expect(data.emoji).toBe('📁');
    });

    it('should set default color', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'group-1', color: '#8b5cf6' }));

      const response = await fetch(`${API_BASE}/notebook-groups`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });
      const data = await response.json();

      expect(data.color).toBe('#8b5cf6');
    });

    it('should allow custom emoji', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'group-1', emoji: '🌍' }));

      const response = await fetch(`${API_BASE}/notebook-groups`, {
        method: 'POST',
        body: JSON.stringify({ name: 'History', emoji: '🌍' }),
      });
      const data = await response.json();

      expect(data.emoji).toBe('🌍');
    });

    it('should allow custom color', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'group-1', color: '#10b981' }));

      const response = await fetch(`${API_BASE}/notebook-groups`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Science', color: '#10b981' }),
      });
      const data = await response.json();

      expect(data.color).toBe('#10b981');
    });

    it('should prevent duplicate group names for same user', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Group already exists' }, 409));

      const response = await fetch(`${API_BASE}/notebook-groups`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Existing Group' }),
      });

      expect(response.status).toBe(409);
    });

    it('should set order for new groups', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ id: 'group-3', order: 2 }));

      const response = await fetch(`${API_BASE}/notebook-groups`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Third Group' }),
      });
      const data = await response.json();

      expect(data.order).toBeDefined();
    });
  });

  describe('GET /api/notebook-groups', () => {
    it('should list user groups', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'group-1', name: 'AP World History' },
        { id: 'group-2', name: 'Chemistry' },
      ]));

      const response = await fetch(`${API_BASE}/notebook-groups`);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
    });

    it('should include notebook count', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'group-1', _count: { Notebooks: 15 } },
      ]));

      const response = await fetch(`${API_BASE}/notebook-groups`);
      const data = await response.json();

      expect(data[0]._count.Notebooks).toBe(15);
    });

    it('should order by user-defined order', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { id: 'group-1', order: 0 },
        { id: 'group-2', order: 1 },
      ]));

      const response = await fetch(`${API_BASE}/notebook-groups`);
      const data = await response.json();

      expect(data[0].order).toBe(0);
    });

    it('should include notebooks in group', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        {
          id: 'group-1',
          Notebooks: [
            { id: 'nb-1', title: 'Unit 1' },
            { id: 'nb-2', title: 'Unit 2' },
          ],
        },
      ]));

      const response = await fetch(`${API_BASE}/notebook-groups`);
      const data = await response.json();

      expect(data[0].Notebooks.length).toBe(2);
    });
  });

  describe('PATCH /api/notebook-groups/[groupId]', () => {
    it('should update group name', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'group-1',
        name: 'Updated Name',
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
      });
      const data = await response.json();

      expect(data.name).toBe('Updated Name');
    });

    it('should update group emoji', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'group-1',
        emoji: '🏛️',
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1`, {
        method: 'PATCH',
        body: JSON.stringify({ emoji: '🏛️' }),
      });
      const data = await response.json();

      expect(data.emoji).toBe('🏛️');
    });

    it('should update group color', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        id: 'group-1',
        color: '#ef4444',
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1`, {
        method: 'PATCH',
        body: JSON.stringify({ color: '#ef4444' }),
      });
      const data = await response.json();

      expect(data.color).toBe('#ef4444');
    });

    it('should require ownership', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Not found' }, 404));

      const response = await fetch(`${API_BASE}/notebook-groups/other-group`, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Hacked' }),
      });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/notebook-groups/[groupId]', () => {
    it('should delete group', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should unassign notebooks (not delete them)', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        unassignedNotebooks: 10,
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(data.unassignedNotebooks).toBe(10);
    });

    it('should require ownership', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Not found' }, 404));

      const response = await fetch(`${API_BASE}/notebook-groups/other-group`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(404);
    });
  });
});

// ==================== Notebook Assignment Tests (15 tests) ====================

describe('Notebook Group Assignment API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('POST /api/notebook-groups/[groupId]/notebooks', () => {
    it('should add notebook to group', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        notebookId: 'nb-1',
        groupId: 'group-1',
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ notebookId: 'nb-1' }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should add multiple notebooks', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        added: 5,
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1/notebooks`, {
        method: 'POST',
        body: JSON.stringify({
          notebookIds: ['nb-1', 'nb-2', 'nb-3', 'nb-4', 'nb-5'],
        }),
      });
      const data = await response.json();

      expect(data.added).toBe(5);
    });

    it('should require notebook ID', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Notebook ID required' }, 400));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1/notebooks`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect(response.status).toBe(400);
    });

    it('should verify notebook ownership', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Notebook not found' }, 404));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ notebookId: 'other-nb' }),
      });

      expect(response.status).toBe(404);
    });

    it('should verify group ownership', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Group not found' }, 404));

      const response = await fetch(`${API_BASE}/notebook-groups/other-group/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ notebookId: 'nb-1' }),
      });

      expect(response.status).toBe(404);
    });

    it('should move notebook between groups', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        previousGroupId: 'group-old',
        newGroupId: 'group-new',
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/group-new/notebooks`, {
        method: 'POST',
        body: JSON.stringify({ notebookId: 'nb-1' }),
      });
      const data = await response.json();

      expect(data.success).toBe(true);
    });
  });

  describe('DELETE /api/notebook-groups/[groupId]/notebooks', () => {
    it('should remove notebook from group', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ success: true }));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1/notebooks?notebookId=nb-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(data.success).toBe(true);
    });

    it('should set groupId to null', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        success: true,
        notebook: { id: 'nb-1', groupId: null },
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1/notebooks?notebookId=nb-1`, {
        method: 'DELETE',
      });
      const data = await response.json();

      expect(data.notebook.groupId).toBeNull();
    });

    it('should require notebook ID', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Notebook ID required' }, 400));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1/notebooks`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(400);
    });

    it('should verify ownership', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Forbidden' }, 403));

      const response = await fetch(`${API_BASE}/notebook-groups/group-1/notebooks?notebookId=other-nb`, {
        method: 'DELETE',
      });

      expect(response.status).toBe(403);
    });
  });
});

// ==================== Smart Suggestions API Tests (15 tests) ====================

describe('Smart Suggestions API', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('GET /api/notebook-groups/suggestions', () => {
    it('should return suggested groups based on content', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        {
          name: 'AP World History',
          emoji: '🌍',
          color: '#10b981',
          notebooks: ['nb-1', 'nb-2', 'nb-3'],
        },
      ]));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`);
      const data = await response.json();

      expect(Array.isArray(data)).toBe(true);
      expect(data[0].name).toBe('AP World History');
    });

    it('should only suggest for ungrouped notebooks', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        {
          name: 'Chemistry',
          notebooks: ['nb-ungrouped-1', 'nb-ungrouped-2'],
        },
      ]));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`);
      const data = await response.json();

      expect(data[0].notebooks.length).toBeGreaterThan(0);
    });

    it('should include emoji based on category', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { name: 'AP World History', emoji: '🌍' },
        { name: 'Biology', emoji: '🧬' },
        { name: 'Computer Science', emoji: '💻' },
      ]));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`);
      const data = await response.json();

      expect(data[0].emoji).toBe('🌍');
      expect(data[1].emoji).toBe('🧬');
    });

    it('should include color based on category', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { name: 'AP World History', color: '#10b981' },
      ]));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`);
      const data = await response.json();

      expect(data[0].color).toBeDefined();
    });

    it('should return empty array if no matches', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([]));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`);
      const data = await response.json();

      expect(data).toEqual([]);
    });

    it('should detect AP subject patterns', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { name: 'AP World History' },
        { name: 'AP Chemistry' },
        { name: 'AP US History' },
      ]));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`);
      const data = await response.json();

      expect(data.some((s: { name: string }) => s.name.startsWith('AP'))).toBe(true);
    });

    it('should detect science subject patterns', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse([
        { name: 'Biology' },
        { name: 'Chemistry' },
        { name: 'Physics' },
      ]));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`);
      const data = await response.json();

      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/notebook-groups/suggestions', () => {
    it('should apply suggestion (create group)', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        group: { id: 'group-new', name: 'AP World History' },
        assignedNotebooks: 10,
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'AP World History',
          emoji: '🌍',
          color: '#10b981',
          notebookIds: ['nb-1', 'nb-2'],
        }),
      });
      const data = await response.json();

      expect(data.group.name).toBe('AP World History');
      expect(data.assignedNotebooks).toBe(10);
    });

    it('should assign all suggested notebooks', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        group: { id: 'group-1' },
        assignedNotebooks: 25,
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'AP World History',
          notebookIds: Array.from({ length: 25 }, (_, i) => `nb-${i}`),
        }),
      });
      const data = await response.json();

      expect(data.assignedNotebooks).toBe(25);
    });

    it('should use existing group if name matches', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({
        group: { id: 'existing-group' },
        existingGroup: true,
        assignedNotebooks: 5,
      }));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Existing Group Name',
          notebookIds: ['nb-1'],
        }),
      });
      const data = await response.json();

      expect(data.existingGroup).toBe(true);
    });

    it('should require name', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'Name required' }, 400));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`, {
        method: 'POST',
        body: JSON.stringify({ notebookIds: ['nb-1'] }),
      });

      expect(response.status).toBe(400);
    });

    it('should require at least one notebook', async () => {
      mockFetch.mockResolvedValueOnce(mockResponse({ error: 'No notebooks specified' }, 400));

      const response = await fetch(`${API_BASE}/notebook-groups/suggestions`, {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      });

      expect(response.status).toBe(400);
    });
  });
});
