import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { NotebookOutputType, Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ notebookId: string }>;
}

// GET /api/notebooks/[notebookId]/outputs - List generated outputs
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as NotebookOutputType | null;

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

    const outputs = await prisma.notebookOutput.findMany({
      where: {
        notebookId,
        ...(type && { type }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(outputs);
  } catch (error) {
    console.error("Error fetching outputs:", error);
    return NextResponse.json(
      { error: "Failed to fetch outputs" },
      { status: 500 }
    );
  }
}

// POST /api/notebooks/[notebookId]/outputs - Generate a new output
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;
    const body = await request.json();
    const { type, title, options } = body;

    // Validate type
    const validTypes: NotebookOutputType[] = [
      "SUMMARY",
      "STUDY_GUIDE",
      "FAQ",
      "BRIEFING_DOC",
      "TIMELINE",
      "MIND_MAP",
      "AUDIO_OVERVIEW",
      "FLASHCARD_DECK",
      "QUIZ",
      "DATA_TABLE",
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid output type" }, { status: 400 });
    }

    // Type assertion after validation
    const validatedType = type as NotebookOutputType;

    // Check access
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
      include: {
        NotebookSource: {
          where: { status: "COMPLETED" },
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
        { error: "Notebook not found or access denied" },
        { status: 404 }
      );
    }

    if (notebook.NotebookSource.length === 0) {
      return NextResponse.json(
        { error: "Add at least one processed source first" },
        { status: 400 }
      );
    }

    // Create output with PENDING status
    const output = await prisma.notebookOutput.create({
      data: {
        id: crypto.randomUUID(),
        notebookId,
        type: validatedType,
        title: title || `${validatedType.replace(/_/g, " ")} - ${new Date().toLocaleDateString()}`,
        content: {},
        status: "PENDING",
      },
    });

    // Build context for generation
    const sourceContext = notebook.NotebookSource
      .map((s) => `[Source: ${s.title}]\n${s.content || ""}`)
      .join("\n\n---\n\n");

    // Generate content based on type
    try {
      const workersUrl = process.env.WORKERS_URL;
      let generatedContent: Prisma.InputJsonValue = {};

      const prompts: Record<NotebookOutputType, string> = {
        SUMMARY: `Create a comprehensive summary of the following sources. Include key points, main themes, and important details. Format as JSON with fields: summary (string), keyPoints (array of strings), themes (array of strings).`,
        STUDY_GUIDE: `Create a detailed study guide from these sources. Include: topics to study, key concepts, important terms with definitions, and review questions. Format as JSON with fields: topics (array), concepts (array), terms (array of {term, definition}), reviewQuestions (array).`,
        FAQ: `Generate frequently asked questions based on these sources. Create 10-15 Q&A pairs covering the main topics. Format as JSON with field: faqs (array of {question, answer}).`,
        BRIEFING_DOC: `Create an executive briefing document summarizing these sources. Include: executive summary, key findings, recommendations, and action items. Format as JSON with fields: executiveSummary, keyFindings (array), recommendations (array), actionItems (array).`,
        TIMELINE: `Create a timeline of events or concepts from these sources. Format as JSON with field: events (array of {date, title, description}).`,
        MIND_MAP: `Create a mind map structure from these sources. Identify the central topic and branch out to subtopics. Format as JSON with fields: centralTopic, branches (array of {topic, subtopics (array)}).`,
        AUDIO_OVERVIEW: `Create a podcast-style script discussing these sources. Write a conversational dialogue between two hosts exploring the key topics. Format as JSON with fields: script (array of {speaker, text}), duration (estimated minutes).`,
        FLASHCARD_DECK: `Create flashcards from these sources. Generate 15-20 cards covering key concepts. Format as JSON with field: cards (array of {front, back, hint}).`,
        QUIZ: `Create a quiz from these sources. Generate 10-15 questions of various types. Format as JSON with field: questions (array of {type, question, options (for MCQ), correctAnswer, explanation}).`,
        DATA_TABLE: `Extract structured data from these sources and organize into tables. Format as JSON with field: tables (array of {title, headers (array), rows (array of arrays)}).`,
      };

      if (workersUrl) {
        const response = await fetch(`${workersUrl}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: prompts[validatedType],
            context: sourceContext,
            outputType: validatedType,
            options,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          generatedContent = data.content || data;
        }
      }

      // Update output with generated content
      await prisma.notebookOutput.update({
        where: { id: output.id },
        data: {
          content: generatedContent,
          status: generatedContent && typeof generatedContent === 'object' && Object.keys(generatedContent).length > 0 ? "COMPLETED" : "FAILED",
        },
      });

      return NextResponse.json({
        ...output,
        content: generatedContent,
        status: generatedContent && typeof generatedContent === 'object' && Object.keys(generatedContent).length > 0 ? "COMPLETED" : "PROCESSING",
      });
    } catch (genError) {
      console.error("Generation error:", genError);

      await prisma.notebookOutput.update({
        where: { id: output.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { error: "Failed to generate output" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating output:", error);
    return NextResponse.json(
      { error: "Failed to create output" },
      { status: 500 }
    );
  }
}

// DELETE /api/notebooks/[notebookId]/outputs?outputId=xxx
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;
    const { searchParams } = new URL(request.url);
    const outputId = searchParams.get("outputId");

    if (!outputId) {
      return NextResponse.json(
        { error: "outputId is required" },
        { status: 400 }
      );
    }

    // Check access
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

    await prisma.notebookOutput.delete({
      where: {
        id: outputId,
        notebookId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting output:", error);
    return NextResponse.json(
      { error: "Failed to delete output" },
      { status: 500 }
    );
  }
}
