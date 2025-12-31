import type {
  Env,
  FlashcardGenerationRequest,
  FlashcardGenerationResponse,
  GeneratedFlashcard,
} from '../types/env';
import { searchRelevantChunks } from './embeddings';
import { generateJSON, generateText } from './llm';

/**
 * Advanced flashcard generation using Llama 3.3
 * Creates high-quality, contextual flashcards with difficulty levels
 */
export async function generateFlashcards(
  request: FlashcardGenerationRequest,
  env: Env
): Promise<FlashcardGenerationResponse> {
  const { sourceId, count = 20, difficulty = 'medium', topics = [] } = request;

  // 1. Get relevant content
  const searchQuery =
    topics.length > 0
      ? `key concepts and facts about ${topics.join(', ')}`
      : 'important concepts, facts, and definitions';

  const chunks = await searchRelevantChunks(searchQuery, sourceId, 15, env);
  const content = chunks.map((c) => c.content).join('\n\n');

  // 2. Generate flashcards in batches
  const batchSize = 10;
  const allCards: GeneratedFlashcard[] = [];

  for (let i = 0; i < count; i += batchSize) {
    const batchCount = Math.min(batchSize, count - i);
    const cards = await generateFlashcardBatch(content, batchCount, difficulty, topics, env);
    allCards.push(...cards);
  }

  // 3. Deduplicate and rank by quality
  const uniqueCards = deduplicateFlashcards(allCards);
  const rankedCards = await rankFlashcardsByQuality(uniqueCards, env);

  // 4. Get source metadata
  const sourceTitle = await getSourceTitle(sourceId, content, env);

  return {
    cards: rankedCards.slice(0, count),
    metadata: {
      totalGenerated: rankedCards.length,
      difficulty,
      sourceTitle,
    },
  };
}

/**
 * Generate a batch of flashcards
 */
async function generateFlashcardBatch(
  content: string,
  count: number,
  difficulty: string,
  topics: string[],
  env: Env
): Promise<GeneratedFlashcard[]> {
  const systemPrompt = `You are an expert educator creating high-quality flashcards.

Create exactly ${count} flashcards with these criteria:
- Difficulty: ${difficulty}
${topics.length > 0 ? `- Focus topics: ${topics.join(', ')}` : ''}
- Each card should test one specific concept
- Questions should be clear and unambiguous
- Answers should be concise but complete
- Include helpful hints when appropriate
- Vary question types (definition, application, comparison, etc.)

Return JSON array:
[{
  "front": "Question or prompt (clear and specific)",
  "back": "Answer (concise and accurate)",
  "hint": "Optional hint (use null if not needed)",
  "difficulty": 1-10 (1=easiest, 10=hardest),
  "topic": "Specific topic this card covers",
  "sourceReference": "Quote or reference from source material"
}]`;

  const prompt = `Source material:\n\n${content.substring(0, 6000)}`;

  const schema = `[{
    "front": "...",
    "back": "...",
    "hint": "..." or null,
    "difficulty": 1-10,
    "topic": "...",
    "sourceReference": "..."
  }]`;

  return generateJSON<GeneratedFlashcard[]>(prompt, systemPrompt, schema, env);
}

/**
 * Deduplicate flashcards based on semantic similarity
 */
function deduplicateFlashcards(cards: GeneratedFlashcard[]): GeneratedFlashcard[] {
  const unique: GeneratedFlashcard[] = [];

  for (const card of cards) {
    // Simple deduplication based on front text similarity
    const isDuplicate = unique.some((existing) => {
      const similarity = calculateTextSimilarity(card.front, existing.front);
      return similarity > 0.8; // 80% similar = duplicate
    });

    if (!isDuplicate) {
      unique.push(card);
    }
  }

  return unique;
}

/**
 * Calculate simple text similarity (Jaccard coefficient)
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter((w) => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Rank flashcards by quality using LLM
 */
