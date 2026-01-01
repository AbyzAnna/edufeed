# Tasks - NotebookLM-Style Chat with Ollama

## T-001: Install Ollama and configure environment
**User Story**: US-002 | **Satisfies ACs**: AC-US2-01, AC-US2-02 | **Status**: [x] completed
**Test**: Given Ollama installed → When checking connection → Then Ollama responds with model list

### Subtasks:
- [x] Check if Ollama is installed, provide installation instructions if not
- [x] Pull llama3.2 model (or latest compatible)
- [x] Add OLLAMA_HOST and OLLAMA_MODEL to .env
- [x] Verify Ollama API is accessible

---

## T-002: Create Ollama service client
**User Story**: US-002 | **Satisfies ACs**: AC-US2-01, AC-US2-03, AC-US2-04 | **Status**: [x] completed
**Test**: Given OllamaService → When calling generate() → Then returns AI response

### Subtasks:
- [x] Create src/lib/ollama/client.ts with OllamaClient class
- [x] Implement generate(prompt, options) method
- [x] Implement chat(messages, options) method
- [x] Add connection health check
- [x] Add timeout handling and retries
- [x] Add fallback to workers/OpenAI if Ollama unavailable

---

## T-003: Create notebook context aggregator
**User Story**: US-001 | **Satisfies ACs**: AC-US1-01, AC-US1-02, AC-US1-03 | **Status**: [x] completed
**Test**: Given notebookId → When aggregating context → Then returns complete notebook data

### Subtasks:
- [x] Create src/lib/notebook/context-aggregator.ts
- [x] Fetch all NotebookSource records with content
- [x] Fetch all NotebookOutput records
- [x] Include notebook metadata (title, description)
- [x] Format context for LLM consumption
- [x] Implement context size limiting (token budget)

---

## T-004: Create conversation history manager
**User Story**: US-001 | **Satisfies ACs**: AC-US1-04 | **Status**: [x] completed
**Test**: Given chat history → When building messages → Then includes recent context

### Subtasks:
- [x] Create src/lib/notebook/conversation-manager.ts (integrated in context-aggregator.ts)
- [x] Fetch recent NotebookChat messages
- [x] Format as Ollama chat messages
- [x] Implement sliding window for long conversations
- [x] Add role mapping (USER, ASSISTANT, SYSTEM)

---

## T-005: Upgrade chat API endpoint
**User Story**: US-001, US-002 | **Satisfies ACs**: AC-001, AC-002 | **Status**: [x] completed
**Test**: Given POST to /api/notebooks/[id]/chat → When message sent → Then Ollama-powered response returned

### Subtasks:
- [x] Modify src/app/api/notebooks/[notebookId]/chat/route.ts
- [x] Integrate context aggregator
- [x] Integrate conversation manager
- [x] Switch from Workers to Ollama client
- [x] Keep Workers as fallback
- [x] Update system prompt for better grounding

---

## T-006: Implement citation extraction
**User Story**: US-003 | **Satisfies ACs**: AC-US3-01, AC-US3-02, AC-US3-03 | **Status**: [x] completed
**Test**: Given AI response with sources → When extracting citations → Then NotebookCitation records created

### Subtasks:
- [x] Create src/lib/notebook/citation-extractor.ts
- [x] Parse AI response for source references
- [x] Match references to NotebookSource records
- [x] Extract relevant excerpts
- [x] Create NotebookCitation records

---

## T-007: Create E2E tests for notebook chat
**User Story**: All | **Satisfies ACs**: AC-006 | **Status**: [x] completed
**Test**: Given E2E test suite → When Playwright runs → Then all chat tests pass

### Subtasks:
- [x] Create tests/e2e/notebook-chat.spec.ts
- [x] Set up test notebook with sources
- [x] Test basic question/answer flow
- [x] Test citation display
- [x] Test conversation continuity
- [x] Test error handling when Ollama unavailable
- [x] Mock Ollama responses for reliable testing

---

## T-008: Run tests and fix issues
**User Story**: All | **Satisfies ACs**: All | **Status**: [x] completed
**Test**: Given all tests → When npm test and playwright test run → Then all pass

### Subtasks:
- [x] Run unit tests (vitest) - 89 tests passed
- [x] Run E2E tests (playwright) - 9 passed, 5 skipped (require auth)
- [x] Fix any failing tests
- [x] Verify all ACs are met
