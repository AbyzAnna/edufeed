import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { OllamaClient } from "@/lib/ollama";
import OpenAI from "openai";
import {
  getNotebookContext,
  formatContextForLLM,
  extractCitations,
} from "@/lib/notebook";
import type { OllamaMessage } from "@/lib/ollama";

// Initialize OpenAI client (if API key is available and not placeholder)
const openai = process.env.OPENAI_API_KEY &&
  !process.env.OPENAI_API_KEY.includes("your-") &&
  process.env.OPENAI_API_KEY.startsWith("sk-")
    ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    : null;

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
    // Validate and clamp limit to prevent DoS via excessive data retrieval
    const rawLimit = parseInt(searchParams.get("limit") || "50");
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 100);
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

    // Validate message
    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedMessage.length > 10000) {
      return NextResponse.json(
        { error: "Message is too long (max 10000 characters)" },
        { status: 400 }
      );
    }

    // Validate sourceIds if provided
    if (sourceIds !== undefined && !Array.isArray(sourceIds)) {
      return NextResponse.json(
        { error: "sourceIds must be an array" },
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

    // Save user message (using trimmed message)
    const userMessage = await prisma.notebookChat.create({
      data: {
        id: crypto.randomUUID(),
        notebookId,
        userId: session.user.id,
        role: "USER",
        content: trimmedMessage,
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
    ollamaMessages.push({ role: "user", content: trimmedMessage });

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
          // Use the dedicated /api/notebook-chat endpoint for Q&A
          const response = await fetch(`${workersUrl}/api/notebook-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: trimmedMessage,
              context: contextText,
              conversationHistory: conversationHistory.map(msg => ({
                role: msg.role === "user" ? "user" : "assistant",
                content: msg.content,
              })),
            }),
          });

          if (response.ok) {
            const data = await response.json();
            // The notebook-chat endpoint returns { response: "...", success: true }
            if (data.success && data.response) {
              aiResponse = data.response;
              aiProvider = "workers";
            }
          }
        } catch (workersError) {
          console.error("Workers error:", workersError);
        }
      }
    }

    // Fallback to OpenAI if Workers unavailable
    if (!aiResponse && openai) {
      try {
        const openaiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
          { role: "system", content: systemPrompt },
          { role: "system", content: `\n\nNOTEBOOK CONTENT:\n\n${contextText}` },
        ];

        // Add conversation history
        for (const msg of conversationHistory) {
          openaiMessages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content,
          });
        }

        openaiMessages.push({ role: "user", content: message });

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: openaiMessages,
          temperature: 0.7,
          max_tokens: 2048,
        });

        aiResponse = completion.choices[0]?.message?.content || "";
        if (aiResponse) {
          aiProvider = "openai";
        }
      } catch (openaiError) {
        console.error("OpenAI error:", openaiError);
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

Please try again in a moment. You can:
1. Check if the server is running properly
2. Verify your OpenAI API key is configured
3. Try running Ollama locally for faster responses`;
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
