---
id: US-003
title: Real-time Content Moderation Hook
feature: FS-002
status: completed
project: edufeed
external:
  github:
    issue: 10
    url: https://github.com/anton-abyzov/specweave/issues/10
---

# US-003: Real-time Content Moderation Hook

**As a** developer, **I want** a reusable moderation service **so that** any new content type can be easily integrated with the moderation system.

## Acceptance Criteria

- [x] AC-US3-01: Create ContentModerationService class with moderate(content, type, userId) method
- [x] AC-US3-02: Service integrates with Cloudflare Workers for low-latency AI inference
- [x] AC-US3-03: Fallback to OpenAI API if Workers unavailable
- [x] AC-US3-04: Service returns structured response: { approved: boolean, report: Report, violations: Violation[] }
- [x] AC-US3-05: Configurable severity thresholds per content type
