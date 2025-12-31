import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ mediaId: string }>;
}

// GET - Fetch bookmarks for media
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { mediaId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookmarks = await prisma.mediaBookmark.findMany({
      where: {
        mediaContentId: mediaId,
        userId: session.user.id,
      },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

// POST - Add or toggle a bookmark
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { mediaId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { timestamp, label } = body;

    if (timestamp === undefined) {
      return NextResponse.json(
        { error: "timestamp is required" },
        { status: 400 }
      );
    }

    // Verify media exists and belongs to user
    const media = await prisma.mediaContent.findFirst({
      where: {
        id: mediaId,
        userId: session.user.id,
      },
    });

    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Check if bookmark exists at this timestamp
    const existing = await prisma.mediaBookmark.findUnique({
      where: {
        userId_mediaContentId_timestamp: {
          userId: session.user.id,
          mediaContentId: mediaId,
          timestamp,
        },
      },
    });

    if (existing) {
      // Remove bookmark if it exists
      await prisma.mediaBookmark.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({
        message: "Bookmark removed",
        removed: true,
      });
    }

    // Create new bookmark
    const bookmark = await prisma.mediaBookmark.create({
      data: {
        id: crypto.randomUUID(),
        mediaContentId: mediaId,
        userId: session.user.id,
        timestamp,
        label: label || null,
      },
    });

    return NextResponse.json({
      message: "Bookmark added",
      bookmark,
      removed: false,
    });
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a bookmark
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { mediaId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookmarkId = searchParams.get("bookmarkId");

    if (!bookmarkId) {
      return NextResponse.json(
        { error: "bookmarkId is required" },
        { status: 400 }
      );
    }

    const bookmark = await prisma.mediaBookmark.deleteMany({
      where: {
        id: bookmarkId,
        mediaContentId: mediaId,
        userId: session.user.id,
      },
    });

    if (bookmark.count === 0) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Bookmark deleted successfully" });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 }
    );
  }
}
