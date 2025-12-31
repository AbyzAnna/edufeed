import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateFeedContent,
  ContentType as FeedContentType,
  GenerationOptions,
} from "@/lib/generation/feed-generator";
import { createClient } from "@/lib/supabase/server";
import { getOrCreatePrismaUser } from "@/lib/supabase/auth";

// POST - Generate feed content from a source
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync Supabase user with Prisma database (creates user if not exists)
    await getOrCreatePrismaUser(user);

    const body = await request.json();
    const {
      sourceId,
      contentTypes = ["SUMMARY", "FLASHCARD_DECK"],
      flashcardCount = 10,
      summaryLength = "medium",
      summaryStyle = "professional",
      tableType = "auto",
      includeAudio = false,
    } = body as {
      sourceId: string;
      contentTypes?: FeedContentType[];
      flashcardCount?: number;
      summaryLength?: "short" | "medium" | "long";
      summaryStyle?: "academic" | "casual" | "professional";
      tableType?: "comparison" | "timeline" | "definitions" | "data" | "auto";
      includeAudio?: boolean;
    };

    if (!sourceId) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    // Validate content types
    const validTypes: FeedContentType[] = ["FLASHCARD_DECK", "SUMMARY", "TABLE", "AUDIO_SUMMARY"];
    const invalidTypes = contentTypes.filter((t) => !validTypes.includes(t));
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        { error: `Invalid content types: ${invalidTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Fetch and verify source ownership
    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        userId: user.id,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    // Build generation options
    // If includeAudio is true, replace SUMMARY with AUDIO_SUMMARY
    let finalContentTypes = [...contentTypes];
    if (includeAudio && finalContentTypes.includes("SUMMARY")) {
      finalContentTypes = finalContentTypes.map(t => t === "SUMMARY" ? "AUDIO_SUMMARY" : t);
    }

    const options: GenerationOptions = {
      contentTypes: finalContentTypes,
      flashcardCount,
      summaryLength,
      summaryStyle,
      tableType,
    };

    // Generate feed content
    const result = await generateFeedContent(user.id, sourceId, options);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Content generation failed",
          details: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Content generated successfully",
      feedItemIds: result.feedItemIds,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

// GET - Get content type recommendations for a source
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync Supabase user with Prisma database (creates user if not exists)
    await getOrCreatePrismaUser(user);

    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { error: "Source ID is required" },
        { status: 400 }
      );
    }

    const source = await prisma.source.findFirst({
      where: {
        id: sourceId,
        userId: user.id,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "Source not found" }, { status: 404 });
    }

    if (!source.content) {
      return NextResponse.json(
        { error: "Source has no content" },
        { status: 400 }
      );
    }

    // Analyze content and recommend best content types
    const { analyzeContentForGeneration } = await import("@/lib/generation/content-generator");
    const recommendations = await analyzeContentForGeneration(source.content, source.title);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Error getting content recommendations:", error);
    return NextResponse.json(
      { error: "Failed to get content recommendations" },
      { status: 500 }
    );
  }
}
