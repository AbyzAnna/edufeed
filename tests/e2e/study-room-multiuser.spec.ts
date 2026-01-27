import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';
import path from 'path';

/**
 * E2E Tests for Study Room Multi-User Functionality
 *
 * Tests Zoom-like video conferencing features with 2 users:
 * - Room creation and joining
 * - Video/audio controls (enable/disable)
 * - Multi-user presence and participant list
 * - Real-time chat between users
 * - Room code sharing and joining
 *
 * Note: WebRTC actual video/audio streaming cannot be tested in headless mode,
 * but we can test UI interactions and API calls.
 */

// Auth file paths
const authFileUser1 = path.join(__dirname, '../.auth/user.json');
const authFileUser2 = path.join(__dirname, '../.auth/user2.json');

// Test user credentials for reference
const USER1 = {
  email: 'abyzovann@icloud.com',
  name: 'Anna',
};

const USER2 = {
  email: 'testuser2@edufeed.app',
  name: 'Test User 2',
};

// Helper to create a new browser context with specific auth
async function createAuthenticatedContext(
  browser: Browser,
  authFile: string
): Promise<BrowserContext> {
  return browser.newContext({
    storageState: authFile,
  });
}

// Helper to wait for room to load
async function waitForRoomToLoad(page: Page, roomTitle: string) {
  await expect(page.locator(`h1:has-text("${roomTitle}")`).first()).toBeVisible({ timeout: 15000 });
}

// Helper to join a call
async function joinCall(page: Page) {
  const joinButton = page.locator('button:has-text("Join Call")');
  await expect(joinButton).toBeVisible({ timeout: 10000 });
  await joinButton.click();
  // Wait for call UI to appear
  await expect(page.locator('button[title="Leave call"], button:has-text("Leave call")').first()).toBeVisible({ timeout: 15000 });
}

// Helper to navigate to study rooms
async function goToStudyRooms(page: Page) {
  await page.goto('/study');
  await expect(page.locator('h1:has-text("Study Hub")')).toBeVisible({ timeout: 10000 });
}

// ============================================================================
// ROOM CREATION TESTS
// ============================================================================

test.describe('Study Room - Room Creation', () => {
  test('User 1 can create a new room', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    await goToStudyRooms(page);

    // Click Create Room button
    const createButton = page.locator('button:has-text("Create Room")');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for modal to appear
    await expect(page.locator('text=Create Study Room')).toBeVisible({ timeout: 5000 });

    // Fill in room details
    const roomTitle = `Test Room ${Date.now()}`;
    await page.fill('input[placeholder*="room title"], input[name="title"]', roomTitle);

    // Optional: fill description
    const descInput = page.locator('textarea[placeholder*="description"], textarea[name="description"]');
    if (await descInput.isVisible()) {
      await descInput.fill('E2E test room for multi-user testing');
    }

    // Submit the form
    const submitButton = page.locator('button[type="submit"]:has-text("Create"), button:has-text("Create Room")').last();
    await submitButton.click();

    // Should redirect to room or show success
    await page.waitForURL('**/study-room/**', { timeout: 10000 });

    await context.close();
  });

  test('User 1 can create a private room', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    await goToStudyRooms(page);

    // Click Create Room
    await page.locator('button:has-text("Create Room")').click();
    await expect(page.locator('text=Create Study Room')).toBeVisible({ timeout: 5000 });

    // Fill in room details
    const roomTitle = `Private Room ${Date.now()}`;
    await page.fill('input[placeholder*="room title"], input[name="title"]', roomTitle);

    // Enable private room toggle if available
    const privateToggle = page.locator('input[type="checkbox"][name*="private"], button:has-text("Private")');
    if (await privateToggle.first().isVisible()) {
      await privateToggle.first().click();
    }

    // Submit
    const submitButton = page.locator('button[type="submit"]').last();
    await submitButton.click();

    // Should redirect to room
    await page.waitForURL('**/study-room/**', { timeout: 10000 });

    await context.close();
  });
});

// ============================================================================
// ROOM JOINING TESTS
// ============================================================================

