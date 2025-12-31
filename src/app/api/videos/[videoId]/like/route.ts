import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;

    const like = await prisma.like.create({
      data: {
        id: crypto.randomUUID(),
        userId: session.user.id,
        videoId,
      },
    });

    return NextResponse.json({ success: true, like });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Already liked" }, { status: 400 });
    }
    console.error("Error liking video:", error);
    return NextResponse.json({ error: "Failed to like video" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;

    await prisma.like.delete({
      where: {
        userId_videoId: {
          userId: session.user.id,
          videoId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unliking video:", error);
    return NextResponse.json({ error: "Failed to unlike video" }, { status: 500 });
  }
}
