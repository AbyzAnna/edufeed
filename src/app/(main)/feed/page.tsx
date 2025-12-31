import { Suspense } from "react";
import ContentFeed from "@/components/feed/ContentFeed";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getFeedItems() {
  try {
    const session = await getServerSession(authOptions);

    const feedItems = await prisma.feedItem.findMany({
      where: {
        status: "COMPLETED",
      },
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
              take: 3,
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
      take: 10,
    });

    // Transform to include isLiked and isBookmarked
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
      };
    });

    return transformedItems;
  } catch (error) {
    console.error("Error fetching feed items:", error);
    return [];
  }
}

function FeedLoading() {
  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <div className="spinner w-10 h-10 mx-auto mb-4" />
        <p className="text-gray-400">Loading your feed...</p>
      </div>
    </div>
  );
}

export default async function FeedPage() {
  const feedItems = await getFeedItems();

  return (
    <Suspense fallback={<FeedLoading />}>
      <ContentFeed initialItems={feedItems} />
    </Suspense>
  );
}
