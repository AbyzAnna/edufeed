import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Studio Panel functionality
 * Tests the 6 studio tools: Audio Overview, Video Overview, Mind Map, Reports, Flashcards, Quiz
 */

// Test configuration
const TEST_BASE_URL = 'http://localhost:3000';
const TEST_NOTEBOOK_ID = 'test-notebook'; // Will be created dynamically

// Studio tool types for testing
const STUDIO_TOOLS = [
  { type: 'AUDIO_OVERVIEW', label: 'Audio Overview', dataTestId: 'studio-tool-AUDIO_OVERVIEW' },
  { type: 'VIDEO_OVERVIEW', label: 'Video Overview', dataTestId: 'studio-tool-VIDEO_OVERVIEW' },
  { type: 'MIND_MAP', label: 'Mind Map', dataTestId: 'studio-tool-MIND_MAP' },
  { type: 'SUMMARY', label: 'Reports', dataTestId: 'studio-tool-SUMMARY' },
  { type: 'FLASHCARD_DECK', label: 'Flashcards', dataTestId: 'studio-tool-FLASHCARD_DECK' },
  { type: 'QUIZ', label: 'Quiz', dataTestId: 'studio-tool-QUIZ' },
];

test.describe('Studio Panel - Tool Buttons', () => {

  test.describe('Button Visibility and State', () => {

    test('should display all 6 studio tool buttons', async ({ page }) => {
      // Mock the notebook API response with sources
      await page.route('**/api/notebooks/**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'test-notebook-id',
              title: 'Test Notebook',
              description: 'Test description',
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
                  content: 'This is test content for the source.',
                  wordCount: 10,
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
        } else {
          await route.continue();
        }
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Check all 6 buttons are visible
      for (const tool of STUDIO_TOOLS) {
        const button = page.locator(`button:has-text("${tool.label}")`);
        await expect(button).toBeVisible({ timeout: 5000 });
      }
    });

    test('should have buttons disabled when no sources exist', async ({ page }) => {
      // Mock notebook with no sources
      await page.route('**/api/notebooks/**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'test-notebook-id',
              title: 'Test Notebook',
              description: 'Test description',
              emoji: '📚',
              color: '#8b5cf6',
              isPublic: false,
              user: { id: 'user-1', name: 'Test User', image: null },
              sources: [],
              outputs: [],
              chatMessages: [],
              _count: { sources: 0, chatMessages: 0, outputs: 0 },
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // All buttons should be disabled
      for (const tool of STUDIO_TOOLS) {
        const button = page.locator(`button:has-text("${tool.label}")`);
        await expect(button).toBeVisible({ timeout: 5000 });
        await expect(button).toBeDisabled();
      }
    });

    test('should have buttons enabled when sources exist', async ({ page }) => {
      // Mock notebook with completed sources
      await page.route('**/api/notebooks/**', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'test-notebook-id',
              title: 'Test Notebook',
              description: 'Test description',
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
                  content: 'This is test content for the source.',
                  wordCount: 10,
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
        } else {
          await route.continue();
        }
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // All buttons should be enabled
      for (const tool of STUDIO_TOOLS) {
        const button = page.locator(`button:has-text("${tool.label}")`);
        await expect(button).toBeVisible({ timeout: 5000 });
        await expect(button).toBeEnabled();
      }
    });
  });

  test.describe('Button Click Functionality', () => {

    test('Flashcards button should be clickable and trigger API call', async ({ page }) => {
      let apiCalled = false;
      let requestBody: Record<string, unknown> | null = null;

      // Mock the notebook API
      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-notebook-id',
            title: 'Test Notebook',
            description: 'Test description',
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
                content: 'This is test content for generating flashcards.',
                wordCount: 10,
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

      // Mock the outputs API
      await page.route('**/api/notebooks/test-notebook-id/outputs', async (route) => {
        if (route.request().method() === 'POST') {
          apiCalled = true;
          requestBody = JSON.parse(route.request().postData() || '{}');

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'output-1',
              type: 'FLASHCARD_DECK',
              title: 'Flashcards',
              content: {
                cards: [
                  { front: 'Question 1', back: 'Answer 1', hint: 'Hint 1' },
                  { front: 'Question 2', back: 'Answer 2', hint: 'Hint 2' },
                ]
              },
              audioUrl: null,
              status: 'COMPLETED',
              createdAt: new Date().toISOString(),
            }),
          });
        } else if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Find and click the Flashcards button
      const flashcardsButton = page.locator('button:has-text("Flashcards")');
      await expect(flashcardsButton).toBeVisible({ timeout: 5000 });
      await expect(flashcardsButton).toBeEnabled();

      // Click the button
      await flashcardsButton.click();

      // Wait for API to be called
      await page.waitForTimeout(1000);

      // Verify API was called
      expect(apiCalled).toBe(true);
      expect(requestBody).toBeTruthy();
      expect(requestBody?.type).toBe('FLASHCARD_DECK');
    });

    test('All 6 studio tools should be clickable', async ({ page }) => {
      const apiCalls: string[] = [];

      // Mock the notebook API
      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-notebook-id',
            title: 'Test Notebook',
            description: 'Test description',
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
                content: 'This is comprehensive test content for all studio tools.',
                wordCount: 50,
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

      // Mock the outputs API for all types
      await page.route('**/api/notebooks/test-notebook-id/outputs', async (route) => {
        if (route.request().method() === 'POST') {
          const body = JSON.parse(route.request().postData() || '{}');
          apiCalls.push(body.type);

          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: `output-${apiCalls.length}`,
              type: body.type,
              title: `${body.type} Output`,
              content: {},
              audioUrl: null,
              status: 'PROCESSING',
              createdAt: new Date().toISOString(),
            }),
          });
        } else if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Test each studio tool button
      for (const tool of STUDIO_TOOLS) {
        const button = page.locator(`button:has-text("${tool.label}")`);
        await expect(button).toBeVisible({ timeout: 5000 });
        await expect(button).toBeEnabled();

        // Click and wait for the button to become enabled again
        await button.click();

        // Wait a bit for the API call
        await page.waitForTimeout(500);
      }

      // Verify all API calls were made
      expect(apiCalls.length).toBe(6);
      expect(apiCalls).toContain('AUDIO_OVERVIEW');
      expect(apiCalls).toContain('VIDEO_OVERVIEW');
      expect(apiCalls).toContain('MIND_MAP');
      expect(apiCalls).toContain('SUMMARY');
      expect(apiCalls).toContain('FLASHCARD_DECK');
      expect(apiCalls).toContain('QUIZ');
    });
  });

  test.describe('Generated Output Cards', () => {

    test('clicking on generated Flashcards card should open viewer modal', async ({ page }) => {
      // Mock the notebook API with existing output
      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-notebook-id',
            title: 'Test Notebook',
            description: 'Test description',
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
                content: 'Test content.',
                wordCount: 10,
                status: 'COMPLETED',
                errorMessage: null,
                createdAt: new Date().toISOString(),
              }
            ],
            outputs: [
              {
                id: 'output-flashcard-1',
                type: 'FLASHCARD_DECK',
                title: 'My Flashcards',
                content: {
                  cards: [
                    { front: 'What is React?', back: 'A JavaScript library for building UIs', hint: 'Facebook' },
                    { front: 'What is TypeScript?', back: 'A typed superset of JavaScript', hint: 'Microsoft' },
                    { front: 'What is Next.js?', back: 'A React framework for production', hint: 'Vercel' },
                  ]
                },
                audioUrl: null,
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
              }
            ],
            chatMessages: [],
            _count: { sources: 1, chatMessages: 0, outputs: 1 },
          }),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Find and click the flashcard output card
      const flashcardCard = page.locator('text=My Flashcards').first();
      await expect(flashcardCard).toBeVisible({ timeout: 5000 });
      await flashcardCard.click();

      // Verify the modal opens
      const modal = page.locator('[role="dialog"], .fixed.inset-0');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Verify flashcard content is visible
      await expect(page.locator('text=What is React?')).toBeVisible({ timeout: 5000 });
    });

    test('clicking on generated Quiz card should open viewer modal', async ({ page }) => {
      // Mock the notebook API with quiz output
      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-notebook-id',
            title: 'Test Notebook',
            description: 'Test description',
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
                content: 'Test content.',
                wordCount: 10,
                status: 'COMPLETED',
                errorMessage: null,
                createdAt: new Date().toISOString(),
              }
            ],
            outputs: [
              {
                id: 'output-quiz-1',
                type: 'QUIZ',
                title: 'Test Quiz',
                content: {
                  questions: [
                    {
                      type: 'MCQ',
                      question: 'What programming language is TypeScript based on?',
                      options: ['Python', 'JavaScript', 'Java', 'C++'],
                      correctAnswer: 'JavaScript',
                      explanation: 'TypeScript is a typed superset of JavaScript.',
                    },
                  ]
                },
                audioUrl: null,
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
              }
            ],
            chatMessages: [],
            _count: { sources: 1, chatMessages: 0, outputs: 1 },
          }),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Find and click the quiz output card
      const quizCard = page.locator('text=Test Quiz').first();
      await expect(quizCard).toBeVisible({ timeout: 5000 });
      await quizCard.click();

      // Verify the modal opens
      const modal = page.locator('[role="dialog"], .fixed.inset-0');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Verify quiz content is visible
      await expect(page.locator('text=What programming language is TypeScript based on?')).toBeVisible({ timeout: 5000 });
    });

    test('clicking on Mind Map output should open its modal', async ({ page }) => {
      // Mock the notebook API with mind map output
      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-notebook-id',
            title: 'Test Notebook',
            description: 'Test description',
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
                content: 'Test content.',
                wordCount: 10,
                status: 'COMPLETED',
                errorMessage: null,
                createdAt: new Date().toISOString(),
              }
            ],
            outputs: [
              {
                id: 'output-mindmap-1',
                type: 'MIND_MAP',
                title: 'Mind Map Test',
                content: { centralTopic: 'Main Topic', branches: [{ topic: 'Branch 1', subtopics: ['Sub 1'] }] },
                audioUrl: null,
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
              }
            ],
            chatMessages: [],
            _count: { sources: 1, chatMessages: 0, outputs: 1 },
          }),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Find and click the mind map output card
      const card = page.locator('[data-testid="output-card-MIND_MAP"]');
      await expect(card).toBeVisible({ timeout: 5000 });
      await card.click();

      // Verify modal opens
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Verify mind map content is visible (use exact match to avoid matching the suggested question button)
      await expect(page.getByText('Main Topic', { exact: true })).toBeVisible({ timeout: 5000 });
    });

    test('clicking on Summary output should open its modal', async ({ page }) => {
      // Mock the notebook API with summary output
      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-notebook-id',
            title: 'Test Notebook',
            description: 'Test description',
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
                content: 'Test content.',
                wordCount: 10,
                status: 'COMPLETED',
                errorMessage: null,
                createdAt: new Date().toISOString(),
              }
            ],
            outputs: [
              {
                id: 'output-summary-1',
                type: 'SUMMARY',
                title: 'Summary Report',
                content: { summary: 'This is a test summary with key information.', keyPoints: ['Point 1', 'Point 2'] },
                audioUrl: null,
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
              }
            ],
            chatMessages: [],
            _count: { sources: 1, chatMessages: 0, outputs: 1 },
          }),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Find and click the summary output card
      const card = page.locator('[data-testid="output-card-SUMMARY"]');
      await expect(card).toBeVisible({ timeout: 5000 });
      await card.click();

      // Verify modal opens
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Verify summary content is visible
      await expect(page.locator('text=This is a test summary')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Flashcard Viewer Interactions', () => {

    test('should flip flashcard on click', async ({ page }) => {
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
            sources: [{ id: 'source-1', type: 'TEXT', title: 'Test', originalUrl: null, content: 'Test', wordCount: 1, status: 'COMPLETED', errorMessage: null, createdAt: new Date().toISOString() }],
            outputs: [
              {
                id: 'output-flashcard-1',
                type: 'FLASHCARD_DECK',
                title: 'Flashcards',
                content: {
                  cards: [
                    { front: 'Front Side Question', back: 'Back Side Answer', hint: 'Hint text' },
                  ]
                },
                audioUrl: null,
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
              }
            ],
            chatMessages: [],
            _count: { sources: 1, chatMessages: 0, outputs: 1 },
          }),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click the flashcard card to open modal using data-testid
      const flashcardCard = page.locator('[data-testid="output-card-FLASHCARD_DECK"]');
      await expect(flashcardCard).toBeVisible({ timeout: 5000 });
      await flashcardCard.click();
      await page.waitForTimeout(600);

      // Verify modal opened
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Verify front side is visible (look for text within the modal)
      await expect(page.locator('.fixed.inset-0.z-50 >> text=Front Side Question')).toBeVisible({ timeout: 5000 });

      // Click the flashcard to flip it
      const flashcardElement = page.locator('.fixed.inset-0.z-50 >> .cursor-pointer').first();
      if (await flashcardElement.isVisible()) {
        await flashcardElement.click();
        await page.waitForTimeout(600); // Wait for flip animation

        // Verify back side is now visible
        await expect(page.locator('.fixed.inset-0.z-50 >> text=Back Side Answer')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should navigate between flashcards', async ({ page }) => {
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
            sources: [{ id: 'source-1', type: 'TEXT', title: 'Test', originalUrl: null, content: 'Test', wordCount: 1, status: 'COMPLETED', errorMessage: null, createdAt: new Date().toISOString() }],
            outputs: [
              {
                id: 'output-flashcard-1',
                type: 'FLASHCARD_DECK',
                title: 'Flashcards',
                content: {
                  cards: [
                    { front: 'Card 1 Front', back: 'Card 1 Back', hint: 'Hint 1' },
                    { front: 'Card 2 Front', back: 'Card 2 Back', hint: 'Hint 2' },
                    { front: 'Card 3 Front', back: 'Card 3 Back', hint: 'Hint 3' },
                  ]
                },
                audioUrl: null,
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
              }
            ],
            chatMessages: [],
            _count: { sources: 1, chatMessages: 0, outputs: 1 },
          }),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open flashcard modal using data-testid
      const flashcardCard = page.locator('[data-testid="output-card-FLASHCARD_DECK"]');
      await expect(flashcardCard).toBeVisible({ timeout: 5000 });
      await flashcardCard.click();
      await page.waitForTimeout(600);

      // Verify modal opened
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Verify first card is visible in modal
      await expect(page.locator('.fixed.inset-0.z-50 >> text=Card 1 Front')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.fixed.inset-0.z-50 >> text=Card 1 of 3')).toBeVisible();

      // The navigation buttons are in a row. Find the "Mark as Mastered" button and click its next sibling
      const masteredButton = page.locator('.fixed.inset-0.z-50 >> button:has-text("Mark as Mastered")');
      await expect(masteredButton).toBeVisible({ timeout: 5000 });

      // Get parent element and find the next enabled button after mastered
      const controlsContainer = masteredButton.locator('..'); // parent
      const nextButton = controlsContainer.locator('button:not([disabled])').last();

      await nextButton.click();
      await page.waitForTimeout(500);

      // Verify second card is now visible
      await expect(page.locator('.fixed.inset-0.z-50 >> text=Card 2 Front')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.fixed.inset-0.z-50 >> text=Card 2 of 3')).toBeVisible();
    });
  });

  test.describe('Quiz Viewer Interactions', () => {

    test('should allow selecting quiz answers', async ({ page }) => {
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
            sources: [{ id: 'source-1', type: 'TEXT', title: 'Test', originalUrl: null, content: 'Test', wordCount: 1, status: 'COMPLETED', errorMessage: null, createdAt: new Date().toISOString() }],
            outputs: [
              {
                id: 'output-quiz-1',
                type: 'QUIZ',
                title: 'Test Quiz',
                content: {
                  questions: [
                    {
                      type: 'MCQ',
                      question: 'What is 2 + 2?',
                      options: ['3', '4', '5', '6'],
                      correctAnswer: '4',
                      explanation: '2 + 2 equals 4.',
                    },
                  ]
                },
                audioUrl: null,
                status: 'COMPLETED',
                createdAt: new Date().toISOString(),
              }
            ],
            chatMessages: [],
            _count: { sources: 1, chatMessages: 0, outputs: 1 },
          }),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open quiz modal
      await page.locator('text=Test Quiz').first().click();
      await page.waitForTimeout(500);

      // Verify question is visible
      await expect(page.locator('text=What is 2 + 2?')).toBeVisible({ timeout: 5000 });

      // Click correct answer
      const correctOption = page.locator('button:has-text("4")');
      await expect(correctOption).toBeVisible();
      await correctOption.click();

      // Verify explanation appears
      await expect(page.locator('text=2 + 2 equals 4')).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('Studio Panel - Edge Cases', () => {

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock notebook API success
    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      if (route.request().method() === 'GET') {
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
            sources: [{ id: 'source-1', type: 'TEXT', title: 'Test', originalUrl: null, content: 'Test', wordCount: 1, status: 'COMPLETED', errorMessage: null, createdAt: new Date().toISOString() }],
            outputs: [],
            chatMessages: [],
            _count: { sources: 1, chatMessages: 0, outputs: 0 },
          }),
        });
      }
    });

    // Mock outputs API with error
    await page.route('**/api/notebooks/test-notebook-id/outputs', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // Click a tool button
    const button = page.locator('button:has-text("Flashcards")');
    await expect(button).toBeEnabled();
    await button.click();

    // Button should not be in infinite loading state
    await page.waitForTimeout(2000);
    await expect(button).toBeEnabled();
  });

  test('should show loading state while generating', async ({ page }) => {
    // Mock notebook API
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
          sources: [{ id: 'source-1', type: 'TEXT', title: 'Test', originalUrl: null, content: 'Test', wordCount: 1, status: 'COMPLETED', errorMessage: null, createdAt: new Date().toISOString() }],
          outputs: [],
          chatMessages: [],
          _count: { sources: 1, chatMessages: 0, outputs: 0 },
        }),
      });
    });

    // Mock outputs API with delay
    await page.route('**/api/notebooks/test-notebook-id/outputs', async (route) => {
      if (route.request().method() === 'POST') {
        // Delay response
        await new Promise(resolve => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'output-1',
            type: 'FLASHCARD_DECK',
            title: 'Flashcards',
            content: { cards: [] },
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

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // Click the button
    const button = page.locator('button:has-text("Flashcards")');
    await button.click();

    // Button should show loading state (has animate-pulse class)
    await expect(button).toHaveClass(/animate-pulse/);

    // Wait for completion
    await page.waitForTimeout(2500);

    // Button should be enabled again
    await expect(button).not.toHaveClass(/animate-pulse/);
  });
});
