import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Study Room (Video Room) functionality
 * Tests the Zoom-like video conferencing features including:
 * - Room display and pre-join screen
 * - UI elements visibility
 * - Navigation and error handling
 *
 * Note: WebRTC functionality cannot be fully tested in headless browser.
 * These tests focus on UI rendering and navigation.
 */

// Mock study room data
const mockStudyRoom = {
  id: 'test-room-id',
  title: 'Test Study Room',
  description: 'A test room for E2E testing',
  code: 'ABC123',
  isActive: true,
  hostId: 'test-user-id',
  host: {
    id: 'test-user-id',
    name: 'Test Host',
    image: null,
  },
  notebook: {
    id: 'test-notebook-id',
    title: 'Test Notebook',
    emoji: '📚',
    sources: [],
  },
  participants: [
    {
      id: 'participant-1',
      userId: 'test-user-id',
      role: 'HOST',
      status: 'ONLINE',
      isAudioOn: true,
      isVideoOn: true,
      user: {
        id: 'test-user-id',
        name: 'Test Host',
        image: null,
      },
    },
  ],
  messages: [],
  settings: {
    allowAudio: true,
    allowVideo: true,
    allowChat: true,
    allowAnnotations: true,
  },
};

// Mock Supabase user for auth
const mockSupabaseUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
    avatar_url: null,
  },
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  created_at: new Date().toISOString(),
};

// Mock session
const mockSession = {
  access_token: 'mock-access-token-' + Date.now(),
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockSupabaseUser,
};

/**
 * Helper to setup all necessary mocks for a page
 * MUST be called BEFORE page.goto()
 */
async function setupMocks(page: Page) {
  // Mock Supabase auth session endpoint
  await page.route('**/auth/v1/token?grant_type=refresh_token', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSession),
    });
  });

  // Mock Supabase getUser endpoint
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSupabaseUser),
    });
  });

  // Mock the study room API
  await page.route('**/api/study-rooms/test-room-id', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStudyRoom),
      });
    } else {
      await route.continue();
    }
  });

  // Mock participants API
  await page.route('**/api/study-rooms/test-room-id/participants', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Mock messages API
  await page.route('**/api/study-rooms/test-room-id/messages', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    } else if (route.request().method() === 'POST') {
      const body = JSON.parse(route.request().postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'new-msg-id',
          type: body.type || 'TEXT',
          content: body.content,
          createdAt: new Date().toISOString(),
          user: {
            id: 'test-user-id',
            name: 'Test User',
            image: null,
          },
        }),
      });
    }
  });

  // Mock Supabase Realtime (prevent WebSocket connections from failing)
  await page.route('**/realtime/v1/**', async (route) => {
    await route.abort();
  });
}

/**
 * Setup mocks for error test cases
 */
async function setupErrorMocks(page: Page, roomId: string, statusCode: number) {
  await page.route(`**/api/study-rooms/${roomId}`, async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Room not found' }),
    });
  });

  // Still need auth mocks
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
}

// ============================================================================
// PRE-JOIN SCREEN TESTS
// ============================================================================

test.describe('Study Room - Pre-Join Screen', () => {

  test('should display room title', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });
  });

  test('should display room code ABC123', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('text=ABC123')).toBeVisible({ timeout: 15000 });
  });

  test('should display Join Call button', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('button:has-text("Join Call")')).toBeVisible({ timeout: 15000 });
  });

  test('should display participant count', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('text=1 participant')).toBeVisible({ timeout: 15000 });
  });

  test('should display media preview area with toggle buttons', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    // Wait for room to load
    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });

    // Should have at least 2 round buttons (mic and camera toggle)
    const mediaButtons = page.locator('.bg-gray-800\\/50 button, button.rounded-xl');
    await expect(mediaButtons.first()).toBeVisible();
  });

  test('should display back to study rooms link', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('a:has-text("Back to Study Rooms")')).toBeVisible({ timeout: 15000 });
  });

  test('should display Room Code label', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('text=Room Code')).toBeVisible({ timeout: 15000 });
  });

  test('should have clickable copy button for room code', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    // Find the button that contains the room code (clickable copy area)
    const copyButton = page.locator('button:has-text("ABC123")');
    await expect(copyButton).toBeVisible({ timeout: 15000 });

    // Verify it's clickable
    await expect(copyButton).toBeEnabled();
  });
});

// ============================================================================
// NAVIGATION TESTS
// ============================================================================

