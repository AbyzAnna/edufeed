import type { Env } from '../types/env';

// Violation categories for content moderation
export type ViolationCategory =
  | 'hate'
  | 'harassment'
  | 'violence'
  | 'sexual'
  | 'self-harm'
  | 'spam'
  | 'misinformation';

// Moderation result structure
export interface ModerationResult {
  flagged: boolean;
  categories: Record<ViolationCategory, boolean>;
  categoryScores: Record<ViolationCategory, number>;
  modelVersion: string;
}

// Moderation prompt for content analysis
const MODERATION_PROMPT = `You are a content moderation AI. Analyze the following user-generated content for policy violations.

CATEGORIES TO CHECK:
1. hate - Discriminatory or hateful content based on race, religion, gender, etc.
2. harassment - Bullying, threatening, or targeting individuals
3. violence - Violent content, threats, or graphic descriptions
4. sexual - Sexually explicit or suggestive content
5. self-harm - Content promoting or discussing self-harm or suicide
6. spam - Promotional spam, repetitive content, or scams
7. misinformation - Deliberately false or misleading information

IMPORTANT: Respond with ONLY valid JSON, no explanation.

RESPONSE FORMAT:
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

USER CONTENT TO MODERATE:
`;

/**
 * Moderate content using Cloudflare Workers AI
 */
export async function moderateContent(
  content: string,
  env: Env
): Promise<ModerationResult> {
  const ai = env.AI;

  // Build the moderation prompt
  const prompt = MODERATION_PROMPT + content.slice(0, 2000); // Limit content length

  try {
    // Use Llama 3.1 for moderation analysis
    const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        {
          role: 'system',
          content: 'You are a content moderation AI. Respond with only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.1, // Low temperature for consistent results
    });

    // Parse the response
    const responseText = typeof response === 'string'
      ? response
      : (response as { response?: string }).response || '';

    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and normalize the result
    return normalizeResult(result);
  } catch (error) {
    console.error('Moderation error:', error);

    // Return safe default on error
    return getDefaultResult();
  }
}

/**
 * Normalize the AI result to ensure all fields are present
 */
function normalizeResult(result: Partial<ModerationResult>): ModerationResult {
  const categories: ViolationCategory[] = [
    'hate',
    'harassment',
    'violence',
    'sexual',
    'self-harm',
    'spam',
    'misinformation',
  ];

  const normalizedCategories: Record<ViolationCategory, boolean> = {} as Record<ViolationCategory, boolean>;
  const normalizedScores: Record<ViolationCategory, number> = {} as Record<ViolationCategory, number>;

  let flagged = false;

  for (const category of categories) {
    // Get boolean value
    const categoryValue = result.categories?.[category] ?? false;
    normalizedCategories[category] = Boolean(categoryValue);

    // Get score (default 0 if not flagged, 75 if flagged but no score)
    let score = result.categoryScores?.[category] ?? 0;
    if (typeof score !== 'number') {
      score = categoryValue ? 75 : 0;
    }
    score = Math.max(0, Math.min(100, score)); // Clamp to 0-100
    normalizedScores[category] = score;

    // Update flagged status
    if (categoryValue || score > 60) {
      flagged = true;
    }
  }

  return {
    flagged: result.flagged ?? flagged,
    categories: normalizedCategories,
    categoryScores: normalizedScores,
    modelVersion: 'cf-llama-3.1-8b-v1',
  };
}

/**
 * Get default result when moderation fails
 */
function getDefaultResult(): ModerationResult {
  return {
    flagged: false,
    categories: {
      hate: false,
      harassment: false,
      violence: false,
      sexual: false,
      'self-harm': false,
      spam: false,
      misinformation: false,
    },
    categoryScores: {
      hate: 0,
      harassment: 0,
      violence: 0,
      sexual: 0,
      'self-harm': 0,
      spam: 0,
      misinformation: 0,
    },
    modelVersion: 'cf-llama-3.1-8b-v1',
  };
}
