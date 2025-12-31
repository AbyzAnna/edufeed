import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

// GET /api/conversations - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        ConversationParticipant: {
          some: { userId: session.user.id },
        },
      },
      orderBy: { updatedAt: "desc" },
      include: {
        ConversationParticipant: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
        DirectMessage: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            sharedFeedItemId: true,
            createdAt: true,
            senderId: true,
            isRead: true,
          },
        },
      },
    });

    // Calculate unread counts
    const conversationsWithMeta = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.directMessage.count({
          where: {
            conversationId: conv.id,
            receiverId: session.user.id,
            isRead: false,
          },
        });

        // Get the other participant
        const otherParticipant = conv.ConversationParticipant.find(
          (p) => p.userId !== session.user.id
        );

        return {
          id: conv.id,
          otherUser: otherParticipant?.User || null,
          lastMessage: conv.DirectMessage[0] || null,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return NextResponse.json({ conversations: conversationsWithMeta });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create or get existing conversation
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { ConversationParticipant: { some: { userId: session.user.id } } },
          { ConversationParticipant: { some: { userId } } },
        ],
      },
      include: {
        ConversationParticipant: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          id: crypto.randomUUID(),
          updatedAt: new Date(),
          ConversationParticipant: {
            create: [
              { id: crypto.randomUUID(), userId: session.user.id },
              { id: crypto.randomUUID(), userId }
            ],
          },
        },
        include: {
          ConversationParticipant: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                },
              },
            },
          },
        },
      });
    }

    const otherParticipant = conversation.ConversationParticipant.find(
      (p) => p.userId !== session.user.id
    );

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser: otherParticipant?.User || null,
      },
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
