import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const topic = searchParams.get("topic");
    const type = searchParams.get("type"); // Filter by content type
    const limit = 10;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      status: "COMPLETED",
    };

    // Filter by type if provided
    if (type) {
      whereClause.type = type;
    }

    // Filter by topic if provided
    if (topic) {
      whereClause.OR = [
        { topic: { contains: topic, mode: "insensitive" } },
        { tags: { has: topic } },
        { title: { contains: topic, mode: "insensitive" } },
        { description: { contains: topic, mode: "insensitive" } },
      ];
    }

    const feedItems = await prisma.feedItem.findMany({
      where: whereClause,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        Source: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
        Summary: true,
        ContentTable: true,
        Deck: {
          include: {
            Flashcard: {
              take: 3, // Preview cards
              select: {
                id: true,
                front: true,
                back: true,
              },
            },
            _count: {
              select: {
                Flashcard: true,
              },
            },
          },
        },
        _count: {
          select: {
            FeedLike: true,
            FeedBookmark: true,
          },
        },
        ...(session?.user?.id && {
          FeedLike: {
            where: { userId: session.user.id },
            select: { id: true },
          },
          FeedBookmark: {
            where: { userId: session.user.id },
            select: { id: true },
          },
        }),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
    });

    // Transform to include isLiked and isBookmarked, and map PascalCase to camelCase
    const transformedItems = feedItems.map((item) => {
      const likesArray = (item as { FeedLike?: { id: string }[] }).FeedLike ?? [];
      const bookmarksArray = (item as { FeedBookmark?: { id: string }[] }).FeedBookmark ?? [];

      return {
        ...item,
        // Map PascalCase to camelCase for frontend compatibility
        user: item.User,
        source: item.Source,
        summary: item.Summary,
        contentTable: item.ContentTable
          ? {
              ...item.ContentTable,
              rows: item.ContentTable.rows as string[][],
            }
          : null,
        flashcardDeck: item.Deck
          ? {
              ...item.Deck,
              cards: item.Deck.Flashcard,
              _count: { cards: item.Deck._count.Flashcard },
            }
          : null,
        isLiked: session?.user?.id ? likesArray.length > 0 : false,
        isBookmarked: session?.user?.id ? bookmarksArray.length > 0 : false,
        likeCount: item._count.FeedLike,
        bookmarkCount: item._count.FeedBookmark,
        // Clean up PascalCase fields
        User: undefined,
        Source: undefined,
        Summary: undefined,
        ContentTable: undefined,
        Deck: undefined,
        FeedLike: undefined,
        FeedBookmark: undefined,
      };
    });

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
