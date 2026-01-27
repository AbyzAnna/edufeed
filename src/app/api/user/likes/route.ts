import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/supabase/auth";

export async function GET() {
  try {
    // Use unified auth session (supports both cookie and Bearer token auth)
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const likes = await prisma.feedLike.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        FeedItem: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            createdAt: true,
            User: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      likes: likes.map((like) => ({
        id: like.id,
        feedItemId: like.feedItemId,
        createdAt: like.createdAt.toISOString(),
        feedItem: {
          id: like.FeedItem.id,
          type: like.FeedItem.type,
          title: like.FeedItem.title,
          description: like.FeedItem.description,
          thumbnailUrl: like.FeedItem.thumbnailUrl,
          createdAt: like.FeedItem.createdAt.toISOString(),
          user: {
            id: like.FeedItem.User.id,
            name: like.FeedItem.User.name,
            image: like.FeedItem.User.image,
          },
        },
      })),
    });
  } catch (error) {
    console.error("Get likes error:", error);
    return NextResponse.json(
      { error: "Failed to get liked content" },
      { status: 500 }
    );
  }
}
