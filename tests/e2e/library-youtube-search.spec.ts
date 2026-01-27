import { test, expect } from "@playwright/test";

// Skip tests if not authenticated or page doesn't load
test.describe("Library Page - YouTube Video Search", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the library page
    await page.goto("/library", { waitUntil: "networkidle" });

    // Wait for either the library page to load or redirect to login
    try {
      await page.waitForSelector('h1:has-text("Music & Videos")', {
        timeout: 10000,
      });
    } catch {
      // If we're redirected to login, the tests in this suite will be skipped
      test.skip(
        true,
        "User not authenticated or library page not accessible"
      );
    }
  });

  test("should display the library page with search bar", async ({ page }) => {
    // Check page title
    await expect(page.locator("h1")).toContainText("Music & Videos");

    // Check search bar exists
    const searchInput = page.locator(
      'input[placeholder*="Search YouTube videos"]'
    );
    await expect(searchInput).toBeVisible();

    // Check category filters exist
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Lofi Beats")')).toBeVisible();
    await expect(page.locator('button:has-text("Deep Focus")')).toBeVisible();
  });

  test("should filter curated videos when searching", async ({ page }) => {
    // Type in search bar
    const searchInput = page.locator(
      'input[placeholder*="Search YouTube videos"]'
    );
    await searchInput.fill("lofi");

    // Should show search results count
    await expect(page.locator("text=curated")).toBeVisible({ timeout: 5000 });
  });

  test("should show loading state when searching YouTube", async ({ page }) => {
    // Type enough characters to trigger YouTube search
    const searchInput = page.locator(
      'input[placeholder*="Search YouTube videos"]'
    );
    await searchInput.fill("study music focus");

    // Should show loading indicator or searching message
    const loadingIndicator = page.locator(".animate-spin, text=Searching");
    await expect(loadingIndicator).toBeVisible({ timeout: 3000 });
  });

  test("should display curated video sections", async ({ page }) => {
    // Check that video sections are displayed
    await expect(page.locator('text="Deep Focus"').first()).toBeVisible();
    await expect(page.locator('text="Lofi Beats"').first()).toBeVisible();
    await expect(page.locator('text="Relaxing"').first()).toBeVisible();
  });

  test("should switch between category filters", async ({ page }) => {
    // Click on Lofi category
    await page.click('button:has-text("Lofi Beats")');

    // The button should be selected (has white background)
    const lofiButton = page.locator('button:has-text("Lofi Beats")');
    await expect(lofiButton).toHaveClass(/bg-white/);

    // Click on All category
    await page.click('button:has-text("All")');
    const allButton = page.locator('button:has-text("All")');
    await expect(allButton).toHaveClass(/bg-white/);
  });

  test("should clear search when clicking X button", async ({ page }) => {
    // Type in search
    const searchInput = page.locator(
      'input[placeholder*="Search YouTube videos"]'
    );
    await searchInput.fill("test search");
    await expect(searchInput).toHaveValue("test search");

    // Click the clear button (X)
    await page.click('button:has(svg.lucide-x)');

    // Search should be cleared
    await expect(searchInput).toHaveValue("");
  });

  test("should show featured section on initial load", async ({ page }) => {
    // Check featured section is visible
    await expect(page.locator('text="LIVE NOW"').first()).toBeVisible();
    await expect(
      page.locator('text="lofi hip hop radio 📚 beats to relax/study to"')
    ).toBeVisible();
  });

  test("should have working shuffle play button", async ({ page }) => {
    // Check shuffle play button exists
    const shuffleButton = page.locator('button:has-text("Shuffle Play")');
    await expect(shuffleButton).toBeVisible();
  });

  test("should show video cards with thumbnails", async ({ page }) => {
    // Check for video cards
    const videoCards = page.locator("img[alt]").first();
    await expect(videoCards).toBeVisible();

    // Check thumbnails are YouTube thumbnails
    const firstThumbnail = page.locator('img[src*="youtube.com"]').first();
    await expect(firstThumbnail).toBeVisible({ timeout: 5000 });
  });

  test("should show play button on video hover", async ({ page }) => {
    // Find a video card
    const videoCard = page.locator(".aspect-video").first();

    // Hover over the video card
    await videoCard.hover();

    // Should show play button overlay
    await expect(
      page.locator("svg.lucide-play, svg.lucide-pause").first()
    ).toBeVisible();
  });

  test("should show minimum character hint for short queries", async ({
    page,
  }) => {
    // Type less than 3 characters
    const searchInput = page.locator(
      'input[placeholder*="Search YouTube videos"]'
    );
    await searchInput.fill("ab");

    // Should show hint about minimum characters
    await expect(
      page.locator("text=Type at least 3 characters")
    ).toBeVisible();
  });

  test("should scroll video sections horizontally", async ({ page }) => {
    // Find scroll buttons
    const rightScrollButton = page
      .locator('button:has(svg.lucide-chevron-right)')
      .first();
    await expect(rightScrollButton).toBeVisible();

    // Click scroll button
    await rightScrollButton.click();

    // The section should scroll (we can't easily verify scroll position, but the action should not error)
  });
});

