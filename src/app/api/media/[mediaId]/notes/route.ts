import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ mediaId: string }>;
}

// GET - Fetch notes for media
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { mediaId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notes = await prisma.mediaNote.findMany({
      where: {
        mediaContentId: mediaId,
        userId: session.user.id,
      },
      orderBy: { timestamp: "asc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST - Add a new note
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { mediaId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { timestamp, content } = body;

    if (timestamp === undefined || !content) {
      return NextResponse.json(
        { error: "timestamp and content are required" },
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

    const note = await prisma.mediaNote.create({
      data: {
        mediaContentId: mediaId,
        userId: session.user.id,
        timestamp,
        content,
      },
    });

    return NextResponse.json({
      message: "Note added successfully",
      note,
    });
  } catch (error) {
    console.error("Error adding note:", error);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a note
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    const { mediaId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json(
        { error: "noteId is required" },
        { status: 400 }
      );
    }

    const note = await prisma.mediaNote.deleteMany({
      where: {
        id: noteId,
        mediaContentId: mediaId,
        userId: session.user.id,
      },
    });

    if (note.count === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}
