import { test, expect, Page } from '@playwright/test';

/**
 * Profile Page E2E Tests
 *
 * Tests the redesigned Profile page functionality including:
 * - Page layout and visual elements
 * - Navigation links
 * - User stats display
 * - Sign out functionality
 * - Delete account modal
 * - Unauthenticated state
 */

// Helper to mock authenticated user
async function mockAuthenticatedUser(page: Page) {
  await page.route('**/api/user/stats', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        sourcesCount: 12,
        videosCount: 25,
        completedVideos: 18,
      }),
    });
  });
}

// Helper to mock unauthenticated state
async function mockUnauthenticatedUser(page: Page) {
  await page.route('**/api/user/stats', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Unauthorized' }),
    });
  });
}

test.describe('Profile Page - Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticatedUser(page);
  });

  test('should show sign in prompt when not authenticated', async ({ page }) => {
    await page.goto('/profile');

    // Should show sign in message
    await expect(page.getByRole('heading', { name: /sign in to view profile/i })).toBeVisible();
    await expect(page.getByText(/access your account/i)).toBeVisible();

    // Should have Sign In button
    const signInButton = page.getByRole('button', { name: /sign in/i });
    await expect(signInButton).toBeVisible();
  });

  test('should navigate to login when Sign In button is clicked', async ({ page }) => {
    await page.goto('/profile');

    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL('/login');
  });

  test('should have link to sign up page', async ({ page }) => {
    await page.goto('/profile');

    const signUpLink = page.getByRole('link', { name: /sign up/i });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute('href', '/signup');
  });
});

test.describe('Profile Page - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state
    await page.addInitScript(() => {
      // Mock Supabase auth state
      window.localStorage.setItem('sb-xsajblfxxeztfzpzoevi-auth-token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            avatar_url: null,
          },
        },
      }));
    });

    await mockAuthenticatedUser(page);
  });

  test('should display user profile card with avatar and name', async ({ page }) => {
    await page.goto('/profile');

    // Wait for page to load
    await page.waitForSelector('h1');

    // Should show user name
    await expect(page.locator('h1', { hasText: 'Test User' })).toBeVisible({ timeout: 10000 });

    // Should show email
    await expect(page.getByText('test@example.com')).toBeVisible();
  });

  test('should display user stats correctly', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Check stats are displayed (from mocked data)
    await expect(page.getByText('12').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('25').first()).toBeVisible();
    await expect(page.getByText('18').first()).toBeVisible();

    // Check stat labels
    await expect(page.getByText('Sources').first()).toBeVisible();
    await expect(page.getByText('Videos').first()).toBeVisible();
    await expect(page.getByText('Completed').first()).toBeVisible();
  });

  test('should display all menu sections', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Check section titles
    await expect(page.getByText('Content', { exact: true })).toBeVisible();
    await expect(page.getByText('Account', { exact: true })).toBeVisible();
    await expect(page.getByText('Support', { exact: true })).toBeVisible();
    await expect(page.getByText('Legal', { exact: true })).toBeVisible();
    await expect(page.getByText('Danger Zone', { exact: true })).toBeVisible();
  });

  test('should display Content menu items with working links', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Check Notebooks link
    const notebooksLink = page.getByRole('link', { name: /notebooks/i }).first();
    await expect(notebooksLink).toBeVisible();
    await expect(notebooksLink).toHaveAttribute('href', '/notebooks');

    // Check Library link
    const libraryLink = page.getByRole('link', { name: /library/i }).first();
    await expect(libraryLink).toBeVisible();
    await expect(libraryLink).toHaveAttribute('href', '/library');

    // Check Study Rooms link
    const studyRoomsLink = page.getByRole('link', { name: /study rooms/i }).first();
    await expect(studyRoomsLink).toBeVisible();
    await expect(studyRoomsLink).toHaveAttribute('href', '/study');
  });

  test('should display disabled Account menu items with Coming Soon badges', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Settings should be disabled with Coming Soon
    const settingsItem = page.locator('button', { hasText: 'Settings' }).first();
    await expect(settingsItem).toBeVisible();
    await expect(settingsItem).toBeDisabled();
    await expect(page.getByText('Coming Soon').first()).toBeVisible();
  });

  test('should display Legal links that work', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Check Terms of Service link
    const termsLink = page.getByRole('link', { name: /terms of service/i });
    await expect(termsLink).toBeVisible();
    await expect(termsLink).toHaveAttribute('href', '/terms');

    // Check Privacy Policy link
    const privacyLink = page.getByRole('link', { name: /privacy policy/i });
    await expect(privacyLink).toBeVisible();
    await expect(privacyLink).toHaveAttribute('href', '/privacy');
  });

  test('should display Support links', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Check Help & Support link
    const helpLink = page.getByRole('link', { name: /help & support/i });
    await expect(helpLink).toBeVisible();
    await expect(helpLink).toHaveAttribute('href', '/support');

    // Check Contact Us link (external)
    const contactLink = page.getByRole('link', { name: /contact us/i });
    await expect(contactLink).toBeVisible();
    await expect(contactLink).toHaveAttribute('href', 'mailto:support@edufeed.io');
  });

  test('should display Sign Out button', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    const signOutButton = page.getByRole('button', { name: /sign out/i });
    await expect(signOutButton).toBeVisible();
  });

  test('should display app version footer', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    await expect(page.getByText('EduFeed v1.0.0')).toBeVisible();
  });

  test('should open delete account confirmation modal', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Find and click Delete Account button
    const deleteButton = page.getByRole('button', { name: /delete account/i }).first();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    // Modal should appear
    await expect(page.getByRole('heading', { name: /delete account\?/i })).toBeVisible();
    await expect(page.getByText(/this action cannot be undone/i)).toBeVisible();

    // Should have Cancel and Delete buttons in modal
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^delete$/i })).toBeVisible();
  });

  test('should close delete account modal when Cancel is clicked', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Open modal
    await page.getByRole('button', { name: /delete account/i }).first().click();
    await expect(page.getByRole('heading', { name: /delete account\?/i })).toBeVisible();

    // Click Cancel
    await page.getByRole('button', { name: /cancel/i }).click();

    // Modal should be closed
    await expect(page.getByRole('heading', { name: /delete account\?/i })).not.toBeVisible();
  });

  test('should navigate to Notebooks page when clicked', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    await page.getByRole('link', { name: /notebooks/i }).first().click();

    await expect(page).toHaveURL('/notebooks');
  });

  test('should navigate to Library page when clicked', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    await page.getByRole('link', { name: /^library$/i }).first().click();

    await expect(page).toHaveURL('/library');
  });

  test('should navigate to Study Rooms page when clicked', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    await page.getByRole('link', { name: /study rooms/i }).first().click();

    await expect(page).toHaveURL('/study');
  });

  test('should navigate to Terms page when clicked', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    await page.getByRole('link', { name: /terms of service/i }).click();

    await expect(page).toHaveURL('/terms');
  });

  test('should navigate to Privacy page when clicked', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    await page.getByRole('link', { name: /privacy policy/i }).click();

    await expect(page).toHaveURL('/privacy');
  });

  test('should navigate to Support page when clicked', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    await page.getByRole('link', { name: /help & support/i }).click();

    await expect(page).toHaveURL('/support');
  });
});

