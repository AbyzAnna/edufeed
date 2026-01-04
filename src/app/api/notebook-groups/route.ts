import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notebook-groups - List user's notebook groups with notebooks
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeNotebooks = searchParams.get("includeNotebooks") !== "false";

    const groups = await prisma.notebookGroup.findMany({
      where: { userId: session.user.id },
      include: {
        Notebooks: includeNotebooks
          ? {
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
                  take: 3,
                },
              },
              orderBy: { updatedAt: "desc" },
            }
          : false,
        _count: {
          select: { Notebooks: true },
        },
      },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching notebook groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch notebook groups" },
      { status: 500 }
    );
  }
}

// POST /api/notebook-groups - Create a new notebook group
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, emoji, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    // Check if group with same name already exists for this user
    const existingGroup = await prisma.notebookGroup.findUnique({
      where: {
        userId_name: {
          userId: session.user.id,
          name: name.trim(),
        },
      },
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: "A group with this name already exists" },
        { status: 409 }
      );
    }

    // Get the highest order number for the user's groups
    const maxOrder = await prisma.notebookGroup.findFirst({
      where: { userId: session.user.id },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const group = await prisma.notebookGroup.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        emoji: emoji || "📁",
        color: color || "#8b5cf6",
        order: (maxOrder?.order ?? -1) + 1,
      },
      include: {
        _count: {
          select: { Notebooks: true },
        },
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error("Error creating notebook group:", error);
    return NextResponse.json(
      { error: "Failed to create notebook group" },
      { status: 500 }
    );
  }
}