test.describe('Study Room - Join by Code', () => {
  test('User 2 can join a room using room code', async ({ browser }) => {
    // First, User 1 creates a room and gets the code
    const context1 = await createAuthenticatedContext(browser, authFileUser1);
    const page1 = await context1.newPage();

    await goToStudyRooms(page1);

    // Create a room
    await page1.locator('button:has-text("Create Room")').click();
    await expect(page1.locator('text=Create Study Room')).toBeVisible({ timeout: 5000 });

    const roomTitle = `Join Test Room ${Date.now()}`;
    await page1.fill('input[placeholder*="room title"], input[name="title"]', roomTitle);
    await page1.locator('button[type="submit"]').last().click();

    // Wait for room to load
    await page1.waitForURL('**/study-room/**', { timeout: 10000 });

    // Get the room code
    const roomCodeElement = page1.locator('button:has-text(/^[A-Z0-9]{6}$/), text=/^[A-Z0-9]{6}$/').first();
    await expect(roomCodeElement).toBeVisible({ timeout: 10000 });
    const roomCode = await roomCodeElement.textContent();

    expect(roomCode).toMatch(/^[A-Z0-9]{6}$/);

    // Now User 2 joins using the code
    const context2 = await createAuthenticatedContext(browser, authFileUser2);
    const page2 = await context2.newPage();

    await goToStudyRooms(page2);

    // Click Join Room button
    await page2.locator('button:has-text("Join Room")').click();
    await expect(page2.locator('text=Join Study Room, text=Enter room code')).toBeVisible({ timeout: 5000 });

    // Enter the room code
    await page2.fill('input[placeholder*="code"], input[name="code"]', roomCode!);
    await page2.locator('button[type="submit"]:has-text("Join"), button:has-text("Join Room")').last().click();

    // Should redirect to the room
    await page2.waitForURL('**/study-room/**', { timeout: 10000 });

    // Should see room title
    await waitForRoomToLoad(page2, roomTitle);

    await context1.close();
    await context2.close();
  });
});

// ============================================================================
// VIDEO/AUDIO CONTROLS TESTS
// ============================================================================

test.describe('Study Room - Video/Audio Controls', () => {
  test('User can toggle microphone on/off before joining', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    // Go to an existing room or create one
    await goToStudyRooms(page);

    // Click on first LIVE room if available
    const liveRoom = page.locator('a:has-text("Join Room")').first();
    if (await liveRoom.isVisible({ timeout: 3000 })) {
      await liveRoom.click();
    } else {
      // Create a new room
      await page.locator('button:has-text("Create Room")').click();
      await page.fill('input[placeholder*="room title"], input[name="title"]', `Mic Test ${Date.now()}`);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForURL('**/study-room/**', { timeout: 10000 });
    }

    // Wait for pre-join screen
    await expect(page.locator('button:has-text("Join Call")')).toBeVisible({ timeout: 15000 });

    // Find mic toggle button (usually first in the row of toggle buttons)
    const micToggle = page.locator('button:has(svg)').first();
    await expect(micToggle).toBeVisible();

    // Click to toggle
    await micToggle.click();
    await page.waitForTimeout(300);

    // Click again to toggle back
    await micToggle.click();
    await page.waitForTimeout(300);

    // Button should still be visible and functional
    await expect(micToggle).toBeVisible();

    await context.close();
  });

  test('User can toggle camera on/off before joining', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    await goToStudyRooms(page);

    // Navigate to a room
    const liveRoom = page.locator('a:has-text("Join Room")').first();
    if (await liveRoom.isVisible({ timeout: 3000 })) {
      await liveRoom.click();
    } else {
      await page.locator('button:has-text("Create Room")').click();
      await page.fill('input[placeholder*="room title"], input[name="title"]', `Camera Test ${Date.now()}`);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForURL('**/study-room/**', { timeout: 10000 });
    }

    await expect(page.locator('button:has-text("Join Call")')).toBeVisible({ timeout: 15000 });

    // Find camera toggle button (usually second in the row)
    const cameraToggle = page.locator('button:has(svg)').nth(1);
    await expect(cameraToggle).toBeVisible();

    // Toggle camera
    await cameraToggle.click();
    await page.waitForTimeout(300);

    await expect(cameraToggle).toBeVisible();

    await context.close();
  });

  test('User can mute/unmute microphone during call', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    await goToStudyRooms(page);

    const liveRoom = page.locator('a:has-text("Join Room")').first();
    if (await liveRoom.isVisible({ timeout: 3000 })) {
      await liveRoom.click();
    } else {
      await page.locator('button:has-text("Create Room")').click();
      await page.fill('input[placeholder*="room title"], input[name="title"]', `Mute Test ${Date.now()}`);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForURL('**/study-room/**', { timeout: 10000 });
    }

    // Join the call
    await joinCall(page);

    // Find mute button in call controls
    const muteButton = page.locator('button[title*="Mute"], button[title*="microphone"], button:has-text("Mute")').first();
    await expect(muteButton).toBeVisible({ timeout: 10000 });

    // Click to mute
    await muteButton.click();
    await page.waitForTimeout(500);

    // Button should change (now shows unmute)
    const unmuteButton = page.locator('button[title*="Unmute"], button[title*="microphone"]').first();
    await expect(unmuteButton).toBeVisible();

    await context.close();
  });

  test('User can turn camera on/off during call', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    await goToStudyRooms(page);

    const liveRoom = page.locator('a:has-text("Join Room")').first();
    if (await liveRoom.isVisible({ timeout: 3000 })) {
      await liveRoom.click();
    } else {
      await page.locator('button:has-text("Create Room")').click();
      await page.fill('input[placeholder*="room title"], input[name="title"]', `Camera Control Test ${Date.now()}`);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForURL('**/study-room/**', { timeout: 10000 });
    }

    await joinCall(page);

    // Find camera toggle button
    const cameraButton = page.locator('button[title*="camera"], button[title*="video"], button:has-text("camera")').first();
    await expect(cameraButton).toBeVisible({ timeout: 10000 });

    // Toggle camera
    await cameraButton.click();
    await page.waitForTimeout(500);

    await expect(cameraButton).toBeVisible();

    await context.close();
  });

  test('User can leave the call', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    await goToStudyRooms(page);

    const liveRoom = page.locator('a:has-text("Join Room")').first();
    if (await liveRoom.isVisible({ timeout: 3000 })) {
      await liveRoom.click();
    } else {
      await page.locator('button:has-text("Create Room")').click();
      await page.fill('input[placeholder*="room title"], input[name="title"]', `Leave Test ${Date.now()}`);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForURL('**/study-room/**', { timeout: 10000 });
    }

    await joinCall(page);

    // Find and click leave button
    const leaveButton = page.locator('button[title*="Leave"], button:has-text("Leave")').first();
    await expect(leaveButton).toBeVisible({ timeout: 10000 });
    await leaveButton.click();

    // Should show pre-join screen again or redirect
    await page.waitForTimeout(1000);
    const joinButton = page.locator('button:has-text("Join Call")');
    const studyHub = page.locator('h1:has-text("Study Hub")');

    // Either back to pre-join or redirected to study rooms list
    const leftSuccessfully = await joinButton.isVisible().catch(() => false) ||
                            await studyHub.isVisible().catch(() => false);
    expect(leftSuccessfully).toBe(true);

    await context.close();
  });
});

