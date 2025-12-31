// Cloudflare Workers environment bindings
export interface Env {
  // AI Binding (Workers AI)
  AI: Ai;

  // Vectorize for embeddings
  VECTORIZE: VectorizeIndex;

  // KV for caching
  CACHE: KVNamespace;

  // R2 for audio storage (optional)
  AUDIO_BUCKET?: R2Bucket;

  // D1 for session data (optional)
  DB_SESSIONS?: D1Database;

  // Environment variables
  ENVIRONMENT: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;

  // Secrets
  SUPABASE_SERVICE_ROLE_KEY: string;
  DATABASE_URL: string;
}

// Types for API requests/responses
export interface ChatRequest {
  sourceId: string;
  message: string;
  conversationHistory?: Message[];
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  response: string;
  sources: SourceCitation[];
  conversationId: string;
}

export interface SourceCitation {
  sourceId: string;
  chunk: string;
  page?: number;
  timestamp?: number;
  relevance: number;
}

export interface StudyGuideRequest {
  sourceId: string;
  focusAreas?: string[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface StudyGuideResponse {
  title: string;
  overview: string;
  keyTopics: KeyTopic[];
  timeline?: TimelineEvent[];
  vocabulary: VocabularyTerm[];
  practiceQuestions: string[];
}

export interface KeyTopic {
  topic: string;
  summary: string;
  subtopics: string[];
  importance: number;
}

export interface TimelineEvent {
  date?: string;
  event: string;
  description: string;
  significance: string;
}

export interface VocabularyTerm {
  term: string;
  definition: string;
  context: string;
}

export interface FlashcardGenerationRequest {
  sourceId: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  topics?: string[];
}

export interface FlashcardGenerationResponse {
  cards: GeneratedFlashcard[];
  metadata: {
    totalGenerated: number;
    difficulty: string;
    sourceTitle: string;
  };
}

export interface GeneratedFlashcard {
  front: string;
  back: string;
  hint?: string;
  difficulty: number;
  topic: string;
  sourceReference: string;
}

export interface AudioOverviewRequest {
  sourceId: string;
  style?: 'conversational' | 'lecture' | 'debate';
  duration?: number; // target duration in seconds
}

export interface AudioOverviewResponse {
  audioUrl: string;
  transcript: string;
  speakers: Speaker[];
  duration: number;
}

export interface Speaker {
  name: string;
  voice: string;
  segments: SpeakerSegment[];
}

export interface SpeakerSegment {
  timestamp: number;
  text: string;
}

// Document chunk for RAG
export interface DocumentChunk {
  id: string;
  sourceId: string;
  content: string;
  embedding?: number[];
  metadata: {
    page?: number;
    timestamp?: number;
    section?: string;
  };
}

// Direct content generation requests (no sourceId/embeddings needed)
export interface DirectSummaryRequest {
  content: string;
  title: string;
  includeAudio?: boolean;
  length?: 'short' | 'medium' | 'long';
  style?: 'academic' | 'casual' | 'professional';
}

export interface DirectSummaryResponse {
  title: string;
  content: string;
  keyPoints: string[];
  highlights: string[];
  audioScript?: string;
  readTime: number;
}

export interface DirectFlashcardsRequest {
  content: string;
  title: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cardStyle?: 'definition' | 'question' | 'cloze' | 'mixed';
}

export interface DirectFlashcardsResponse {
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

export interface DirectTableRequest {
  content: string;
  title: string;
  tableType?: 'comparison' | 'timeline' | 'definitions' | 'data' | 'auto';
  maxRows?: number;
  maxColumns?: number;
}

export interface DirectTableResponse {
  tables: Array<{
    tableTitle: string;
    headers: string[];
    rows: string[][];
    caption: string;
  }>;
}
