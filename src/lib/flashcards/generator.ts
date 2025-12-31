import { generateDirectFlashcards } from "@/lib/workers-client";

export interface GeneratedFlashcard {
  front: string;
  back: string;
  hint?: string;
}

export interface FlashcardGenerationOptions {
  count?: number;
  difficulty?: "easy" | "medium" | "hard";
  focusAreas?: string[];
  cardStyle?: "definition" | "question" | "cloze" | "mixed";
}

/**
 * Generate flashcards from content using Workers AI
 */
export async function generateFlashcardsFromContent(
  content: string,
  title: string,
  options: FlashcardGenerationOptions = {}
): Promise<GeneratedFlashcard[]> {
  const {
    count = 10,
    difficulty = "medium",
    cardStyle = "mixed",
  } = options;

  try {
    const result = await generateDirectFlashcards({
      content,
      title,
      count,
      difficulty,
      cardStyle,
    });

    return result.flashcards || [];
  } catch (error) {
    console.error("Error generating flashcards:", error);
    throw new Error("Failed to generate flashcards");
  }
}

/**
 * Generate flashcards from a specific topic (without source content)
 * Creates a simple description of the topic and uses it as content
 */
export async function generateFlashcardsFromTopic(
  topic: string,
  options: FlashcardGenerationOptions = {}
): Promise<GeneratedFlashcard[]> {
  const { count = 10, difficulty = "medium", cardStyle = "mixed" } = options;

  try {
    // Create a prompt that acts as content for the topic
    const topicContent = `
Topic: ${topic}

Create educational flashcards about ${topic}. Cover the key concepts,
important facts, definitions, and relationships related to this topic.
Progress from foundational to more advanced concepts.
Include key vocabulary and ensure cards test active recall.
`;

    const result = await generateDirectFlashcards({
      content: topicContent,
      title: topic,
      count,
      difficulty,
      cardStyle,
    });

    return result.flashcards || [];
  } catch (error) {
    console.error("Error generating flashcards from topic:", error);
    throw new Error("Failed to generate flashcards");
  }
}

/**
 * Improve an existing flashcard
 * Returns the original card with minor improvements if possible
 */
export async function improveFlashcard(
  front: string,
  back: string,
  feedback?: string
): Promise<GeneratedFlashcard> {
  try {
    // Create content that includes the current card and improvement request
    const improvementContent = `
Current flashcard that needs improvement:
Question: ${front}
Answer: ${back}
${feedback ? `User feedback: ${feedback}` : ""}

Please create an improved version of this flashcard with:
- A clearer, more specific question
- A more concise, memorable answer
- A helpful hint if appropriate
`;

    const result = await generateDirectFlashcards({
      content: improvementContent,
      title: "Improved Flashcard",
      count: 1,
      difficulty: "medium",
      cardStyle: "question",
    });

    if (result.flashcards && result.flashcards.length > 0) {
      return {
        front: result.flashcards[0].front || front,
        back: result.flashcards[0].back || back,
        hint: result.flashcards[0].hint,
      };
    }

    return { front, back };
  } catch (error) {
    console.error("Error improving flashcard:", error);
    return { front, back };
  }
}
