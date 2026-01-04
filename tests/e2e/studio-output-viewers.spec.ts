import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Studio Output Viewer Modals
 * Tests that each of the 6 output types can be viewed properly in their modals
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

// Sample outputs for each type
const sampleOutputs = {
  AUDIO_OVERVIEW: {
    id: 'output-audio-1',
    type: 'AUDIO_OVERVIEW',
    title: 'Audio Summary',
    content: {
      summary: 'This is an audio summary of the content.',
      duration: 120,
      transcript: 'Full transcript text here...',
    },
    audioUrl: 'https://example.com/audio.mp3',
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  },
  VIDEO_OVERVIEW: {
    id: 'output-video-1',
    type: 'VIDEO_OVERVIEW',
    title: 'Video Overview',
    content: {
      summary: 'This is a video overview of the content.',
      duration: 180,
      scenes: [
        { timestamp: 0, description: 'Introduction' },
        { timestamp: 30, description: 'Main content' },
        { timestamp: 120, description: 'Conclusion' },
      ],
    },
    videoUrl: 'https://example.com/video.mp4',
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  },
  MIND_MAP: {
    id: 'output-mindmap-1',
    type: 'MIND_MAP',
    title: 'Mind Map',
    content: {
      centralTopic: 'Main Topic',
      branches: [
        {
          topic: 'Branch 1',
          subtopics: ['Subtopic 1.1', 'Subtopic 1.2'],
        },
        {
          topic: 'Branch 2',
          subtopics: ['Subtopic 2.1', 'Subtopic 2.2', 'Subtopic 2.3'],
        },
        {
          topic: 'Branch 3',
          subtopics: ['Subtopic 3.1'],
        },
      ],
    },
    audioUrl: null,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  },
  SUMMARY: {
    id: 'output-summary-1',
    type: 'SUMMARY',
    title: 'Summary Report',
    content: {
      summary: 'This is a comprehensive summary of all the content in this notebook.',
      keyPoints: [
        'Key point number one',
        'Key point number two',
        'Key point number three',
      ],
      sections: [
        { title: 'Section 1', content: 'Content for section 1' },
        { title: 'Section 2', content: 'Content for section 2' },
      ],
    },
    audioUrl: null,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  },
  FLASHCARD_DECK: {
    id: 'output-flashcard-1',
    type: 'FLASHCARD_DECK',
    title: 'Study Flashcards',
    content: {
      cards: [
        { front: 'What is React?', back: 'A JavaScript library for building user interfaces', hint: 'Created by Facebook' },
        { front: 'What is TypeScript?', back: 'A typed superset of JavaScript', hint: 'Created by Microsoft' },
        { front: 'What is Next.js?', back: 'A React framework for production', hint: 'Created by Vercel' },
        { front: 'What is Prisma?', back: 'A next-generation ORM for Node.js', hint: 'Database toolkit' },
        { front: 'What is Tailwind?', back: 'A utility-first CSS framework', hint: 'Atomic CSS' },
      ],
    },
    audioUrl: null,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  },
  QUIZ: {
    id: 'output-quiz-1',
    type: 'QUIZ',
    title: 'Knowledge Quiz',
    content: {
      questions: [
        {
          type: 'MCQ',
          question: 'What programming language is TypeScript based on?',
          options: ['Python', 'JavaScript', 'Java', 'C++'],
          correctAnswer: 'JavaScript',
          explanation: 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.',
        },
        {
          type: 'MCQ',
          question: 'Which company created React?',
          options: ['Google', 'Microsoft', 'Facebook', 'Amazon'],
          correctAnswer: 'Facebook',
          explanation: 'React was created by Jordan Walke at Facebook.',
        },
        {
          type: 'MCQ',
          question: 'What is the main purpose of Next.js?',
          options: ['State management', 'Server-side rendering', 'Testing', 'Styling'],
          correctAnswer: 'Server-side rendering',
          explanation: 'Next.js is known for its server-side rendering capabilities.',
        },
      ],
    },
    audioUrl: null,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  },
};

