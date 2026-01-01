import { test, expect } from '@playwright/test';

// Test user credentials (should match a test user in database)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpass123',
};

test.describe('YouTube Source Addition Flow', () => {
  // Skip UI tests that require authentication until test users are set up
  test.skip(({ }, testInfo) => true, 'Requires authentication setup');

  // Before each test, login and navigate to notebooks
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('/login');

    // Wait for the login form to load
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

    // Fill in login credentials
    await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);

    // Submit login form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard/notebooks
    await page.waitForURL('**/notebooks**', { timeout: 15000 });
  });

  test('should create a new notebook and add a YouTube source', async ({ page }) => {
    // Navigate to notebooks page
    await page.goto('/notebooks');

    // Click "Create Notebook" or similar button
    const createButton = page.getByRole('button', { name: /create|new notebook/i });
    await createButton.click();

    // Fill in notebook name
    const titleInput = page.getByPlaceholder(/notebook name|title/i);
    if (await titleInput.isVisible()) {
      await titleInput.fill('Test YouTube Notebook');
    }

    // Create the notebook
    const submitButton = page.getByRole('button', { name: /create/i });
    await submitButton.click();

    // Wait for notebook to be created and navigated to
    await page.waitForURL('**/notebooks/**', { timeout: 10000 });

    // Click "Add sources" button
    const addSourceButton = page.getByRole('button', { name: /add source/i });
    await addSourceButton.click();

    // Select YouTube source type
    const youtubeOption = page.getByText('YouTube Video');
    await youtubeOption.click();

    // Enter YouTube URL
    const urlInput = page.getByPlaceholder(/youtube\.com/i);
    await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ'); // Rick Astley - popular, likely has captions

    // Click Add Source button
    const addButton = page.getByRole('button', { name: /add source/i });
    await addButton.click();

    // Wait for modal to close or success
    await expect(page.getByText(/failed to fetch/i)).not.toBeVisible({ timeout: 15000 });

    // Verify source was added (either shows in list or shows processing)
    await expect(
      page.getByText(/youtube video|processing|completed/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('YouTube API endpoint returns valid data', async ({ request }) => {
    // Test the worker endpoint directly
    const response = await request.post(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/api/youtube/transcript',
      {
        data: {
          videoId: 'dQw4w9WgXcQ', // Rick Astley video - very popular, should have captions
        },
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('transcript');
    expect(data.title).toBeTruthy();
    // The transcript may or may not be available, but we should get a response
  });

  test('should handle YouTube URL validation', async ({ page }) => {
    // Navigate to a notebook (assuming one exists or create one)
    await page.goto('/notebooks');

    // If there's a notebook, click it; otherwise create one
    const firstNotebook = page.locator('.card, [data-testid="notebook-card"]').first();
    if (await firstNotebook.isVisible({ timeout: 3000 })) {
      await firstNotebook.click();
    } else {
      // Create a new notebook first
      const createButton = page.getByRole('button', { name: /create|new/i });
      await createButton.click();
      await page.waitForTimeout(1000);
    }

    // Wait for notebook page
    await page.waitForURL('**/notebooks/**');

    // Click add sources
    const addSourceButton = page.getByRole('button', { name: /add source/i });
    if (await addSourceButton.isVisible({ timeout: 5000 })) {
      await addSourceButton.click();

      // Select YouTube
      const youtubeOption = page.getByText('YouTube Video');
      await youtubeOption.click();

      // Enter invalid URL
      const urlInput = page.getByPlaceholder(/youtube/i);
      await urlInput.fill('https://not-youtube.com/video');

      // Check for warning
      await expect(
        page.getByText(/doesn't look like a YouTube URL/i)
      ).toBeVisible();
    }
  });
});

// Test the API endpoint directly (these don't require auth)
test.describe('YouTube API Tests', () => {
  test('Worker health check', async ({ request }) => {
    const response = await request.get(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/health'
    );

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('YouTube transcript endpoint - video with captions', async ({ request }) => {
    // Test with a well-known video that has captions
    const response = await request.post(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/api/youtube/transcript',
      {
        data: { videoId: 'jNQXAC9IVRw' }, // First YouTube video "Me at the zoo"
        timeout: 30000,
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('Transcript response:', JSON.stringify(data, null, 2));

    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('channelName');
    expect(data).toHaveProperty('transcript');
  });

  test('YouTube transcript endpoint - educational video', async ({ request }) => {
    // Test with an educational video likely to have captions
    const response = await request.post(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/api/youtube/transcript',
      {
        data: { videoId: 'fTv4S1q7p_c' }, // The video from user's screenshot
        timeout: 30000,
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    console.log('Educational video response:', JSON.stringify(data, null, 2));

    expect(data).toHaveProperty('title');
    expect(data.title).toContain('APUSH');
  });
});
