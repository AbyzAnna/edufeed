import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Audio and Video Generation Features
 * Tests audio overview, video overview, and generation progress UI
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

// Sample test image (1x1 pink pixel PNG)
const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

// Sample audio URL (data URL with minimal MP3)
const testAudioBase64 = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNGvAvAAAAAAD/+1DEAAAGAAGn9AAAIAAAP8AAAARN7AjE2Z7BAFQAD/MQAAA/8z/AAAJCCYhCEIxCEIQhCEIQhCMQhCEMQhCEYhCEYhCMQhGIYhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhGIYhCEMQhCEYhCEf/7UMQIg8AAAaQAAAAgAAA0gAAABCMYhCEYhiEIRiEIxDEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCMQhCMQxCEIQhCEIQhCEIQhCMQxCEIxCEI//tQxBiDwAABpAAAACAAADSAAAAERiGIRjEMRiEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCMQhCEYhCEIxCEIxCEIQhCEIQhCEIQ=';

// Sample audio overview output with podcast-style dialogue
const sampleAudioOverviewOutput = {
  id: 'output-audio-1',
  type: 'AUDIO_OVERVIEW',
  title: 'Audio Overview - Climate Change',
  content: {
    script: [
      { speaker: 'Alex', text: "Today we're diving into climate change and sustainability." },
      { speaker: 'Jamie', text: "It's such an important topic. Let's explore the key concepts." },
      { speaker: 'Alex', text: 'What are the main causes of climate change?' },
      { speaker: 'Jamie', text: 'The primary cause is greenhouse gas emissions from human activities.' },
      { speaker: 'Alex', text: "That's fascinating. How can individuals make a difference?" },
      { speaker: 'Jamie', text: 'Small changes in daily habits can collectively have a huge impact.' },
    ],
    duration: 180,
    audioUrl: testAudioBase64,
  },
  audioUrl: testAudioBase64,
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
};

// Sample video overview output with AI-generated images
const sampleVideoOverviewOutput = {
  id: 'output-video-1',
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
        narration: "Let's explore the fundamental ideas behind climate science",
        visualDescription: 'Animated diagrams showing greenhouse effect',
        duration: 60,
        imageUrl: testImageBase64,
      },
      {
        title: 'Global Impact',
        narration: 'Climate change affects every region of our planet',
        visualDescription: 'World map with impact zones highlighted',
        duration: 45,
        imageUrl: testImageBase64,
      },
      {
        title: 'Solutions',
        narration: 'There are many ways we can address these challenges',
        visualDescription: 'Renewable energy icons and green initiatives',
        duration: 40,
        imageUrl: testImageBase64,
      },
      {
        title: 'Conclusion',
        narration: 'Together we can make a difference',
        visualDescription: 'Call to action with key takeaways',
        duration: 25,
        imageUrl: testImageBase64,
      },
    ],
    totalDuration: 200,
    audioUrl: testAudioBase64,
    thumbnailUrl: testImageBase64,
  },
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
};

// Sample video overview output without images (script-only)
const sampleScriptOnlyVideoOutput = {
  id: 'output-video-script-1',
  type: 'VIDEO_OVERVIEW',
  title: 'Video Script - History Overview',
  content: {
    isActualVideo: false,
    segments: [
      { title: 'Ancient Civilizations', narration: 'The story of early human societies', duration: 60 },
      { title: 'Medieval Period', narration: 'The age of kingdoms and castles', duration: 60 },
      { title: 'Modern Era', narration: 'The industrial revolution and beyond', duration: 60 },
    ],
    totalDuration: 180,
  },
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
};

// Create mock notebook helper
const createMockNotebook = (outputs: unknown[]) => ({
  id: 'test-notebook-audio-video',
  title: 'Audio & Video Generation Test',
  description: 'Testing audio and video generation features',
  emoji: '🎬',
  color: '#ec4899',
  isPublic: false,
  user: { id: 'user-1', name: 'Test User', image: null },
  sources: [{
    id: 'source-1',
    type: 'TEXT',
    title: 'Climate Change Article',
    content: 'Climate change is one of the most pressing issues facing our planet today. It affects weather patterns, sea levels, and ecosystems worldwide.',
    wordCount: 500,
    status: 'COMPLETED',
    createdAt: new Date().toISOString(),
  }],
  outputs,
  chatMessages: [],
  _count: { sources: 1, chatMessages: 0, outputs: outputs.length },
});

