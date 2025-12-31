import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ notebookId: string }>;
}

// GET /api/notebooks/[notebookId] - Get notebook details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;

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
        User: {
          select: { id: true, name: true, image: true },
        },
        NotebookSource: {
          orderBy: { createdAt: "desc" },
        },
        NotebookOutput: {
          orderBy: { createdAt: "desc" },
        },
        NotebookChat: {
          orderBy: { createdAt: "asc" },
          take: 50, // Limit initial chat messages
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
        },
        NotebookCollaborator: {
          select: {
            id: true,
            userId: true,
            role: true,
          },
        },
        _count: {
          select: {
            NotebookSource: true,
            NotebookChat: true,
            NotebookOutput: true,
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

    // Transform response to match expected format
    const response = {
      id: notebook.id,
      title: notebook.title,
      description: notebook.description,
      emoji: notebook.emoji,
      color: notebook.color,
      isPublic: notebook.isPublic,
      createdAt: notebook.createdAt,
      updatedAt: notebook.updatedAt,
      user: notebook.User,
      sources: notebook.NotebookSource,
      outputs: notebook.NotebookOutput,
      chatMessages: notebook.NotebookChat.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
        citations: msg.NotebookCitation.map((citation) => ({
          id: citation.id,
          excerpt: citation.excerpt,
          source: citation.NotebookSource,
        })),
      })),
      collaborators: notebook.NotebookCollaborator,
      _count: {
        sources: notebook._count.NotebookSource,
        chatMessages: notebook._count.NotebookChat,
        outputs: notebook._count.NotebookOutput,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching notebook:", error);
    return NextResponse.json(
      { error: "Failed to fetch notebook" },
      { status: 500 }
    );
  }
}

// PATCH /api/notebooks/[notebookId] - Update notebook
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;
    const body = await request.json();
    const { title, description, emoji, color, isPublic } = body;

    // Check ownership or editor access
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

    const updated = await prisma.notebook.update({
      where: { id: notebookId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(emoji && { emoji }),
        ...(color && { color }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating notebook:", error);
    return NextResponse.json(
      { error: "Failed to update notebook" },
      { status: 500 }
    );
  }
}

// DELETE /api/notebooks/[notebookId] - Delete notebook
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notebookId } = await params;

    // Only owner can delete
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

    await prisma.notebook.delete({
      where: { id: notebookId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notebook:", error);
    return NextResponse.json(
      { error: "Failed to delete notebook" },
      { status: 500 }
    );
  }
}
