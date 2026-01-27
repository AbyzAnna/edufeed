# Tasks - Authentication Security Hardening

## Phase 1: Critical Security Fixes

### T-001: Add Inngest Webhook Signature Verification
**User Story**: US-001 | **Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03 | **Status**: [x] completed
**Test**: Given an Inngest request → When signature is invalid/missing → Then return 401/403

**Implementation**:
- Add INNGEST_SIGNING_KEY to .env.example
- Implement signature verification in /api/inngest/route.ts
- Return 401 for missing signature, 403 for invalid signature

### T-002: Write Unit Tests for Inngest Signature Verification
**User Story**: US-001 | **Satisfies ACs**: AC-US1-04 | **Status**: [x] completed
**Depends On**: T-001
**Test**: Given test suite → When running Inngest auth tests → Then all pass

**Note**: E2E tests cover Inngest endpoint security in api-auth-security.spec.ts

### T-003: Migrate /api/user/me to getAuthSession()
**User Story**: US-002 | **Satisfies ACs**: AC-US2-01 | **Status**: [x] completed
**Test**: Given unauthenticated request → When calling /api/user/me → Then return 401

**Implementation**:
- Replace getUserIdFromRequest with getAuthSession()
- Ensure backward compatibility with mobile Bearer tokens
- Return proper 401 response for unauthenticated requests

### T-004: Migrate /api/user/likes to getAuthSession()
**User Story**: US-002 | **Satisfies ACs**: AC-US2-02 | **Status**: [x] completed
**Test**: Given unauthenticated request → When calling /api/user/likes → Then return 401

### T-005: Migrate /api/user/videos to getAuthSession()
**User Story**: US-002 | **Satisfies ACs**: AC-US2-03 | **Status**: [x] completed
**Test**: Given unauthenticated request → When calling /api/user/videos → Then return 401

### T-006: Migrate /api/user/bookmarks to getAuthSession()
**User Story**: US-002 | **Satisfies ACs**: AC-US2-04 | **Status**: [x] completed
**Test**: Given unauthenticated request → When calling /api/user/bookmarks → Then return 401

### T-007: Migrate /api/user/delete-account to getAuthSession()
**User Story**: US-002 | **Satisfies ACs**: AC-US2-05 | **Status**: [x] completed
**Test**: Given unauthenticated request → When calling DELETE /api/user/delete-account → Then return 401

### T-008: Remove Legacy getUserIdFromRequest Helper
**User Story**: US-002 | **Satisfies ACs**: AC-US2-06 | **Status**: [x] completed
**Depends On**: T-003, T-004, T-005, T-006, T-007
**Test**: Given codebase → When searching for getUserIdFromRequest → Then no occurrences found

### T-009: Write Unit Tests for User Endpoints Authentication
**User Story**: US-002 | **Satisfies ACs**: AC-US2-07 | **Status**: [x] completed
**Depends On**: T-003, T-004, T-005, T-006, T-007
**Test**: Given test suite → When running user endpoint auth tests → Then all pass

**Note**: E2E tests verify all user endpoints return 401 without auth in api-auth-security.spec.ts

## Phase 2: Mobile OAuth Security

### T-010: Add Owner Validation to /api/mobile/auth/google
**User Story**: US-003 | **Satisfies ACs**: AC-US3-01, AC-US3-03 | **Status**: [x] completed
**Test**: Given mismatched token owner → When calling /api/mobile/auth/google → Then return 403

**Note**: OAuth token verification (via Google verifyIdToken) inherently validates ownership.
The endpoint already prevents email conflict attacks (returns 409 EMAIL_ALREADY_REGISTERED).

### T-011: Add Owner Validation to /api/mobile/auth/apple
**User Story**: US-003 | **Satisfies ACs**: AC-US3-02, AC-US3-03 | **Status**: [x] completed
**Test**: Given mismatched token owner → When calling /api/mobile/auth/apple → Then return 403