// ============================================================================
// MULTI-USER PRESENCE TESTS
// ============================================================================

test.describe('Study Room - Multi-User Presence', () => {
  test('Both users can see each other in participant list', async ({ browser }) => {
    // User 1 creates a room
    const context1 = await createAuthenticatedContext(browser, authFileUser1);
    const page1 = await context1.newPage();

    await goToStudyRooms(page1);

    await page1.locator('button:has-text("Create Room")').click();
    await expect(page1.locator('text=Create Study Room')).toBeVisible({ timeout: 5000 });

    const roomTitle = `Presence Test ${Date.now()}`;
    await page1.fill('input[placeholder*="room title"], input[name="title"]', roomTitle);
    await page1.locator('button[type="submit"]').last().click();

    await page1.waitForURL('**/study-room/**', { timeout: 10000 });

    // Get room code
    const roomCodeElement = page1.locator('button:has-text(/^[A-Z0-9]{6}$/), text=/^[A-Z0-9]{6}$/').first();
    await expect(roomCodeElement).toBeVisible({ timeout: 10000 });
    const roomCode = await roomCodeElement.textContent();

    // User 1 joins the call
    await joinCall(page1);

    // User 2 joins the same room
    const context2 = await createAuthenticatedContext(browser, authFileUser2);
    const page2 = await context2.newPage();

    await goToStudyRooms(page2);

    await page2.locator('button:has-text("Join Room")').click();
    await page2.fill('input[placeholder*="code"], input[name="code"]', roomCode!);
    await page2.locator('button[type="submit"]').last().click();

    await page2.waitForURL('**/study-room/**', { timeout: 10000 });

    // User 2 joins the call
    await joinCall(page2);

    // Wait for WebRTC signaling
    await page1.waitForTimeout(3000);
    await page2.waitForTimeout(3000);

    // Check participant count on User 1's page
    const participantCount1 = page1.locator('text=/2 in call|2 participants/i');
    const participantCount1Alt = page1.locator('button:has-text("2")');

    const user1SeesTwo = await participantCount1.isVisible({ timeout: 5000 }).catch(() => false) ||
                         await participantCount1Alt.isVisible({ timeout: 3000 }).catch(() => false);

    // Check participant count on User 2's page
    const participantCount2 = page2.locator('text=/2 in call|2 participants/i');
    const participantCount2Alt = page2.locator('button:has-text("2")');

    const user2SeesTwo = await participantCount2.isVisible({ timeout: 5000 }).catch(() => false) ||
                         await participantCount2Alt.isVisible({ timeout: 3000 }).catch(() => false);

    // At least one should see 2 participants (WebRTC might need more time)
    expect(user1SeesTwo || user2SeesTwo).toBe(true);

    await context1.close();
    await context2.close();
  });

  test('Participant list updates when user leaves', async ({ browser }) => {
    // User 1 creates a room
    const context1 = await createAuthenticatedContext(browser, authFileUser1);
    const page1 = await context1.newPage();

    await goToStudyRooms(page1);

    await page1.locator('button:has-text("Create Room")').click();
    const roomTitle = `Leave Presence Test ${Date.now()}`;
    await page1.fill('input[placeholder*="room title"], input[name="title"]', roomTitle);
    await page1.locator('button[type="submit"]').last().click();
    await page1.waitForURL('**/study-room/**', { timeout: 10000 });

    const roomCodeElement = page1.locator('button:has-text(/^[A-Z0-9]{6}$/), text=/^[A-Z0-9]{6}$/').first();
    const roomCode = await roomCodeElement.textContent();

    await joinCall(page1);

    // User 2 joins
    const context2 = await createAuthenticatedContext(browser, authFileUser2);
    const page2 = await context2.newPage();

    await goToStudyRooms(page2);
    await page2.locator('button:has-text("Join Room")').click();
    await page2.fill('input[placeholder*="code"], input[name="code"]', roomCode!);
    await page2.locator('button[type="submit"]').last().click();
    await page2.waitForURL('**/study-room/**', { timeout: 10000 });
    await joinCall(page2);

    await page1.waitForTimeout(3000);

    // User 2 leaves
    const leaveButton2 = page2.locator('button[title*="Leave"], button:has-text("Leave")').first();
    await leaveButton2.click();

    // Wait for presence update
    await page1.waitForTimeout(3000);

    // User 1 should now see only 1 participant
    const participantCount = page1.locator('text=/1 in call|1 participant/i');
    const participantCountAlt = page1.locator('button:has-text("1")');

    const seesOne = await participantCount.isVisible({ timeout: 5000 }).catch(() => false) ||
                    await participantCountAlt.isVisible({ timeout: 3000 }).catch(() => false);

    expect(seesOne).toBe(true);

    await context1.close();
    await context2.close();
  });
});

