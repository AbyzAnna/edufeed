import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { NotebookSourceType, SourceType } from "@prisma/client";
import { processSource } from "@/lib/notebook/source-processor";
import { generateFeedContent } from "@/lib/generation/feed-generator";

interface RouteParams {
  params: Promise<{ notebookId: string }>;
}

// GET /api/notebooks/[notebookId]/sources - List sources
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;

    // Check access
    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        OR: [
          { userId: session.user.id },
          { isPublic: true },
          {
            NotebookCollaborator: {
              some: { userId: session.user.id },
            },
          },
        ],
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    const sources = await prisma.notebookSource.findMany({
      where: { notebookId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error("Error fetching sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    );
  }
}

// POST /api/notebooks/[notebookId]/sources - Add a source
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;
    const body = await request.json();
    const { type, title, url, content, fileUrl } = body;

    // Check editor access
    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        OR: [
          { userId: session.user.id },
          {
            NotebookCollaborator: {
              some: {
                userId: session.user.id,
                role: { in: ["OWNER", "EDITOR"] },
              },
            },
          },
        ],
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found or access denied" },
        { status: 404 }
      );
    }

    // Check source limit (50 for free tier like NotebookLM)
    const sourceCount = await prisma.notebookSource.count({
      where: { notebookId },
    });

    if (sourceCount >= 50) {
      return NextResponse.json(
        { error: "Maximum 50 sources per notebook" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes: NotebookSourceType[] = [
      "URL",
      "PDF",
      "YOUTUBE",
      "TEXT",
      "GOOGLE_DOC",
      "IMAGE",
      "AUDIO",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid source type" }, { status: 400 });
    }

    // Validate required fields based on type
    if ((type === "URL" || type === "YOUTUBE" || type === "GOOGLE_DOC") && !url) {
      return NextResponse.json(
        { error: "URL is required for this source type" },
        { status: 400 }
      );
    }

    if (type === "TEXT" && (!content || typeof content !== "string" || content.trim().length === 0)) {
      return NextResponse.json(
        { error: "Content is required for text sources" },
        { status: 400 }
      );
    }

    if ((type === "PDF" || type === "IMAGE" || type === "AUDIO") && !fileUrl && !url) {
      return NextResponse.json(
        { error: "File URL is required for this source type" },
        { status: 400 }
      );
    }

    // Validate URL format if provided
    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 }
        );
      }
    }

    // Create source with PENDING status
    const notebookSource = await prisma.notebookSource.create({
      data: {
        id: crypto.randomUUID(),
        notebookId,
        type,
        title: title || "Untitled Source",
        originalUrl: url,
        content: type === "TEXT" ? content : null,
        fileUrl,
        status: "PENDING",
      },
    });

    // Get the notebook owner to create the Source record
    const notebookWithOwner = await prisma.notebook.findUnique({
      where: { id: notebookId },
      select: { userId: true },
    });

    if (!notebookWithOwner) {
      return NextResponse.json(notebookSource, { status: 201 });
    }

    // Process source content in the background (non-blocking)
    // This extracts text from URLs, PDFs, YouTube videos, etc.
    processSourceAndGenerateFeed(
      notebookSource.id,
      type,
      notebookWithOwner.userId,
      title || "Untitled Source",
      url,
      type === "TEXT" ? content : undefined,
      fileUrl
    ).catch((error) => {
      console.error("Background source processing failed:", error);
    });

    return NextResponse.json(notebookSource, { status: 201 });
  } catch (error) {
    console.error("Error adding source:", error);
    return NextResponse.json(
      { error: "Failed to add source" },
      { status: 500 }
    );
  }
}

// PATCH - Update a source (via query param ?sourceId=xxx)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");
    const body = await request.json();
    const { title, content } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    // Check editor access
    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        OR: [
          { userId: session.user.id },
          {
            NotebookCollaborator: {
              some: {
                userId: session.user.id,
                role: { in: ["OWNER", "EDITOR"] },
              },
            },
          },
        ],
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found or access denied" },
        { status: 404 }
      );
    }

    // Verify source exists in this notebook
    const existingSource = await prisma.notebookSource.findFirst({
      where: {
        id: sourceId,
        notebookId,
      },
    });

    if (!existingSource) {
      return NextResponse.json(
        { error: "Source not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: { title?: string; content?: string; wordCount?: number } = {};

    if (title !== undefined && title.trim()) {
      updateData.title = title.trim();
    }

    // Only allow content update for TEXT type sources
    if (content !== undefined && existingSource.type === "TEXT") {
      updateData.content = content;
      updateData.wordCount = content.split(/\s+/).filter(Boolean).length;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updatedSource = await prisma.notebookSource.update({
      where: {
        id: sourceId,
        notebookId,
      },
      data: updateData,
    });

    return NextResponse.json(updatedSource);
  } catch (error) {
    console.error("Error updating source:", error);
    return NextResponse.json(
      { error: "Failed to update source" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a source (via query param ?sourceId=xxx)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;
    const { searchParams } = new URL(request.url);
    const sourceId = searchParams.get("sourceId");

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId is required" },
        { status: 400 }
      );
    }

    // Check editor access
    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        OR: [
          { userId: session.user.id },
          {
            NotebookCollaborator: {
              some: {
                userId: session.user.id,
                role: { in: ["OWNER", "EDITOR"] },
              },
            },
          },
        ],
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.notebookSource.delete({
      where: {
        id: sourceId,
        notebookId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting source:", error);
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    );
  }
}

/**
 * Process a NotebookSource, create a matching Source record, and generate feed content
 * This runs in the background (non-blocking) after the source is created
 */
async function processSourceAndGenerateFeed(
  notebookSourceId: string,
  type: NotebookSourceType,
  userId: string,
  title: string,
  url?: string,
  textContent?: string,
  fileUrl?: string
): Promise<void> {
  try {
    // Step 1: Process the source (extract content from URL, PDF, YouTube, etc.)
    const result = await processSource(
      notebookSourceId,
      type,
      url || fileUrl,
      textContent
    );

    if (result.error || !result.content) {
      console.error(`Source processing failed for ${notebookSourceId}:`, result.error);
      return;
    }

    // Step 2: Map NotebookSourceType to SourceType for the Source table
    const sourceTypeMap: Record<NotebookSourceType, SourceType> = {
      URL: "URL",
      PDF: "PDF",
      YOUTUBE: "YOUTUBE",
      TEXT: "TEXT",
      GOOGLE_DOC: "URL", // Map to URL as fallback
      IMAGE: "TEXT", // Map to TEXT as fallback
      AUDIO: "TEXT", // Map to TEXT as fallback
    };

    const mappedSourceType = sourceTypeMap[type] || "TEXT";

    // Step 3: Create a Source record for the feed system
    const source = await prisma.source.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type: mappedSourceType,
        title,
        content: result.content,
        originalUrl: url,
        fileUrl,
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Created Source ${source.id} from NotebookSource ${notebookSourceId}`);

    // Step 4: Generate feed content (flashcards, summary, table)
    const feedResult = await generateFeedContent(userId, source.id, {
      contentTypes: ["SUMMARY", "FLASHCARD_DECK"],
      flashcardCount: 10,
      summaryLength: "medium",
      summaryStyle: "professional",
    });

    if (feedResult.success) {
      console.log(`✅ Generated ${feedResult.feedItemIds.length} feed items for source ${source.id}`);
    } else {
      console.error(`Feed generation had errors for source ${source.id}:`, feedResult.errors);
    }
  } catch (error) {
    console.error(`Error in processSourceAndGenerateFeed for ${notebookSourceId}:`, error);
    // Don't rethrow - this is background processing
  }
}
