import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { OllamaClient } from "@/lib/ollama";
import {
  getNotebookContext,
  formatContextForLLM,
  extractCitations,
} from "@/lib/notebook";
import type { OllamaMessage } from "@/lib/ollama";

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

// POST /api/notebooks/[notebookId]/chat - Send a message (NotebookLM-style grounded response)
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

    // Check access (minimal query, full context fetched separately)
    const notebookAccess = await prisma.notebook.findFirst({
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
      select: { id: true },
    });

    if (!notebookAccess) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    // Get comprehensive notebook context (NotebookLM-style)
    const notebookContext = await getNotebookContext(notebookId, {
      includeOutputs: true,
      maxSources: 50,
      maxMessages: 10,
      sourceIds: sourceIds?.length > 0 ? sourceIds : undefined,
    });

    if (!notebookContext) {
      return NextResponse.json(
        { error: "Failed to load notebook context" },
        { status: 500 }
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

    // Format context for LLM
    const { systemPrompt, contextText, conversationHistory } = formatContextForLLM(
      notebookContext,
      { maxTokenEstimate: 6000, includeOutputs: true }
    );

    // Build messages for Ollama chat
    const ollamaMessages: OllamaMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "system", content: `\n\nNOTEBOOK CONTENT:\n\n${contextText}` },
    ];

    // Add conversation history for multi-turn context
    for (const msg of conversationHistory) {
      ollamaMessages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    // Add current message
    ollamaMessages.push({ role: "user", content: message });

    // Call AI service for grounded response
    let aiResponse = "";
    let aiProvider = "none";

    // Try Ollama first (local, fast, private)
    const ollama = new OllamaClient();
    const ollamaAvailable = await ollama.isAvailable();

    if (ollamaAvailable) {
      try {
        const response = await ollama.chat(ollamaMessages, {
          temperature: 0.7,
          maxTokens: 2048,
        });
        aiResponse = response.content;
        aiProvider = "ollama";
      } catch (ollamaError) {
        console.error("Ollama error:", ollamaError);
      }
    }

    // Fallback to Cloudflare Workers if Ollama unavailable
    if (!aiResponse) {
      const workersUrl = process.env.WORKERS_URL;
      if (workersUrl) {
        try {
          const response = await fetch(`${workersUrl}/api/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message,
              context: contextText,
              notebookId,
              systemPrompt,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            aiResponse = data.response || data.message;
            aiProvider = "workers";
          }
        } catch (workersError) {
          console.error("Workers error:", workersError);
        }
      }
    }

    // Final fallback if all AI services unavailable
    if (!aiResponse) {
      aiResponse = `I have access to ${notebookContext.stats.totalSources} sources with ${notebookContext.stats.totalWords} total words in this notebook. However, the AI service is currently unavailable.

**Notebook Summary:**
- Title: ${notebookContext.notebook.title}
- Sources: ${Object.entries(notebookContext.stats.sourcesByType)
        .map(([type, count]) => `${type}: ${count}`)
        .join(", ")}
${notebookContext.stats.hasOutputs ? "- Generated outputs available (summaries, flashcards, etc.)" : ""}

Please try again in a moment, or check that Ollama is running locally.`;
      aiProvider = "fallback";
    }

    // Extract citations from the response
    const extractedCitations = extractCitations(aiResponse, notebookContext.sources);

    // Save AI response with citations
    const assistantMessage = await prisma.notebookChat.create({
      data: {
        id: crypto.randomUUID(),
        notebookId,
        userId: session.user.id,
        role: "ASSISTANT",
        content: aiResponse,
        NotebookCitation: {
          create: extractedCitations.map((c) => ({
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
      meta: {
        provider: aiProvider,
        sourcesUsed: notebookContext.stats.totalSources,
        totalWords: notebookContext.stats.totalWords,
        citationsFound: extractedCitations.length,
      },
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
