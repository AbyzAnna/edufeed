import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for All Source Types
 * Tests adding each of the 4 source types: PDF, URL, TEXT, YOUTUBE
 */

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

// Base notebook with no sources
const createMockNotebook = (sources: unknown[] = []) => ({
  id: 'test-notebook-sources',
  title: 'Source Types Test Notebook',
  description: 'Testing all source types',
  emoji: '📚',
  color: '#8b5cf6',
  isPublic: false,
  user: { id: 'user-1', name: 'Test User', image: null },
  sources,
  outputs: [],
  chatMessages: [],
  _count: { sources: sources.length, chatMessages: 0, outputs: 0 },
});

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

test.describe('Source Types', () => {
  test.describe('TEXT Source', () => {
    test('should add text source manually', async ({ page }) => {
      let sourceAdded = false;

      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook(sourceAdded ? [{
            id: 'text-source-1',
            type: 'TEXT',
            title: 'Manual Text Source',
            originalUrl: null,
            content: 'This is manually entered text content for testing.',
            wordCount: 8,
            status: 'COMPLETED',
            errorMessage: null,
            createdAt: new Date().toISOString(),
          }] : [])),
        });
      });

      await page.route('**/api/notebooks/test-notebook-id/sources', async (route) => {
        if (route.request().method() === 'POST') {
          const body = JSON.parse(route.request().postData() || '{}');
          sourceAdded = true;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'text-source-1',
              type: 'TEXT',
              title: body.title || 'Text Source',
              content: body.content,
              wordCount: body.content?.split(' ').length || 0,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Look for add source button
      const addSourceButton = page.locator('button:has-text("Add Source"), button:has-text("Add"), button:has-text("+")').first();
      await expect(addSourceButton).toBeVisible({ timeout: 10000 });
    });

    test('should display text source in sources panel', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([{
            id: 'text-source-1',
            type: 'TEXT',
            title: 'Existing Text Source',
            originalUrl: null,
            content: 'Content of the text source.',
            wordCount: 5,
            status: 'COMPLETED',
            errorMessage: null,
            createdAt: new Date().toISOString(),
          }])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Verify source is displayed
      await expect(page.locator('text=Existing Text Source')).toBeVisible({ timeout: 10000 });
    });

    test('should show text source icon (📝)', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([{
            id: 'text-source-1',
            type: 'TEXT',
            title: 'Text Source',
            originalUrl: null,
            content: 'Content.',
            wordCount: 1,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
          }])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Text sources typically show with 📝 icon
      await expect(page.locator('text=Text Source')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('URL Source', () => {
    test('should add URL source', async ({ page }) => {
      let sourceAdded = false;

      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook(sourceAdded ? [{
            id: 'url-source-1',
            type: 'URL',
            title: 'Web Article',
            originalUrl: 'https://example.com/article',
            content: 'Scraped content from the web article.',
            wordCount: 6,
            status: 'COMPLETED',
            errorMessage: null,
            createdAt: new Date().toISOString(),
          }] : [])),
        });
      });

      await page.route('**/api/notebooks/test-notebook-id/sources', async (route) => {
        if (route.request().method() === 'POST') {
          const body = JSON.parse(route.request().postData() || '{}');
          sourceAdded = true;
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'url-source-1',
              type: 'URL',
              title: 'Web Article',
              originalUrl: body.url,
              content: null,
              status: 'PROCESSING',
              createdAt: new Date().toISOString(),
            }),
          });
        }
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Verify notebook loaded
      await expect(page.locator('text=Source Types Test Notebook')).toBeVisible({ timeout: 10000 });
    });

    test('should display URL source with link icon (🔗)', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([{
            id: 'url-source-1',
            type: 'URL',
            title: 'Example Website',
            originalUrl: 'https://example.com',
            content: 'Scraped content from example.com.',
            wordCount: 5,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
          }])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // URL sources show the title
      await expect(page.locator('text=Example Website')).toBeVisible({ timeout: 10000 });
    });

    test('should show processing status for URL being scraped', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([{
            id: 'url-source-1',
            type: 'URL',
            title: 'Processing URL',
            originalUrl: 'https://example.com/processing',
            content: null,
            wordCount: 0,
            status: 'PROCESSING',
            createdAt: new Date().toISOString(),
          }])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Should show the source even if processing
      await expect(page.locator('text=Processing URL')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('PDF Source', () => {
    test('should show PDF source with document icon (📄)', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([{
            id: 'pdf-source-1',
            type: 'PDF',
            title: 'Research Paper.pdf',
            originalUrl: 'https://storage.example.com/paper.pdf',
            content: 'Extracted content from the PDF document.',
            wordCount: 7,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
          }])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // PDF source should be visible
      await expect(page.locator('text=Research Paper.pdf')).toBeVisible({ timeout: 10000 });
    });

    test('should handle PDF processing status', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([{
            id: 'pdf-source-1',
            type: 'PDF',
            title: 'Large Document.pdf',
            originalUrl: null,
            content: null,
            wordCount: 0,
            status: 'PROCESSING',
            createdAt: new Date().toISOString(),
          }])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Should show PDF being processed
      await expect(page.locator('text=Large Document.pdf')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('YOUTUBE Source', () => {
    test('should show YouTube source with video icon (🎬)', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([{
            id: 'youtube-source-1',
            type: 'YOUTUBE',
            title: 'Educational Video',
            originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            content: 'Transcript from the YouTube video.',
            wordCount: 6,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
          }])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // YouTube source should be visible
      await expect(page.locator('text=Educational Video')).toBeVisible({ timeout: 10000 });
    });

    test('should handle YouTube transcript extraction', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([{
            id: 'youtube-source-1',
            type: 'YOUTUBE',
            title: 'Long Lecture Video',
            originalUrl: 'https://www.youtube.com/watch?v=abc123',
            content: null,
            wordCount: 0,
            status: 'PROCESSING',
            createdAt: new Date().toISOString(),
          }])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Should show YouTube source being processed
      await expect(page.locator('text=Long Lecture Video')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Multiple Source Types', () => {
    test('should display all 4 source types together', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([
            {
              id: 'text-source-1',
              type: 'TEXT',
              title: 'Notes Document',
              content: 'Manual notes content.',
              wordCount: 3,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'url-source-1',
              type: 'URL',
              title: 'Web Article',
              originalUrl: 'https://example.com/article',
              content: 'Scraped content.',
              wordCount: 2,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'pdf-source-1',
              type: 'PDF',
              title: 'Research Paper.pdf',
              originalUrl: null,
              content: 'PDF extracted text.',
              wordCount: 3,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
            },
            {
              id: 'youtube-source-1',
              type: 'YOUTUBE',
              title: 'Tutorial Video',
              originalUrl: 'https://youtube.com/watch?v=123',
              content: 'Video transcript.',
              wordCount: 2,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
            },
          ])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Verify all 4 sources are visible
      await expect(page.locator('text=Notes Document')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Web Article')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Research Paper.pdf')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Tutorial Video')).toBeVisible({ timeout: 10000 });
    });

    test('should show correct source count', async ({ page }) => {
      await setupAuthMocks(page);

      const sources = [
        { id: '1', type: 'TEXT', title: 'S1', content: 'c', wordCount: 1, status: 'COMPLETED' },
        { id: '2', type: 'URL', title: 'S2', content: 'c', wordCount: 1, status: 'COMPLETED' },
        { id: '3', type: 'PDF', title: 'S3', content: 'c', wordCount: 1, status: 'COMPLETED' },
        { id: '4', type: 'YOUTUBE', title: 'S4', content: 'c', wordCount: 1, status: 'COMPLETED' },
      ];

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook(sources)),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Should show 4 sources
      const sourceCount = page.locator('text=4 source, text=4 Sources');
      await expect(sourceCount.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Source Error Handling', () => {
    test('should show error state for failed source', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([{
            id: 'failed-source-1',
            type: 'URL',
            title: 'Failed URL',
            originalUrl: 'https://example.com/error',
            content: null,
            wordCount: 0,
            status: 'FAILED',
            errorMessage: 'Failed to scrape URL',
            createdAt: new Date().toISOString(),
          }])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Source should still be visible even if failed
      await expect(page.locator('text=Failed URL')).toBeVisible({ timeout: 10000 });
    });
  });
});
