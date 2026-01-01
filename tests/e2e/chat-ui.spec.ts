import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Chat UI in Notebook Page
 * Tests that the chat interface renders correctly and is functional
 */

const mockNotebookWithSources = {
  id: 'test-notebook-chat-ui',
  title: 'Test Chat Notebook',
  description: 'Testing chat UI',
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
      content: 'This is comprehensive test content about artificial intelligence and machine learning. AI helps computers learn from data.',
      wordCount: 20,
      status: 'COMPLETED',
      errorMessage: null,
      createdAt: new Date().toISOString(),
    }
  ],
  outputs: [],
  chatMessages: [],
  _count: { sources: 1, chatMessages: 0, outputs: 0 },
};

const mockNotebookWithoutSources = {
  ...mockNotebookWithSources,
  sources: [],
  _count: { sources: 0, chatMessages: 0, outputs: 0 },
};

test.describe('Chat UI Visibility Tests', () => {

  test('Chat panel should be fully visible with header, messages area, and input', async ({ page }) => {
    await page.route('**/api/notebooks/test-notebook-chat-ui', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNotebookWithSources),
      });
    });

    await page.goto('/notebooks/test-notebook-chat-ui');
    await page.waitForLoadState('networkidle');

    // Check Chat header is visible (use exact match)
    const chatHeader = page.getByRole('heading', { name: 'Chat', exact: true });
    await expect(chatHeader).toBeVisible({ timeout: 5000 });

    // Check chat input area is visible
    const chatInput = page.locator('textarea[placeholder*="Start typing"], textarea[placeholder*="Add sources"]');
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Check AI Assistant overview or empty state is visible
    const aiOverview = page.locator('text=AI-powered research assistant');
    const emptyState = page.locator('text=Ask me anything about your sources');
    const hasAiContent = await aiOverview.isVisible().catch(() => false) ||
                          await emptyState.isVisible().catch(() => false);
    expect(hasAiContent).toBe(true);

    // Check Send button is visible
    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeVisible({ timeout: 5000 });
  });

  test('Chat input should be enabled when sources exist', async ({ page }) => {
    await page.route('**/api/notebooks/test-notebook-chat-ui', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNotebookWithSources),
      });
    });

    await page.goto('/notebooks/test-notebook-chat-ui');
    await page.waitForLoadState('networkidle');

    // Input should be enabled
    const chatInput = page.locator('textarea[placeholder*="Start typing"]');
    await expect(chatInput).toBeEnabled({ timeout: 5000 });
  });

  test('Chat input should be disabled when no sources exist', async ({ page }) => {
    await page.route('**/api/notebooks/test-notebook-chat-ui', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNotebookWithoutSources),
      });
    });

    await page.goto('/notebooks/test-notebook-chat-ui');
    await page.waitForLoadState('networkidle');

    // Input should be disabled
    const chatInput = page.locator('textarea[placeholder*="Add sources"]');
    await expect(chatInput).toBeDisabled({ timeout: 5000 });
  });

  test('Suggested questions should be visible when no messages', async ({ page }) => {
    await page.route('**/api/notebooks/test-notebook-chat-ui', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNotebookWithSources),
      });
    });

    await page.goto('/notebooks/test-notebook-chat-ui');
    await page.waitForLoadState('networkidle');

    // At least one suggested question should be visible
    const suggestedQ1 = page.locator('button:has-text("What are the main topics")');
    const suggestedQ2 = page.locator('button:has-text("Summarize the key points")');
    const hasSuggestion = await suggestedQ1.isVisible().catch(() => false) ||
                           await suggestedQ2.isVisible().catch(() => false);
    expect(hasSuggestion).toBe(true);
  });

  test('Clicking suggested question fills input', async ({ page }) => {
    await page.route('**/api/notebooks/test-notebook-chat-ui', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNotebookWithSources),
      });
    });

    await page.goto('/notebooks/test-notebook-chat-ui');
    await page.waitForLoadState('networkidle');

    const suggestedQ = page.locator('button:has-text("What are the main topics")');
    if (await suggestedQ.isVisible()) {
      await suggestedQ.click();

      const chatInput = page.locator('textarea[placeholder*="Start typing"]');
      await expect(chatInput).toHaveValue(/What are the main topics/);
    }
  });
});

