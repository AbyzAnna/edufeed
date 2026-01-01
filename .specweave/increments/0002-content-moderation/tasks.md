# Tasks - AI Content Moderation System

---

## T-001: Add ContentModeration Prisma models
**User Story**: US-002 | **Satisfies ACs**: AC-US2-01, AC-US2-02, AC-US2-03, AC-US2-04, AC-US2-05 | **Status**: [x] completed
**Test**: Given Prisma schema → When migration runs → Then ContentModerationReport and UserModerationHistory tables exist

### Subtasks:
- [x] Add ContentType enum (COMMENT, DIRECT_MESSAGE, STUDY_ROOM_MESSAGE, NOTEBOOK_CONTENT, NOTEBOOK_SOURCE, FLASHCARD, FEED_ITEM)
- [x] Add ModerationStatus enum (PENDING, AUTO_APPROVED, AUTO_REJECTED, MANUAL_REVIEW, APPROVED, REJECTED, APPEALED, ESCALATED)
- [x] Add ModerationDecision enum (APPROVED, REJECTED, WARNING_ISSUED, CONTENT_MODIFIED)
- [x] Add UserModerationStatus enum (GOOD_STANDING, WARNING, MUTED, UNDER_REVIEW, SUSPENDED)
- [x] Add ContentModerationReport model with all fields
- [x] Add UserModerationHistory model
- [x] Add relations to User model
- [x] Run prisma generate and prisma db push

---

## T-002: Create ContentModerationService class
**User Story**: US-003 | **Satisfies ACs**: AC-US3-01, AC-US3-04 | **Status**: [x] completed
**Test**: Given content string → When moderate() called → Then returns structured ModerationResult

### Subtasks:
- [x] Create src/lib/moderation/types.ts with interfaces
- [x] Create src/lib/moderation/config.ts with thresholds
- [x] Create src/lib/moderation/content-moderation-service.ts
- [x] Implement moderate(content, type, userId) method
- [x] Implement createReport() method
- [x] Implement determineDecision() based on confidence scores

---

## T-003: Add Cloudflare Workers moderation endpoint
**User Story**: US-003 | **Satisfies ACs**: AC-US3-02 | **Status**: [x] completed
**Test**: Given content → When POST to Worker /moderation → Then AI returns violation analysis

### Subtasks:
- [x] Add moderation route to workers/index.ts
- [x] Create workers/lib/moderation.ts with moderation logic
- [x] Use Workers AI (@cf/meta/llama-3.1-8b-instruct) for content analysis
- [x] Create moderation prompt for violation detection
- [x] Return structured JSON response with categories and confidence
- [ ] Deploy worker with wrangler deploy (deferred - test locally first)

---

## T-004: Implement OpenAI moderation fallback
**User Story**: US-003 | **Satisfies ACs**: AC-US3-03 | **Status**: [x] completed
**Test**: Given Workers unavailable → When moderate() called → Then OpenAI API is used as fallback

### Subtasks:
- [x] Create src/lib/moderation/openai-moderation.ts (integrated in content-moderation-service.ts)
- [x] Implement checkWithOpenAI(content) using OpenAI Moderation API
- [x] Map OpenAI categories to our ViolationCategory enum
- [x] Add error handling and retry logic
- [x] Add timeout handling (max 5s)

---

## T-005: Write unit tests for ModerationService
**User Story**: US-003 | **Satisfies ACs**: AC-US3-01 | **Status**: [ ] pending
**Test**: Given test suite → When vitest runs → Then all moderation service tests pass

### Subtasks:
- [ ] Create src/lib/moderation/__tests__/content-moderation-service.test.ts
- [ ] Test moderate() with clean content (should approve)
- [ ] Test moderate() with hate speech (should reject)
- [ ] Test moderate() with borderline content (should flag for review)
- [ ] Test fallback from Workers to OpenAI
- [ ] Test report creation

---