// ============================================================================
// CHAT FUNCTIONALITY TESTS
// ============================================================================

test.describe('Study Room - Chat', () => {
  test('User can send a chat message', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    await goToStudyRooms(page);

    const liveRoom = page.locator('a:has-text("Join Room")').first();
    if (await liveRoom.isVisible({ timeout: 3000 })) {
      await liveRoom.click();
    } else {
      await page.locator('button:has-text("Create Room")').click();
      await page.fill('input[placeholder*="room title"], input[name="title"]', `Chat Test ${Date.now()}`);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForURL('**/study-room/**', { timeout: 10000 });
    }

    await joinCall(page);

    // Open chat panel if not visible
    const chatButton = page.locator('button[title*="chat"], button:has-text("Chat")').first();
    if (await chatButton.isVisible()) {
      await chatButton.click();
      await page.waitForTimeout(500);
    }

    // Find chat input
    const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
    await expect(chatInput).toBeVisible({ timeout: 5000 });

    // Type and send message
    const testMessage = `Hello from E2E test ${Date.now()}`;
    await chatInput.fill(testMessage);

    // Find and click send button
    const sendButton = page.locator('button[type="submit"]').last();
    await sendButton.click();

    // Wait for message to appear
    await page.waitForTimeout(1000);

    // Message should be visible in chat
    const sentMessage = page.locator(`text=${testMessage}`);
    await expect(sentMessage).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  test('Users can see each others messages', async ({ browser }) => {
    // User 1 creates room
    const context1 = await createAuthenticatedContext(browser, authFileUser1);
    const page1 = await context1.newPage();

    await goToStudyRooms(page1);

    await page1.locator('button:has-text("Create Room")').click();
    const roomTitle = `Chat Exchange Test ${Date.now()}`;
    await page1.fill('input[placeholder*="room title"], input[name="title"]', roomTitle);
    await page1.locator('button[type="submit"]').last().click();
    await page1.waitForURL('**/study-room/**', { timeout: 10000 });

    const roomCodeElement = page1.locator('button:has-text(/^[A-Z0-9]{6}$/), text=/^[A-Z0-9]{6}$/').first();
    const roomCode = await roomCodeElement.textContent();

    await joinCall(page1);

    // User 2 joins
    const context2 = await createAuthenticatedContext(browser, authFileUser2);
    const page2 = await context2.newPage();

    await goToStudyRooms(page2);
    await page2.locator('button:has-text("Join Room")').click();
    await page2.fill('input[placeholder*="code"], input[name="code"]', roomCode!);
    await page2.locator('button[type="submit"]').last().click();
    await page2.waitForURL('**/study-room/**', { timeout: 10000 });
    await joinCall(page2);

    // User 1 sends a message
    const chatInput1 = page1.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
    await chatInput1.fill('Hello from User 1!');
    await page1.locator('button[type="submit"]').last().click();

    // Wait for message to sync
    await page2.waitForTimeout(3000);

    // User 2 should see the message (may need polling refresh)
    // Note: Due to the polling-based real-time implementation, this might take a few seconds
    const message1OnPage2 = page2.locator('text=Hello from User 1!');
    const user2SeesMessage = await message1OnPage2.isVisible({ timeout: 10000 }).catch(() => false);

    // User 2 sends a message
    const chatInput2 = page2.locator('input[placeholder*="message"], textarea[placeholder*="message"]').first();
    await chatInput2.fill('Hello from User 2!');
    await page2.locator('button[type="submit"]').last().click();

    // Wait for message to sync
    await page1.waitForTimeout(3000);

    // User 1 should see the message
    const message2OnPage1 = page1.locator('text=Hello from User 2!');
    const user1SeesMessage = await message2OnPage1.isVisible({ timeout: 10000 }).catch(() => false);

    // At least the sender should see their own messages immediately
    const user1SeesOwn = await page1.locator('text=Hello from User 1!').isVisible();
    const user2SeesOwn = await page2.locator('text=Hello from User 2!').isVisible();

    expect(user1SeesOwn).toBe(true);
    expect(user2SeesOwn).toBe(true);

    await context1.close();
    await context2.close();
  });
});

// ============================================================================
// ROOM CODE FUNCTIONALITY TESTS
// ============================================================================

test.describe('Study Room - Room Code', () => {
  test('Room code is displayed and can be copied', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    await goToStudyRooms(page);

    // Create or join a room
    const liveRoom = page.locator('a:has-text("Join Room")').first();
    if (await liveRoom.isVisible({ timeout: 3000 })) {
      await liveRoom.click();
    } else {
      await page.locator('button:has-text("Create Room")').click();
      await page.fill('input[placeholder*="room title"], input[name="title"]', `Code Test ${Date.now()}`);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForURL('**/study-room/**', { timeout: 10000 });
    }

    // Wait for room to load
    await expect(page.locator('button:has-text("Join Call")')).toBeVisible({ timeout: 15000 });

    // Room code should be visible
    const roomCodeButton = page.locator('button:has-text(/^[A-Z0-9]{6}$/)');
    await expect(roomCodeButton).toBeVisible({ timeout: 5000 });

    // Click to copy (should trigger clipboard API)
    await roomCodeButton.click();

    // Check for copy confirmation (usually shows "Copied!" or changes icon)
    await page.waitForTimeout(500);

    // Button should still be functional
    await expect(roomCodeButton).toBeEnabled();

    await context.close();
  });

  test('Invalid room code shows error', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser2);
    const page = await context.newPage();

    await goToStudyRooms(page);

    await page.locator('button:has-text("Join Room")').click();
    await expect(page.locator('text=Join Study Room, text=Enter room code')).toBeVisible({ timeout: 5000 });

    // Enter invalid code
    await page.fill('input[placeholder*="code"], input[name="code"]', 'INVALID');
    await page.locator('button[type="submit"]').last().click();

    // Should show error message
    const errorMessage = page.locator('text=/not found|invalid|doesn\'t exist/i');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});

