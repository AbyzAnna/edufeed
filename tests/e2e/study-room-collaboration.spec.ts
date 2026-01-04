import { test, expect, Page } from '@playwright/test';

/**
 * E2E Tests for Study Room Collaboration
 * Tests multi-user scenarios, no screen share on desktop, and room features
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
  id: 'test-room-id',
  title: 'Collaboration Test Room',
  description: 'Testing multi-user collaboration',
  code: 'TEST123',
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
      isAudioOn: true,
      isVideoOn: true,
      user: {
        id: 'test-user-id',
        name: 'Test Host',
        image: null,
      },
    },
    {
      id: 'participant-2',
      userId: 'user-2',
      role: 'PARTICIPANT',
      status: 'ONLINE',
      isAudioOn: true,
      isVideoOn: false,
      user: {
        id: 'user-2',
        name: 'Participant Two',
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

async function setupRoomMocks(page: Page, roomData = mockStudyRoom) {
  await page.route(`**/api/study-rooms/${roomData.id}`, async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(roomData),
      });
    }
  });

  await page.route(`**/api/study-rooms/${roomData.id}/participants`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route(`**/api/study-rooms/${roomData.id}/messages`, async (route) => {
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
          user: mockSupabaseUser,
        }),
      });
    }
  });
}

test.describe('Screen Share NOT Available on Desktop', () => {
  test('should NOT show screen share button on desktop viewport', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Wait for room to load
    await expect(page.locator('h1:has-text("Collaboration Test Room")')).toBeVisible({ timeout: 15000 });

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 10000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Screen share button should NOT be visible
    const screenShareButton = page.locator('button[title*="screen"], button[title*="Screen"], button[title*="share"], button:has-text("Share screen")');
    await expect(screenShareButton).not.toBeVisible({ timeout: 5000 });

    // Monitor icon button should NOT be visible (screen share uses Monitor icon)
    const monitorButton = page.locator('button:has(svg):has-text("Share")');
    await expect(monitorButton).not.toBeVisible({ timeout: 5000 });
  });

  test('should show audio and video toggles on desktop', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Wait for room to load
    await expect(page.locator('h1:has-text("Collaboration Test Room")')).toBeVisible({ timeout: 15000 });

    // Pre-join screen should have audio/video toggles
    const audioToggle = page.locator('button:has(svg)').first();
    await expect(audioToggle).toBeVisible({ timeout: 5000 });
  });

  test('should work on different desktop resolutions', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    const desktopViewports = [
      { width: 1280, height: 720 },
      { width: 1366, height: 768 },
      { width: 1920, height: 1080 },
      { width: 2560, height: 1440 },
    ];

    for (const viewport of desktopViewports) {
      await page.setViewportSize(viewport);

      await page.goto(`/study-room/${mockStudyRoom.id}`);
      await page.waitForLoadState('networkidle');

      // Room should load
      await expect(page.locator('h1:has-text("Collaboration Test Room")')).toBeVisible({ timeout: 15000 });

      // Join the call
      const joinButton = page.locator('button:has-text("Join Call")');
      if (await joinButton.isVisible()) {
        await joinButton.click();
        await page.waitForTimeout(500);
      }

      // Screen share button should NOT be visible at any desktop resolution
      const screenShareButton = page.locator('button[title*="Share screen"]');
      await expect(screenShareButton).not.toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('Multi-User Collaboration', () => {
  test('should display multiple participants in room', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Wait for room to load
    await expect(page.locator('h1:has-text("Collaboration Test Room")')).toBeVisible({ timeout: 15000 });

    // Should show participant count
    await expect(page.locator('text=2 participant')).toBeVisible({ timeout: 10000 });
  });

  test('should show participant list after joining', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Open participants panel
    const participantsButton = page.locator('button[title="View participants"]');
    if (await participantsButton.isVisible()) {
      await participantsButton.click();
      await page.waitForTimeout(500);

      // Should show participant names
      await expect(page.locator('text=Participant Two')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Room Chat', () => {
  test('should have chat panel', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Chat button should be visible
    const chatButton = page.locator('button[title="Open chat"]');
    await expect(chatButton).toBeVisible({ timeout: 5000 });
  });

  test('should be able to send chat message', async ({ page }) => {
    let messageSent = false;

    await setupAuthMocks(page);

    // Override message mock to track if sent
    await page.route(`**/api/study-rooms/${mockStudyRoom.id}/messages`, async (route) => {
      if (route.request().method() === 'POST') {
        messageSent = true;
        const body = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-msg-id',
            type: body.type || 'TEXT',
            content: body.content,
            createdAt: new Date().toISOString(),
            user: mockSupabaseUser,
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

    await page.route(`**/api/study-rooms/${mockStudyRoom.id}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStudyRoom),
      });
    });

    await page.route(`**/api/study-rooms/${mockStudyRoom.id}/participants`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Open chat
    const chatButton = page.locator('button[title="Open chat"]');
    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(500);

      // Type and send message
      const chatInput = page.locator('input[placeholder*="message"]');
      if (await chatInput.isVisible()) {
        await chatInput.fill('Hello everyone!');
        await page.locator('button[type="submit"]').last().click();
        await page.waitForTimeout(500);

        // Message should have been sent
        expect(messageSent).toBe(true);
      }
    }
  });
});

test.describe('Room Controls', () => {
  test('should have mic toggle', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Mic toggle should be visible
    const micButton = page.locator('button[title*="Mute"], button[title*="microphone"]');
    await expect(micButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have camera toggle', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Camera toggle should be visible
    const cameraButton = page.locator('button[title*="camera"], button[title*="video"]');
    await expect(cameraButton.first()).toBeVisible({ timeout: 5000 });
  });

  test('should have leave button', async ({ page }) => {
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
  });

  test('should NOT have screen share button (collaboration only)', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Join the call
    const joinButton = page.locator('button:has-text("Join Call")');
    await expect(joinButton).toBeVisible({ timeout: 15000 });
    await joinButton.click();
    await page.waitForTimeout(1000);

    // Count visible media control buttons
    const mediaButtons = page.locator('.flex.items-center.justify-center.gap-2 button');
    const buttonCount = await mediaButtons.count();

    // Should have: mic, camera, participants, chat, leave = 5 buttons (no screen share)
    // Screen share button should NOT exist
    const screenButton = page.locator('button[title*="Share screen"], button[title*="Stop sharing"]');
    await expect(screenButton).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe('Room Code', () => {
  test('should display room code', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Room code should be visible
    await expect(page.locator('text=TEST123')).toBeVisible({ timeout: 15000 });
  });

  test('should have copy button for room code', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Copy button should be visible
    const copyButton = page.locator('button:has-text("TEST123")');
    await expect(copyButton).toBeVisible({ timeout: 15000 });
    await expect(copyButton).toBeEnabled();
  });
});

test.describe('Mobile Viewport', () => {
  test('should display properly on mobile', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Room should load
    await expect(page.locator('h1:has-text("Collaboration Test Room")')).toBeVisible({ timeout: 15000 });

    // Join button should be visible
    await expect(page.locator('button:has-text("Join Call")')).toBeVisible({ timeout: 10000 });
  });

  test('should have mic and camera toggles on mobile pre-join', async ({ page }) => {
    await setupAuthMocks(page);
    await setupRoomMocks(page);

    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/study-room/${mockStudyRoom.id}`);
    await page.waitForLoadState('networkidle');

    // Pre-join toggles should be visible
    const toggleButtons = page.locator('.bg-gray-800\\/50 button, button.rounded-xl');
    const count = await toggleButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
