import {
  ModerationContentType,
  ModerationStatus,
  ModerationDecision,
  ContentModerationReport,
} from '@prisma/client';

// Violation categories detected by AI
export type ViolationCategory =
  | 'hate'
  | 'harassment'
  | 'violence'
  | 'sexual'
  | 'self-harm'
  | 'spam'
  | 'misinformation';

// Single violation with details
export interface Violation {
  category: ViolationCategory;
  confidence: number; // 0-100
  details: string;
}

// Result from AI moderation check
export interface AICheckResult {
  flagged: boolean;
  categories: Record<ViolationCategory, boolean>;
  categoryScores: Record<ViolationCategory, number>;
  modelVersion: string;
}

// Decision result from moderation service
export interface ModerationResult {
  approved: boolean;
  requiresReview: boolean;
  violations: Violation[];
  confidenceScore: number; // highest violation confidence
  status: ModerationStatus;
  report: ContentModerationReport;
}

// Input for moderation check
export interface ModerationInput {
  content: string;
  contentType: ModerationContentType;
  userId: string;
  contentId?: string; // For existing content being moderated
}

// Configuration for different content types
export interface ContentTypeConfig {
  sensitivity: 'low' | 'medium' | 'high';
  autoRejectThreshold: number;
  manualReviewThreshold: number;
}

// API response for blocked content
export interface ContentBlockedResponse {
  error: 'CONTENT_BLOCKED';
  message: string;
  violations: Array<{
    category: ViolationCategory;
    suggestion: string;
  }>;
  reportId: string;
  canAppeal: boolean;
}

// Worker API response
export interface WorkerModerationResponse {
  success: boolean;
  result?: AICheckResult;
  error?: string;
}

// OpenAI moderation response mapping
export interface OpenAIModerationResponse {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: {
      sexual: boolean;
      hate: boolean;
      harassment: boolean;
      'self-harm': boolean;
      'sexual/minors': boolean;
      'hate/threatening': boolean;
      'violence/graphic': boolean;
      violence: boolean;
      'self-harm/intent': boolean;
      'self-harm/instructions': boolean;
      'harassment/threatening': boolean;
    };
    category_scores: Record<string, number>;
  }>;
}

// Suggestion messages for each violation category
export const VIOLATION_SUGGESTIONS: Record<ViolationCategory, string> = {
  hate: 'Please remove any discriminatory or hateful language.',
  harassment: 'Please ensure your content is respectful and not targeting individuals.',
  violence: 'Please remove any violent or threatening content.',
  sexual: 'Please remove any sexually explicit or suggestive content.',
  'self-harm': 'Please remove any content promoting or discussing self-harm.',
  spam: 'Please ensure your content is relevant and not promotional spam.',
  misinformation: 'Please verify the accuracy of information before posting.',
};
