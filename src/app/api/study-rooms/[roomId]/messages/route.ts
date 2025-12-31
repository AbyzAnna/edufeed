import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import { prisma } from "@/lib/prisma";
import { RoomMessageType } from "@prisma/client";

interface RouteParams {
  params: Promise<{ roomId: string }>;
}

// GET /api/study-rooms/[roomId]/messages - Get room messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const cursor = searchParams.get("cursor");

    // Check participant access
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

    const messages = await prisma.studyRoomMessage.findMany({
      where: { roomId },
      include: {
        other_StudyRoomMessage: {
          take: 3,
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
    });

    // Get user info for messages
    const userIds = [...new Set(messages.map((m) => m.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true },
    });

    const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

    const messagesWithUsers = messages.map((m) => ({
      ...m,
      user: userMap[m.userId],
    }));

    return NextResponse.json(messagesWithUsers.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/study-rooms/[roomId]/messages - Send a message
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const body = await request.json();
    const { content, type, metadata, replyToId } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Check participant access and room active
    const room = await prisma.studyRoom.findFirst({
      where: {
        id: roomId,
        isActive: true,
        StudyRoomParticipant: {
          some: { userId: session.user.id },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found or not active" },
        { status: 404 }
      );
    }

    const validTypes: RoomMessageType[] = [
      "TEXT",
      "SYSTEM",
      "AI_RESPONSE",
      "HIGHLIGHT",
      "QUESTION",
      "POLL",
    ];
    const messageType = validTypes.includes(type) ? type : "TEXT";

    const message = await prisma.studyRoomMessage.create({
      data: {
        id: crypto.randomUUID(),
        roomId,
        userId: session.user.id,
        type: messageType,
        content,
        metadata,
        replyToId,
      },
    });

    // If it's a question to AI, generate response
    if (type === "QUESTION" && room.notebookId) {
      // Trigger AI response (this would be async in production)
      generateAIResponse(roomId, room.notebookId, content, session.user.id);
    }

    return NextResponse.json({
      ...message,
      user: {
        id: session.user.id,
        name: session.user.name,
        image: session.user.image,
      },
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

// Helper function to generate AI response
async function generateAIResponse(
  roomId: string,
  notebookId: string,
  question: string,
  userId: string
) {
  try {
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
      include: {
        NotebookSource: {
          where: { status: "COMPLETED" },
          select: { content: true, title: true },
        },
      },
    });

    if (!notebook) return;

    const sourceContext = notebook.NotebookSource
      .map((s) => `[${s.title}]\n${s.content}`)
      .join("\n\n---\n\n");

    const workersUrl = process.env.WORKERS_URL;
    let aiResponse = "I couldn't process that question right now.";

    if (workersUrl) {
      const response = await fetch(`${workersUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          context: sourceContext,
          systemPrompt:
            "You are a helpful study assistant. Answer based on the provided materials. Be concise.",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        aiResponse = data.response || data.message;
      }
    }

    await prisma.studyRoomMessage.create({
      data: {
        id: crypto.randomUUID(),
        roomId,
        userId,
        type: "AI_RESPONSE",
        content: aiResponse,
        metadata: { questionContext: question },
      },
    });
  } catch (error) {
    console.error("AI response error:", error);
  }
}
