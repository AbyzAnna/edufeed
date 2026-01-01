import { test, expect } from '@playwright/test';

/**
 * E2E tests for YouTube source integration
 * Tests the full flow from API to worker to response
 */
test.describe('YouTube Source API Integration', () => {

  test('Worker health check is available', async ({ request }) => {
    const response = await request.get(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/health'
    );

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('YouTube transcript endpoint returns valid response structure', async ({ request }) => {
    const response = await request.post(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/api/youtube/transcript',
      {
        data: { videoId: 'dQw4w9WgXcQ' },
        timeout: 45000,
      }
    );

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('transcript');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('channelName');
    expect(data).toHaveProperty('hasTranscript');
    expect(data).toHaveProperty('wordCount');

    // Verify data types
    expect(typeof data.transcript).toBe('string');
    expect(typeof data.title).toBe('string');
    expect(typeof data.channelName).toBe('string');
    expect(typeof data.hasTranscript).toBe('boolean');
    expect(typeof data.wordCount).toBe('number');

    // Verify content
    expect(data.title.toLowerCase()).toContain('rick');
    expect(data.transcript.length).toBeGreaterThan(100);
    expect(data.wordCount).toBeGreaterThan(50);
  });

  test('YouTube transcript extracts actual captions when available', async ({ request }) => {
    // Test with a video known to have captions
    const response = await request.post(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/api/youtube/transcript',
      {
        data: { videoId: 'dQw4w9WgXcQ' },
        timeout: 45000,
      }
    );

    const data = await response.json();

    // This video should have transcripts
    expect(data.hasTranscript).toBe(true);

    // Should contain actual lyrics, not AI summary
    expect(data.transcript.toLowerCase()).toContain('never gonna give you up');
    expect(data.transcript).not.toContain('[Note: Auto-generated captions');
  });

  test('YouTube transcript provides fallback for videos without captions', async ({ request }) => {
    // Test with an educational video
    const response = await request.post(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/api/youtube/transcript',
      {
        data: { videoId: 'fTv4S1q7p_c' },
        timeout: 45000,
      }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should have title and channel
    expect(data.title).toContain('APUSH');
    expect(data.channelName).toBe("Heimler's History");

    // Should have some content (either transcript or AI summary)
    expect(data.transcript.length).toBeGreaterThan(50);
    expect(data.wordCount).toBeGreaterThan(10);
  });

  test('YouTube transcript handles invalid videoId gracefully', async ({ request }) => {
    const response = await request.post(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/api/youtube/transcript',
      {
        data: { videoId: 'invalid123456' },
        timeout: 30000,
      }
    );

    // Should still return 200 with fallback content
    expect(response.status()).toBe(200);
    const data = await response.json();

    // Should have basic structure
    expect(data).toHaveProperty('transcript');
    expect(data).toHaveProperty('title');
  });

  test('YouTube transcript handles missing videoId', async ({ request }) => {
    const response = await request.post(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/api/youtube/transcript',
      {
        data: {},
        timeout: 10000,
      }
    );

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Missing videoId');
  });

  test('YouTube key moments endpoint works', async ({ request }) => {
    const response = await request.post(
      'https://edufeed-ai-worker.steep-mouse-b843.workers.dev/api/youtube/key-moments',
      {
        data: {
          title: 'How to Learn Programming',
          description: 'A comprehensive guide to learning programming from scratch',
          targetDuration: 60,
        },
        timeout: 30000,
      }
    );

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(data).toHaveProperty('keyMoments');
    expect(Array.isArray(data.keyMoments)).toBe(true);
    expect(data.keyMoments.length).toBeGreaterThan(0);

    // Check key moment structure
    const moment = data.keyMoments[0];
    expect(moment).toHaveProperty('startTime');
    expect(moment).toHaveProperty('endTime');
    expect(moment).toHaveProperty('title');
    expect(moment).toHaveProperty('importance');
  });
});

/**
 * Test the Next.js API route integration
 */
test.describe('Next.js YouTube Source Integration', () => {

  test.skip('Notebook source API accepts YouTube source', async ({ request }) => {
    // This test is skipped by default as it requires authentication
    // Enable and configure when you have test credentials

    const response = await request.post(
      'http://localhost:3000/api/notebooks/test-notebook/sources',
      {
        data: {
          type: 'YOUTUBE',
          title: 'Test YouTube Video',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
        headers: {
          'Cookie': 'your-auth-cookie-here',
        },
      }
    );

    // Without auth, should return 401
    expect(response.status()).toBe(401);
  });
});