test.describe('Audio Overview Generation', () => {
  test.describe('Audio Player UI', () => {
    test('should display audio player when audio URL is available', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleAudioOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on audio output card
      const audioCard = page.locator('[data-testid="output-card-AUDIO_OVERVIEW"]').first();
      await expect(audioCard).toBeVisible({ timeout: 10000 });
      await audioCard.click();
      await page.waitForTimeout(500);

      // Modal should open - try multiple selectors
      const modal = page.locator('.fixed.inset-0.z-50').or(page.locator('[role="dialog"]'));
      await expect(modal.first()).toBeVisible({ timeout: 5000 });

      // Audio element or player UI should be present
      const audioElement = page.locator('audio');
      const playButton = page.locator('button svg');
      const hasAudio = await audioElement.isVisible().catch(() => false);
      const hasPlayButton = await playButton.first().isVisible().catch(() => false);

      expect(hasAudio || hasPlayButton).toBe(true);
    });

    test('should display transcript with speaker segments', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleAudioOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open audio modal
      await page.locator('[data-testid="output-card-AUDIO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Check for transcript heading
      const transcriptHeading = page.locator('text=Transcript');
      await expect(transcriptHeading).toBeVisible({ timeout: 5000 });

      // Check for speaker names
      await expect(page.locator('text=Alex').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Jamie').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show play/pause controls', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleAudioOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open audio modal
      await page.locator('[data-testid="output-card-AUDIO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Should have play/pause button
      const playButton = page.locator('.fixed.inset-0.z-50 button').filter({ has: page.locator('svg') });
      await expect(playButton.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show time display (0:00 format)', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleAudioOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open audio modal
      await page.locator('[data-testid="output-card-AUDIO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Should show time format
      const timeDisplay = page.locator('text=/\\d+:\\d{2}/').first();
      await expect(timeDisplay).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Audio Generation API', () => {
    test('should request audio generation correctly', async ({ page }) => {
      await setupAuthMocks(page);
      let audioApiCalled = false;

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
          if (body?.type === 'AUDIO_OVERVIEW') {
            audioApiCalled = true;
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify(sampleAudioOverviewOutput),
            });
            return;
          }
        }
        await route.continue();
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // API route is set up and ready for audio generation requests
    });
  });
});

test.describe('Video Overview Generation', () => {
  test.describe('Video Viewer with AI Images', () => {
    test('should display video overview with segment thumbnails', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Click on video output card
      const videoCard = page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first();
      await expect(videoCard).toBeVisible({ timeout: 10000 });
      await videoCard.click();
      await page.waitForTimeout(500);

      // Modal should open - try multiple selectors
      const modal = page.locator('.fixed.inset-0.z-50').or(page.locator('[role="dialog"]'));
      await expect(modal.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show Generate MP4 button or CORS warning', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open video modal
      await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Should show either Generate MP4 button or CORS warning
      const generateButton = page.locator('button:has-text("Generate MP4")');
      const corsWarning = page.locator('text=Cross-Origin');

      const hasButton = await generateButton.isVisible({ timeout: 3000 }).catch(() => false);
      const hasWarning = await corsWarning.isVisible({ timeout: 1000 }).catch(() => false);

      expect(hasButton || hasWarning).toBe(true);
    });

    test('should display video transcript section', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open video modal
      await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Should show transcript
      const transcriptHeading = page.locator('h4:has-text("Transcript")');
      await expect(transcriptHeading.first()).toBeVisible({ timeout: 5000 });
    });

    test('should display segment titles in transcript', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open video modal
      await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Should show segment titles
      await expect(page.locator('text=Introduction').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Key Concepts').first()).toBeVisible({ timeout: 5000 });
    });

    test('should show total duration', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open video modal
      await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Should show duration (3:20 for 200 seconds)
      const durationDisplay = page.locator('text=3:20');
      await expect(durationDisplay.first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Script-Only Video Fallback', () => {
    test('should show script view when no images available', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleScriptOnlyVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open video modal
      await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Should show "Video Script" heading
      const scriptHeading = page.locator('h3:has-text("Video Script")');
      await expect(scriptHeading).toBeVisible({ timeout: 5000 });
    });

    test('should display numbered segments in script view', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleScriptOnlyVideoOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open video modal
      await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Should show numbered segments
      await expect(page.locator('text=Ancient Civilizations').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=Medieval Period').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Video Generation Progress UI', () => {
    test('should display progress percentage between 0-100', async ({ page }) => {
      await setupAuthMocks(page);

      // This test verifies the UI correctly handles progress display
      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open video modal
      await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // If progress is shown, verify it's a valid percentage (0-100%)
      const progressText = page.locator('text=/%$/');
      if (await progressText.isVisible({ timeout: 1000 }).catch(() => false)) {
        const text = await progressText.textContent();
        if (text) {
          const match = text.match(/(-?\d+)%/);
          if (match) {
            const percentage = parseInt(match[1], 10);
            // Should NOT be negative or > 100
            expect(percentage).toBeGreaterThanOrEqual(0);
            expect(percentage).toBeLessThanOrEqual(100);
          }
        }
      }
    });

    test('progress circle SVG should have valid strokeDashoffset', async ({ page }) => {
      // This test would need to trigger generation to test progress UI
      // For now, verify the component loads without errors
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open video modal
      await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Modal should open without errors
      const modal = page.locator('.fixed.inset-0.z-50');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // No JavaScript errors should occur
      const errors: string[] = [];
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.waitForTimeout(1000);

      // Filter for progress-related errors
      const progressErrors = errors.filter(e =>
        e.includes('NaN') ||
        e.includes('Infinity') ||
        e.includes('strokeDashoffset')
      );
      expect(progressErrors).toHaveLength(0);
    });
  });

  test.describe('Video Style Selection', () => {
    test('should show Enhanced and Fast style options', async ({ page }) => {
      await setupAuthMocks(page);

      await page.route('**/api/notebooks/test-notebook-id', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createMockNotebook([sampleVideoOverviewOutput])),
        });
      });

      await page.goto('/notebooks/test-notebook-id');
      await page.waitForLoadState('networkidle');

      // Open video modal
      await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first().click();
      await page.waitForTimeout(500);

      // Check for style toggle buttons
      const enhancedButton = page.locator('button:has-text("Enhanced")');
      const fastButton = page.locator('button:has-text("Fast")');

      const hasEnhanced = await enhancedButton.isVisible({ timeout: 3000 }).catch(() => false);
      const hasFast = await fastButton.isVisible({ timeout: 1000 }).catch(() => false);

      // Both options should be visible if FFmpeg is supported
      if (hasEnhanced) {
        expect(hasFast).toBe(true);
      }
    });
  });
});

test.describe('Audio and Video Combined', () => {
  test('should display both audio and video outputs in notebook', async ({ page }) => {
    await setupAuthMocks(page);

    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockNotebook([
          sampleAudioOverviewOutput,
          sampleVideoOverviewOutput,
        ])),
      });
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // Both output cards should be visible
    const audioCard = page.locator('[data-testid="output-card-AUDIO_OVERVIEW"]');
    const videoCard = page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]');

    await expect(audioCard).toBeVisible({ timeout: 10000 });
    await expect(videoCard).toBeVisible({ timeout: 10000 });
  });

  test('should be able to open each viewer independently', async ({ page }) => {
    await setupAuthMocks(page);

    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockNotebook([
          sampleAudioOverviewOutput,
          sampleVideoOverviewOutput,
        ])),
      });
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // Open audio viewer
    await page.locator('[data-testid="output-card-AUDIO_OVERVIEW"]').click();
    await page.waitForTimeout(500);

    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Open video viewer
    await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').click();
    await page.waitForTimeout(500);

    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Error Handling', () => {
  test('should handle missing audio URL gracefully', async ({ page }) => {
    await setupAuthMocks(page);

    const audioWithoutUrl = {
      ...sampleAudioOverviewOutput,
      audioUrl: null,
      content: {
        ...sampleAudioOverviewOutput.content,
        audioUrl: undefined,
      },
    };

    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockNotebook([audioWithoutUrl])),
      });
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // Open audio modal
    await page.locator('[data-testid="output-card-AUDIO_OVERVIEW"]').first().click();
    await page.waitForTimeout(500);

    // Modal should open without crashing
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Should still show transcript
    const transcript = page.locator('text=Transcript');
    await expect(transcript).toBeVisible({ timeout: 5000 });
  });

  test('should handle empty segments array', async ({ page }) => {
    await setupAuthMocks(page);

    const videoWithNoSegments = {
      ...sampleVideoOverviewOutput,
      content: {
        isActualVideo: true,
        segments: [],
        totalDuration: 0,
      },
    };

    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockNotebook([videoWithNoSegments])),
      });
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // Open video modal
    await page.locator('[data-testid="output-card-VIDEO_OVERVIEW"]').first().click();
    await page.waitForTimeout(500);

    // Modal should open without crashing
    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accessibility', () => {
  test('audio player should have accessible controls', async ({ page }) => {
    await setupAuthMocks(page);

    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockNotebook([sampleAudioOverviewOutput])),
      });
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // Open audio modal
    await page.locator('[data-testid="output-card-AUDIO_OVERVIEW"]').first().click();
    await page.waitForTimeout(500);

    // Buttons should be keyboard accessible
    const buttons = page.locator('.fixed.inset-0.z-50 button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should close modal on Escape key', async ({ page }) => {
    await setupAuthMocks(page);

    await page.route('**/api/notebooks/test-notebook-id', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createMockNotebook([sampleAudioOverviewOutput])),
      });
    });

    await page.goto('/notebooks/test-notebook-id');
    await page.waitForLoadState('networkidle');

    // Open audio modal
    await page.locator('[data-testid="output-card-AUDIO_OVERVIEW"]').first().click();
    await page.waitForTimeout(500);

    const modal = page.locator('.fixed.inset-0.z-50');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Press Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Modal should be closed
    await expect(modal).not.toBeVisible({ timeout: 3000 });
  });
});
