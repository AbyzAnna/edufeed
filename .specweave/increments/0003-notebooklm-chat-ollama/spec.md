# Specification: NotebookLM-Style Chat with Ollama Integration

## Overview
Implement a NotebookLM-style chat experience for notebooks that provides intelligent, contextual responses grounded in ALL notebook information (sources, outputs, metadata). The chat should use Ollama with open-source models (llama3.2 or similar) for local inference.

## Problem Statement
Currently, the notebook chat implementation:
1. Only concatenates source content without semantic understanding
2. Uses external Cloudflare Workers AI requiring internet connectivity
3. Doesn't leverage the full notebook context (outputs, metadata, chat history)
4. Lacks proper citation extraction and grounding

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
Create a service that builds comprehensive context from:
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

### 4. E2E Testing
- Playwright tests for chat functionality
- Mock Ollama for testing
- Test all AC criteria

## Configuration
```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
OLLAMA_TIMEOUT=60000
```

## Out of Scope
- Fine-tuning the model (use pre-trained)
- Vector similarity search (simple context for now)
- Streaming responses to client (batch response)
