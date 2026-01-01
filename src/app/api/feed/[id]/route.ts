import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getAuthSession();

    const feedItem = await prisma.feedItem.findUnique({
      where: { id },
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
              take: 10, // Preview cards
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
    });

    if (!feedItem) {
      return NextResponse.json(
        { error: "Feed item not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.feedItem.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Transform to match expected format
    const likesArray = (feedItem as { FeedLike?: { id: string }[] }).FeedLike ?? [];
    const bookmarksArray = (feedItem as { FeedBookmark?: { id: string }[] }).FeedBookmark ?? [];

    const transformedItem = {
      ...feedItem,
      user: feedItem.User,
      source: feedItem.Source,
      summary: feedItem.Summary,
      contentTable: feedItem.ContentTable
        ? {
            ...feedItem.ContentTable,
            rows: feedItem.ContentTable.rows as string[][],
          }
        : null,
      flashcardDeck: feedItem.Deck
        ? {
            ...feedItem.Deck,
            cards: feedItem.Deck.Flashcard,
            _count: { cards: feedItem.Deck._count.Flashcard },
          }
        : null,
      isLiked: session?.user?.id ? likesArray.length > 0 : false,
      isBookmarked: session?.user?.id ? bookmarksArray.length > 0 : false,
      likeCount: feedItem._count.FeedLike,
      bookmarkCount: feedItem._count.FeedBookmark,
      // Clean up PascalCase fields
      User: undefined,
      Source: undefined,
      Summary: undefined,
      ContentTable: undefined,
      Deck: undefined,
      FeedLike: undefined,
      FeedBookmark: undefined,
    };

    return NextResponse.json(transformedItem);
  } catch (error) {
    console.error("Error fetching feed item:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed item" },
      { status: 500 }
    );
  }
}
