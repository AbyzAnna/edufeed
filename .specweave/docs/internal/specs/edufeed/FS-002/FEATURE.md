---
id: FS-002
title: AI Content Moderation System
origin: internal
increment: 0002-content-moderation
status: in-progress
project: edufeed
created: 2025-12-30T21:39:45.000Z
external_tools:
  github:
    type: milestone
    id: 2
    url: https://github.com/AbyzAnna/edufeed/milestone/2
---

# Feature: AI Content Moderation System

**Origin**: Internal Increment
**Increment**: 0002-content-moderation

## Description

Smart AI-powered content verification system that automatically detects policy violations, generates moderation reports, and blocks inappropriate content in the EduFeed platform. The system will moderate user-generated content including comments, messages, notebook content, study room chat, and flashcard decks.

## User Stories

### US-001: Content Policy Violation Detection
**As a** platform administrator, I want the system to automatically detect content that violates platform policies **so that** inappropriate content is flagged before it reaches other users.

**Acceptance Criteria:**
- [ ] AC-US1-01: System analyzes text content using OpenAI moderation API for policy violations
- [ ] AC-US1-02: Detects categories: hate speech, harassment, violence, sexual content, self-harm, spam, misinformation
- [ ] AC-US1-03: Assigns confidence score (0-100) for each violation category
- [ ] AC-US1-04: Content with confidence > 70% is automatically flagged
- [ ] AC-US1-05: Flagged content is prevented from being published until reviewed

### US-002: Moderation Report Storage
**As a** platform administrator, I want all moderation decisions stored in the database **so that** I can review moderation history, audit decisions, and improve the system.

**Acceptance Criteria:**
- [x] AC-US2-01: Create ContentModerationReport model with violation details, confidence scores, and decision
- [x] AC-US2-02: Store original content, moderation timestamp, and AI model version
- [x] AC-US2-03: Link reports to source content (comment, message, notebook, etc.) via polymorphic relation
- [x] AC-US2-04: Track moderation status: PENDING, APPROVED, REJECTED, APPEALED, ESCALATED
- [x] AC-US2-05: Store reviewer information for manual reviews

### US-003: Real-time Content Moderation Hook
**As a** developer, I want a reusable moderation service **so that** any new content type can be easily integrated with the moderation system.

**Acceptance Criteria:**
- [x] AC-US3-01: Create ContentModerationService class with moderate(content, type, userId) method
- [x] AC-US3-02: Service integrates with Cloudflare Workers for low-latency AI inference
- [x] AC-US3-03: Fallback to OpenAI API if Workers unavailable
- [x] AC-US3-04: Service returns structured response: { approved: boolean, report: Report, violations: Violation[] }
- [x] AC-US3-05: Configurable severity thresholds per content type

### US-004: Content Blocking and User Notification
**As a** user, I want to be notified if my content is blocked **so that** I understand why and can modify my content appropriately.

**Acceptance Criteria:**
- [ ] AC-US4-01: Blocked content shows clear error message explaining the violation
- [ ] AC-US4-02: User receives in-app notification about blocked content
- [ ] AC-US4-03: API returns structured error with violation categories and suggestions
- [ ] AC-US4-04: Track user's violation history for pattern detection
- [ ] AC-US4-05: Progressive penalties: warning -> temp mute -> account review

### US-005: Admin Moderation Dashboard
**As a** platform administrator, I want a dashboard to review flagged content **so that** I can make final moderation decisions on edge cases.

**Acceptance Criteria:**
- [ ] AC-US5-01: Dashboard lists all pending moderation reports with filters
- [ ] AC-US5-02: Admin can approve, reject, or escalate flagged content
- [ ] AC-US5-03: Bulk actions for processing multiple reports
- [ ] AC-US5-04: Show AI confidence scores and violation breakdown
- [ ] AC-US5-05: Appeal workflow for users to contest moderation decisions

### US-006: Content Type Integration
**As a** developer, I want moderation integrated into all user content flows **so that** all content is checked consistently.

**Acceptance Criteria:**
- [x] AC-US6-01: Integrate moderation into Comment creation API
- [x] AC-US6-02: Integrate moderation into DirectMessage sending
- [x] AC-US6-03: Integrate moderation into StudyRoomMessage posting
- [ ] AC-US6-04: Integrate moderation into Notebook/NotebookSource content
- [ ] AC-US6-05: Integrate moderation into Flashcard deck creation

## Technical Notes

### AI Integration
- Primary: Cloudflare Workers AI for low-latency moderation
- Fallback: OpenAI Moderation API
- Custom categories: spam detection, educational content verification

### Priority
- **P1**: Core moderation system (US-001, US-002, US-003)
- **P2**: User notifications and content integration (US-004, US-006)
- **P3**: Admin dashboard (US-005)

## Status

- **Created**: 2025-12-30
- **Increment**: 0002-content-moderation
