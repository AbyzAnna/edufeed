import { NextRequest, NextResponse } from "next/server";

/**
 * CORS configuration for the EduFeed API
 *
 * This utility provides secure CORS headers that only allow requests from
 * authorized origins (web app and mobile app).
 *
 * SECURITY NOTE: Never use "*" for Access-Control-Allow-Origin on auth endpoints
 * as it enables CSRF attacks from any origin.
 */

// Allowed origins for CORS - EXACT MATCHES ONLY for security
const ALLOWED_ORIGINS = [
  // Web app
  "http://localhost:3000",
  "https://edufeed.app",
  "https://www.edufeed.app",
  // Mobile app origins (Expo)
  "exp://localhost:8081",
  "http://localhost:8081",
  // Production mobile app (custom scheme) - exact match
  "edufeed://app",
];

// Development mode check
const isDevelopment = process.env.NODE_ENV === "development";

// SECURITY FIX: Strict regex pattern for development origins
const DEV_ORIGIN_PATTERN = /^(https?|exp):\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const DEV_LOCAL_IP_PATTERN = /^(https?|exp):\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/;

/**
 * Check if an origin is allowed for CORS
 * SECURITY: Uses exact matching and strict regex to prevent bypass attacks
 */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;

  // In development, allow localhost and local IP origins with strict validation
  if (isDevelopment) {
    if (DEV_ORIGIN_PATTERN.test(origin) || DEV_LOCAL_IP_PATTERN.test(origin)) {
      return true;
    }
  }

  // Check against allowed origins - EXACT MATCH ONLY (no startsWith to prevent bypass)
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get CORS headers for a request
 * Returns headers with the specific origin if allowed, or restrictive headers if not
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get("origin");

  // If origin is allowed, reflect it back
  if (origin && isAllowedOrigin(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400", // 24 hours
    };
  }

  // For requests without origin (same-origin) or unknown origin, use first allowed origin
  // This is safer than using * and still allows the API to work
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  return NextResponse.json({}, { headers: getCorsHeaders(request) });
}

/**
 * Add CORS headers to a response
 */
export function withCors(response: NextResponse, request: NextRequest): NextResponse {
  const corsHeaders = getCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Create a JSON response with CORS headers
 */
export function corsJsonResponse(
  data: unknown,
  request: NextRequest,
  options?: { status?: number }
): NextResponse {
  return NextResponse.json(data, {
    status: options?.status || 200,
    headers: getCorsHeaders(request),
  });
}
