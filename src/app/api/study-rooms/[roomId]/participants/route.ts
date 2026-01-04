import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { ParticipantStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

// GET /api/study-rooms/[roomId]/participants - Get room participants
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;

    // SECURITY FIX: Verify user is a participant before returning data
    const userParticipation = await prisma.studyRoomParticipant.findFirst({
      where: {
        roomId,
        userId: session.user.id,
      },
    });

    if (!userParticipation) {
      return NextResponse.json(
        { error: "Not a participant" },
        { status: 403 }
      );
    }

    const participants = await prisma.studyRoomParticipant.findMany({
      where: { roomId },
      include: {
        User: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
    });

    return NextResponse.json(participants);
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 }
    );
  }
}

// PATCH /api/study-rooms/[roomId]/participants - Update own status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const { status, isAudioOn, isVideoOn, cursorPosition } = body;

    const participant = await prisma.studyRoomParticipant.findFirst({
      where: {
        roomId,
        userId: session.user.id,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant" },
        { status: 403 }
      );
    }

    const validStatuses: ParticipantStatus[] = ["ONLINE", "AWAY", "OFFLINE"];

    const updated = await prisma.studyRoomParticipant.update({
      where: { id: participant.id },
      data: {
        ...(status && validStatuses.includes(status) && { status }),
        ...(isAudioOn !== undefined && { isAudioOn }),
        ...(isVideoOn !== undefined && { isVideoOn }),
        ...(cursorPosition !== undefined && { cursorPosition }),
        ...(status === "OFFLINE" && { leftAt: new Date() }),
      },
      include: {
        User: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating participant:", error);
    return NextResponse.json(
      { error: "Failed to update participant" },
      { status: 500 }
    );
  }
}

// POST /api/study-rooms/[roomId]/participants - Leave room
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const { action } = body; // "leave" or "kick" (with targetUserId)

    if (action === "leave") {
      const participant = await prisma.studyRoomParticipant.findFirst({
        where: {
          roomId,
          userId: session.user.id,
        },
      });

      if (!participant) {
        return NextResponse.json(
          { error: "Not a participant" },
          { status: 403 }
        );
      }

      // Update status to offline
      await prisma.studyRoomParticipant.update({
        where: { id: participant.id },
        data: {
          status: "OFFLINE",
          leftAt: new Date(),
        },
      });

      // Create leave message
      await prisma.studyRoomMessage.create({
        data: {
          id: crypto.randomUUID(),
          roomId,
          userId: session.user.id,
          type: "SYSTEM",
          content: `${session.user.name || "Someone"} left the room`,
        },
      });

      return NextResponse.json({ success: true, action: "left" });
    }

    if (action === "kick") {
      const { targetUserId } = body;

      if (!targetUserId) {
        return NextResponse.json(
          { error: "targetUserId is required" },
          { status: 400 }
        );
      }

      // Check if user is host or moderator
      const actor = await prisma.studyRoomParticipant.findFirst({
        where: {
          roomId,
          userId: session.user.id,
          role: { in: ["HOST", "MODERATOR"] },
        },
      });

      if (!actor) {
        return NextResponse.json(
          { error: "Only host or moderator can kick" },
          { status: 403 }
        );
      }

      // Can't kick the host
      const room = await prisma.studyRoom.findUnique({
        where: { id: roomId },
      });

      if (room?.hostId === targetUserId) {
        return NextResponse.json(
          { error: "Cannot kick the host" },
          { status: 400 }
        );
      }

      // Remove participant
      await prisma.studyRoomParticipant.deleteMany({
        where: {
          roomId,
          userId: targetUserId,
        },
      });

      return NextResponse.json({ success: true, action: "kicked" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in participant action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
