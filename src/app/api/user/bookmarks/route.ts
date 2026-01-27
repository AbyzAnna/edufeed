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

    const bookmarks = await prisma.feedBookmark.findMany({
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
      bookmarks: bookmarks.map((bookmark) => ({
        id: bookmark.id,
        feedItemId: bookmark.feedItemId,
        createdAt: bookmark.createdAt.toISOString(),
        feedItem: {
          id: bookmark.FeedItem.id,
          type: bookmark.FeedItem.type,
          title: bookmark.FeedItem.title,
          description: bookmark.FeedItem.description,
          thumbnailUrl: bookmark.FeedItem.thumbnailUrl,
          createdAt: bookmark.FeedItem.createdAt.toISOString(),
          user: {
            id: bookmark.FeedItem.User.id,
            name: bookmark.FeedItem.User.name,
            image: bookmark.FeedItem.User.image,
          },
        },
      })),
    });
  } catch (error) {
    console.error("Get bookmarks error:", error);
    return NextResponse.json(
      { error: "Failed to get bookmarks" },
      { status: 500 }
    );
  }
}
