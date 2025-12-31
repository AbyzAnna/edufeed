import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notebooks - List user's notebooks OR public notebooks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showPublic = searchParams.get("public") === "true";
    const search = searchParams.get("search") || "";

    // For public notebooks, we don't require authentication
    const session = await getAuthSession();

    let whereClause;

    if (showPublic) {
      // Return public notebooks from all users (for explore/discover feature)
      whereClause = {
        isPublic: true,
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };
    } else {
      // Require auth for user's own notebooks
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      whereClause = {
        OR: [
          { userId: session.user.id },
          {
            NotebookCollaborator: {
              some: { userId: session.user.id },
            },
          },
        ],
      };
    }

    const notebooks = await prisma.notebook.findMany({
      where: whereClause,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
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
        NotebookOutput: showPublic
          ? {
              where: { status: "COMPLETED" },
              select: {
                id: true,
                type: true,
                title: true,
                audioUrl: true,
              },
              take: 3,
            }
          : false,
        NotebookCollaborator: {
          include: {
            // We need to get user info for collaborators
          },
          take: 5,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: showPublic ? 50 : undefined, // Limit public notebooks
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
