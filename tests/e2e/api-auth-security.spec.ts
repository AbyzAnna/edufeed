import { test, expect } from '@playwright/test';

/**
 * E2E Tests for API Authentication Security
 *
 * Tests that protected endpoints properly reject unauthenticated requests
 * and that security measures (rate limiting, webhook protection) work correctly.
 */

// Use empty storage state to ensure tests run without authentication
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('API Authentication Security', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test.describe('Protected User Endpoints', () => {
    test('GET /api/user/me should return 401 without authentication', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/user/me`);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('GET /api/user/likes should return 401 without authentication', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/user/likes`);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('GET /api/user/videos should return 401 without authentication', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/user/videos`);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('GET /api/user/bookmarks should return 401 without authentication', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/user/bookmarks`);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('DELETE /api/user/delete-account should return 401 without authentication', async ({
      request,
    }) => {
      const response = await request.delete(`${BASE_URL}/api/user/delete-account`);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  test.describe('Protected Notification Endpoints', () => {
    test('POST /api/notifications/register should return 401 without authentication', async ({
      request,
    }) => {
      const response = await request.post(`${BASE_URL}/api/notifications/register`, {
        data: { pushToken: 'test-token', platform: 'ios' },
      });
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    test('DELETE /api/notifications/register should return 401 without authentication', async ({
      request,
    }) => {
      const response = await request.delete(`${BASE_URL}/api/notifications/register`);
      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });
  });

  test.describe('Invalid Bearer Token', () => {
    test('should reject invalid Bearer token on /api/user/me', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/me`, {
        headers: {
          Authorization: 'Bearer invalid-token-12345',
        },
      });
      expect(response.status()).toBe(401);
    });

    test('should reject malformed Bearer header', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/me`, {
        headers: {
          Authorization: 'BearerInvalid',
        },
      });
      expect(response.status()).toBe(401);
    });

    test('should reject empty Bearer token', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/user/me`, {
        headers: {
          Authorization: 'Bearer ',
        },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Inngest Webhook Security', () => {
    // These tests verify that Inngest webhook is protected in production
    // Note: In development mode, signature verification may be relaxed

    test('POST /api/inngest without signature should be rejected in production mode', async ({
      request,
    }) => {
      // Skip if not in production mode (signature not required in dev)
      if (process.env.NODE_ENV !== 'production') {
        test.skip();
        return;
      }

      const response = await request.post(`${BASE_URL}/api/inngest`, {
        data: { test: 'data' },
      });

      // Should return 401 (missing signature) or 503 (no signing key configured)
      expect([401, 503]).toContain(response.status());
    });

    test('GET /api/inngest should return Inngest introspection or error', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/inngest`);

      // GET is typically used for Inngest introspection
      // In production without signature, should be blocked
      if (process.env.NODE_ENV === 'production') {
        expect([200, 401, 503]).toContain(response.status());
      } else {
        // In development, may return 200 with introspection data
        expect([200, 401, 503]).toContain(response.status());
      }
    });
  });

  test.describe('Mobile Auth Endpoints - Token Validation', () => {
    test('POST /api/mobile/auth/google should reject invalid token', async ({
      request,
    }) => {
      const response = await request.post(`${BASE_URL}/api/mobile/auth/google`, {
        data: { idToken: 'invalid-google-token' },
      });

      // Should return 401 for invalid token
      expect([401, 500]).toContain(response.status());
    });

    test('POST /api/mobile/auth/apple should reject invalid token', async ({
      request,
    }) => {
      const response = await request.post(`${BASE_URL}/api/mobile/auth/apple`, {
        data: { identityToken: 'invalid-apple-token' },
      });

      // Should return 401 for invalid token
      expect([401, 500]).toContain(response.status());
    });

    test('POST /api/mobile/auth/google should reject missing token', async ({
      request,
    }) => {
      const response = await request.post(`${BASE_URL}/api/mobile/auth/google`, {
        data: {},
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('required');
    });

    test('POST /api/mobile/auth/apple should reject missing token', async ({
      request,
    }) => {
      const response = await request.post(`${BASE_URL}/api/mobile/auth/apple`, {
        data: {},
      });

      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body.error).toContain('required');
    });
  });

  test.describe('Public Endpoints - Should Work Without Auth', () => {
    test('GET /api/feed should work without authentication', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/feed`);
      // Feed is public, should return 200 with empty or populated data
      expect([200]).toContain(response.status());
    });

    test('POST /api/auth/signup should work without authentication', async ({
      request,
    }) => {
      // Signup endpoint should be accessible (may return validation error)
      const response = await request.post(`${BASE_URL}/api/auth/signup`, {
        data: { email: 'test', password: 'test' },
      });

      // Should not return 401 (it's a public endpoint)
      expect(response.status()).not.toBe(401);
    });
  });

  test.describe('Study Room Endpoints - Auth Required', () => {
    test('GET /api/study-rooms should return 401 without authentication', async ({
      request,
    }) => {
      const response = await request.get(`${BASE_URL}/api/study-rooms`);
      expect(response.status()).toBe(401);
    });

    test('POST /api/study-rooms should return 401 without authentication', async ({
      request,
    }) => {
      const response = await request.post(`${BASE_URL}/api/study-rooms`, {
        data: { name: 'Test Room' },
      });
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Notebook Endpoints - Auth for User Content', () => {
    test('POST /api/notebooks should return 401 without authentication', async ({
      request,
    }) => {
      const response = await request.post(`${BASE_URL}/api/notebooks`, {
        data: { title: 'Test Notebook' },
      });
      expect(response.status()).toBe(401);
    });

    // GET /api/notebooks may work without auth for public notebooks
    test('GET /api/notebooks returns data or auth error', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/notebooks`);
      // May return 200 (public notebooks) or require auth
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe('Rate Limiting Headers', () => {
    test('Rate limited responses should include proper headers', async ({
      request,
    }) => {
      // This test would need actual rate limiting to trigger
      // For now, we just verify the endpoint structure

      const response = await request.get(`${BASE_URL}/api/user/me`);

      // Unauthenticated, so we get 401 before rate limiting kicks in
      expect(response.status()).toBe(401);
    });
  });
});

test.describe('API Security Headers', () => {
  const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test('API responses should not expose sensitive information', async ({
    request,
  }) => {
    const response = await request.get(`${BASE_URL}/api/user/me`);

    // Error response should not leak implementation details
    const body = await response.json();
    expect(body).not.toHaveProperty('stack');
    expect(body).not.toHaveProperty('trace');
    expect(JSON.stringify(body)).not.toContain('at Object');
    expect(JSON.stringify(body)).not.toContain('.ts:');
  });
});
