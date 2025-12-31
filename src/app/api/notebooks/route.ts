import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notebooks - List user's notebooks
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notebooks = await prisma.notebook.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          {
            NotebookCollaborator: {
              some: { userId: session.user.id },
            },
          },
        ],
      },
      include: {
        _count: {
          select: {
            NotebookSource: true,
            NotebookChat: true,
            NotebookOutput: true,
          },
        },
        NotebookSource: {
          select: {
            id: true,
            type: true,
            title: true,
            status: true,
          },
          take: 5,
        },
        NotebookCollaborator: {
          include: {
            // We need to get user info for collaborators
          },
          take: 5,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(notebooks);
  } catch (error) {
    console.error("Error fetching notebooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch notebooks" },
      { status: 500 }
    );
  }
}

// POST /api/notebooks - Create a new notebook
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, emoji, color } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const notebook = await prisma.notebook.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        title,
        description,
        emoji: emoji || "📚",
        color: color || "#6366f1",
      },
      include: {
        _count: {
          select: {
            NotebookSource: true,
            NotebookChat: true,
            NotebookOutput: true,
          },
        },
      },
    });

    return NextResponse.json(notebook, { status: 201 });
  } catch (error) {
    console.error("Error creating notebook:", error);
    return NextResponse.json(
      { error: "Failed to create notebook" },
      { status: 500 }
    );
  }
}
