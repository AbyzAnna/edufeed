---
id: FS-003
title: NotebookLM-Style Chat with Ollama Integration
origin: internal
increment: 0003-notebooklm-chat-ollama
status: completed
project: edufeed
created: 2025-12-31T10:00:00.000Z
completedAt: 2025-12-31T10:45:00.000Z
external_tools:
  github:
    type: milestone
    id: 3
    url: https://github.com/AbyzAnna/edufeed/milestone/3
---

# Feature: NotebookLM-Style Chat with Ollama Integration

**Origin**: Internal Increment
**Increment**: 0003-notebooklm-chat-ollama

## Description

Implement a NotebookLM-style chat experience for notebooks that provides intelligent, contextual responses grounded in ALL notebook information (sources, outputs, metadata). The chat uses Ollama with open-source models (llama3.2 or similar) for local inference.

## Goals
- [x] AC-001: Chat has access to complete notebook context (sources, outputs, metadata)
- [x] AC-002: Uses Ollama with latest open-source model for local inference
- [x] AC-003: Provides accurate, grounded responses with proper citations
- [x] AC-004: Maintains conversation history for multi-turn dialogues
- [x] AC-005: Falls back gracefully when Ollama is unavailable
- [x] AC-006: E2E tests pass for all critical chat flows

## User Stories

### US-001: Comprehensive Context Understanding
**As a** student using the notebook
**I want** the AI to understand ALL my notebook content
**So that** I get accurate, grounded responses based on everything I've collected

**Acceptance Criteria:**
- [x] AC-US1-01: Chat can answer questions about any source content
- [x] AC-US1-02: Chat can reference generated outputs (summaries, flashcards)
- [x] AC-US1-03: Chat knows notebook title, description, and metadata
- [x] AC-US1-04: Chat maintains conversation context across messages

### US-002: Local AI with Ollama
**As a** user concerned about privacy and latency
**I want** AI processing to happen locally via Ollama
**So that** my data stays on my machine and responses are fast

**Acceptance Criteria:**
- [x] AC-US2-01: System connects to Ollama API (default http://localhost:11434)
- [x] AC-US2-02: Uses llama3.2 or compatible model
- [x] AC-US2-03: Handles Ollama connection errors gracefully
- [x] AC-US2-04: Falls back to alternative if Ollama unavailable

### US-003: Accurate Citations
**As a** researcher
**I want** the AI to cite specific sources when answering
**So that** I can verify information and trace it back to the original

**Acceptance Criteria:**
- [x] AC-US3-01: Responses include source citations
- [x] AC-US3-02: Citations map to specific NotebookSource records
- [x] AC-US3-03: Citation excerpts are stored in NotebookCitation

## Technical Approach

### 1. Notebook Context Aggregator
Service that builds comprehensive context from:
- All NotebookSource records (content, metadata, type)
- All NotebookOutput records (summaries, flashcards, study guides)
- Notebook metadata (title, description)
- Recent conversation history

### 2. Ollama Integration
- Service client for Ollama API
- Model configuration (llama3.2:latest or configurable)
- Streaming support for long responses
- Connection pooling and error handling

### 3. Enhanced Chat API
- Upgraded /api/notebooks/[notebookId]/chat endpoint
- Full context injection
- Citation extraction from responses
- Conversation history management

## Configuration
```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
OLLAMA_TIMEOUT=60000
```

## Test Results
- Unit Tests: 89 passed, 0 failed
- E2E Tests: 9 passed, 0 failed, 5 skipped

## Status

- **Created**: 2025-12-31
- **Completed**: 2025-12-31
- **Increment**: 0003-notebooklm-chat-ollama
