import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedFlashcard {
  front: string;
  back: string;
  hint?: string;
}

export interface GeneratedQuiz {
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

/**
 * Generate flashcards from source content using AI
 */
export async function generateFlashcards(
  content: string,
  title: string,
  count: number = 10
): Promise<GeneratedFlashcard[]> {
  const prompt = `You are an expert educator creating flashcards for effective learning and retention.

SOURCE CONTENT:
Title: ${title}
Content: ${content.slice(0, 10000)}

REQUIREMENTS:
- Generate exactly ${count} high-quality flashcards
- Each flashcard should test a single concept or fact
- Front: Clear, concise question or prompt (no more than 2 sentences)
- Back: Direct, memorable answer (no more than 3 sentences)
- Hint: Optional subtle clue that helps recall without giving away the answer
- Focus on key concepts, definitions, processes, and relationships
- Avoid trivial facts; prioritize understanding and application
- Use varied question types: definitions, comparisons, applications, examples

OUTPUT FORMAT (JSON):
{
  "flashcards": [
    {
      "front": "Question or prompt text",
      "back": "Answer or explanation",
      "hint": "Optional hint (can be null)"
    }
  ]
}

Respond with valid JSON only.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educator specializing in creating effective flashcards for learning. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return (result.flashcards || []).map(
      (card: { front?: string; back?: string; hint?: string }) => ({
        front: card.front || "",
        back: card.back || "",
        hint: card.hint || null,
      })
    );
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error("Failed to generate flashcards");
  }
}

/**
 * Generate quiz questions from source content using AI
 */
export async function generateQuizQuestions(
  content: string,
  title: string,
  count: number = 5,
  difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM"
): Promise<GeneratedQuiz[]> {
  const difficultyGuide = {
    EASY: "straightforward recall questions with obvious correct answers",
    MEDIUM:
      "questions requiring understanding and application with plausible distractors",
    HARD: "challenging questions requiring analysis and synthesis with subtle distinctions between options",
  };

  const prompt = `You are an expert educator creating quiz questions for assessment.

SOURCE CONTENT:
Title: ${title}
Content: ${content.slice(0, 10000)}

REQUIREMENTS:
- Generate exactly ${count} multiple-choice questions
- Difficulty: ${difficulty} - ${difficultyGuide[difficulty]}
- Each question should have exactly 4 options (A, B, C, D)
- Only one option should be correct
- Distractors should be plausible but clearly wrong upon understanding
- Include a brief explanation for why the correct answer is right

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "question": "The question text",
      "options": [
        { "id": "A", "text": "Option A text", "isCorrect": false },
        { "id": "B", "text": "Option B text", "isCorrect": true },
        { "id": "C", "text": "Option C text", "isCorrect": false },
        { "id": "D", "text": "Option D text", "isCorrect": false }
      ],
      "explanation": "Why the correct answer is right"
    }
  ]
}

Respond with valid JSON only.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert educator specializing in creating effective assessments. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return (result.questions || []).map(
      (q: {
        question?: string;
        options?: { id: string; text: string; isCorrect: boolean }[];
        explanation?: string;
      }) => ({
        question: q.question || "",
        options: q.options || [],
        explanation: q.explanation || "",
      })
    );
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

/**
 * Generate feed content ideas from source (for video/content suggestions)
 */
export async function generateFeedContentIdeas(
  content: string,
  title: string,
  count: number = 5
): Promise<
  {
    title: string;
    description: string;
    hook: string;
    type: "VIDEO" | "FLASHCARD_DECK" | "QUIZ" | "SUMMARY";
  }[]
> {
  const prompt = `You are a content strategist for an educational platform. Analyze the source content and suggest various types of feed content that could be generated from it.

SOURCE CONTENT:
Title: ${title}
Content: ${content.slice(0, 8000)}

REQUIREMENTS:
- Generate ${count} diverse content ideas
- Each idea should represent a different aspect or angle of the source material
- Include a mix of content types: VIDEO (short educational video), FLASHCARD_DECK (set of flashcards), QUIZ (assessment), SUMMARY (key takeaways)
- For each, provide an engaging hook that would work for social media

OUTPUT FORMAT (JSON):
{
  "ideas": [
    {
      "title": "Content title",
      "description": "Brief description of what this content would cover",
      "hook": "Attention-grabbing opening line for social media",
      "type": "VIDEO" | "FLASHCARD_DECK" | "QUIZ" | "SUMMARY"
    }
  ]
}

Respond with valid JSON only.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a content strategist specializing in educational social media content. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return result.ideas || [];
  } catch (error) {
    console.error("Error generating feed content ideas:", error);
    throw new Error("Failed to generate feed content ideas");
  }
}

/**
 * SM-2 Algorithm for spaced repetition
 * Returns updated card parameters based on user response quality (0-5)
 */
export function calculateSM2(
  quality: number, // 0-5 rating
  easeFactor: number,
  interval: number,
  repetitions: number
): { easeFactor: number; interval: number; repetitions: number } {
  // Quality < 3 means incorrect response - reset
  if (quality < 3) {
    return {
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      interval: 1,
      repetitions: 0,
    };
  }

  // Calculate new ease factor
  const newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate new interval
  let newInterval: number;
  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * newEaseFactor);
  }

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: repetitions + 1,
  };
}