## T-006: Create moderation check API endpoint
**User Story**: US-003 | **Satisfies ACs**: AC-US3-01, AC-US3-04 | **Status**: [x] completed
**Test**: Given POST /api/moderation/check with content → When called → Then returns moderation result

### Subtasks:
- [x] Create src/app/api/moderation/check/route.ts
- [x] Validate request body (content, type required)
- [x] Call ContentModerationService.moderate()
- [x] Return structured response with approval status and violations
- [x] Add rate limiting (10 requests/minute per user)

---

## T-007: Integrate moderation into Comment creation
**User Story**: US-006 | **Satisfies ACs**: AC-US6-01 | **Status**: [x] completed
**Test**: Given inappropriate comment → When submitted → Then comment is blocked with error

### Subtasks:
- [x] Modify src/app/api/feed/[id]/comments/route.ts POST handler
- [x] Add moderation check before comment creation
- [x] Return ContentBlockedError if rejected
- [x] Create report in database
- [x] Update user moderation history

---

## T-008: Integrate moderation into DirectMessage
**User Story**: US-006 | **Satisfies ACs**: AC-US6-02 | **Status**: [x] completed
**Test**: Given inappropriate DM → When sent → Then message is blocked

### Subtasks:
- [x] Find or create DirectMessage API route (src/app/api/conversations/[conversationId]/messages/route.ts)
- [x] Add moderation check before message creation
- [x] Return ContentBlockedError if rejected
- [x] Create report in database

---

## T-009: Integrate moderation into StudyRoomMessage
**User Story**: US-006 | **Satisfies ACs**: AC-US6-03 | **Status**: [x] completed
**Test**: Given inappropriate room message → When posted → Then message is blocked

### Subtasks:
- [x] Modify StudyRoomMessage API route
- [x] Add moderation check before message creation
- [x] Real-time notification to user if blocked (via error response)
- [x] Create report in database

---

## T-010: Integrate moderation into Notebook content
**User Story**: US-006 | **Satisfies ACs**: AC-US6-04 | **Status**: [ ] pending
**Test**: Given inappropriate notebook content → When saved → Then content is flagged

### Subtasks:
- [ ] Modify Notebook/NotebookSource API routes
- [ ] Add moderation check on content updates
- [ ] Flag for review (lower sensitivity for educational content)
- [ ] Create report in database

---

## T-011: Create blocked content error responses
**User Story**: US-004 | **Satisfies ACs**: AC-US4-01, AC-US4-03 | **Status**: [ ] pending
**Test**: Given blocked content → When API responds → Then error includes violation details and suggestions

### Subtasks:
- [ ] Create src/lib/moderation/errors.ts with ContentBlockedError
- [ ] Include violation categories in error response
- [ ] Add user-friendly suggestions for each category
- [ ] Standardize error format across all content APIs

---

## T-012: Add user notification for blocked content
**User Story**: US-004 | **Satisfies ACs**: AC-US4-02 | **Status**: [ ] pending
**Test**: Given content blocked → When user checks notifications → Then sees moderation notification

### Subtasks:
- [ ] Add CONTENT_BLOCKED to NotificationType enum
- [ ] Create notification when content is blocked
- [ ] Include violation type and suggestions
- [ ] Link to appeal process if available

---

## T-013: Implement UserModerationHistory tracking
**User Story**: US-004 | **Satisfies ACs**: AC-US4-04 | **Status**: [ ] pending
**Test**: Given user with violations → When new violation occurs → Then history is updated

### Subtasks:
- [ ] Create updateUserHistory() in ModerationService
- [ ] Increment violation counts
- [ ] Track last violation timestamp
- [ ] Update currentStatus based on thresholds

---

## T-014: Add progressive penalty system
**User Story**: US-004 | **Satisfies ACs**: AC-US4-05 | **Status**: [ ] pending
**Test**: Given user with multiple violations → When threshold reached → Then appropriate penalty applied