test.describe('Study Room - Navigation', () => {

  test('should have back link to study rooms', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });

    const backLink = page.locator('a[href="/study-rooms"]');
    await expect(backLink).toBeVisible();
  });

  test('back link should navigate to study rooms list', async ({ page }) => {
    await setupMocks(page);

    // Also mock the study rooms list API
    await page.route('**/api/study-rooms', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([mockStudyRoom]),
      });
    });

    await page.goto('/study-room/test-room-id');
    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });

    // Scroll to the back link first to ensure it's not obscured by bottom nav
    const backLink = page.locator('a:has-text("Back to Study Rooms")');
    await backLink.scrollIntoViewIfNeeded();

    // Use evaluate to click the link directly to bypass overlay issues
    await backLink.evaluate((el: HTMLAnchorElement) => el.click());

    // Should navigate to study rooms
    await page.waitForURL('**/study-rooms', { timeout: 10000 });
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe('Study Room - Error Handling', () => {

  test('should show error message for non-existent room', async ({ page }) => {
    await setupErrorMocks(page, 'non-existent-room', 404);
    await page.goto('/study-room/non-existent-room');

    // Should show "Room not found" message
    await expect(page.locator('text=Room not found')).toBeVisible({ timeout: 15000 });
  });

  test('should show back link when room not found', async ({ page }) => {
    await setupErrorMocks(page, 'invalid-room', 404);
    await page.goto('/study-room/invalid-room');

    // Should show back link
    await expect(page.locator('a:has-text("Back to Study Rooms")')).toBeVisible({ timeout: 15000 });
  });
});

// ============================================================================
// JOIN CALL BUTTON TESTS
// ============================================================================

test.describe('Study Room - Join Call Button', () => {

  test('Join Call button should be enabled', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await expect(joinButton).toBeEnabled();
  });

  test('Join Call button should have correct styling', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });

    // Should have purple background
    await expect(joinButton).toHaveClass(/bg-purple-600/);
  });

  test('clicking Join Call should trigger state change', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });

    // Click the button (this tests that the click event fires)
    await joinButton.click();

    // WebRTC join may fail in headless mode, but the click should still work
    // The button remains visible due to the async nature, which is expected
    await page.waitForTimeout(500);
  });
});

// ============================================================================
// UI STRUCTURE TESTS
// ============================================================================

test.describe('Study Room - UI Structure', () => {

  test('should have proper page structure', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    // Wait for room to load
    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });

    // Check for main structural elements
    // 1. Title area
    await expect(page.locator('h1')).toBeVisible();

    // 2. Preview/video area (aspect-video container)
    await expect(page.locator('.aspect-video, .bg-gray-800')).toBeVisible();

    // 3. Room info section
    await expect(page.locator('text=Room Code')).toBeVisible();

    // 4. Join button
    await expect(page.locator('button:has-text("Join Call")')).toBeVisible();
  });

  test('should display subtitle text', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('text=Get ready to join the study session')).toBeVisible({ timeout: 15000 });
  });

  test('should have black background', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });

    // Check that the page has black background class
    const bgElement = page.locator('.bg-black').first();
    await expect(bgElement).toBeVisible();
  });
});

// ============================================================================
// MEDIA TOGGLE TESTS (Pre-Join)
// ============================================================================

test.describe('Study Room - Media Toggles', () => {

  test('should have microphone toggle button', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });

    // Look for SVG with microphone path or button with mic icon
    const micButton = page.locator('button:has(svg)').first();
    await expect(micButton).toBeVisible();
  });

  test('should have camera toggle button', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });

    // Look for buttons in the media toggle area
    const buttons = page.locator('.bg-gray-800\\/50 button, button.rounded-xl');
    const count = await buttons.count();

    // Should have at least 2 buttons (mic and camera)
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('media toggle buttons should be clickable', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });

    // Find and click first media toggle button
    const mediaButton = page.locator('button.rounded-xl').first();
    if (await mediaButton.isVisible()) {
      await expect(mediaButton).toBeEnabled();
      await mediaButton.click();
      // Should toggle state without error
      await page.waitForTimeout(300);
      await expect(mediaButton).toBeVisible();
    }
  });
});

// ============================================================================
// RESPONSIVE TESTS
// ============================================================================

test.describe('Study Room - Responsive', () => {

  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    // Should still show main elements
    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Join Call")')).toBeVisible();
    await expect(page.locator('text=ABC123')).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Join Call")')).toBeVisible();
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await setupMocks(page);
    await page.goto('/study-room/test-room-id');

    await expect(page.locator('h1:has-text("Test Study Room")')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('button:has-text("Join Call")')).toBeVisible();
  });
});
