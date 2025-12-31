import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

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

    // Check if already liked
    const existingLike = await prisma.feedLike.findUnique({
      where: {
        userId_feedItemId: {
          userId: session.user.id,
          feedItemId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.feedLike.delete({
        where: { id: existingLike.id },
      });
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.feedLike.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          feedItemId,
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
