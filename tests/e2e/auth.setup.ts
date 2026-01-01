import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

/**
 * Authentication setup for E2E tests
 *
 * This sets up the e2e-test-mode cookie which bypasses server-side auth
 * in the middleware for testing purposes.
 */
setup('authenticate', async ({ page }) => {
  // Navigate to the base URL first
  await page.goto('/');

  // Set the e2e-test-mode cookie to bypass middleware auth
  await page.context().addCookies([
    {
      name: 'e2e-test-mode',
      value: 'true',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  // Save storage state with the test mode cookie
  await page.context().storageState({ path: authFile });
});
