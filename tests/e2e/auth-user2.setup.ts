import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user2.json');

// Second test user credentials
const TEST_EMAIL = process.env.E2E_TEST_EMAIL_USER2 || 'testuser2@edufeed.app';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD_USER2 || 'TestUser2$';

/**
 * Authentication setup for second test user (E2E tests)
 *
 * This user is used for multi-user collaboration testing
 * (e.g., study rooms with 2 participants)
 */
setup('authenticate user 2', async ({ page }) => {
  console.log('[Auth Setup User 2] Starting authentication...');

  // Navigate to login page
  await page.goto('/login');

  // Wait for the login form to be ready
  await page.waitForSelector('#email', { timeout: 10000 });
  console.log('[Auth Setup User 2] Login page loaded');

  // Fill in email
  await page.fill('#email', TEST_EMAIL);

  // Fill in password
  await page.fill('#password', TEST_PASSWORD);

  // Click submit button
  await page.click('button[type="submit"]');
  console.log('[Auth Setup User 2] Submitted login form');

  // Wait for successful redirect to notebooks (or any authenticated page)
  try {
    await page.waitForURL('**/notebooks**', { timeout: 15000 });
    console.log('[Auth Setup User 2] Successfully logged in and redirected to notebooks');
  } catch (error) {
    // Check for error message on page
    const errorElement = page.locator('.bg-red-500\\/10');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.error(`[Auth Setup User 2] Login failed with error: ${errorText}`);
      throw new Error(`Login failed: ${errorText}`);
    }
    throw error;
  }

  // Wait a bit for session to be fully established
  await page.waitForTimeout(1000);

  // Verify we're authenticated by checking for user elements
  const userIndicator = page.locator('text=Sign Out, [data-testid="user-menu"], img[alt*="avatar"]').first();
  const isAuthenticated = await userIndicator.isVisible({ timeout: 5000 }).catch(() => false);

  if (!isAuthenticated) {
    // Alternative check - ensure we're on an authenticated page
    const url = page.url();
    if (!url.includes('/notebooks')) {
      throw new Error('Authentication may have failed - not on expected page');
    }
  }

  console.log('[Auth Setup User 2] Authentication verified');

  // Save the authentication state
  await page.context().storageState({ path: authFile });
  console.log(`[Auth Setup User 2] Saved auth state to ${authFile}`);
});