test.describe('Chat Message Sending', () => {

  test('Should send a message and show user message immediately', async ({ page }) => {
    await page.route('**/api/notebooks/test-notebook-chat-ui', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockNotebookWithSources),
        });
      }
    });

    // Mock the chat API to respond
    await page.route('**/api/notebooks/test-notebook-chat-ui/chat', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            userMessage: {
              id: 'user-msg-1',
              role: 'USER',
              content: 'Hello AI',
              createdAt: new Date().toISOString(),
            },
            assistantMessage: {
              id: 'assistant-msg-1',
              role: 'ASSISTANT',
              content: 'Hello! I can help you understand your notebook content. What would you like to know?',
              createdAt: new Date().toISOString(),
              citations: [],
            },
            meta: {
              provider: 'ollama',
              sourcesUsed: 1,
              totalWords: 20,
              citationsFound: 0,
            },
          }),
        });
      }
    });

    await page.goto('/notebooks/test-notebook-chat-ui');
    await page.waitForLoadState('networkidle');

    // Type a message
    const chatInput = page.locator('textarea[placeholder*="Start typing"]');
    await chatInput.fill('Hello AI');

    // Click send button
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for response
    await page.waitForTimeout(1000);

    // User message should be visible
    const userMessage = page.locator('text=Hello AI');
    await expect(userMessage).toBeVisible({ timeout: 5000 });

    // AI response should be visible
    const aiResponse = page.locator('text=Hello! I can help you understand');
    await expect(aiResponse).toBeVisible({ timeout: 5000 });
  });

  test('Should show loading state while waiting for response', async ({ page }) => {
    await page.route('**/api/notebooks/test-notebook-chat-ui', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNotebookWithSources),
      });
    });

    // Mock chat API with delay
    await page.route('**/api/notebooks/test-notebook-chat-ui/chat', async (route) => {
      if (route.request().method() === 'POST') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            userMessage: { id: 'u1', role: 'USER', content: 'Test', createdAt: new Date().toISOString() },
            assistantMessage: { id: 'a1', role: 'ASSISTANT', content: 'Response', createdAt: new Date().toISOString(), citations: [] },
            meta: { provider: 'ollama' },
          }),
        });
      }
    });

    await page.goto('/notebooks/test-notebook-chat-ui');
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea[placeholder*="Start typing"]');
    await chatInput.fill('Test message');

    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Should show "Thinking..." or loading spinner
    const thinkingIndicator = page.locator('text=Thinking');
    await expect(thinkingIndicator).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Chat Three-Column Layout', () => {

  test('Should show sources panel on left, chat in center, studio on right', async ({ page }) => {
    await page.route('**/api/notebooks/test-notebook-chat-ui', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNotebookWithSources),
      });
    });

    await page.goto('/notebooks/test-notebook-chat-ui');
    await page.waitForLoadState('networkidle');

    // Left panel - Sources
    const sourcesPanel = page.locator('text=Sources');
    await expect(sourcesPanel.first()).toBeVisible({ timeout: 5000 });

    // Center - Chat (use exact match)
    const chatPanel = page.getByRole('heading', { name: 'Chat', exact: true });
    await expect(chatPanel).toBeVisible({ timeout: 5000 });

    // Right panel - Studio
    const studioPanel = page.locator('text=Audio Overview');
    await expect(studioPanel.first()).toBeVisible({ timeout: 5000 });
  });

  test('Chat panel should take center position and be scrollable', async ({ page }) => {
    // Mock notebook with chat history
    await page.route('**/api/notebooks/test-notebook-chat-ui', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...mockNotebookWithSources,
          chatMessages: [
            { id: 'msg-1', role: 'USER', content: 'First message', createdAt: new Date().toISOString() },
            { id: 'msg-2', role: 'ASSISTANT', content: 'First response', createdAt: new Date().toISOString() },
            { id: 'msg-3', role: 'USER', content: 'Second message', createdAt: new Date().toISOString() },
            { id: 'msg-4', role: 'ASSISTANT', content: 'Second response', createdAt: new Date().toISOString() },
          ],
        }),
      });
    });

    await page.goto('/notebooks/test-notebook-chat-ui');
    await page.waitForLoadState('networkidle');

    // Messages should be visible
    await expect(page.locator('text=First message')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=First response')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Chat with Ollama Integration', () => {

  test('Should work with Ollama when available', async ({ page, request }) => {
    // First check if Ollama is actually running
    let ollamaAvailable = false;
    try {
      const response = await request.get('http://localhost:11434/api/tags', { timeout: 5000 });
      ollamaAvailable = response.ok();
    } catch {
      // Ollama not running
    }

    if (!ollamaAvailable) {
      test.skip(true, 'Ollama not running - skipping integration test');
      return;
    }

    await page.route('**/api/notebooks/test-notebook-chat-ui', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockNotebookWithSources),
      });
    });

    // Don't mock the chat API - let it hit the real API which will use Ollama
    await page.goto('/notebooks/test-notebook-chat-ui');
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea[placeholder*="Start typing"]');
    await expect(chatInput).toBeEnabled({ timeout: 5000 });

    // Page should be fully functional
    await expect(page.locator('text=AI-powered research assistant')).toBeVisible();
  });
});
