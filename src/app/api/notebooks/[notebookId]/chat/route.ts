import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ notebookId: string }>;
}

// GET /api/notebooks/[notebookId]/chat - Get chat history
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

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

    const messages = await prisma.notebookChat.findMany({
      where: { notebookId },
      include: {
        NotebookCitation: {
          include: {
            NotebookSource: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching chat:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat" },
      { status: 500 }
    );
  }
}

// POST /api/notebooks/[notebookId]/chat - Send a message (AI grounded response)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;
    const body = await request.json();
    const { message, sourceIds } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

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
      include: {
        NotebookSource: {
          where: {
            status: "COMPLETED",
            // Filter by sourceIds if provided
            ...(sourceIds && sourceIds.length > 0
              ? { id: { in: sourceIds } }
              : {}),
          },
          select: {
            id: true,
            title: true,
            content: true,
            type: true,
          },
        },
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    // Save user message
    const userMessage = await prisma.notebookChat.create({
      data: {
        id: crypto.randomUUID(),
        notebookId,
        userId: session.user.id,
        role: "USER",
        content: message,
      },
    });

    // Build context from sources for RAG
    const sourceContext = notebook.NotebookSource
      .map((s) => `[Source: ${s.title}]\n${s.content || ""}`)
      .join("\n\n---\n\n");

    // Call AI service for grounded response
    let aiResponse = "";
    let citations: { sourceId: string; excerpt: string }[] = [];

    try {
      // Use Cloudflare Workers AI or OpenAI
      const workersUrl = process.env.WORKERS_URL;

      if (workersUrl) {
        const response = await fetch(`${workersUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            context: sourceContext,
            notebookId,
            systemPrompt: `You are a helpful research assistant. Answer questions based ONLY on the provided source materials.
If the answer cannot be found in the sources, say so clearly.
When citing information, mention which source it comes from.
Be concise and accurate.`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiResponse = data.response || data.message;
          citations = data.citations || [];
        }
      }

      // Fallback if workers not available
      if (!aiResponse) {
        aiResponse = `Based on your ${notebook.NotebookSource.length} sources, I can help answer questions about the material. However, the AI service is currently unavailable. Please try again later.`;
      }
    } catch (aiError) {
      console.error("AI service error:", aiError);
      aiResponse =
        "I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment.";
    }

    // Save AI response with citations
    const assistantMessage = await prisma.notebookChat.create({
      data: {
        id: crypto.randomUUID(),
        notebookId,
        userId: session.user.id,
        role: "ASSISTANT",
        content: aiResponse,
        NotebookCitation: {
          create: citations.map((c) => ({
            id: crypto.randomUUID(),
            sourceId: c.sourceId,
            excerpt: c.excerpt,
          })),
        },
      },
      include: {
        NotebookCitation: {
          include: {
            NotebookSource: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error("Error in chat:", error);
    return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
  }
}

// DELETE /api/notebooks/[notebookId]/chat - Clear chat history
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;

    // Check owner access
    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        userId: session.user.id,
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found or access denied" },
        { status: 404 }
      );
    }

    await prisma.notebookChat.deleteMany({
      where: { notebookId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing chat:", error);
    return NextResponse.json(
      { error: "Failed to clear chat" },
      { status: 500 }
    );
  }
}