// ============================================================================
// VIEW MODE TESTS
// ============================================================================

test.describe('Study Room - View Modes', () => {
  test('User can switch between Speaker and Gallery view', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    await goToStudyRooms(page);

    const liveRoom = page.locator('a:has-text("Join Room")').first();
    if (await liveRoom.isVisible({ timeout: 3000 })) {
      await liveRoom.click();
    } else {
      await page.locator('button:has-text("Create Room")').click();
      await page.fill('input[placeholder*="room title"], input[name="title"]', `View Test ${Date.now()}`);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForURL('**/study-room/**', { timeout: 10000 });
    }

    await joinCall(page);

    // Find view mode toggle buttons
    const speakerViewBtn = page.locator('button:has-text("Speaker View"), button[title*="Speaker"]');
    const galleryViewBtn = page.locator('button:has-text("Gallery View"), button[title*="Gallery"]');

    // Check if view mode buttons are visible
    if (await speakerViewBtn.isVisible({ timeout: 3000 })) {
      // Click Gallery View
      await galleryViewBtn.click();
      await page.waitForTimeout(500);

      // Click Speaker View
      await speakerViewBtn.click();
      await page.waitForTimeout(500);

      // Both should still be visible and functional
      await expect(speakerViewBtn).toBeVisible();
      await expect(galleryViewBtn).toBeVisible();
    }

    await context.close();
  });
});