### Subtasks:
- [ ] Create src/lib/moderation/penalty-service.ts
- [ ] Implement warning system (2 violations)
- [ ] Implement temporary mute (5 violations, 24h)
- [ ] Implement account review flag (10 violations)
- [ ] Check mute status before allowing content creation

---

## T-015: Create appeal submission endpoint
**User Story**: US-005 | **Satisfies ACs**: AC-US5-05 | **Status**: [ ] pending
**Test**: Given blocked content → When user submits appeal → Then appeal is recorded

### Subtasks:
- [ ] Create src/app/api/moderation/appeal/[reportId]/route.ts
- [ ] Validate user owns the content
- [ ] Update report status to APPEALED
- [ ] Store appeal reason
- [ ] Create notification for admin

---

## T-016: Create admin reports listing API
**User Story**: US-005 | **Satisfies ACs**: AC-US5-01 | **Status**: [ ] pending
**Test**: Given admin user → When GET /api/admin/moderation/reports → Then returns paginated reports

### Subtasks:
- [ ] Create src/app/api/admin/moderation/reports/route.ts
- [ ] Add admin role check middleware
- [ ] Implement filtering (status, type, date range)
- [ ] Add pagination and sorting
- [ ] Include user info and content preview

---

## T-017: Build moderation dashboard UI
**User Story**: US-005 | **Satisfies ACs**: AC-US5-01, AC-US5-04 | **Status**: [ ] pending
**Test**: Given admin user → When accessing dashboard → Then sees pending reports with details

### Subtasks:
- [ ] Create src/app/admin/moderation/page.tsx
- [ ] Create ModerationReportList component
- [ ] Create ModerationReportCard with violation breakdown
- [ ] Show AI confidence scores visually
- [ ] Add filters and search

---

## T-018: Implement moderation decision actions
**User Story**: US-005 | **Satisfies ACs**: AC-US5-02 | **Status**: [ ] pending
**Test**: Given pending report → When admin approves/rejects → Then status updates

### Subtasks:
- [ ] Create src/app/api/admin/moderation/reports/[id]/route.ts PATCH
- [ ] Implement approve action
- [ ] Implement reject action
- [ ] Implement escalate action
- [ ] Record reviewer and notes
- [ ] Notify user of decision

---

## T-019: Add bulk moderation actions
**User Story**: US-005 | **Satisfies ACs**: AC-US5-03 | **Status**: [ ] pending
**Test**: Given multiple selected reports → When bulk action → Then all reports updated

### Subtasks:
- [ ] Add bulk action endpoint
- [ ] Implement select-all in dashboard
- [ ] Bulk approve/reject selected
- [ ] Transaction handling for consistency

---

## T-020: Add appeal review workflow
**User Story**: US-005 | **Satisfies ACs**: AC-US5-05 | **Status**: [ ] pending
**Test**: Given appealed report → When admin reviews → Then original decision can be overturned

### Subtasks:
- [ ] Create appeal review UI in dashboard
- [ ] Show original content and user's appeal reason
- [ ] Allow admin to uphold or overturn
- [ ] Update user history if overturned
- [ ] Notify user of appeal decision

---

## T-021: Integrate moderation into Flashcard creation
**User Story**: US-006 | **Satisfies ACs**: AC-US6-05 | **Status**: [ ] pending
**Test**: Given inappropriate flashcard → When created → Then content is flagged

### Subtasks:
- [ ] Modify Flashcard/Deck API routes
- [ ] Check front and back content
- [ ] Lower sensitivity for educational content
- [ ] Create report if flagged

---

## T-022: Write E2E tests for moderation flow
**User Story**: All | **Satisfies ACs**: All | **Status**: [ ] pending
**Test**: Given E2E test suite → When Playwright runs → Then all moderation flows pass

### Subtasks:
- [ ] Test clean content submission
- [ ] Test blocked content error display
- [ ] Test notification appearance
- [ ] Test admin dashboard workflow
- [ ] Test appeal submission and resolution
