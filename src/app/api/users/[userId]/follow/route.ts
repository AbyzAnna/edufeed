import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

// POST /api/users/[userId]/follow - Toggle follow on a user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId: followingId } = await params;

    // Can't follow yourself
    if (followingId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Verify user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true, name: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return NextResponse.json({ following: false });
    } else {
      // Follow - use transaction to ensure atomicity of follow + notification
      await prisma.$transaction(async (tx) => {
        await tx.follow.create({
          data: {
            id: crypto.randomUUID(),
            followerId: session.user.id,
            followingId,
          },
        });

        // Create notification
        await tx.notification.create({
          data: {
            id: crypto.randomUUID(),
            userId: followingId,
            type: "FOLLOW",
            title: "New follower",
            message: `${session.user.name || "Someone"} started following you`,
            actorId: session.user.id,
            targetId: session.user.id,
            targetType: "user",
          },
        });
      });

      return NextResponse.json({ following: true });
    }
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json(
      { error: "Failed to toggle follow" },
      { status: 500 }
    );
  }
}

// GET /api/users/[userId]/follow - Get follow status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAuthSession();
    const { userId } = await params;

    // Get follower/following counts
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    let isFollowing = false;
    if (session?.user?.id && session.user.id !== userId) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: userId,
          },
        },
      });
      isFollowing = !!follow;
    }

    return NextResponse.json({
      followerCount,
      followingCount,
      isFollowing,
    });
  } catch (error) {
    console.error("Error getting follow status:", error);
    return NextResponse.json(
      { error: "Failed to get follow status" },
      { status: 500 }
    );
  }
}
