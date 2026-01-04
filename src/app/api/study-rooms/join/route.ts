import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

// POST /api/study-rooms/join - Join a study room by code
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    // Find room by code
    const room = await prisma.studyRoom.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        StudyRoomParticipant: true,
        _count: {
          select: { StudyRoomParticipant: true },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found. Check the code and try again." },
        { status: 404 }
      );
    }

    if (!room.isActive) {
      return NextResponse.json(
        { error: "This study room has ended" },
        { status: 400 }
      );
    }

    // Check if room is full
    if (room._count.StudyRoomParticipant >= room.maxParticipants) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }

    // Check if user is already a participant
    const existingParticipant = room.StudyRoomParticipant.find(
      (p) => p.userId === session.user.id
    );

    if (existingParticipant) {
      // Update status to online and return room
      await prisma.studyRoomParticipant.update({
        where: { id: existingParticipant.id },
        data: {
          status: "ONLINE",
          leftAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        roomId: room.id,
        message: "Rejoined room",
      });
    }

    // Check if room is private and user has invite
    let inviteId: string | null = null;
    if (room.isPrivate) {
      const invite = await prisma.studyRoomInvite.findFirst({
        where: {
          roomId: room.id,
          inviteeId: session.user.id,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });

      if (!invite) {
        return NextResponse.json(
          { error: "This room is private. You need an invite to join." },
          { status: 403 }
        );
      }
      inviteId = invite.id;
    }

    // Use transaction to ensure atomicity of all join operations
    // This also prevents race condition where capacity check passes but room fills up
    await prisma.$transaction(async (tx) => {
      // Re-check capacity within transaction to prevent race condition
      const currentCount = await tx.studyRoomParticipant.count({
        where: { roomId: room.id },
      });
      if (currentCount >= room.maxParticipants) {
        throw new Error("ROOM_FULL");
      }

      // Accept the invite if private room
      if (inviteId) {
        await tx.studyRoomInvite.update({
          where: { id: inviteId },
          data: { status: "ACCEPTED" },
        });
      }

      // Add participant
      await tx.studyRoomParticipant.create({
        data: {
          id: crypto.randomUUID(),
          roomId: room.id,
          userId: session.user.id,
          role: "PARTICIPANT",
          status: "ONLINE",
        },
      });

      // Create system message for join
      await tx.studyRoomMessage.create({
        data: {
          id: crypto.randomUUID(),
          roomId: room.id,
          userId: session.user.id,
          type: "SYSTEM",
          content: `${session.user.name || "Someone"} joined the room`,
        },
      });
    });

    return NextResponse.json({
      success: true,
      roomId: room.id,
      message: "Joined room successfully",
    });
  } catch (error) {
    // Handle specific error for room full (thrown from transaction)
    if (error instanceof Error && error.message === "ROOM_FULL") {
      return NextResponse.json({ error: "Room is full" }, { status: 400 });
    }
    console.error("Error joining room:", error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}
