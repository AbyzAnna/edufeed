import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

// GET /api/study-rooms/[roomId] - Get room details
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;

    const room = await prisma.studyRoom.findFirst({
      where: {
        id: roomId,
        OR: [
          { hostId: session.user.id },
          { isPrivate: false },
          {
            StudyRoomParticipant: {
              some: { userId: session.user.id },
            },
          },
          {
            StudyRoomInvite: {
              some: {
                inviteeId: session.user.id,
                status: "ACCEPTED",
              },
            },
          },
        ],
      },
      include: {
        User: {
          select: { id: true, name: true, image: true },
        },
        Notebook: {
          select: {
            id: true,
            title: true,
            emoji: true,
            NotebookSource: {
              select: {
                id: true,
                title: true,
                type: true,
                status: true,
              },
            },
          },
        },
        StudyRoomParticipant: {
          include: {
            User: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        StudyRoomMessage: {
          take: 50,
          orderBy: { createdAt: "desc" },
        },
        StudyRoomAnnotation: {
          where: { isResolved: false },
          orderBy: { createdAt: "desc" },
        },
        StudySession: {
          take: 5,
          orderBy: { startedAt: "desc" },
        },
        _count: {
          select: {
            StudyRoomParticipant: true,
            StudyRoomMessage: true,
            StudyRoomAnnotation: true,
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get user info for messages
    const messageUserIds = Array.from(new Set(room.StudyRoomMessage.map((m) => m.userId)));
    const messageUsers = messageUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: messageUserIds } },
          select: { id: true, name: true, image: true },
        })
      : [];
    const userMap = Object.fromEntries(messageUsers.map((u) => [u.id, u]));

    // Transform response to match frontend expectations
    const response = {
      id: room.id,
      title: room.title,
      description: room.description,
      code: room.code,
      isActive: room.isActive,
      isPrivate: room.isPrivate,
      maxParticipants: room.maxParticipants,
      hostId: room.hostId,
      notebookId: room.notebookId,
      createdAt: room.createdAt,
      endedAt: room.endedAt,
      settings: room.settings,
      // Map User to host
      host: room.User,
      // Map Notebook with proper structure
      notebook: room.Notebook ? {
        id: room.Notebook.id,
        title: room.Notebook.title,
        emoji: room.Notebook.emoji,
        sources: room.Notebook.NotebookSource.map((source) => ({
          id: source.id,
          title: source.title,
          type: source.type,
          status: source.status,
        })),
      } : null,
      // Map StudyRoomParticipant to participants
      participants: room.StudyRoomParticipant.map((p) => ({
        id: p.id,
        userId: p.userId,
        role: p.role,
        status: p.status,
        isAudioOn: p.isAudioOn,
        isVideoOn: p.isVideoOn,
        joinedAt: p.joinedAt,
        leftAt: p.leftAt,
        user: p.User,
      })),
      // Map StudyRoomMessage to messages with user data
      messages: room.StudyRoomMessage.map((m) => ({
        id: m.id,
        type: m.type,
        content: m.content,
        createdAt: m.createdAt,
        metadata: m.metadata,
        replyToId: m.replyToId,
        user: userMap[m.userId] || null,
      })),
      annotations: room.StudyRoomAnnotation,
      sessions: room.StudySession,
      _count: room._count,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

// PATCH /api/study-rooms/[roomId] - Update room settings
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const {
      title,
      description,
      isPrivate,
      maxParticipants,
      settings,
      notebookId,
    } = body;

    // Check host/moderator access
    const room = await prisma.studyRoom.findFirst({
      where: {
        id: roomId,
        OR: [
          { hostId: session.user.id },
          {
            StudyRoomParticipant: {
              some: {
                userId: session.user.id,
                role: { in: ["HOST", "MODERATOR"] },
              },
            },
          },
        ],
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found or access denied" },
        { status: 404 }
      );
    }

    const updated = await prisma.studyRoom.update({
      where: { id: roomId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(isPrivate !== undefined && { isPrivate }),
        ...(maxParticipants && { maxParticipants }),
        ...(settings && { settings }),
        ...(notebookId !== undefined && { notebookId }),
      },
      include: {
        User: {
          select: { id: true, name: true, image: true },
        },
        Notebook: {
          select: { id: true, title: true, emoji: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// DELETE /api/study-rooms/[roomId] - End/delete room
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // "end" or "delete"

    // Only host can end/delete
    const room = await prisma.studyRoom.findFirst({
      where: {
        id: roomId,
        hostId: session.user.id,
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found or access denied" },
        { status: 404 }
      );
    }

    if (action === "end") {
      // End the room but keep it for history
      await prisma.studyRoom.update({
        where: { id: roomId },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });

      // Update all participants to offline
      await prisma.studyRoomParticipant.updateMany({
        where: { roomId },
        data: {
          status: "OFFLINE",
          leftAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, action: "ended" });
    } else {
      // Permanently delete
      await prisma.studyRoom.delete({
        where: { id: roomId },
      });

      return NextResponse.json({ success: true, action: "deleted" });
    }
  } catch (error) {
    console.error("Error ending/deleting room:", error);
    return NextResponse.json(
      { error: "Failed to end/delete room" },
      { status: 500 }
    );
  }
}
