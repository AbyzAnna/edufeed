---
id: US-001
title: Content Policy Violation Detection
feature: FS-002
status: not-started
project: edufeed
external:
  github:
    issue: 8
    url: https://github.com/anton-abyzov/specweave/issues/8
---

# US-001: Content Policy Violation Detection

**As a** platform administrator, **I want** the system to automatically detect content that violates platform policies **so that** inappropriate content is flagged before it reaches other users.

## Acceptance Criteria

- [ ] AC-US1-01: System analyzes text content using OpenAI moderation API for policy violations
- [ ] AC-US1-02: Detects categories: hate speech, harassment, violence, sexual content, self-harm, spam, misinformation
- [ ] AC-US1-03: Assigns confidence score (0-100) for each violation category
- [ ] AC-US1-04: Content with confidence > 70% is automatically flagged
- [ ] AC-US1-05: Flagged content is prevented from being published until reviewed
