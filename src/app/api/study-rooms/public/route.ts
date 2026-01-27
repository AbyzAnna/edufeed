import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";

// GET /api/study-rooms/public - List all active public study rooms
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const cursor = searchParams.get("cursor");
    const search = searchParams.get("search");

    const rooms = await prisma.studyRoom.findMany({
      where: {
        isActive: true,
        isPrivate: false,
        endedAt: null,
        // Exclude rooms user is already in
        NOT: {
          OR: [
            { hostId: session.user.id },
            {
              StudyRoomParticipant: {
                some: { userId: session.user.id },
              },
            },
          ],
        },
        // Search filter
        ...(search && {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
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
      orderBy: [
        // Sort by activity - rooms with more online participants first
        { updatedAt: "desc" },
      ],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = rooms.length > limit;
    const items = hasMore ? rooms.slice(0, -1) : rooms;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    // Transform response to match expected frontend format
    const transformedRooms = items.map((room) => ({
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
      onlineCount: room.StudyRoomParticipant.length,
    }));

    return NextResponse.json({
      rooms: transformedRooms,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching public study rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch public study rooms" },
      { status: 500 }
    );
  }
}
