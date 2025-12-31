import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAuthSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [sourcesCount, videosCount, completedVideos] = await Promise.all([
      prisma.source.count({
        where: { userId: session.user.id },
      }),
      prisma.video.count({
        where: { userId: session.user.id },
      }),
      prisma.video.count({
        where: {
          userId: session.user.id,
          status: "COMPLETED",
        },
      }),
    ]);

    return NextResponse.json({
      sourcesCount,
      videosCount,
      completedVideos,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