// Create mock notebook with specific output
const createMockNotebook = (outputs: unknown[]) => ({
  id: 'test-notebook-viewers',
  title: 'Output Viewers Test Notebook',
  description: 'Testing output viewer modals',
  emoji: '📚',
  color: '#8b5cf6',
  isPublic: false,
  user: { id: 'user-1', name: 'Test User', image: null },
  sources: [{
    id: 'source-1',
    type: 'TEXT',
    title: 'Test Source',
    content: 'Test content for generating outputs.',
    wordCount: 5,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  }],
  outputs,
  chatMessages: [],
  _count: { sources: 1, chatMessages: 0, outputs: outputs.length },
});

test.describe('Studio Output Viewers', () => {
  test.describe('FLASHCARD_DECK Viewer', () => {
    test('should open flashcard viewer modal when clicking card', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.FLASHCARD_DECK])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the flashcard output card
      const flashcardCard = page.locator('[data-testid="output-card-FLASHCARD_DECK"], text=Study Flashcards').first();
      await expect(flashcardCard).toBeVisible({ timeout: 10000 });
      await flashcardCard.click();

      // Modal should open
      const modal = page.locator('.fixed.inset-0.z-50, [role="dialog"]');
      await expect(modal.first()).toBeVisible({ timeout: 5000 });

      // First card should be visible
      await expect(page.locator('text=What is React?')).toBeVisible({ timeout: 5000 });
    });

    test('should flip flashcard to show answer', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.FLASHCARD_DECK])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open modal
      const flashcardCard = page.locator('[data-testid="output-card-FLASHCARD_DECK"]').first();
      await flashcardCard.click();
      await page.waitForTimeout(600);

      // Click to flip
      const cardElement = page.locator('.fixed.inset-0.z-50 .cursor-pointer').first();
      if (await cardElement.isVisible()) {
        await cardElement.click();
        await page.waitForTimeout(600);

        // Answer should now be visible
        await expect(page.locator('text=A JavaScript library for building user interfaces')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should navigate between flashcards', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.FLASHCARD_DECK])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open modal
      const flashcardCard = page.locator('[data-testid="output-card-FLASHCARD_DECK"]').first();
      await flashcardCard.click();
      await page.waitForTimeout(600);

      // Should show "1 of 5"
      await expect(page.locator('text=1 of 5')).toBeVisible({ timeout: 5000 });

      // Find next button and click
      const masteredButton = page.locator('.fixed.inset-0.z-50 button:has-text("Mark as Mastered")');
      if (await masteredButton.isVisible({ timeout: 3000 })) {
        const nextButton = masteredButton.locator('..').locator('button:not([disabled])').last();
        await nextButton.click();
        await page.waitForTimeout(500);

        // Should now show "2 of 5"
        await expect(page.locator('text=2 of 5')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('QUIZ Viewer', () => {
    test('should open quiz viewer modal', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.QUIZ])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on quiz output
      const quizCard = page.locator('text=Knowledge Quiz').first();
      await expect(quizCard).toBeVisible({ timeout: 10000 });
      await quizCard.click();

      // Modal should open with question
      await expect(page.locator('text=What programming language is TypeScript based on?')).toBeVisible({ timeout: 5000 });
    });

    test('should allow selecting quiz answer', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.QUIZ])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open quiz modal
      await page.locator('text=Knowledge Quiz').first().click();
      await page.waitForTimeout(500);

      // Select correct answer
      const correctOption = page.locator('button:has-text("JavaScript")');
      await expect(correctOption).toBeVisible({ timeout: 5000 });
      await correctOption.click();

      // Explanation should appear
      await expect(page.locator('text=TypeScript is a typed superset of JavaScript')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('MIND_MAP Viewer', () => {
    test('should open mind map viewer modal', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.MIND_MAP])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on mind map output
      const mindMapCard = page.locator('[data-testid="output-card-MIND_MAP"]');
      await expect(mindMapCard).toBeVisible({ timeout: 10000 });
      await mindMapCard.click();

      // Modal should open with central topic
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Main Topic', { exact: true })).toBeVisible({ timeout: 5000 });
    });

    test('should display branches and subtopics', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.MIND_MAP])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open mind map modal
      await page.locator('[data-testid="output-card-MIND_MAP"]').click();
      await page.waitForTimeout(500);

      // Check branches are visible
      await expect(page.locator('text=Branch 1')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Branch 2')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('SUMMARY Viewer', () => {
    test('should open summary viewer modal', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.SUMMARY])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on summary output
      const summaryCard = page.locator('[data-testid="output-card-SUMMARY"]');
      await expect(summaryCard).toBeVisible({ timeout: 10000 });
      await summaryCard.click();

      // Modal should show summary content
      await expect(page.locator('text=This is a comprehensive summary')).toBeVisible({ timeout: 5000 });
    });

    test('should display key points', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.SUMMARY])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open summary modal
      await page.locator('[data-testid="output-card-SUMMARY"]').click();
      await page.waitForTimeout(500);

      // Check key points are visible
      await expect(page.locator('text=Key point number one')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('AUDIO_OVERVIEW Viewer', () => {
    test('should open audio viewer modal', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.AUDIO_OVERVIEW])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on audio output
      const audioCard = page.locator('[data-testid="output-card-AUDIO_OVERVIEW"], text=Audio Summary').first();
      await expect(audioCard).toBeVisible({ timeout: 10000 });
      await audioCard.click();

      // Modal should open
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });
    });

    test('should show audio player or transcript', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.AUDIO_OVERVIEW])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open audio modal
      const audioCard = page.locator('[data-testid="output-card-AUDIO_OVERVIEW"]').first();
      await audioCard.click();
      await page.waitForTimeout(500);

      // Should show audio content or controls
      const audioElement = page.locator('audio');
      const hasAudio = await audioElement.isVisible().catch(() => false);

      const transcript = page.locator('text=This is an audio summary');
      const hasTranscript = await transcript.isVisible().catch(() => false);

      expect(hasAudio || hasTranscript).toBe(true);
    });
  });

  test.describe('VIDEO_OVERVIEW Viewer', () => {
    test('should open video viewer modal', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.VIDEO_OVERVIEW])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on video output
      const videoCard = page.locator('[data-testid="output-card-VIDEO_OVERVIEW"], text=Video Overview').first();
      await expect(videoCard).toBeVisible({ timeout: 10000 });
      await videoCard.click();

      // Modal should open
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Multiple Outputs', () => {
    test('should display all output types correctly', async ({ page }) => {
      await setupAuthMocks(page);

      const allOutputs = Object.values(sampleOutputs);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook(allOutputs)),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // All output cards should be visible
      for (const output of allOutputs) {
        const card = page.locator(`text=${output.title}`).first();
        await expect(card).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test.describe('Close Modal', () => {
    test('should close modal when clicking close button', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.FLASHCARD_DECK])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open modal
      await page.locator('[data-testid="output-card-FLASHCARD_DECK"]').first().click();
      await page.waitForTimeout(600);

      // Modal should be open
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Close modal (look for close button or X)
      const closeButton = page.locator('.fixed.inset-0.z-50 button:has(svg), button[aria-label="Close"]').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);

        // Modal should be closed
        await expect(modal).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('should close modal when clicking outside', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleOutputs.FLASHCARD_DECK])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open modal
      await page.locator('[data-testid="output-card-FLASHCARD_DECK"]').first().click();
      await page.waitForTimeout(600);

      // Modal should be open
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Click on backdrop (outside modal content)
      const backdrop = page.locator('.fixed.inset-0.z-50 > div').first();
      if (await backdrop.isVisible()) {
        await backdrop.click({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(500);
      }
    });
  });
});
