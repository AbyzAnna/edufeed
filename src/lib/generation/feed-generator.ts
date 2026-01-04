import prisma from "@/lib/prisma";
import { parseURL } from "./parser";
import {
  generateSummaryFromContent,
  generateTableFromContent,
  GeneratedSummary,
  GeneratedTable,
} from "./content-generator";
import { generateFlashcardsFromContent } from "@/lib/flashcards/generator";
import { generateAndUploadSpeech } from "./tts";

export type ContentType = "FLASHCARD_DECK" | "SUMMARY" | "TABLE" | "AUDIO_SUMMARY";

export interface GenerationOptions {
  contentTypes: ContentType[];
  flashcardCount?: number;
  summaryLength?: "short" | "medium" | "long";
  summaryStyle?: "academic" | "casual" | "professional";
  tableType?: "comparison" | "timeline" | "definitions" | "data" | "auto";
}

export interface GenerationResult {
  success: boolean;
  feedItemIds: string[];
  errors: string[];
}

/**
 * Main content generation pipeline for feed items
 */
export async function generateFeedContent(
  userId: string,
  sourceId: string,
  options: GenerationOptions
): Promise<GenerationResult> {
  const results: GenerationResult = {
    success: true,
    feedItemIds: [],
    errors: [],
  };

  try {
    // Get source content
    const source = await prisma.source.findUnique({
      where: { id: sourceId },
    });

    if (!source) {
      throw new Error("Source not found");
    }

    // Get content based on source type
    let content = source.content || "";

    if (!content && source.type === "URL" && source.originalUrl) {
      const parsed = await parseURL(source.originalUrl);
      content = parsed.content;

      // Update source with extracted content
      await prisma.source.update({
        where: { id: sourceId },
        data: { content },
      });
    }

    if (!content) {
      throw new Error("No content available for generation");
    }

    // Generate each content type
    for (const contentType of options.contentTypes) {
      try {
        let feedItemId: string | null = null;

        switch (contentType) {
          case "FLASHCARD_DECK":
            feedItemId = await generateFlashcardDeckItem(
              userId,
              sourceId,
              source.title,
              content,
              options.flashcardCount || 10
            );
            break;

          case "SUMMARY":
            feedItemId = await generateSummaryItem(
              userId,
              sourceId,
              source.title,
              content,
              false,
              options
            );
            break;

          case "AUDIO_SUMMARY":
            feedItemId = await generateSummaryItem(
              userId,
              sourceId,
              source.title,
              content,
              true,
              options
            );
            break;

          case "TABLE":
            feedItemId = await generateTableItem(
              userId,
              sourceId,
              source.title,
              content,
              options
            );
            break;
        }

        if (feedItemId) {
          results.feedItemIds.push(feedItemId);
        }
      } catch (error) {
        console.error(`Error generating ${contentType}:`, error);
        results.errors.push(
          `Failed to generate ${contentType}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    if (results.feedItemIds.length === 0) {
      results.success = false;
    }

    return results;
  } catch (error) {
    console.error("Generation pipeline error:", error);
    return {
      success: false,
      feedItemIds: [],
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

/**
 * Generate flashcard deck feed item
 */
async function generateFlashcardDeckItem(
  userId: string,
  sourceId: string,
  title: string,
  content: string,
  cardCount: number
): Promise<string> {
  // Create feed item first
  const feedItem = await prisma.feedItem.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      sourceId,
      type: "FLASHCARD_DECK",
      title: `Flashcards: ${title}`,
      status: "PROCESSING",
      updatedAt: new Date(),
    },
  });

  try {
    // Generate flashcards
    const flashcards = await generateFlashcardsFromContent(content, title, {
      count: cardCount,
      difficulty: "medium",
      cardStyle: "mixed",
    });

    // Create deck with cards
    const deck = await prisma.deck.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        sourceId,
        feedItemId: feedItem.id,
        title: `Flashcards: ${title}`,
        description: `Auto-generated flashcard deck from ${title}`,
        color: getRandomColor(),
        updatedAt: new Date(),
        Flashcard: {
          create: flashcards.map((card) => ({
            id: crypto.randomUUID(),
            front: card.front,
            back: card.back,
            hint: card.hint,
            updatedAt: new Date(),
          })),
        },
      },
    });

    // Update feed item to completed
    await prisma.feedItem.update({
      where: { id: feedItem.id },
      data: {
        status: "COMPLETED",
        description: `${flashcards.length} flashcards covering key concepts`,
      },
    });

    return feedItem.id;
  } catch (error) {
    await prisma.feedItem.update({
      where: { id: feedItem.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

/**
 * Generate summary feed item
 */
async function generateSummaryItem(
  userId: string,
  sourceId: string,
  title: string,
  content: string,
  includeAudio: boolean,
  options: GenerationOptions
): Promise<string> {
  const type = includeAudio ? "AUDIO_SUMMARY" : "SUMMARY";

  // Create feed item first
  const feedItem = await prisma.feedItem.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      sourceId,
      type,
      title: `Summary: ${title}`,
      status: "PROCESSING",
      updatedAt: new Date(),
    },
  });

  try {
    // Generate summary
    const summary = await generateSummaryFromContent(content, title, {
      includeAudio,
      length: options.summaryLength || "medium",
      style: options.summaryStyle || "professional",
    });

    // Generate audio if requested
    let audioUrl: string | undefined;
    if (includeAudio && summary.audioScript) {
      try {
        audioUrl = await generateAndUploadSpeech(
          summary.audioScript,
          `summary-${feedItem.id}`,
          { voice: "nova", speed: 1.0 }
        );
      } catch (audioError) {
        console.error("Audio generation failed:", audioError);
        // Continue without audio
      }
    }

    // Create summary record
    await prisma.summary.create({
      data: {
        id: crypto.randomUUID(),
        feedItemId: feedItem.id,
        content: summary.content,
        keyPoints: summary.keyPoints,
        highlights: summary.highlights,
        readTime: summary.readTime,
      },
    });

    // Update feed item
    await prisma.feedItem.update({
      where: { id: feedItem.id },
      data: {
        status: "COMPLETED",
        title: summary.title,
        description: summary.content.slice(0, 200),
        audioUrl,
      },
    });

    return feedItem.id;
  } catch (error) {
    await prisma.feedItem.update({
      where: { id: feedItem.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

/**
 * Generate table feed item
 */
async function generateTableItem(
  userId: string,
  sourceId: string,
  title: string,
  content: string,
  options: GenerationOptions
): Promise<string> {
  // Create feed item first
  const feedItem = await prisma.feedItem.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      sourceId,
      type: "TABLE",
      title: `Table: ${title}`,
      status: "PROCESSING",
      updatedAt: new Date(),
    },
  });

  try {
    // Generate tables
    const tables = await generateTableFromContent(content, title, {
      tableType: options.tableType || "auto",
      maxRows: 10,
      maxColumns: 5,
    });

    if (tables.length === 0) {
      throw new Error("No tables could be generated from content");
    }

    // Use the first table (or could create multiple feed items)
    const table = tables[0];

    // Create content table record
    await prisma.contentTable.create({
      data: {
        id: crypto.randomUUID(),
        feedItemId: feedItem.id,
        tableTitle: table.tableTitle,
        headers: table.headers,
        rows: table.rows,
        caption: table.caption,
      },
    });

    // Update feed item
    await prisma.feedItem.update({
      where: { id: feedItem.id },
      data: {
        status: "COMPLETED",
        title: table.tableTitle,
        description: table.caption,
      },
    });

    return feedItem.id;
  } catch (error) {
    await prisma.feedItem.update({
      where: { id: feedItem.id },
      data: { status: "FAILED" },
    });
    throw error;
  }
}

// Helper function to get a random color
function getRandomColor(): string {
  const colors = [
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#a855f7", // Purple
    "#ec4899", // Pink
    "#f43f5e", // Rose
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#14b8a6", // Teal
    "#06b6d4", // Cyan
    "#3b82f6", // Blue
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
