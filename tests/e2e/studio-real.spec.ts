import { test, expect } from '@playwright/test';

/**
 * Real E2E tests for Studio Panel - running against actual server
 * These tests require a running server and valid test data
 */

// Skip tests that need auth since we don't have test users set up
test.describe.skip('Studio Panel - Real Server Tests', () => {

  test('should click on Flashcards button and trigger generation', async ({ page }) => {
    // Login first (assuming test user exists)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'testpass123');
    await page.click('button[type="submit"]');

    // Navigate to notebooks
    await page.waitForURL('**/notebooks**', { timeout: 15000 });

    // Click on first notebook (or create one)
    const notebookCard = page.locator('[data-testid="notebook-card"], .notebook-card').first();
    if (await notebookCard.isVisible({ timeout: 3000 })) {
      await notebookCard.click();
    }

    // Wait for notebook page
    await page.waitForURL('**/notebooks/**');

    // Find Flashcards button
    const flashcardsBtn = page.locator('button:has-text("Flashcards")');
    await expect(flashcardsBtn).toBeVisible({ timeout: 10000 });

    // Check if button is enabled (has sources)
    const isDisabled = await flashcardsBtn.isDisabled();
    console.log('Flashcards button disabled:', isDisabled);

    if (!isDisabled) {
      // Click it
      await flashcardsBtn.click();

      // Should show loading state
      await expect(flashcardsBtn).toHaveClass(/animate-pulse/, { timeout: 2000 });
    }
  });
});

test.describe('Studio Panel - Debug Tests (Mocked)', () => {

  test('Debug: Check button click propagation', async ({ page }) => {
    // Setup console log capture
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Mock the notebook API
    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-notebook-id',
          title: 'Test Notebook',
          description: 'Test',
          emoji: '📚',
          color: '#8b5cf6',
          isPublic: false,
          user: { id: 'user-1', name: 'Test User', image: null },
          sources: [
            {
              id: 'source-1',
              type: 'TEXT',
              title: 'Test Source',
              originalUrl: null,
              content: 'This is test content.',
              wordCount: 5,
              status: 'COMPLETED',
              errorMessage: null,
              createdAt: new Date().toISOString(),
            }
          ],
          outputs: [],
          chatMessages: [],
          _count: { sources: 1, chatMessages: 0, outputs: 0 },
        }),
      });
    });

    let postCalled = false;
    let postBody: unknown = null;

    await page.route('**/api/notebooks/test-notebook-id/outputs', async (route) => {
      if (route.request().method() === 'POST') {
        postCalled = true;
        postBody = JSON.parse(route.request().postData() || '{}');
        console.log('POST to outputs:', postBody);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'output-1',
            type: (postBody as {type?: string})?.type || 'FLASHCARD_DECK',
            title: 'Generated',
            content: { cards: [{ front: 'Q', back: 'A' }] },
            audioUrl: null,
            status: 'COMPLETED',
            createdAt: new Date().toISOString(),
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    // Navigate
    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // Debug: Check button state
    const flashcardsBtn = page.locator('button:has-text("Flashcards")');
    await expect(flashcardsBtn).toBeVisible();

    const isEnabled = await flashcardsBtn.isEnabled();
    console.log('Button enabled:', isEnabled);

    const classList = await flashcardsBtn.getAttribute('class');
    console.log('Button class:', classList);

    // Click using different methods to debug
    console.log('Attempting click...');

    // Method 1: Direct click
    await flashcardsBtn.click();
    await page.waitForTimeout(1000);

    console.log('POST called after click:', postCalled);
    console.log('POST body:', postBody);

    expect(postCalled).toBe(true);
  });

  test('Debug: Check if disabled state is correct', async ({ page }) => {
    // Test with NO sources - buttons should be disabled
    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-notebook-id',
          title: 'Test Notebook',
          description: 'Test',
          emoji: '📚',
          color: '#8b5cf6',
          isPublic: false,
          user: { id: 'user-1', name: 'Test User', image: null },
          sources: [], // NO sources
          outputs: [],
          chatMessages: [],
          _count: { sources: 0, chatMessages: 0, outputs: 0 },
        }),
      });
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    const flashcardsBtn = page.locator('button:has-text("Flashcards")');
    await expect(flashcardsBtn).toBeVisible();

    // Button SHOULD be disabled
    await expect(flashcardsBtn).toBeDisabled();

    // Text should say "Add sources to generate content"
    await expect(page.locator('text=Add sources to generate content')).toBeVisible();
  });

  test('Debug: Check with PROCESSING source (not COMPLETED)', async ({ page }) => {
    // Test with source in PROCESSING state - buttons should still be disabled
    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-notebook-id',
          title: 'Test Notebook',
          description: 'Test',
          emoji: '📚',
          color: '#8b5cf6',
          isPublic: false,
          user: { id: 'user-1', name: 'Test User', image: null },
          sources: [
            {
              id: 'source-1',
              type: 'TEXT',
              title: 'Processing Source',
              originalUrl: null,
              content: null,
              wordCount: null,
              status: 'PROCESSING', // Not COMPLETED!
              errorMessage: null,
              createdAt: new Date().toISOString(),
            }
          ],
          outputs: [],
          chatMessages: [],
          _count: { sources: 1, chatMessages: 0, outputs: 0 },
        }),
      });
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    const flashcardsBtn = page.locator('button:has-text("Flashcards")');
    await expect(flashcardsBtn).toBeVisible();

    // Button SHOULD be disabled because source is not COMPLETED
    await expect(flashcardsBtn).toBeDisabled();
  });

  test('Debug: Verify all 6 buttons have correct labels', async ({ page }) => {
    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-notebook-id',
          title: 'Test Notebook',
          description: 'Test',
          emoji: '📚',
          color: '#8b5cf6',
          isPublic: false,
          user: { id: 'user-1', name: 'Test User', image: null },
          sources: [{ id: 's1', type: 'TEXT', title: 'Test', originalUrl: null, content: 'Test', wordCount: 1, status: 'COMPLETED', errorMessage: null, createdAt: new Date().toISOString() }],
          outputs: [],
          chatMessages: [],
          _count: { sources: 1, chatMessages: 0, outputs: 0 },
        }),
      });
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // Check all 6 buttons exist and are enabled
    const expectedButtons = [
      'Audio Overview',
      'Video Overview',
      'Mind Map',
      'Reports',
      'Flashcards',
      'Quiz',
    ];

    for (const label of expectedButtons) {
      const button = page.locator(`button:has-text("${label}")`);
      await expect(button).toBeVisible({ timeout: 5000 });
      await expect(button).toBeEnabled();
    }
  });
});
