# Authentication Security Hardening

## Overview
Comprehensive security hardening of all API endpoints to ensure protected endpoints are only accessible after user authentication. This increment addresses critical vulnerabilities identified in the security audit.

## User Stories

### US-001: Inngest Webhook Protection
**As a** system administrator
**I want** the Inngest webhook endpoint to verify request signatures
**So that** only legitimate Inngest requests can trigger background jobs

**Acceptance Criteria:**
- [ ] AC-US1-01: Inngest webhook verifies signature using INNGEST_SIGNING_KEY
- [ ] AC-US1-02: Unauthorized requests return 401/403 status
- [ ] AC-US1-03: Environment variable INNGEST_SIGNING_KEY is documented
- [ ] AC-US1-04: Unit tests cover signature verification logic

### US-002: Unified User Endpoint Authentication
**As a** developer
**I want** all /api/user/* endpoints to use consistent getAuthSession() pattern
**So that** authentication is reliable and maintainable

**Acceptance Criteria:**
- [ ] AC-US2-01: /api/user/me uses getAuthSession() instead of manual JWT
- [ ] AC-US2-02: /api/user/likes uses getAuthSession()
- [ ] AC-US2-03: /api/user/videos uses getAuthSession()
- [ ] AC-US2-04: /api/user/bookmarks uses getAuthSession()
- [ ] AC-US2-05: /api/user/delete-account uses getAuthSession()
- [ ] AC-US2-06: Legacy getUserIdFromRequest helper is removed
- [ ] AC-US2-07: Unit tests verify authentication for each endpoint

### US-003: Mobile OAuth Owner Validation
**As a** mobile user
**I want** OAuth endpoints to validate token ownership
**So that** my account cannot be hijacked through token substitution

**Acceptance Criteria:**
- [ ] AC-US3-01: /api/mobile/auth/google validates token owner matches authenticated user
- [ ] AC-US3-02: /api/mobile/auth/apple validates token owner matches authenticated user
- [ ] AC-US3-03: Mismatched ownership returns 403 Forbidden
- [ ] AC-US3-04: Unit tests cover owner validation logic

### US-004: E2E Authentication Tests
**As a** QA engineer
**I want** comprehensive E2E tests for authentication flows
**So that** regressions are caught before deployment

**Acceptance Criteria:**
- [ ] AC-US4-01: E2E test for protected API endpoints returning 401 without auth
- [ ] AC-US4-02: E2E test for successful authenticated API requests
- [ ] AC-US4-03: E2E test for Inngest webhook rejection without signature
- [ ] AC-US4-04: E2E test for mobile auth token validation
- [ ] AC-US4-05: All existing E2E tests continue to pass

### US-005: Rate Limiting for Sensitive Endpoints
**As a** security engineer
**I want** rate limiting on sensitive user endpoints
**So that** brute force attacks are prevented

**Acceptance Criteria:**
- [ ] AC-US5-01: /api/user/me has rate limiting (60 req/min)
- [ ] AC-US5-02: /api/user/delete-account has rate limiting (5 req/hour)
- [ ] AC-US5-03: Rate limit exceeded returns 429 status
- [ ] AC-US5-04: Rate limiting is tested

## Technical Notes

### Inngest Signature Verification
Use the `inngest` package's built-in signature verification or manually verify using HMAC-SHA256 with the signing key from request headers.

### getAuthSession() Pattern
All user-specific endpoints should use the centralized `getAuthSession()` from `@/lib/supabase/auth` which:
- Supports both cookie-based (web) and Bearer token (mobile) authentication
- Handles session refresh automatically
- Returns consistent user object structure

### Rate Limiting Implementation
Use in-memory rate limiting with `Map<string, {count, timestamp}>` for simplicity, or integrate with existing Redis/Upstash if available.

## Out of Scope
- MFA implementation (future increment)
- OAuth linking security enhancements
- Session invalidation on suspicious activity
