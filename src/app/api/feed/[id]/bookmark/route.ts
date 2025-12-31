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

    // Check if already bookmarked
    const existingBookmark = await prisma.feedBookmark.findUnique({
      where: {
        userId_feedItemId: {
          userId: session.user.id,
          feedItemId,
        },
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prisma.feedBookmark.delete({
        where: { id: existingBookmark.id },
      });
      return NextResponse.json({ bookmarked: false });
    } else {
      // Add bookmark
      await prisma.feedBookmark.create({
        data: {
          id: crypto.randomUUID(),
          userId: session.user.id,
          feedItemId,
        },
      });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      { error: "Failed to toggle bookmark" },
      { status: 500 }
    );
  }
}
