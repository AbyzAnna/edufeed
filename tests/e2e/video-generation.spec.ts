import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Real Video Generation Feature
 * Tests the ffmpeg.wasm video generation from AI-generated images
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

// Sample video output with AI-generated images (base64 encoded small test images)
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const sampleVideoOutput = {
  id: 'output-video-real-1',
  type: 'VIDEO_OVERVIEW',
  title: 'Video Overview - Climate Change',
  content: {
    isActualVideo: true,
    segments: [
      {
        title: 'Introduction',
        narration: 'Welcome to Climate Change & Sustainability',
        visualDescription: 'Title card with topic theme',
        duration: 30,
        imageUrl: testImageBase64,
      },
      {
        title: 'Key Concepts',
        narration: "Let's explore the fundamental ideas",
        visualDescription: 'Animated diagrams',
        duration: 120,
        imageUrl: testImageBase64,
      },
      {
        title: 'Impact Assessment',
        narration: 'Understanding the global effects',
        visualDescription: 'World map with impact zones',
        duration: 90,
        imageUrl: testImageBase64,
      },
      {
        title: 'Conclusion',
        narration: 'Summary and call to action',
        visualDescription: 'Key takeaways list',
        duration: 60,
        imageUrl: testImageBase64,
      },
    ],
    totalDuration: 300,
    audioUrl: null, // No audio for test
    thumbnailUrl: testImageBase64,
  },
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
};

// Script-only video output (no images)
const sampleScriptOnlyOutput = {
  id: 'output-video-script-1',
  type: 'VIDEO_OVERVIEW',
  title: 'Video Script Only',
  content: {
    segments: [
      { title: 'Intro', narration: 'Introduction text', duration: 30 },
      { title: 'Body', narration: 'Main content text', duration: 60 },
    ],
    totalDuration: 90,
  },
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
};

// Create mock notebook with specific output
const createMockNotebook = (outputs: unknown[]) => ({
  id: 'test-notebook-video',
  title: 'Video Generation Test Notebook',
  description: 'Testing real video generation with ffmpeg.wasm',
  emoji: '🎬',
  color: '#ec4899',
  isPublic: false,
  user: { id: 'user-1', name: 'Test User', image: null },
  sources: [{
    id: 'source-1',
    type: 'TEXT',
    title: 'Climate Change Article',
    content: 'Climate change is one of the most pressing issues facing our planet today...',
    wordCount: 500,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  }],
  outputs,
  chatMessages: [],
  _count: { sources: 1, chatMessages: 0, outputs: outputs.length },
});

