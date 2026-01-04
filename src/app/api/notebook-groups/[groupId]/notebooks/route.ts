import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

// POST /api/notebook-groups/[groupId]/notebooks - Add notebooks to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const body = await request.json();
    const { notebookIds } = body;

    if (!notebookIds || !Array.isArray(notebookIds) || notebookIds.length === 0) {
      return NextResponse.json(
        { error: "notebookIds array is required" },
        { status: 400 }
      );
    }

    // Verify group ownership
    const group = await prisma.notebookGroup.findFirst({
      where: {
        id: groupId,
        userId: session.user.id,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Verify all notebooks belong to user
    const notebooks = await prisma.notebook.findMany({
      where: {
        id: { in: notebookIds },
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (notebooks.length !== notebookIds.length) {
      return NextResponse.json(
        { error: "One or more notebooks not found or not owned by user" },
        { status: 400 }
      );
    }

    // Update notebooks to assign them to the group
    await prisma.notebook.updateMany({
      where: {
        id: { in: notebookIds },
        userId: session.user.id,
      },
      data: { groupId },
    });

    // Return updated group with notebooks
    const updatedGroup = await prisma.notebookGroup.findUnique({
      where: { id: groupId },
      include: {
        Notebooks: {
          include: {
            _count: {
              select: {
                NotebookSource: true,
                NotebookChat: true,
                NotebookOutput: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        _count: {
          select: { Notebooks: true },
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Error adding notebooks to group:", error);
    return NextResponse.json(
      { error: "Failed to add notebooks to group" },
      { status: 500 }
    );
  }
}

// DELETE /api/notebook-groups/[groupId]/notebooks - Remove notebooks from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const body = await request.json();
    const { notebookIds } = body;

    if (!notebookIds || !Array.isArray(notebookIds) || notebookIds.length === 0) {
      return NextResponse.json(
        { error: "notebookIds array is required" },
        { status: 400 }
      );
    }

    // Verify group ownership
    const group = await prisma.notebookGroup.findFirst({
      where: {
        id: groupId,
        userId: session.user.id,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Remove notebooks from group (set groupId to null)
    await prisma.notebook.updateMany({
      where: {
        id: { in: notebookIds },
        userId: session.user.id,
        groupId: groupId,
      },
      data: { groupId: null },
    });

    // Return updated group
    const updatedGroup = await prisma.notebookGroup.findUnique({
      where: { id: groupId },
      include: {
        Notebooks: {
          include: {
            _count: {
              select: {
                NotebookSource: true,
                NotebookChat: true,
                NotebookOutput: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        _count: {
          select: { Notebooks: true },
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Error removing notebooks from group:", error);
    return NextResponse.json(
      { error: "Failed to remove notebooks from group" },
      { status: 500 }
    );
  }
}
