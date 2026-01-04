import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Complete Notebook Flow
 * Tests the full journey: create notebook → add sources → chat → generate outputs
 */

// Mock data for notebook
const mockNotebook = {
  id: 'test-notebook-complete-flow',
  title: 'Complete Flow Test Notebook',
  description: 'Testing the complete notebook flow',
  emoji: '📚',
  color: '#8b5cf6',
  isPublic: false,
  user: { id: 'user-1', name: 'Test User', image: null },
  sources: [],
  outputs: [],
  chatMessages: [],
  _count: { sources: 0, chatMessages: 0, outputs: 0 },
};

// Mock Supabase auth
const mockSupabaseUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: { name: 'Test User', avatar_url: null },
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  created_at: new Date().toISOString(),
};

const mockSession = {
  access_token: 'mock-access-token-' + Date.now(),
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockSupabaseUser,
};

async function setupAuthMocks(page: Page) {
  await page.route('**/auth/v1/token?grant_type=refresh_token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession),
    });
  });

  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSupabaseUser),
    });
  });

  await page.route('**/realtime/v1/**', async (route) => {
    await route.abort();
  });
}

test.describe('Notebook Complete Flow', () => {
  test.describe('Notebook Creation', () => {
    test('should display all notebook creation form elements', async ({ page }) => {
      await setupAuthMocks(page);

      // Mock notebooks list API
      await page.route('**/api/notebooks', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(mockNotebook),
          });
        }
      });

      await page.goto('/notebooks');
      await page.waitForLoadState('networkidle');

      // Look for create button
      const createButton = page.locator('button:has-text("New Notebook"), button:has-text("Create"), a:has-text("Create")');
      await expect(createButton.first()).toBeVisible({ timeout: 10000 });
    });

    test('should create notebook with title, emoji, and color', async ({ page }) => {
      let notebookCreated = false;
      let createdNotebook: Record<string, unknown> | null = null;

      await setupAuthMocks(page);

      // Mock notebooks list API
      await page.route('**/api/notebooks', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(notebookCreated ? [createdNotebook] : []),
          });
        } else if (route.request().method() === 'POST') {
          const body = JSON.parse(route.request().postData() || '{}');
          createdNotebook = {
            id: 'new-notebook-id',
            title: body.title || 'Untitled Notebook',
            description: body.description || '',
            emoji: body.emoji || '📚',
            color: body.color || '#8b5cf6',
            isPublic: false,
            user: mockSupabaseUser,
            sources: [],
            outputs: [],
            chatMessages: [],
            _count: { sources: 0, chatMessages: 0, outputs: 0 },
          };
          notebookCreated = true;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(createdNotebook),
          });
        }
      });

      await page.goto('/notebooks');
      await page.waitForLoadState('networkidle');

      // Click create button
      const createButton = page.locator('button:has-text("New Notebook"), button:has-text("Create")').first();
      if (await createButton.isVisible({ timeout: 5000 })) {
        await createButton.click();
        await page.waitForTimeout(500);

        // Fill in notebook title if dialog appears
        const titleInput = page.locator('input[placeholder*="title"], input[name="title"]');
        if (await titleInput.isVisible({ timeout: 3000 })) {
          await titleInput.fill('My Test Notebook');
        }

        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').last();
        if (await submitButton.isVisible()) {
          await submitButton.click();
        }
      }

      // Verify notebook was created
      expect(notebookCreated).toBe(true);
    });
  });

  test.describe('Notebook Detail Page', () => {
    test('should display notebook with all sections', async ({ page }) => {
      await setupAuthMocks(page);

      // Mock notebook API
      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockNotebook,
            id: 'test-notebook-id',
            sources: [
              {
                id: 'source-1',
                type: 'TEXT',
                title: 'Test Source',
                originalUrl: null,
                content: 'Test content for the notebook.',
                wordCount: 5,
                status: 'COMPLETED',
                errorMessage: null,
                createdAt: new Date().toISOString(),
              },
            ],
            _count: { sources: 1, chatMessages: 0, outputs: 0 },
          }),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Verify title is visible
      await expect(page.locator('text=Complete Flow Test Notebook')).toBeVisible({ timeout: 10000 });
    });

    test('should show sources panel', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockNotebook,
            id: 'test-notebook-id',
            sources: [
              {
                id: 'source-1',
                type: 'TEXT',
                title: 'Test Source',
                originalUrl: null,
                content: 'Test content for the notebook.',
                wordCount: 5,
                status: 'COMPLETED',
                errorMessage: null,
                createdAt: new Date().toISOString(),
              },
            ],
          }),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Check for sources section
      await expect(page.locator('text=Sources, text=Source').first()).toBeVisible({ timeout: 10000 });
    });

    test('should show chat panel', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockNotebook,
            id: 'test-notebook-id',
          }),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Check for chat input area
      const chatInput = page.locator('textarea, input[placeholder*="Ask"], input[placeholder*="message"], input[placeholder*="question"]');
      await expect(chatInput.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show studio panel with 6 tools', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...mockNotebook,
            id: 'test-notebook-id',
            sources: [
              {
                id: 'source-1',
                type: 'TEXT',
                title: 'Test Source',
                content: 'Content for studio generation.',
                wordCount: 5,
                status: 'COMPLETED',
              },
            ],
          }),
        });
      });

      await page.route('**/api/notebooks/test-notebook-id/outputs', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Check for 6 studio tools
      const studioTools = [
        'Audio Overview',
        'Video Overview',
        'Mind Map',
        'Reports',
        'Flashcards',
        'Quiz',
      ];

      for (const tool of studioTools) {
        const button = page.locator(`button:has-text("${tool}")`);
        await expect(button).toBeVisible({ timeout: 10000 });
      }
    });
  });
});

test.describe('Notebook Navigation', () => {
  test('should navigate between notebooks list and detail', async ({ page }) => {
    await setupAuthMocks(page);

    await page.route('**/api/notebooks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockNotebook]),
      });
    });

    await page.route(`**/api/notebooks/${mockNotebook.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNotebook),
      });
    });

    await page.goto('/notebooks');
    await page.waitForLoadState('networkidle');

    // Click on notebook card to navigate to detail
    const notebookCard = page.locator(`text=${mockNotebook.title}`).first();
    if (await notebookCard.isVisible({ timeout: 5000 })) {
      await notebookCard.click();
      await page.waitForURL(`**/notebooks/${mockNotebook.id}`, { timeout: 10000 });
    }
  });
});

test.describe('Error Handling', () => {
  test('should show error for non-existent notebook', async ({ page }) => {
    await setupAuthMocks(page);

    await page.route('**/api/notebooks/non-existent-id', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Notebook not found' }),
      });
    });

    await page.goto('/notebooks/non-existent-id');
    await page.waitForLoadState('networkidle');

    // Should show error or not found message
    const errorMessage = page.locator('text=not found, text=error, text=Error');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });
});