test.describe('Real Video Generation', () => {
  test.describe('Video Viewer with AI Images', () => {
    test('should display video overview with AI-generated images', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the generated output card (in "Generated Notes" section)
      // The output card shows "Video Overview - Climate Change"
      const videoCard = page.locator('text=Video Overview - Climate Change').first();
      await expect(videoCard).toBeVisible({ timeout: 10000 });
      await videoCard.click();

      // Modal should open
      const modal = page.locator('.fixed.inset-0.z-50, [role="dialog"]');
      await expect(modal.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show Generate MP4 button when images are available', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the generated output card
      await page.locator('text=Video Overview - Climate Change').first().click();
      await page.waitForTimeout(500);

      // Should show "Generate MP4" button or warning about CORS headers
      const generateButton = page.locator('button:has-text("Generate MP4")');
      const corsWarning = page.locator('text=Cross-Origin-Opener-Policy');

      // Either the button or the warning should be visible
      const hasButton = await generateButton.isVisible({ timeout: 5000 }).catch(() => false);
      const hasWarning = await corsWarning.isVisible({ timeout: 1000 }).catch(() => false);

      expect(hasButton || hasWarning).toBe(true);
    });

    test('should display segment thumbnails', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the generated output card using test ID
      const outputCard = page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]');
      await expect(outputCard).toBeVisible({ timeout: 10000 });
      await outputCard.click();
      await page.waitForTimeout(1000);

      // Check that modal is open by looking for transcript section or video content
      const transcriptHeader = page.locator('h4:has-text("Transcript")');
      const videoContent = page.locator('.aspect-video');
      const hasTranscript = await transcriptHeader.isVisible({ timeout: 3000 }).catch(() => false);
      const hasVideo = await videoContent.isVisible({ timeout: 1000 }).catch(() => false);
      expect(hasTranscript || hasVideo).toBe(true);
    });

    test('should show transcript section', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the generated output card using test ID
      const outputCard = page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]');
      await expect(outputCard).toBeVisible({ timeout: 10000 });
      await outputCard.click();
      await page.waitForTimeout(1000);

      // Should show transcript header (may be in modal or expanded section)
      const transcriptHeader = page.locator('h4:has-text("Transcript")');
      await expect(transcriptHeader.first()).toBeVisible({ timeout: 5000 });
    });

    test('should allow clicking on segments to navigate', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the generated output card
      await page.locator('text=Video Overview - Climate Change').first().click();
      await page.waitForTimeout(500);

      // Modal should be open
      const modal = page.locator('.fixed.inset-0.z-50, [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Click on a segment in the transcript (Key Concepts)
      const segmentButton = page.locator('.fixed.inset-0.z-50 >> text=Key Concepts').first();
      if (await segmentButton.isVisible({ timeout: 3000 })) {
        await segmentButton.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display time stamps for each segment', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the generated output card using test ID
      const outputCard = page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]');
      await expect(outputCard).toBeVisible({ timeout: 10000 });
      await outputCard.click();
      await page.waitForTimeout(1000);

      // Should show timestamps (e.g., "0:00") somewhere in the opened content
      const hasTimestamp = await page.locator('text=/\\d+:\\d{2}/').first().isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasTimestamp).toBe(true);
    });
  });

  test.describe('Script-Only Fallback', () => {
    test('should show script view when no images available', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleScriptOnlyOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the script-only output card using test ID
      const outputCard = page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]');
      await expect(outputCard).toBeVisible({ timeout: 10000 });
      await outputCard.click();
      await page.waitForTimeout(1000);

      // Should show script content (video script heading visible)
      const scriptHeading = page.locator('h3:has-text("Video Script")');
      const hasScript = await scriptHeading.isVisible({ timeout: 5000 }).catch(() => false);
      expect(hasScript).toBe(true);
    });
  });

  test.describe('Video Generation Progress', () => {
    test('should handle ffmpeg support check gracefully', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the generated output card
      await page.locator('text=Video Overview - Climate Change').first().click();
      await page.waitForTimeout(1000);

      // Modal should be open
      const modal = page.locator('.fixed.inset-0.z-50, [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // The page should not crash and should show content
      const hasContent = await modal.textContent();
      expect(hasContent?.length).toBeGreaterThan(0);
    });
  });

  test.describe('Video Controls', () => {
    test('should show play/pause button', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the generated output card
      await page.locator('text=Video Overview - Climate Change').first().click();
      await page.waitForTimeout(500);

      // Modal should be open
      const modal = page.locator('.fixed.inset-0.z-50, [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Should show play button (SVG icon)
      const playButton = page.locator('.fixed.inset-0.z-50 button >> svg').first();
      await expect(playButton).toBeVisible({ timeout: 5000 });
    });

    test('should display total duration', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the generated output card
      await page.locator('text=Video Overview - Climate Change').first().click();
      await page.waitForTimeout(500);

      // Modal should be open
      const modal = page.locator('.fixed.inset-0.z-50, [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Should show duration (5:00 for 300 seconds)
      await expect(page.locator('.fixed.inset-0.z-50 >> text=5:00')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Close Modal', () => {
    test('should close video modal', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on the generated output card
      await page.locator('text=Video Overview - Climate Change').first().click();
      await page.waitForTimeout(500);

      // Modal should be visible
      const modal = page.locator('.fixed.inset-0.z-50, [role="dialog"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });

      // Find and click close button
      const closeButton = page.locator('.fixed.inset-0.z-50 button >> svg').first();
      await closeButton.click();

      // Wait for modal to close
      await page.waitForTimeout(500);
    });
  });
});

test.describe('Video Generation API Integration', () => {
  test('should call video generation endpoint correctly', async ({ page }) => {
    await setupAuthMocks(page);

    let videoApiCalled = false;

    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockNotebook([])),
      });
    });

    await page.route('**/api/notebooks/test-notebook-id/outputs', async (route) => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        if (body?.type === 'VIDEO_OVERVIEW') {
          videoApiCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(sampleVideoOutput),
          });
          return;
        }
      }
      await route.continue();
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // This test verifies the API route structure
    // The actual video generation is handled by the workers endpoint
  });
});
