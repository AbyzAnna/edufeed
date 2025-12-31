import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

// Generate a random 6-character room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars like 0,O,1,I
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/study-rooms - List user's study rooms (hosted or participating)
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // active, ended, scheduled

    const rooms = await prisma.studyRoom.findMany({
      where: {
        OR: [
          { hostId: session.user.id },
          {
            StudyRoomParticipant: {
              some: { userId: session.user.id },
            },
          },
        ],
        ...(status === "active" && { isActive: true, endedAt: null }),
        ...(status === "ended" && { endedAt: { not: null } }),
        ...(status === "scheduled" && {
          scheduledFor: { not: null },
          startedAt: null,
        }),
      },
      include: {
        User: {
          select: { id: true, name: true, image: true },
        },
        Notebook: {
          select: { id: true, title: true, emoji: true },
        },
        StudyRoomParticipant: {
          include: {
            User: {
              select: { id: true, name: true, image: true },
            },
          },
          where: { status: "ONLINE" },
          take: 5,
        },
        _count: {
          select: {
            StudyRoomParticipant: true,
            StudyRoomMessage: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Transform response to match expected frontend format
    const transformedRooms = rooms.map((room) => ({
      ...room,
      host: room.User,
      notebook: room.Notebook,
      participants: room.StudyRoomParticipant.map((p) => ({
        ...p,
        user: p.User,
      })),
      _count: {
        participants: room._count.StudyRoomParticipant,
        messages: room._count.StudyRoomMessage,
      },
    }));

    return NextResponse.json(transformedRooms);
  } catch (error) {
    console.error("Error fetching study rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch study rooms" },
      { status: 500 }
    );
  }
}

// POST /api/study-rooms - Create a new study room
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      notebookId,
      isPrivate,
      maxParticipants,
      scheduledFor,
      settings,
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Generate unique room code
    let code: string;
    let isUnique = false;
    let attempts = 0;

    do {
      code = generateRoomCode();
      const existing = await prisma.studyRoom.findUnique({
        where: { code },
      });
      isUnique = !existing;
      attempts++;
    } while (!isUnique && attempts < 10);

    if (!isUnique) {
      return NextResponse.json(
        { error: "Failed to generate room code" },
        { status: 500 }
      );
    }

    // Verify notebook access if provided
    if (notebookId) {
      const notebook = await prisma.notebook.findFirst({
        where: {
          id: notebookId,
          OR: [
            { userId: session.user.id },
            {
              NotebookCollaborator: {
                some: { userId: session.user.id },
              },
            },
          ],
        },
      });

      if (!notebook) {
        return NextResponse.json(
          { error: "Notebook not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Create room
    const room = await prisma.studyRoom.create({
      data: {
        id: crypto.randomUUID(),
        hostId: session.user.id,
        title,
        description,
        code: code!,
        notebookId,
        isPrivate: isPrivate || false,
        maxParticipants: maxParticipants || 10,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        settings: settings || {
          allowAudio: true,
          allowVideo: true,
          allowChat: true,
          allowAnnotations: true,
        },
        // Add host as participant
        StudyRoomParticipant: {
          create: {
            id: crypto.randomUUID(),
            userId: session.user.id,
            role: "HOST",
            status: "ONLINE",
          },
        },
      },
      include: {
        User: {
          select: { id: true, name: true, image: true },
        },
        Notebook: {
          select: { id: true, title: true, emoji: true },
        },
        StudyRoomParticipant: {
          include: {
            User: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        _count: {
          select: {
            StudyRoomParticipant: true,
            StudyRoomMessage: true,
          },
        },
      },
    });

    // Transform response to match expected frontend format
    const transformedRoom = {
      ...room,
      host: room.User,
      notebook: room.Notebook,
      participants: room.StudyRoomParticipant.map((p) => ({
        ...p,
        user: p.User,
      })),
      _count: {
        participants: room._count.StudyRoomParticipant,
        messages: room._count.StudyRoomMessage,
      },
    };

    return NextResponse.json(transformedRoom, { status: 201 });
  } catch (error) {
    console.error("Error creating study room:", error);
    return NextResponse.json(
      { error: "Failed to create study room" },
      { status: 500 }
    );
  }
}
