import { ModerationContentType } from '@prisma/client';
import { ContentTypeConfig } from './types';

// Moderation thresholds
export const MODERATION_THRESHOLDS = {
  // Confidence > this = auto reject
  autoReject: 85,
  // Confidence between manualReview and autoReject = needs review
  manualReview: 60,
  // Confidence < manualReview = auto approve
  autoApprove: 60,
} as const;

// Content type specific configurations
export const CONTENT_TYPE_CONFIG: Record<ModerationContentType, ContentTypeConfig> = {
  COMMENT: {
    sensitivity: 'medium',
    autoRejectThreshold: 85,
    manualReviewThreshold: 60,
  },
  DIRECT_MESSAGE: {
    sensitivity: 'high',
    autoRejectThreshold: 80, // Lower threshold for DMs
    manualReviewThreshold: 50,
  },
  STUDY_ROOM_MESSAGE: {
    sensitivity: 'medium',
    autoRejectThreshold: 85,
    manualReviewThreshold: 60,
  },
  NOTEBOOK_CONTENT: {
    sensitivity: 'low', // Educational content is more lenient
    autoRejectThreshold: 90,
    manualReviewThreshold: 70,
  },
  NOTEBOOK_SOURCE: {
    sensitivity: 'low',
    autoRejectThreshold: 90,
    manualReviewThreshold: 70,
  },
  FLASHCARD: {
    sensitivity: 'low',
    autoRejectThreshold: 90,
    manualReviewThreshold: 70,
  },
  FEED_ITEM: {
    sensitivity: 'medium',
    autoRejectThreshold: 85,
    manualReviewThreshold: 60,
  },
};

// User penalty thresholds
export const PENALTY_CONFIG = {
  // Number of violations before warning
  warningThreshold: 2,
  // Number of violations before mute
  muteThreshold: 5,
  // Mute duration in minutes
  muteDurationMinutes: 24 * 60, // 24 hours
  // Number of violations before account review
  reviewThreshold: 10,
} as const;

// API rate limits
export const RATE_LIMITS = {
  // Max moderation checks per minute per user
  maxChecksPerMinute: 10,
  // Max appeals per day per user
  maxAppealsPerDay: 3,
} as const;

// AI model configuration
export const AI_CONFIG = {
  // Cloudflare Worker URL
  workerUrl: process.env.WORKERS_URL || 'https://edufeed-ai-worker.steep-mouse-b843.workers.dev',
  // Request timeout in milliseconds
  timeoutMs: 5000,
  // Retry attempts
  maxRetries: 2,
  // Current AI model version for tracking
  modelVersion: 'cf-llama-3.1-8b-v1',
  // Fallback model version
  openAIModelVersion: 'omni-moderation-latest',
} as const;

// Moderation prompt for Cloudflare Workers AI
export const MODERATION_PROMPT = `You are a content moderation AI. Analyze the following user-generated content for policy violations.

CATEGORIES TO CHECK:
1. hate - Discriminatory or hateful content based on race, religion, gender, etc.
2. harassment - Bullying, threatening, or targeting individuals
3. violence - Violent content, threats, or graphic descriptions
4. sexual - Sexually explicit or suggestive content
5. self-harm - Content promoting or discussing self-harm or suicide
6. spam - Promotional spam, repetitive content, or scams
7. misinformation - Deliberately false or misleading information

RESPONSE FORMAT (JSON only, no explanation):
{
  "flagged": boolean,
  "categories": {
    "hate": boolean,
    "harassment": boolean,
    "violence": boolean,
    "sexual": boolean,
    "self-harm": boolean,
    "spam": boolean,
    "misinformation": boolean
  },
  "categoryScores": {
    "hate": number (0-100),
    "harassment": number (0-100),
    "violence": number (0-100),
    "sexual": number (0-100),
    "self-harm": number (0-100),
    "spam": number (0-100),
    "misinformation": number (0-100)
  }
}

CONTENT TO MODERATE:
`;