async function rankFlashcardsByQuality(
  cards: GeneratedFlashcard[],
  env: Env
): Promise<GeneratedFlashcard[]> {
  // For large sets, just sort by difficulty and topic diversity
  // For small sets, could use LLM to evaluate quality

  if (cards.length <= 20) {
    // LLM-based ranking for small sets
    const systemPrompt = `Evaluate these flashcards for quality.
Rate each card 1-10 based on:
- Clarity of question
- Accuracy of answer
- Educational value
- Appropriate difficulty

Return JSON array of scores in same order: [8, 7, 9, ...]`;

    try {
      const cardsJson = JSON.stringify(cards.map((c) => ({ front: c.front, back: c.back })));
      const scores = await generateJSON<number[]>(
        cardsJson,
        systemPrompt,
        '[1, 2, 3, ...]',
        env
      );

      // Sort by scores
      const scored = cards.map((card, idx) => ({
        card,
        score: scores[idx] || 5,
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored.map((s) => s.card);
    } catch {
      // Fallback to simple sorting
      return cards;
    }
  }

  // Simple topic diversity sorting for large sets
  return cards;
}

/**
 * Get source title
 */
async function getSourceTitle(
  sourceId: string,
  content: string,
  env: Env
): Promise<string> {
  // Try to infer title from content
  const systemPrompt = `Based on this content, generate a short title (5-8 words) that describes what this is about.
Return only the title text.`;

  const prompt = content.substring(0, 500);

  return generateText(prompt, systemPrompt, env, {
    temperature: 0.5,
    maxTokens: 30,
  });
}

/**
 * Generate cloze deletion flashcards (fill-in-the-blank)
 */
export async function generateClozeCards(
  sourceId: string,
  count: number,
  env: Env
): Promise<GeneratedFlashcard[]> {
  const chunks = await searchRelevantChunks('important facts and key information', sourceId, 10, env);
  const content = chunks.map((c) => c.content).join('\n\n');

  const systemPrompt = `Create ${count} cloze deletion flashcards (fill-in-the-blank).

For each card:
- Front: Sentence with [...] replacing a key term
- Back: The missing term/phrase
- Hint: Context clue

Example:
Front: "The [...] is the powerhouse of the cell."
Back: "mitochondria"
Hint: "Organelle responsible for energy production"

Return JSON array:
[{
  "front": "Sentence with [...]",
  "back": "Missing term",
  "hint": "Context clue",
  "difficulty": 1-10,
  "topic": "Topic name",
  "sourceReference": "Original sentence"
}]`;

  const prompt = `Content:\n\n${content.substring(0, 6000)}`;

  const schema = `[{"front": "...", "back": "...", "hint": "...", "difficulty": 1-10, "topic": "...", "sourceReference": "..."}]`;

  return generateJSON<GeneratedFlashcard[]>(prompt, systemPrompt, schema, env);
}

/**
 * Generate image occlusion cards (for diagrams)
 * Note: Requires image processing capabilities
 */
export async function generateImageOcclusionCards(
  imageUrl: string,
  description: string,
  env: Env
): Promise<GeneratedFlashcard[]> {
  // This would require vision model support
  // Placeholder for future implementation with Llama Vision or similar

  const systemPrompt = `Based on this diagram description, create flashcards that would work with image occlusion.
Each card should test one labeled part or concept from the diagram.

Description: ${description}

Return JSON array of cards.`;

  return generateJSON<GeneratedFlashcard[]>(
    description,
    systemPrompt,
    '[{"front": "...", "back": "...", "hint": "...", "difficulty": 1-10, "topic": "...", "sourceReference": "..."}]',
    env
  );
}

/**
 * Adapt flashcard difficulty based on user performance
 */
export async function adaptFlashcardDifficulty(
  card: GeneratedFlashcard,
  userPerformance: {
    attempts: number;
    successRate: number;
    averageResponseTime: number;
  },
  env: Env
): Promise<GeneratedFlashcard> {
  const systemPrompt = `Adapt this flashcard based on user performance.

Current card:
Front: ${card.front}
Back: ${card.back}
Current difficulty: ${card.difficulty}

User performance:
- Attempts: ${userPerformance.attempts}
- Success rate: ${userPerformance.successRate}%
- Avg response time: ${userPerformance.averageResponseTime}ms

If user is struggling (success rate < 60%), simplify the card.
If user is excelling (success rate > 90%, fast responses), make it more challenging.

Return adapted card as JSON with same schema.`;

  const schema = `{"front": "...", "back": "...", "hint": "...", "difficulty": 1-10, "topic": "...", "sourceReference": "..."}`;

  return generateJSON<GeneratedFlashcard>(JSON.stringify(card), systemPrompt, schema, env);
}
