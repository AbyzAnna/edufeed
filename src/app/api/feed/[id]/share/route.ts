import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

// POST /api/feed/[id]/share - Record a share action
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: feedItemId } = await params;
    const { shareType, sharedToUserId, externalPlatform } = await request.json();

    // Validate share type
    if (!["INTERNAL", "EXTERNAL", "COPY_LINK"].includes(shareType)) {
      return NextResponse.json(
        { error: "Invalid share type" },
        { status: 400 }
      );
    }

    // Verify feed item exists
    const feedItem = await prisma.feedItem.findUnique({
      where: { id: feedItemId },
      select: { id: true, title: true, userId: true },
    });

    if (!feedItem) {
      return NextResponse.json(
        { error: "Feed item not found" },
        { status: 404 }
      );
    }

    // Create share record
    const share = await prisma.share.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        feedItemId,
        shareType,
        sharedToUserId: sharedToUserId || null,
        externalPlatform: externalPlatform || null,
      },
    });

    // If sharing internally to another user, send them a DM with the content
    if (shareType === "INTERNAL" && sharedToUserId) {
      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { ConversationParticipant: { some: { userId: session.user.id } } },
            { ConversationParticipant: { some: { userId: sharedToUserId } } },
          ],
        },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            id: crypto.randomUUID(),
            updatedAt: new Date(),
            ConversationParticipant: {
              create: [
                { id: crypto.randomUUID(), userId: session.user.id },
                { id: crypto.randomUUID(), userId: sharedToUserId },
              ],
            },
          },
        });
      }

      // Create message with shared content
      await prisma.directMessage.create({
        data: {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          senderId: session.user.id,
          receiverId: sharedToUserId,
          content: `Shared: ${feedItem.title}`,
          sharedFeedItemId: feedItemId,
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: sharedToUserId,
          type: "SHARE",
          title: "Content shared with you",
          message: `${session.user.name || "Someone"} shared "${feedItem.title}" with you`,
          actorId: session.user.id,
          targetId: feedItemId,
          targetType: "feedItem",
        },
      });
    }

    // Generate share URL for external/copy link
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/feed/${feedItemId}`;

    return NextResponse.json({
      share,
      shareUrl,
    });
  } catch (error) {
    console.error("Error sharing:", error);
    return NextResponse.json(
      { error: "Failed to share content" },
      { status: 500 }
    );
  }
}

// GET /api/feed/[id]/share - Get share count
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: feedItemId } = await params;

    const shareCount = await prisma.share.count({
      where: { feedItemId },
    });

    return NextResponse.json({ shareCount });
  } catch (error) {
    console.error("Error getting share count:", error);
    return NextResponse.json(
      { error: "Failed to get share count" },
      { status: 500 }
    );
  }
}
