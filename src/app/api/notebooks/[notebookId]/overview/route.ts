import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ notebookId: string }>;
}

// GET /api/notebooks/[notebookId]/overview - Get or generate AI overview
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
      include: {
        NotebookSource: {
          where: { status: "COMPLETED" },
          select: {
            id: true,
            title: true,
            type: true,
            content: true,
            wordCount: true,
          },
        },
        NotebookOutput: {
          where: { type: "SUMMARY" },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    const completedSources = notebook.NotebookSource;

    // Calculate stats
    const totalWords = completedSources.reduce(
      (acc, s) => acc + (s.wordCount || 0),
      0
    );

    const sourcesByType = completedSources.reduce(
      (acc, source) => {
        acc[source.type] = (acc[source.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get existing summary if available
    const existingSummary = notebook.NotebookOutput[0];

    // Basic overview (without AI if no sources)
    if (completedSources.length === 0) {
      return NextResponse.json({
        title: notebook.title,
        sourceCount: 0,
        totalWords: 0,
        sourcesByType: {},
        summary: null,
        keyTopics: [],
        suggestedQuestions: [
          "Add some sources to get started",
        ],
      });
    }

    // If we have an existing summary, use it
    if (existingSummary?.status === "COMPLETED") {
      const summaryContent = existingSummary.content as {
        summary?: string;
        keyTopics?: string[];
        suggestedQuestions?: string[];
      };

      return NextResponse.json({
        title: notebook.title,
        sourceCount: completedSources.length,
        totalWords,
        sourcesByType,
        summary: summaryContent.summary || null,
        keyTopics: summaryContent.keyTopics || [],
        suggestedQuestions: summaryContent.suggestedQuestions || [
          "What are the main topics covered?",
          "Summarize the key points",
          "What are the important terms to know?",
        ],
      });
    }

    // Generate a quick overview using AI
    const overview = {
      summary: null as string | null,
      keyTopics: [] as string[],
      suggestedQuestions: [
        "What are the main topics covered?",
        "Summarize the key points",
        "What are the important terms to know?",
        "Create a study guide",
      ],
    };

    try {
      const workersUrl = process.env.WORKERS_URL;

      if (workersUrl && completedSources.length > 0) {
        // Combine first 2000 words from each source for overview
        const contextText = completedSources
          .map((s) => {
            const content = s.content || "";
            return `[${s.type}: ${s.title}]\n${content.slice(0, 2000)}`;
          })
          .join("\n\n");

        const response = await fetch(`${workersUrl}/api/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: contextText,
            type: "overview",
            format: "json",
            instructions: `Generate a brief overview (2-3 sentences) of what this notebook contains.
Also extract 3-5 key topics and suggest 3-4 relevant questions.
Return as JSON: { summary: string, keyTopics: string[], suggestedQuestions: string[] }`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.summary) overview.summary = data.summary;
          if (data.keyTopics) overview.keyTopics = data.keyTopics;
          if (data.suggestedQuestions)
            overview.suggestedQuestions = data.suggestedQuestions;
        }
      }
    } catch (error) {
      console.error("AI overview generation error:", error);
      // Continue with default overview
    }

    // Generate a basic summary if AI failed
    if (!overview.summary) {
      const sourceTypeSummary = Object.entries(sourcesByType)
        .map(([type, count]) => `${count} ${type.toLowerCase()}${count > 1 ? "s" : ""}`)
        .join(", ");

      overview.summary = `This notebook contains ${completedSources.length} sources (${sourceTypeSummary}) with approximately ${totalWords.toLocaleString()} words of content. Use the chat to ask questions about the material.`;
    }

    return NextResponse.json({
      title: notebook.title,
      sourceCount: completedSources.length,
      totalWords,
      sourcesByType,
      ...overview,
    });
  } catch (error) {
    console.error("Error generating overview:", error);
    return NextResponse.json(
      { error: "Failed to generate overview" },
      { status: 500 }
    );
  }
}

// POST /api/notebooks/[notebookId]/overview - Regenerate overview
export async function POST(request: NextRequest, { params }: RouteParams) {
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
        { error: "No sources available to generate overview" },
        { status: 400 }
      );
    }

    // Create a new SUMMARY output (this will trigger async generation)
    const output = await prisma.notebookOutput.create({
      data: {
        id: crypto.randomUUID(),
        notebookId,
        type: "SUMMARY",
        title: "Notebook Overview",
        content: {},
        status: "PROCESSING",
      },
    });

    // Trigger async generation (in production, use a job queue like Inngest)
    // For now, we'll update it synchronously
    try {
      const workersUrl = process.env.WORKERS_URL;

      if (workersUrl) {
        const contextText = notebook.NotebookSource.map((s) => {
          const content = (s.content as string) || "";
          return `[${s.type}: ${s.title}]\n${content.slice(0, 3000)}`;
        }).join("\n\n");

        const response = await fetch(`${workersUrl}/api/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: contextText,
            type: "comprehensive",
            format: "json",
          }),
        });

        if (response.ok) {
          const data = await response.json();

          await prisma.notebookOutput.update({
            where: { id: output.id },
            data: {
              content: data,
              status: "COMPLETED",
            },
          });

          return NextResponse.json({
            id: output.id,
            status: "COMPLETED",
            ...data,
          });
        }
      }

      // If AI failed, mark as failed
      await prisma.notebookOutput.update({
        where: { id: output.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { error: "Failed to generate overview" },
        { status: 500 }
      );
    } catch (error) {
      console.error("Overview generation error:", error);

      await prisma.notebookOutput.update({
        where: { id: output.id },
        data: { status: "FAILED" },
      });

      return NextResponse.json(
        { error: "Failed to generate overview" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in overview regeneration:", error);
    return NextResponse.json(
      { error: "Failed to regenerate overview" },
      { status: 500 }
    );
  }
}
