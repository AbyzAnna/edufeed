import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkRateLimit,
  isRateLimited,
  rateLimiters,
  getRateLimitStats,
} from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  // Note: We can't easily reset the in-memory store between tests
  // so we use unique identifiers per test

  describe('checkRateLimit', () => {
    it('should allow requests within limit', () => {
      const identifier = `test-user-${Date.now()}-allow`;
      const config = { windowMs: 60000, maxRequests: 5 };

      // First request should be allowed
      const result1 = checkRateLimit('test-endpoint', identifier, config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      // Second request should be allowed
      const result2 = checkRateLimit('test-endpoint', identifier, config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it('should block requests when limit exceeded', () => {
      const identifier = `test-user-${Date.now()}-block`;
      const config = { windowMs: 60000, maxRequests: 3 };

      // Use up all requests
      checkRateLimit('test-endpoint-block', identifier, config);
      checkRateLimit('test-endpoint-block', identifier, config);
      checkRateLimit('test-endpoint-block', identifier, config);

      // Fourth request should be blocked
      const result = checkRateLimit('test-endpoint-block', identifier, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should track separate limits for different endpoints', () => {
      const identifier = `test-user-${Date.now()}-endpoints`;
      const config = { windowMs: 60000, maxRequests: 2 };

      // Use up requests on endpoint A
      checkRateLimit('endpoint-a', identifier, config);
      checkRateLimit('endpoint-a', identifier, config);
      const resultA = checkRateLimit('endpoint-a', identifier, config);
      expect(resultA.allowed).toBe(false);

      // Endpoint B should still have capacity
      const resultB = checkRateLimit('endpoint-b', identifier, config);
      expect(resultB.allowed).toBe(true);
    });

    it('should track separate limits for different identifiers', () => {
      const config = { windowMs: 60000, maxRequests: 2 };

      const user1 = `user1-${Date.now()}`;
      const user2 = `user2-${Date.now()}`;

      // Use up user1's limit
      checkRateLimit('shared-endpoint', user1, config);
      checkRateLimit('shared-endpoint', user1, config);
      const result1 = checkRateLimit('shared-endpoint', user1, config);
      expect(result1.allowed).toBe(false);

      // User2 should still have capacity
      const result2 = checkRateLimit('shared-endpoint', user2, config);
      expect(result2.allowed).toBe(true);
    });

    it('should return reset time in the future', () => {
      const identifier = `test-user-${Date.now()}-reset`;
      const config = { windowMs: 60000, maxRequests: 5 };

      const result = checkRateLimit('test-reset', identifier, config);
      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.resetTime).toBeLessThanOrEqual(Date.now() + 60000);
    });
  });

  describe('isRateLimited', () => {
    it('should return false when not rate limited', () => {
      const identifier = `test-user-${Date.now()}-not-limited`;
      const config = { windowMs: 60000, maxRequests: 10 };

      const result = isRateLimited('is-limited-test', identifier, config);
      expect(result).toBe(false);
    });

    it('should return true when rate limited', () => {
      const identifier = `test-user-${Date.now()}-is-limited`;
      const config = { windowMs: 60000, maxRequests: 1 };

      // Use up the limit
      checkRateLimit('is-limited-endpoint', identifier, config);

      // Now should be rate limited
      const result = isRateLimited('is-limited-endpoint', identifier, config);
      expect(result).toBe(true);
    });
  });

  describe('rateLimiters presets', () => {
    it('userProfile should allow 60 requests per minute', () => {
      const identifier = `test-user-profile-${Date.now()}`;

      // First request should be allowed
      const result = rateLimiters.userProfile(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
    });

    it('accountDelete should allow 5 requests per hour', () => {
      const identifier = `test-delete-${Date.now()}`;

      // First request should be allowed
      const result = rateLimiters.accountDelete(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('signup should allow 5 requests per 15 minutes', () => {
      const identifier = `test-signup-${Date.now()}`;

      const result = rateLimiters.signup(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('login should allow 10 requests per 15 minutes', () => {
      const identifier = `test-login-${Date.now()}`;

      const result = rateLimiters.login(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('api should allow 60 requests per minute', () => {
      const identifier = `test-api-${Date.now()}`;

      const result = rateLimiters.api(identifier);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(59);
    });
  });

  describe('getRateLimitStats', () => {
    it('should return stats for rate limit maps', () => {
      const identifier = `stats-test-${Date.now()}`;
      const config = { windowMs: 60000, maxRequests: 10 };

      // Make a request to create an entry
      checkRateLimit('stats-endpoint', identifier, config);

      const stats = getRateLimitStats();
      expect(stats).toHaveProperty('stats-endpoint');
      expect(stats['stats-endpoint'].size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty identifier', () => {
      const config = { windowMs: 60000, maxRequests: 5 };

      const result = checkRateLimit('empty-id-test', '', config);
      expect(result.allowed).toBe(true);
    });

    it('should handle very short window', () => {
      const identifier = `short-window-${Date.now()}`;
      const config = { windowMs: 1, maxRequests: 5 };

      const result = checkRateLimit('short-window-test', identifier, config);
      expect(result.allowed).toBe(true);
    });

    it('should handle single request limit', () => {
      const identifier = `single-limit-${Date.now()}`;
      const config = { windowMs: 60000, maxRequests: 1 };

      const result1 = checkRateLimit('single-test', identifier, config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(0);

      const result2 = checkRateLimit('single-test', identifier, config);
      expect(result2.allowed).toBe(false);
    });
  });
});
