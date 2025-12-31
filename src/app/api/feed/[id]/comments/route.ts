import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

// GET /api/feed/[id]/comments - Get comments for a feed item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: feedItemId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");

    const comments = await prisma.comment.findMany({
      where: {
        feedItemId,
        parentId: null, // Only top-level comments
      },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        other_Comment: {
          take: 3,
          orderBy: { createdAt: "asc" },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
              },
            },
            _count: {
              select: { CommentLike: true },
            },
          },
        },
        _count: {
          select: { other_Comment: true, CommentLike: true },
        },
      },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, -1) : comments;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Get current user's likes if authenticated
    const session = await getAuthSession();
    let userLikedCommentIds: string[] = [];

    if (session?.user?.id) {
      // Get all comment IDs including replies
      const allCommentIds = items.flatMap((c) => [
        c.id,
        ...c.other_Comment.map((r) => r.id),
      ]);

      const userLikes = await prisma.commentLike.findMany({
        where: {
          userId: session.user.id,
          commentId: { in: allCommentIds },
        },
        select: { commentId: true },
      });
      userLikedCommentIds = userLikes.map((l) => l.commentId);
    }

    const commentsWithLikeStatus = items.map((comment) => ({
      ...comment,
      user: comment.User,
      isLiked: userLikedCommentIds.includes(comment.id),
      likeCount: comment._count.CommentLike,
      replyCount: comment._count.other_Comment,
      replies: comment.other_Comment.map((reply) => ({
        ...reply,
        user: reply.User,
        isLiked: userLikedCommentIds.includes(reply.id),
        likeCount: reply._count.CommentLike,
      })),
    }));

    return NextResponse.json({
      comments: commentsWithLikeStatus,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/feed/[id]/comments - Create a new comment
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
    const { content, parentId } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Verify feed item exists
    const feedItem = await prisma.feedItem.findUnique({
      where: { id: feedItemId },
      select: { id: true, userId: true },
    });

    if (!feedItem) {
      return NextResponse.json(
        { error: "Feed item not found" },
        { status: 404 }
      );
    }

    // If parentId is provided, verify parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const comment = await prisma.comment.create({
      data: {
        id: crypto.randomUUID(),
        content: content.trim(),
        userId: session.user.id,
        feedItemId,
        parentId: parentId || null,
        updatedAt: new Date(),
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
      },
    });

    // Create notification for feed item owner (if not self-commenting)
    if (feedItem.userId !== session.user.id) {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: feedItem.userId,
          type: "COMMENT",
          title: "New comment",
          message: `${session.user.name || "Someone"} commented on your post`,
          actorId: session.user.id,
          targetId: feedItemId,
          targetType: "feedItem",
        },
      });
    }

    return NextResponse.json({
      comment: {
        ...comment,
        user: comment.User,
        isLiked: false,
        likeCount: 0,
        replyCount: 0,
      },
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