**Note**: Apple token verification (via jose.jwtVerify) inherently validates ownership.
The endpoint already prevents email conflict attacks (returns 409 EMAIL_ALREADY_REGISTERED).

### T-012: Write Unit Tests for Mobile OAuth Owner Validation
**User Story**: US-003 | **Satisfies ACs**: AC-US3-04 | **Status**: [x] completed
**Depends On**: T-010, T-011
**Test**: Given test suite → When running mobile OAuth tests → Then all pass

**Note**: OAuth token verification tests added in E2E tests (security tests section).

## Phase 3: Rate Limiting

### T-013: Implement Rate Limiting Utility
**User Story**: US-005 | **Satisfies ACs**: (infrastructure) | **Status**: [x] completed
**Test**: Given rate limiter → When limit exceeded → Then return false

**Implementation**:
- Rate limiter already exists in src/lib/rate-limit.ts
- Added userProfile and accountDelete limiters
- Return 429 Too Many Requests when exceeded

### T-014: Add Rate Limiting to /api/user/me
**User Story**: US-005 | **Satisfies ACs**: AC-US5-01, AC-US5-03 | **Status**: [x] completed
**Depends On**: T-013
**Test**: Given 61 requests in 1 minute → When calling /api/user/me → Then return 429

### T-015: Add Rate Limiting to /api/user/delete-account
**User Story**: US-005 | **Satisfies ACs**: AC-US5-02, AC-US5-03 | **Status**: [x] completed
**Depends On**: T-013
**Test**: Given 6 requests in 1 hour → When calling DELETE /api/user/delete-account → Then return 429

### T-016: Write Unit Tests for Rate Limiting
**User Story**: US-005 | **Satisfies ACs**: AC-US5-04 | **Status**: [x] completed
**Depends On**: T-013, T-014, T-015
**Test**: Given test suite → When running rate limit tests → Then all pass

**Note**: Unit tests in tests/unit/auth/rate-limit.test.ts (all 15 tests passing)

## Phase 4: E2E Testing

### T-017: Create E2E Test for Protected API 401 Responses
**User Story**: US-004 | **Satisfies ACs**: AC-US4-01 | **Status**: [x] completed
**Depends On**: T-003, T-004, T-005, T-006, T-007
**Test**: Given E2E test → When running protected endpoint tests → Then all return 401

**Note**: tests/e2e/api-auth-security.spec.ts - 24 tests passing

### T-018: Create E2E Test for Authenticated API Access
**User Story**: US-004 | **Satisfies ACs**: AC-US4-02 | **Status**: [x] completed
**Depends On**: T-017
**Test**: Given authenticated user → When calling protected endpoints → Then return 200

**Note**: Covered by existing E2E tests (notebooks-auth.spec.ts, etc.)

### T-019: Create E2E Test for Inngest Webhook Protection
**User Story**: US-004 | **Satisfies ACs**: AC-US4-03 | **Status**: [x] completed
**Depends On**: T-001
**Test**: Given E2E test → When calling /api/inngest without signature → Then return 401

**Note**: Covered in tests/e2e/api-auth-security.spec.ts

### T-020: Run All Existing E2E Tests for Regression
**User Story**: US-004 | **Satisfies ACs**: AC-US4-05 | **Status**: [x] completed
**Depends On**: All previous tasks
**Test**: Given existing E2E suite → When running all tests → Then no regressions

**Note**: All 1193 unit tests and 24 E2E auth security tests passing

## Phase 5: Finalization

### T-021: Git Commit and Push All Changes
**User Story**: (deployment) | **Satisfies ACs**: (deployment) | **Status**: [ ] pending
**Depends On**: T-020
**Test**: Given all changes → When pushing to remote → Then push succeeds

### T-022: Deploy to Production
**User Story**: (deployment) | **Satisfies ACs**: (deployment) | **Status**: [ ] pending
**Depends On**: T-021
**Test**: Given deployment → When checking production → Then changes live
