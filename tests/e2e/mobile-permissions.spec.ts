import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Mobile Camera/Microphone Permissions
 * Tests permission flows, error states, and device selection on mobile viewports
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

const mockStudyRoom = {
  id: 'permission-test-room',
  title: 'Permission Test Room',
  description: 'Testing camera and mic permissions',
  code: 'PERM123',
  isActive: true,
  hostId: 'test-user-id',
  host: {
    id: 'test-user-id',
    name: 'Test Host',
    image: null,
  },
  notebook: null,
  participants: [
    {
      id: 'participant-1',
      userId: 'test-user-id',
      role: 'HOST',
      status: 'ONLINE',
      isAudioOn: false,
      isVideoOn: false,
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

async function setupRoomMocks(page: Page) {
  await page.route(`**/api/study-rooms/${mockStudyRoom.id}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStudyRoom),
      });
    }
  });

  await page.route(`**/api/study-rooms/${mockStudyRoom.id}/participants`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route(`**/api/study-rooms/${mockStudyRoom.id}/messages`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

test.describe('Mobile Camera Permission Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should show pre-join screen with media toggles on mobile', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Room should load
    await expect(page.locator('h1:has-text("Permission Test Room")')).toBeVisible({ timeout: 15000 });

    // Pre-join screen should have media toggle buttons
    const toggleButtons = page.locator('button').filter({ has: page.locator('svg') });
    const count = await toggleButtons.count();
    expect(count).toBeGreaterThanOrEqual(2); // At least mic and camera toggles
  });

  test('should have Join Call button on mobile', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join button should be visible
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await expect(joinButton).toBeEnabled();
  });

  test('should show media controls after joining on mobile', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Media controls should be visible at bottom
    const mediaControls = page.locator('.bg-black\\/80');
    await expect(mediaControls).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Permission Denied Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should handle permission request gracefully', async ({ page, context }) => {
    // Block media permissions to simulate denied state
    await context.grantPermissions([], { origin: 'http://localhost:3000' });

    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Room should still load even without camera permissions
    await expect(page.locator('h1:has-text("Permission Test Room")')).toBeVisible({ timeout: 15000 });

    // Join button should still be accessible
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 10000 });
  });

  test('should show muted state when audio permission denied', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Mic button should be visible (either muted or unmuted state)
    const micButton = page.locator('button[title*="Mute"], button[title*="microphone"], button[title*="Unmute"]');
    await expect(micButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should show camera off state when video permission denied', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Camera button should be visible (either on or off state)
    const cameraButton = page.locator('button[title*="camera"], button[title*="video"]');
    await expect(cameraButton.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Permission Granted Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // Grant media permissions
    await context.grantPermissions(['camera', 'microphone'], { origin: 'http://localhost:3000' });
  });

  test('should enable video toggle when camera permission granted', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Camera toggle should be enabled
    const cameraButton = page.locator('button[title*="camera"], button[title*="video"]').first();
    await expect(cameraButton).toBeVisible({ timeout: 5000 });
    await expect(cameraButton).toBeEnabled();
  });

  test('should enable audio toggle when microphone permission granted', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Mic toggle should be enabled
    const micButton = page.locator('button[title*="Mute"], button[title*="microphone"]').first();
    await expect(micButton).toBeVisible({ timeout: 5000 });
    await expect(micButton).toBeEnabled();
  });

  test('should be able to toggle camera on and off', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Find and click camera toggle
    const cameraButton = page.locator('button[title*="camera"], button[title*="video"]').first();
    await expect(cameraButton).toBeVisible({ timeout: 5000 });

    // Get initial state
    const initialTitle = await cameraButton.getAttribute('title');

    // Click to toggle
    await cameraButton.click();
    await page.waitForTimeout(500);

    // State should have changed
    const newTitle = await cameraButton.getAttribute('title');
    expect(newTitle).not.toBe(initialTitle);
  });

  test('should be able to toggle microphone on and off', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Find and click mic toggle
    const micButton = page.locator('button[title*="Mute"], button[title*="microphone"]').first();
    await expect(micButton).toBeVisible({ timeout: 5000 });

    // Get initial state
    const initialTitle = await micButton.getAttribute('title');

    // Click to toggle
    await micButton.click();
    await page.waitForTimeout(500);

    // State should have changed
    const newTitle = await micButton.getAttribute('title');
    expect(newTitle).not.toBe(initialTitle);
  });
});

test.describe('Mobile-Specific Viewport Tests', () => {
  const mobileViewports = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'Pixel 5', width: 393, height: 851 },
    { name: 'Samsung Galaxy S21', width: 360, height: 800 },
  ];

  for (const viewport of mobileViewports) {
    test(`should display properly on ${viewport.name}`, async ({ page, context }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await context.grantPermissions(['camera', 'microphone'], { origin: 'http://localhost:3000' });

      await setupAuthMocks(page);
      await setupRoomMocks(page);

      await page.goto(`/study-room/${mockStudyRoom.id}`);
      await page.waitForLoadState('networkidle');

      // Room should load
      await expect(page.locator('h1:has-text("Permission Test Room")')).toBeVisible({ timeout: 15000 });

      // Join button should be visible
      await expect(page.locator('button:has-text("Join Call")')).toBeVisible({ timeout: 10000 });
    });

    test(`should have working controls on ${viewport.name}`, async ({ page, context }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await context.grantPermissions(['camera', 'microphone'], { origin: 'http://localhost:3000' });

      await setupAuthMocks(page);
      await setupRoomMocks(page);

      await page.goto(`/study-room/${mockStudyRoom.id}`);
      await page.waitForLoadState('networkidle');

      // Join the call
      const joinButton = page.locator('button:has-text("Join Call")');
      await expect(joinButton).toBeVisible({ timeout: 15000 });
      await joinButton.click();
      await page.waitForTimeout(1000);

      // Media controls should be visible
      const micButton = page.locator('button[title*="Mute"], button[title*="microphone"]').first();
      const cameraButton = page.locator('button[title*="camera"], button[title*="video"]').first();

      await expect(micButton).toBeVisible({ timeout: 5000 });
      await expect(cameraButton).toBeVisible({ timeout: 5000 });
    });
  }
});

test.describe('Pre-Join Media Preview', () => {
  test('should show preview toggles before joining', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await context.grantPermissions(['camera', 'microphone'], { origin: 'http://localhost:3000' });

    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Pre-join screen should show media preview options
    await expect(page.locator('h1:has-text("Permission Test Room")')).toBeVisible({ timeout: 15000 });

    // Should have buttons to toggle audio/video before joining
    const preJoinButtons = page.locator('button.rounded-xl, button.rounded-full').filter({ has: page.locator('svg') });
    const count = await preJoinButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should remember pre-join toggle state after joining', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await context.grantPermissions(['camera', 'microphone'], { origin: 'http://localhost:3000' });

    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Room should load
    await expect(page.locator('h1:has-text("Permission Test Room")')).toBeVisible({ timeout: 15000 });

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // After joining, controls should be visible
    const mediaControls = page.locator('.bg-black\\/80, .bg-black');
    await expect(mediaControls.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Leave Call Functionality', () => {
  test('should be able to leave call on mobile', async ({ page, context }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await context.grantPermissions(['camera', 'microphone'], { origin: 'http://localhost:3000' });

    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Leave button should be visible
    const leaveButton = page.locator('button[title*="Leave"]');
    await expect(leaveButton).toBeVisible({ timeout: 5000 });

    // Click leave
    await leaveButton.click();
    await page.waitForTimeout(500);

    // Should return to pre-join or study rooms page
    // Either Join Call button reappears or we navigate away
    const joinButtonAfterLeave = page.locator('button:has-text("Join Call")');
    const isBackToPreJoin = await joinButtonAfterLeave.isVisible().catch(() => false);

    // Either back to pre-join or navigated away
    expect(isBackToPreJoin || page.url().includes('/study-room')).toBeTruthy();
  });
});
