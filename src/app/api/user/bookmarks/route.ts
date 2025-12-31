import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  email?: string;
  sub?: string;
}

function getUserIdFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET!
    ) as TokenPayload;
    return payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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