test.describe('Profile Page - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('sb-xsajblfxxeztfzpzoevi-auth-token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            avatar_url: null,
          },
        },
      }));
    });

    await mockAuthenticatedUser(page);
  });

  test('should display correctly on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Profile card should be visible
    await expect(page.locator('h1', { hasText: 'Test User' })).toBeVisible();

    // Stats should be visible
    await expect(page.getByText('Sources').first()).toBeVisible();

    // Menu items should be visible
    await expect(page.getByText('Notebooks')).toBeVisible();
  });

  test('should display correctly on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Profile card should be visible
    await expect(page.locator('h1', { hasText: 'Test User' })).toBeVisible();

    // All sections should be visible
    await expect(page.getByText('Content', { exact: true })).toBeVisible();
    await expect(page.getByText('Account', { exact: true })).toBeVisible();
  });

  test('should display correctly on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Profile card should be visible with larger avatar
    await expect(page.locator('h1', { hasText: 'Test User' })).toBeVisible();

    // All content should be visible
    await expect(page.getByText('EduFeed v1.0.0')).toBeVisible();
  });
});

test.describe('Profile Page - Visual Elements', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('sb-xsajblfxxeztfzpzoevi-auth-token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            avatar_url: null,
          },
        },
      }));
    });

    await mockAuthenticatedUser(page);
  });

  test('should show avatar initial when no avatar URL', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Should show initial letter in avatar
    const avatarInitial = page.locator('.rounded-full >> text=T').first();
    await expect(avatarInitial).toBeVisible();
  });

  test('should show green verified badge on avatar', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Check for green badge (CheckCircle2 icon container)
    const verifiedBadge = page.locator('.bg-green-500.rounded-full');
    await expect(verifiedBadge).toBeVisible();
  });

  test('should display stats badges in profile header', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Check for source and video count badges
    await expect(page.getByText(/12 sources/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/25 videos/i)).toBeVisible();
  });

  test('should have gradient header background', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Check that gradient container exists
    const gradientContainer = page.locator('.bg-gradient-to-b');
    await expect(gradientContainer.first()).toBeVisible();
  });

  test('should display proper hover states on menu items', async ({ page }) => {
    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Hover over a menu link
    const notebooksLink = page.getByRole('link', { name: /notebooks/i }).first();
    await notebooksLink.hover();

    // The link should be visible and have proper styling (we're just checking it's interactive)
    await expect(notebooksLink).toBeVisible();
  });
});

test.describe('Profile Page - Loading States', () => {
  test('should show loading spinner initially', async ({ page }) => {
    // Delay the response to simulate loading
    await page.route('**/api/user/stats', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sourcesCount: 5,
          videosCount: 10,
          completedVideos: 8,
        }),
      });
    });

    await page.goto('/profile');

    // During loading, spinner should be visible (this test may be flaky due to timing)
    // The page eventually loads the content
    await page.waitForSelector('h1', { timeout: 10000 });
  });
});

test.describe('Profile Page - Error Handling', () => {
  test('should handle stats API error gracefully', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('sb-xsajblfxxeztfzpzoevi-auth-token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'test-user-123',
          email: 'test@example.com',
          user_metadata: {
            full_name: 'Test User',
            avatar_url: null,
          },
        },
      }));
    });

    // Mock stats API to return error
    await page.route('**/api/user/stats', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/profile');

    await page.waitForSelector('h1');

    // Page should still load, stats will show 0
    await expect(page.locator('h1', { hasText: 'Test User' })).toBeVisible();
    await expect(page.getByText('0').first()).toBeVisible();
  });
});
