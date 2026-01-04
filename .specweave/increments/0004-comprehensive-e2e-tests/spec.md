# Specification: Comprehensive E2E Tests for Notebooks and Study Rooms

## Overview
Create comprehensive end-to-end tests covering all critical user flows for notebooks (creation, sources, chat, studio outputs) and study rooms (creation, multi-user collaboration, mobile-specific features). Also includes UI/UX improvements including removing screen share from desktop (collaboration only).

## Problem Statement
The application needs comprehensive E2E test coverage for:
1. Notebook creation and management
2. Adding all 4 source types (PDF, URL, TEXT, YOUTUBE)
3. Chat functionality with AI responses
4. All 6 Studio output types with proper viewer modals (web + mobile viewable)
5. Study Room creation, joining, and multi-user collaboration
6. Mobile-specific features (camera permissions)
7. Desktop web should NOT have screen sharing (collaboration only, not screen sharing)

## Goals
- [x] AC-001: E2E tests cover notebook creation flow
- [x] AC-002: E2E tests cover all 4 source types (PDF, URL, TEXT, YOUTUBE)
- [x] AC-003: E2E tests cover chat functionality
- [x] AC-004: E2E tests cover all 6 Studio outputs (AUDIO_OVERVIEW, VIDEO_OVERVIEW, MIND_MAP, SUMMARY, FLASHCARD_DECK, QUIZ)
- [x] AC-005: Each Studio output viewer modal works on web and displays content correctly
- [x] AC-006: E2E tests cover Study Room creation and joining
- [x] AC-007: E2E tests cover multi-user collaboration in Study Rooms
- [x] AC-008: Screen share button is removed from desktop web (collaboration only)
- [x] AC-009: Mobile camera permission flow is tested
- [x] AC-010: UI/UX improvements are tested and verified

## User Stories

### US-001: Notebook Complete Flow
**As a** student
**I want** to create a notebook, add sources, chat, and generate study materials
**So that** I can study effectively

**Acceptance Criteria:**
- [x] AC-US1-01: Can create new notebook with title, emoji, color
- [x] AC-US1-02: Can add PDF source and see it processed
- [x] AC-US1-03: Can add URL source and see it scraped
- [x] AC-US1-04: Can add TEXT source manually
- [x] AC-US1-05: Can add YOUTUBE source and see transcript extracted
- [x] AC-US1-06: Can chat about notebook content
- [x] AC-US1-07: Can generate all 6 output types

### US-002: Studio Outputs Viewers
**As a** student
**I want** to view generated content in proper modals
**So that** I can study the materials effectively

**Acceptance Criteria:**
- [x] AC-US2-01: AUDIO_OVERVIEW shows audio player
- [x] AC-US2-02: VIDEO_OVERVIEW shows video player
- [x] AC-US2-03: MIND_MAP shows interactive mind map
- [x] AC-US2-04: SUMMARY shows formatted report with key points
- [x] AC-US2-05: FLASHCARD_DECK shows cards with flip and navigation
- [x] AC-US2-06: QUIZ shows questions with answer selection

### US-003: Study Room Collaboration
**As a** student
**I want** to create and join study rooms with others
**So that** I can collaborate with classmates

**Acceptance Criteria:**
- [x] AC-US3-01: Can create study room with title
- [x] AC-US3-02: Can join room via code
- [x] AC-US3-03: Multiple users can participate in same room
- [x] AC-US3-04: Desktop web does NOT have screen share option
- [x] AC-US3-05: Mobile has camera/mic toggle

### US-004: Mobile Camera Permissions
**As a** mobile user
**I want** camera permission to work correctly
**So that** I can participate in video calls

**Acceptance Criteria:**
- [x] AC-US4-01: Permission prompt appears on first camera use
- [x] AC-US4-02: Denied permission shows appropriate message
- [x] AC-US4-03: Granted permission enables video

## Technical Approach

### 1. Remove Screen Share from Desktop
The screen share button in MediaControls.tsx needs to be removed/hidden for desktop web. This is a collaboration-only feature for now.

### 2. E2E Test Structure
- tests/e2e/notebook-complete-flow.spec.ts - Full notebook journey
- tests/e2e/source-types.spec.ts - All source type tests
- tests/e2e/studio-outputs.spec.ts - All 6 output type tests
- tests/e2e/study-room-collaboration.spec.ts - Multi-user room tests
- tests/e2e/mobile-permissions.spec.ts - Mobile-specific tests
- tests/e2e/ui-ux.spec.ts - UI/UX verification tests

### 3. Test Data Strategy
- Use mocked API responses for reliable testing
- Create test fixtures for common scenarios
- Test both happy path and error cases

## Out of Scope
- Performance testing
- Load testing
- Security testing (separate increment)
