---
id: US-002
title: Local AI with Ollama
feature: FS-003
status: completed
project: edufeed
external:
  github:
    issue: 15
    url: https://github.com/anton-abyzov/specweave/issues/15
---

# US-002: Local AI with Ollama

**As a** user concerned about privacy and latency, **I want** AI processing to happen locally via Ollama **so that** my data stays on my machine and responses are fast.

## Acceptance Criteria

- [x] AC-US2-01: System connects to Ollama API (default http://localhost:11434)
- [x] AC-US2-02: Uses llama3.2 or compatible model
- [x] AC-US2-03: Handles Ollama connection errors gracefully
- [x] AC-US2-04: Falls back to alternative if Ollama unavailable