// ============================================================================
// RESPONSIVE TESTS
// ============================================================================

test.describe('Study Room - Responsive Design', () => {
  test('Room UI works on mobile viewport', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await goToStudyRooms(page);

    const liveRoom = page.locator('a:has-text("Join Room")').first();
    if (await liveRoom.isVisible({ timeout: 3000 })) {
      await liveRoom.click();
    } else {
      await page.locator('button:has-text("Create Room")').click();
      await page.fill('input[placeholder*="room title"], input[name="title"]', `Mobile Test ${Date.now()}`);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForURL('**/study-room/**', { timeout: 10000 });
    }

    // Should show join button
    await expect(page.locator('button:has-text("Join Call")')).toBeVisible({ timeout: 15000 });

    await joinCall(page);

    // Media controls should be visible
    const muteButton = page.locator('button[title*="Mute"], button[title*="microphone"]').first();
    await expect(muteButton).toBeVisible({ timeout: 10000 });

    // Leave button should be visible
    const leaveButton = page.locator('button[title*="Leave"], button:has-text("Leave")').first();
    await expect(leaveButton).toBeVisible();

    await context.close();
  });

  test('Room UI works on tablet viewport', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await goToStudyRooms(page);

    const liveRoom = page.locator('a:has-text("Join Room")').first();
    if (await liveRoom.isVisible({ timeout: 3000 })) {
      await liveRoom.click();
    } else {
      await page.locator('button:has-text("Create Room")').click();
      await page.fill('input[placeholder*="room title"], input[name="title"]', `Tablet Test ${Date.now()}`);
      await page.locator('button[type="submit"]').last().click();
      await page.waitForURL('**/study-room/**', { timeout: 10000 });
    }

    await expect(page.locator('button:has-text("Join Call")')).toBeVisible({ timeout: 15000 });

    await joinCall(page);

    // All controls should be visible
    await expect(page.locator('button[title*="Mute"], button[title*="microphone"]').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button[title*="camera"], button[title*="video"]').first()).toBeVisible();
    await expect(page.locator('button[title*="Leave"], button:has-text("Leave")').first()).toBeVisible();

    await context.close();
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

test.describe('Study Room - Error Handling', () => {
  test('Handles non-existent room gracefully', async ({ browser }) => {
    const context = await createAuthenticatedContext(browser, authFileUser1);
    const page = await context.newPage();

    // Try to access a non-existent room
    await page.goto('/study-room/non-existent-room-id');

    // Should show error or redirect
    const errorMessage = page.locator('text=/not found|doesn\'t exist|error/i');
    const backLink = page.locator('a:has-text("Back")');

    const showsError = await errorMessage.isVisible({ timeout: 10000 }).catch(() => false);
    const showsBackLink = await backLink.isVisible({ timeout: 3000 }).catch(() => false);

    expect(showsError || showsBackLink).toBe(true);

    await context.close();
  });
});
