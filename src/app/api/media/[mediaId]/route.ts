import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ mediaId: string }>;
}

// GET - Fetch a specific media content with all details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { mediaId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const media = await prisma.mediaContent.findFirst({
      where: {
        id: mediaId,
        userId: session.user.id,
      },
      include: {
        Chapter: {
          orderBy: { order: "asc" },
        },
        MediaNote: {
          where: { userId: session.user.id },
          orderBy: { timestamp: "asc" },
        },
        MediaBookmark: {
          where: { userId: session.user.id },
          orderBy: { timestamp: "asc" },
        },
        Source: {
          select: { id: true, title: true, type: true },
        },
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json(media);
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// PATCH - Update media info
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { mediaId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, transcript } = body;

    const media = await prisma.mediaContent.updateMany({
      where: {
        id: mediaId,
        userId: session.user.id,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(transcript !== undefined && { transcript }),
      },
    });

    if (media.count === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Media updated successfully" });
  } catch (error) {
    console.error("Error updating media:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}

// DELETE - Delete media content
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { mediaId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const media = await prisma.mediaContent.deleteMany({
      where: {
        id: mediaId,
        userId: session.user.id,
      },
    });

    if (media.count === 0) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Media deleted successfully" });
  } catch (error) {
    console.error("Error deleting media:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
