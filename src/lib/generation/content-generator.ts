import {
  generateDirectSummary,
  generateDirectTable,
  type DirectSummaryResult,
  type DirectTableResult,
} from "@/lib/workers-client";

// ==================== SUMMARY GENERATION ====================

export interface GeneratedSummary {
  title: string;
  content: string;
  keyPoints: string[];
  highlights: string[];
  audioScript?: string; // Script optimized for voice narration
  readTime: number; // in seconds
}

export interface SummaryGenerationOptions {
  includeAudio?: boolean;
  length?: "short" | "medium" | "long";
  style?: "academic" | "casual" | "professional";
}

/**
 * Generate a comprehensive summary from source content using Workers AI
 */
export async function generateSummaryFromContent(
  content: string,
  title: string,
  options: SummaryGenerationOptions = {}
): Promise<GeneratedSummary> {
  const { includeAudio = false, length = "medium", style = "professional" } = options;

  try {
    const result: DirectSummaryResult = await generateDirectSummary({
      content,
      title,
      includeAudio,
      length,
      style,
    });

    return {
      title: result.title || title,
      content: result.content || "",
      keyPoints: result.keyPoints || [],
      highlights: result.highlights || [],
      audioScript: result.audioScript,
      readTime: result.readTime || Math.ceil((result.content?.split(" ").length || 0) / 3),
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error("Failed to generate summary");
  }
}

// ==================== TABLE GENERATION ====================

export interface GeneratedTable {
  tableTitle: string;
  headers: string[];
  rows: string[][];
  caption: string;
}

export interface TableGenerationOptions {
  tableType?: "comparison" | "timeline" | "definitions" | "data" | "auto";
  maxRows?: number;
  maxColumns?: number;
}

/**
 * Generate structured tables from content using Workers AI
 */
export async function generateTableFromContent(
  content: string,
  title: string,
  options: TableGenerationOptions = {}
): Promise<GeneratedTable[]> {
  const { tableType = "auto", maxRows = 10, maxColumns = 5 } = options;

  try {
    const result: DirectTableResult = await generateDirectTable({
      content,
      title,
      tableType,
      maxRows,
      maxColumns,
    });

    return result.tables || [];
  } catch (error) {
    console.error("Error generating tables:", error);
    throw new Error("Failed to generate tables");
  }
}

// ==================== FLASHCARD DECK FOR FEED ====================

export interface FeedFlashcardDeck {
  title: string;
  description: string;
  cardCount: number;
  previewCards: Array<{ front: string; back: string }>;
  color: string;
}

/**
 * Generate flashcard deck metadata for feed display
 * Uses the flashcard generation to get preview cards
 */
export async function generateFlashcardDeckPreview(
  content: string,
  title: string,
  cardCount: number = 10
): Promise<FeedFlashcardDeck> {
  try {
    // Use direct flashcard generation to get preview cards
    const { generateDirectFlashcards } = await import("@/lib/workers-client");
    const result = await generateDirectFlashcards({
      content,
      title,
      count: 3, // Just get 3 preview cards
      difficulty: "medium",
    });

    const colors = [
      "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e",
      "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      title: `Flashcards: ${title}`,
      description: `${cardCount} flashcards covering key concepts from ${title}`,
      cardCount,
      previewCards: result.flashcards.slice(0, 3).map(card => ({
        front: card.front,
        back: card.back,
      })),
      color: randomColor,
    };
  } catch (error) {
    console.error("Error generating flashcard preview:", error);
    // Return a basic preview without AI
    return {
      title: `Flashcards: ${title}`,
      description: `${cardCount} flashcards from this source`,
      cardCount,
      previewCards: [],
      color: "#6366f1",
    };
  }
}

// ==================== CONTENT TYPE DETECTION ====================

export interface ContentTypeRecommendation {
  recommended: ("flashcards" | "summary" | "table" | "audio")[];
  reasoning: string;
}

/**
 * Analyze content and recommend best content types to generate
 * Uses simple heuristics instead of AI for speed
 */
export async function analyzeContentForGeneration(
  content: string,
  title: string
): Promise<ContentTypeRecommendation> {
  // Simple heuristic-based analysis (no AI needed)
  const recommended: ("flashcards" | "summary" | "table" | "audio")[] = ["summary", "flashcards"];
  const reasons: string[] = [];

  const lowerContent = content.toLowerCase();
  const contentLength = content.length;

  // Check for table-worthy content
  const hasComparisons = /vs\.?|versus|compare|comparison|difference|similar/i.test(content);
  const hasLists = (content.match(/\n[-•*]\s/g) || []).length > 3;
  const hasNumbers = (content.match(/\d+/g) || []).length > 5;

  if (hasComparisons || hasLists || hasNumbers) {
    recommended.push("table");
    reasons.push("Content contains structured data suitable for tables");
  }

  // Check for audio-worthy content
  const hasNarrative = contentLength > 2000;
  const hasExplanations = /explain|because|therefore|thus|however/i.test(content);

  if (hasNarrative && hasExplanations) {
    recommended.push("audio");
    reasons.push("Content has narrative structure good for audio");
  }

  // Flashcards are almost always useful
  reasons.push("Flashcards help with memorization and recall");
  reasons.push("Summary provides quick overview of key points");

  return {
    recommended,
    reasoning: reasons.join(". "),
  };
}
