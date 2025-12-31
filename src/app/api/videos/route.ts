import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

interface VideoWithRelations {
  Like?: { id: string }[];
  Bookmark?: { id: string }[];
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get("cursor");
    const topic = searchParams.get("topic");
    const limit = 10;

    const whereClause: Record<string, unknown> = {
      status: "COMPLETED",
    };

    // Filter by topic if provided
    if (topic) {
      whereClause.OR = [
        { topic: { contains: topic, mode: "insensitive" } },
        { tags: { has: topic } },
        { title: { contains: topic, mode: "insensitive" } },
        { description: { contains: topic, mode: "insensitive" } },
      ];
    }

    const videos = await prisma.video.findMany({
      where: whereClause,
      include: {
        User: {
          select: {
            name: true,
            image: true,
          },
        },
        Source: {
          select: {
            title: true,
            type: true,
          },
        },
        _count: {
          select: {
            Like: true,
            Bookmark: true,
          },
        },
        ...(session?.user?.id && {
          Like: {
            where: { userId: session.user.id },
            select: { id: true },
          },
          Bookmark: {
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

    // Transform to include isLiked and isBookmarked
    const transformedVideos = videos.map((video) => {
      const videoData = video as VideoWithRelations;
      const likesArray = videoData.Like ?? [];
      const bookmarksArray = videoData.Bookmark ?? [];

      return {
        ...video,
        isLiked: session?.user?.id ? likesArray.length > 0 : false,
        isBookmarked: session?.user?.id ? bookmarksArray.length > 0 : false,
        Like: undefined,
        Bookmark: undefined,
      };
    });

    return NextResponse.json(transformedVideos);
  } catch (error) {
    console.error("Error fetching videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    );
  }
}
