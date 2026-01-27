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

    const videos = await prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnailUrl: true,
        duration: true,
        viewCount: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      videos: videos.map((video) => ({
        id: video.id,
        title: video.title,
        description: video.description,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        viewCount: video.viewCount,
        status: video.status,
        createdAt: video.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get videos error:", error);
    return NextResponse.json(
      { error: "Failed to get videos" },
      { status: 500 }
    );
  }
}
