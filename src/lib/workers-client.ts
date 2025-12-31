/**
 * Client library for calling Cloudflare Workers AI endpoints
 * Use this from Next.js API routes or server components
 */

const WORKERS_URL = process.env.WORKERS_URL || 'http://localhost:8787';

// ==================== Types ====================

export interface ChatRequest {
  sourceId: string;
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  response: string;
  sources: Array<{
    sourceId: string;
    chunk: string;
    page?: number;
    timestamp?: number;
    relevance: number;
  }>;
  conversationId: string;
}

export interface StudyGuideResponse {
  title: string;
  overview: string;
  keyTopics: Array<{
    topic: string;
    summary: string;
    subtopics: string[];
    importance: number;
  }>;
  timeline?: Array<{
    date?: string;
    event: string;
    description: string;
    significance: string;
  }>;
  vocabulary: Array<{
    term: string;
    definition: string;
    context: string;
  }>;
  practiceQuestions: string[];
}

export interface FlashcardGenerationResponse {
  cards: Array<{
    front: string;
    back: string;
    hint?: string;
    difficulty: number;
    topic: string;
    sourceReference: string;
  }>;
  metadata: {
    totalGenerated: number;
    difficulty: string;
    sourceTitle: string;
  };
}

export interface AudioOverviewResponse {
  audioUrl: string;
  transcript: string;
  speakers: Array<{
    name: string;
    voice: string;
    segments: Array<{
      timestamp: number;
      text: string;
    }>;
  }>;
  duration: number;
}

// ==================== API Functions ====================

/**
 * Store document embeddings in Vectorize
 * Call this after creating a new Source in your database
 */
export async function storeDocumentEmbeddings(
  sourceId: string,
  content: string,
  metadata: { title: string; type: string }
): Promise<void> {
  const response = await fetch(`${WORKERS_URL}/api/embeddings/store`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, content, metadata }),
  });

  if (!response.ok) {
    throw new Error(`Failed to store embeddings: ${response.statusText}`);
  }
}

/**
 * Delete document embeddings
 * Call this when deleting a Source
 */
export async function deleteDocumentEmbeddings(sourceId: string): Promise<void> {
  const response = await fetch(`${WORKERS_URL}/api/embeddings/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete embeddings: ${response.statusText}`);
  }
}

/**
 * Chat with a document using RAG
 */
export async function chatWithDocument(
  sourceId: string,
  message: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<ChatResponse> {
  const response = await fetch(`${WORKERS_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceId,
      message,
      conversationHistory,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Continue an existing chat conversation
 */
export async function continueChatConversation(
  conversationId: string,
  message: string
): Promise<ChatResponse> {
  const response = await fetch(`${WORKERS_URL}/api/chat/continue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message }),
  });

  if (!response.ok) {
    throw new Error(`Chat continuation failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate comprehensive study guide
 */
export async function generateStudyGuide(
  sourceId: string,
  options?: {
    focusAreas?: string[];
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  }
): Promise<StudyGuideResponse> {
  const response = await fetch(`${WORKERS_URL}/api/study-guide/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceId,
      ...options,
    }),
  });

  if (!response.ok) {
    throw new Error(`Study guide generation failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate study plan from study guide
 */
export async function generateStudyPlan(
  studyGuide: StudyGuideResponse,
  targetDays: number
): Promise<
  Array<{
    day: number;
    topics: string[];
    tasks: string[];
    estimatedHours: number;
  }>
> {
  const response = await fetch(`${WORKERS_URL}/api/study-guide/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studyGuide, targetDays }),
  });

  if (!response.ok) {
    throw new Error(`Study plan generation failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate flashcards from source
 */
export async function generateFlashcards(
  sourceId: string,
  options?: {
    count?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    topics?: string[];
  }
): Promise<FlashcardGenerationResponse> {
  const response = await fetch(`${WORKERS_URL}/api/flashcards/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceId,
      count: options?.count ?? 20,
      difficulty: options?.difficulty ?? 'medium',
      topics: options?.topics ?? [],
    }),
  });

  if (!response.ok) {
    throw new Error(`Flashcard generation failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate cloze deletion flashcards
 */
export async function generateClozeCards(
  sourceId: string,
  count: number = 10
): Promise<FlashcardGenerationResponse> {
  const response = await fetch(`${WORKERS_URL}/api/flashcards/generate-cloze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sourceId, count }),
  });

  if (!response.ok) {
    throw new Error(`Cloze card generation failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate podcast-style audio overview
 */
export async function generateAudioOverview(
  sourceId: string,
  options?: {
    style?: 'conversational' | 'lecture' | 'debate';
    duration?: number;
  }
): Promise<AudioOverviewResponse> {
  const response = await fetch(`${WORKERS_URL}/api/audio-overview/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceId,
      style: options?.style ?? 'conversational',
      duration: options?.duration ?? 300, // 5 minutes default
    }),
  });

  if (!response.ok) {
    throw new Error(`Audio overview generation failed: ${response.statusText}`);
  }

  return response.json();
}

// ==================== Direct Content Generation ====================
// These endpoints accept raw content directly (no embeddings needed)

export interface DirectSummaryOptions {
  content: string;
  title: string;
  includeAudio?: boolean;
  length?: 'short' | 'medium' | 'long';
  style?: 'academic' | 'casual' | 'professional';
}

export interface DirectSummaryResult {
  title: string;
  content: string;
  keyPoints: string[];
  highlights: string[];
  audioScript?: string;
  readTime: number;
}

export interface DirectFlashcardsOptions {
  content: string;
  title: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cardStyle?: 'definition' | 'question' | 'cloze' | 'mixed';
}

export interface DirectFlashcardsResult {
  flashcards: Array<{
    front: string;
    back: string;
    hint?: string;
  }>;
  metadata: {
    totalGenerated: number;
    difficulty: string;
  };
}

export interface DirectTableOptions {
  content: string;
  title: string;
  tableType?: 'comparison' | 'timeline' | 'definitions' | 'data' | 'auto';
  maxRows?: number;
  maxColumns?: number;
}

export interface DirectTableResult {
  tables: Array<{
    tableTitle: string;
    headers: string[];
    rows: string[][];
    caption: string;
  }>;
}

/**
 * Generate summary directly from content (no embeddings required)
 */
export async function generateDirectSummary(
  options: DirectSummaryOptions
): Promise<DirectSummaryResult> {
  const response = await fetch(`${WORKERS_URL}/api/content/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Summary generation failed: ${error.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Generate flashcards directly from content (no embeddings required)
 */
export async function generateDirectFlashcards(
  options: DirectFlashcardsOptions
): Promise<DirectFlashcardsResult> {
  const response = await fetch(`${WORKERS_URL}/api/content/flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Flashcard generation failed: ${error.error || response.statusText}`);
  }

  return response.json();
}

/**
 * Generate tables directly from content (no embeddings required)
 */
export async function generateDirectTable(
  options: DirectTableOptions
): Promise<DirectTableResult> {
  const response = await fetch(`${WORKERS_URL}/api/content/table`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(`Table generation failed: ${error.error || response.statusText}`);
  }

  return response.json();
}

// ==================== Utility Functions ====================

/**
 * Check Workers health
 */
export async function checkWorkersHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${WORKERS_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Batch process multiple sources
 */
export async function batchStoreEmbeddings(
  sources: Array<{
    id: string;
    content: string;
    title: string;
    type: string;
  }>
): Promise<void> {
  const promises = sources.map((source) =>
    storeDocumentEmbeddings(source.id, source.content, {
      title: source.title,
      type: source.type,
    })
  );

  await Promise.all(promises);
}