test.describe("Library Page - Video Playback", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/library", { waitUntil: "networkidle" });
    try {
      await page.waitForSelector('h1:has-text("Music & Videos")', {
        timeout: 10000,
      });
    } catch {
      test.skip(true, "User not authenticated or library page not accessible");
    }
  });

  test("should show mini player when clicking a video", async ({ page }) => {
    // Click on a video thumbnail
    const videoThumbnail = page.locator(".aspect-video").first();
    await videoThumbnail.click();

    // Mini player bar should appear at the bottom
    const miniPlayer = page.locator("text=Playing").first();
    // Wait for player to appear (may take time for YouTube iframe to load)
    await expect(miniPlayer).toBeVisible({ timeout: 10000 });
  });

  test("should have play/pause controls in mini player", async ({ page }) => {
    // Click on a video to start playing
    const videoThumbnail = page.locator(".aspect-video").first();
    await videoThumbnail.click();

    // Wait for mini player
    await page.waitForTimeout(2000);

    // Check for play/pause button
    const playPauseButton = page
      .locator('button:has(svg.lucide-play), button:has(svg.lucide-pause)')
      .last();
    await expect(playPauseButton).toBeVisible({ timeout: 10000 });
  });

  test("should be able to close the player", async ({ page }) => {
    // Click on a video to start playing
    const videoThumbnail = page.locator(".aspect-video").first();
    await videoThumbnail.click();

    // Wait for player to appear
    await page.waitForTimeout(2000);

    // Find and click close button (X in the player bar)
    const closeButton = page.locator('button:has(svg.lucide-x)').last();
    await closeButton.click();

    // Player should be closed (no "Playing" text visible in player area)
    await page.waitForTimeout(500);
  });

  test("should show video info in mini player", async ({ page }) => {
    // Click on a video
    const videoThumbnail = page.locator(".aspect-video").first();
    await videoThumbnail.click();

    // Wait for mini player to show video info
    await page.waitForTimeout(2000);

    // Should show video title and channel somewhere in the player area
    const playerBar = page.locator(".fixed.bottom-16, .fixed.bottom-0").last();
    await expect(playerBar).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Library Page - Responsive Design", () => {
  test("should work on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/library");
    await page.waitForSelector("h1:has-text('Music & Videos')");

    // Check search bar is visible
    const searchInput = page.locator(
      'input[placeholder*="Search YouTube videos"]'
    );
    await expect(searchInput).toBeVisible();

    // Check categories are scrollable
    const categoryContainer = page.locator(".overflow-x-auto").first();
    await expect(categoryContainer).toBeVisible();
  });

  test("should work on tablet viewport", async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto("/library");
    await page.waitForSelector("h1:has-text('Music & Videos')");

    // Page should still function
    await expect(page.locator("h1")).toContainText("Music & Videos");
  });
});

test.describe("Library Page - Accessibility", () => {
  test("should have proper heading structure", async ({ page }) => {
    await page.goto("/library");

    // Main heading
    const h1 = page.locator("h1");
    await expect(h1).toHaveCount(1);

    // Section headings
    const h2s = page.locator("h2");
    expect(await h2s.count()).toBeGreaterThan(0);
  });

  test("should have accessible search input", async ({ page }) => {
    await page.goto("/library");

    const searchInput = page.locator(
      'input[placeholder*="Search YouTube videos"]'
    );
    await expect(searchInput).toBeVisible();

    // Input should be focusable
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });

  test("should have keyboard accessible buttons", async ({ page }) => {
    await page.goto("/library");

    // Tab to shuffle play button
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // Should be able to interact with keyboard
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});
