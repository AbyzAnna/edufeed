---
id: US-002
title: Moderation Report Storage
feature: FS-002
status: completed
project: edufeed
external:
  github:
    issue: 9
    url: https://github.com/anton-abyzov/specweave/issues/9
---

# US-002: Moderation Report Storage

**As a** platform administrator, **I want** all moderation decisions stored in the database **so that** I can review moderation history, audit decisions, and improve the system.

## Acceptance Criteria

- [x] AC-US2-01: Create ContentModerationReport model with violation details, confidence scores, and decision
- [x] AC-US2-02: Store original content, moderation timestamp, and AI model version
- [x] AC-US2-03: Link reports to source content (comment, message, notebook, etc.) via polymorphic relation
- [x] AC-US2-04: Track moderation status: PENDING, APPROVED, REJECTED, APPEALED, ESCALATED
- [x] AC-US2-05: Store reviewer information for manual reviews
