import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notebook-groups/[groupId] - Get a specific group with notebooks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    const group = await prisma.notebookGroup.findFirst({
      where: {
        id: groupId,
        userId: session.user.id,
      },
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
            NotebookSource: {
              select: {
                id: true,
                type: true,
                title: true,
                status: true,
              },
              take: 5,
            },
          },
          orderBy: { updatedAt: "desc" },
        },
        _count: {
          select: { Notebooks: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching notebook group:", error);
    return NextResponse.json(
      { error: "Failed to fetch notebook group" },
      { status: 500 }
    );
  }
}

// PATCH /api/notebook-groups/[groupId] - Update a group
export async function PATCH(
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
    const { name, description, emoji, color, order } = body;

    // Verify ownership
    const existingGroup = await prisma.notebookGroup.findFirst({
      where: {
        id: groupId,
        userId: session.user.id,
      },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check for duplicate name if name is being changed
    if (name && name.trim() !== existingGroup.name) {
      const duplicateGroup = await prisma.notebookGroup.findFirst({
        where: {
          userId: session.user.id,
          name: name.trim(),
          NOT: { id: groupId },
        },
      });

      if (duplicateGroup) {
        return NextResponse.json(
          { error: "A group with this name already exists" },
          { status: 409 }
        );
      }
    }

    const group = await prisma.notebookGroup.update({
      where: { id: groupId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(emoji !== undefined && { emoji }),
        ...(color !== undefined && { color }),
        ...(order !== undefined && { order }),
      },
      include: {
        _count: {
          select: { Notebooks: true },
        },
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error updating notebook group:", error);
    return NextResponse.json(
      { error: "Failed to update notebook group" },
      { status: 500 }
    );
  }
}

// DELETE /api/notebook-groups/[groupId] - Delete a group (notebooks are unassigned, not deleted)
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

    // Verify ownership
    const existingGroup = await prisma.notebookGroup.findFirst({
      where: {
        id: groupId,
        userId: session.user.id,
      },
    });

    if (!existingGroup) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Delete the group (notebooks will have groupId set to null due to onDelete: SetNull)
    await prisma.notebookGroup.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notebook group:", error);
    return NextResponse.json(
      { error: "Failed to delete notebook group" },
      { status: 500 }
    );
  }
}
