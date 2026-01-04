/**
 * In-memory rate limiting utility with memory leak prevention
 *
 * IMPORTANT: This is suitable for single-instance deployments only.
 * For multi-instance deployments (load balanced, serverless), use Redis instead.
 *
 * Features:
 * - Sliding window rate limiting
 * - Automatic cleanup of expired entries
 * - Maximum size limit to prevent unbounded memory growth
 * - Emergency cleanup when approaching capacity
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests allowed in window
  maxMapSize?: number; // Maximum map size (default: 10000)
}

// Shared rate limit maps for different endpoints
// Using separate maps prevents one endpoint's traffic from affecting another
const rateLimitMaps = new Map<string, Map<string, RateLimitRecord>>();
const lastCleanupTimes = new Map<string, number>();

// Default max size to prevent unbounded memory growth
const DEFAULT_MAX_MAP_SIZE = 10000;

// Cleanup interval in milliseconds
const CLEANUP_INTERVAL = 60000; // 1 minute

/**
 * Get or create a rate limit map for a specific endpoint
 */
function getRateLimitMap(endpoint: string): Map<string, RateLimitRecord> {
  let map = rateLimitMaps.get(endpoint);
  if (!map) {
    map = new Map();
    rateLimitMaps.set(endpoint, map);
    lastCleanupTimes.set(endpoint, Date.now());
  }
  return map;
}

/**
 * Cleanup expired entries from a rate limit map
 */
function cleanupMap(endpoint: string, maxSize: number): void {
  const map = getRateLimitMap(endpoint);
  const now = Date.now();
  const lastCleanup = lastCleanupTimes.get(endpoint) || 0;

  // Only cleanup periodically or if map is getting too large
  if (now - lastCleanup < CLEANUP_INTERVAL && map.size < maxSize) {
    return;
  }

  lastCleanupTimes.set(endpoint, now);

  // Remove expired entries
  for (const [key, record] of map.entries()) {
    if (now > record.resetTime) {
      map.delete(key);
    }
  }

  // Emergency cleanup if still too large - remove oldest entries (FIFO)
  if (map.size >= maxSize) {
    const entriesToDelete = Math.floor(maxSize * 0.2); // Remove 20%
    let deleted = 0;
    for (const key of map.keys()) {
      if (deleted >= entriesToDelete) break;
      map.delete(key);
      deleted++;
    }
  }
}

/**
 * Check if a request should be rate limited
 *
 * @param endpoint - Unique identifier for the endpoint (e.g., "signup", "password-reset")
 * @param identifier - Unique identifier for the requester (e.g., IP address, user ID)
 * @param config - Rate limiting configuration
 * @returns Object with allowed status and remaining requests info
 */
export function checkRateLimit(
  endpoint: string,
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  const maxSize = config.maxMapSize || DEFAULT_MAX_MAP_SIZE;
  cleanupMap(endpoint, maxSize);

  const map = getRateLimitMap(endpoint);
  const now = Date.now();
  const record = map.get(identifier);

  // If no record or expired, create new one
  if (!record || now > record.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    map.set(identifier, newRecord);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: newRecord.resetTime,
    };
  }

  // Check if over limit
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Simple rate limit check that returns boolean
 * Use this when you don't need the detailed info
 */
export function isRateLimited(
  endpoint: string,
  identifier: string,
  config: RateLimitConfig
): boolean {
  return !checkRateLimit(endpoint, identifier, config).allowed;
}

/**
 * Get rate limit map stats for monitoring
 */
export function getRateLimitStats(): Record<string, { size: number; lastCleanup: number }> {
  const stats: Record<string, { size: number; lastCleanup: number }> = {};
  for (const [endpoint, map] of rateLimitMaps.entries()) {
    stats[endpoint] = {
      size: map.size,
      lastCleanup: lastCleanupTimes.get(endpoint) || 0,
    };
  }
  return stats;
}

// Pre-configured rate limiters for common use cases
export const rateLimiters = {
  signup: (identifier: string) =>
    checkRateLimit("signup", identifier, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
    }),

  passwordReset: (identifier: string) =>
    checkRateLimit("password-reset", identifier, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 3,
    }),

  resendVerification: (identifier: string) =>
    checkRateLimit("resend-verification", identifier, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 3,
    }),

  login: (identifier: string) =>
    checkRateLimit("login", identifier, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 10,
    }),

  api: (identifier: string) =>
    checkRateLimit("api", identifier, {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,
    }),

  emailVerification: (identifier: string) =>
    checkRateLimit("email-verification", identifier, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 10,
    }),

  tokenValidation: (identifier: string) =>
    checkRateLimit("token-validation", identifier, {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 20,
    }),
};
