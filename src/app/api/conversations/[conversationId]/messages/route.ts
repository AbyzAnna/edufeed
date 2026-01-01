import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";
import { moderationService } from "@/lib/moderation";
import { ModerationContentType } from "@prisma/client";
import { ContentBlockedError } from "@/lib/moderation/errors";

// GET /api/conversations/[conversationId]/messages - Get messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Verify user is participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const messages = await prisma.directMessage.findMany({
      where: { conversationId },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: {
        User_DirectMessage_senderIdToUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Mark unread messages as read
    await prisma.directMessage.updateMany({
      where: {
        conversationId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    // Update last read timestamp
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
      data: { lastReadAt: new Date() },
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Get shared feed items if any
    const sharedItemIds = items
      .filter((m) => m.sharedFeedItemId)
      .map((m) => m.sharedFeedItemId as string);

    const sharedItems =
      sharedItemIds.length > 0
        ? await prisma.feedItem.findMany({
            where: { id: { in: sharedItemIds } },
            select: {
              id: true,
              title: true,
              type: true,
              thumbnailUrl: true,
            },
          })
        : [];

    const sharedItemsMap = new Map(sharedItems.map((item) => [item.id, item]));

    const messagesWithShared = items.map((msg) => ({
      ...msg,
      sharedFeedItem: msg.sharedFeedItemId
        ? sharedItemsMap.get(msg.sharedFeedItemId) || null
        : null,
    }));

    return NextResponse.json({
      messages: messagesWithShared.reverse(), // Return in chronological order
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[conversationId]/messages - Send message
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { content, sharedFeedItemId } = await request.json();

    if (!content && !sharedFeedItemId) {
      return NextResponse.json(
        { error: "Message content or shared item is required" },
        { status: 400 }
      );
    }

    // Get conversation and other participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ConversationParticipant: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Verify user is participant
    const isParticipant = conversation.ConversationParticipant.some(
      (p) => p.userId === session.user.id
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get receiver
    const receiverParticipant = conversation.ConversationParticipant.find(
      (p) => p.userId !== session.user.id
    );
    if (!receiverParticipant) {
      return NextResponse.json(
        { error: "Receiver not found" },
        { status: 400 }
      );
    }

    // Moderate content if text message
    if (content && content.trim()) {
      // Check if user is muted
      const isMuted = await moderationService.isUserMuted(session.user.id);
      if (isMuted) {
        return NextResponse.json(
          {
            error: "USER_MUTED",
            message: "Your account is temporarily muted due to repeated policy violations",
          },
          { status: 403 }
        );
      }

      // Run content moderation (higher sensitivity for DMs)
      const moderationResult = await moderationService.moderate({
        content: content.trim(),
        contentType: ModerationContentType.DIRECT_MESSAGE,
        userId: session.user.id,
      });

      // Block if content is rejected
      if (!moderationResult.approved) {
        const error = new ContentBlockedError(
          moderationResult.violations,
          moderationResult.report.id,
          true
        );
        return NextResponse.json(
          error.toResponse(),
          { status: 403 }
        );
      }
    }

    // Create message
    const message = await prisma.directMessage.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        senderId: session.user.id,
        receiverId: receiverParticipant.userId,
        content: content?.trim() || null,
        sharedFeedItemId: sharedFeedItemId || null,
      },
      include: {
        User_DirectMessage_senderIdToUser: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: receiverParticipant.userId,
        type: "MESSAGE",
        title: "New message",
        message: `${session.user.name || "Someone"} sent you a message`,
        actorId: session.user.id,
        targetId: conversationId,
        targetType: "conversation",
      },
    });

    // Get shared feed item if any
    let sharedFeedItem = null;
    if (sharedFeedItemId) {
      sharedFeedItem = await prisma.feedItem.findUnique({
        where: { id: sharedFeedItemId },
        select: {
          id: true,
          title: true,
          type: true,
          thumbnailUrl: true,
        },
      });
    }

    return NextResponse.json({
      message: {
        ...message,
        sharedFeedItem,
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
