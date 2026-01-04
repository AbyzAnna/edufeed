import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { storeDocumentEmbeddings } from "@/lib/workers-client";
import { createClient } from "@/lib/supabase/server";
import { getOrCreatePrismaUser } from "@/lib/supabase/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Sync Supabase user with Prisma database (creates user if not exists)
    await getOrCreatePrismaUser(user);

    // Parse pagination parameters with reasonable defaults and limits
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limitParam = parseInt(searchParams.get("limit") || "50", 10);
    const limit = Math.min(Math.max(1, limitParam), 100); // Cap at 100 max

    const sources = await prisma.source.findMany({
      where: {
        userId: user.id,
      },
      include: {
        FeedItem: {
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 5, // Limit nested feed items
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit + 1, // Fetch one extra to detect if there's more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
    });

    // Check if there are more items
    const hasMore = sources.length > limit;
    const items = hasMore ? sources.slice(0, limit) : sources;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    return NextResponse.json({
      sources: items,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, content, originalUrl, fileUrl } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "Type and title are required" },
        { status: 400 }
      );
    }

    // Sync Supabase user with Prisma database (creates user if not exists)
    await getOrCreatePrismaUser(user);

    const source = await prisma.source.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        type,
        title,
        content,
        originalUrl,
        fileUrl,
        updatedAt: new Date(),
      },
    });

    // NEW: Auto-generate embeddings for AI features
    let aiEnabled = false;
    if (content && content.trim().length > 100) {
      try {
        await storeDocumentEmbeddings(source.id, content, {
          title: source.title,
          type: source.type,
        });
        aiEnabled = true;
        console.log(`✅ AI features enabled for source: ${source.id}`);
      } catch (embeddingError) {
        console.error('Failed to generate embeddings:', embeddingError);
        // Don't fail - embeddings are optional
      }
    }

    return NextResponse.json({
      ...source,
      aiEnabled, // Indicates if AI features (chat, flashcards, study guides) are available
    });
  } catch (error) {
    console.error("Error creating source:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create source";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
