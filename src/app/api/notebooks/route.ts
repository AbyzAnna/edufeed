import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notebooks - List user's notebooks OR public notebooks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const showPublic = searchParams.get("public") === "true";
    const search = searchParams.get("search") || "";

    console.log("[Notebooks API] GET request, showPublic:", showPublic);

    // For public notebooks, we don't require authentication
    const session = await getAuthSession();
    console.log("[Notebooks API] Session:", session ? `User ${session.user.id}` : "No session");

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
        NotebookGroup: {
          select: {
            id: true,
            name: true,
            emoji: true,
            color: true,
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
    const { title, description, emoji, color, groupId } = body;

    // Input validation
    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      return NextResponse.json(
        { error: "Title cannot be empty" },
        { status: 400 }
      );
    }

    if (trimmedTitle.length > 200) {
      return NextResponse.json(
        { error: "Title must be 200 characters or less" },
        { status: 400 }
      );
    }

    if (description && typeof description === "string" && description.length > 2000) {
      return NextResponse.json(
        { error: "Description must be 2000 characters or less" },
        { status: 400 }
      );
    }

    // Validate emoji if provided (should be a single emoji or short string)
    if (emoji && (typeof emoji !== "string" || emoji.length > 10)) {
      return NextResponse.json(
        { error: "Invalid emoji" },
        { status: 400 }
      );
    }

    // Validate color if provided (should be a hex color)
    if (color && (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color))) {
      return NextResponse.json(
        { error: "Invalid color format. Use hex format like #6366f1" },
        { status: 400 }
      );
    }

    // Verify group ownership if groupId is provided
    if (groupId) {
      const group = await prisma.notebookGroup.findFirst({
        where: {
          id: groupId,
          userId: session.user.id,
        },
      });
      if (!group) {
        return NextResponse.json(
          { error: "Group not found or not owned by user" },
          { status: 400 }
        );
      }
    }

    const notebook = await prisma.notebook.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        title: trimmedTitle,
        description: description?.trim() || null,
        emoji: emoji || "📚",
        color: color || "#6366f1",
        groupId: groupId || null,
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
