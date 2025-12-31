import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

// GET /api/users/[userId]/followers - Get user's followers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getAuthSession();
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type") || "followers"; // followers | following

    const followers =
      type === "followers"
        ? await prisma.follow.findMany({
            where: { followingId: userId },
            take: limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
            orderBy: { createdAt: "desc" },
            include: {
              User_Follow_followerIdToUser: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  bio: true,
                },
              },
            },
          })
        : await prisma.follow.findMany({
            where: { followerId: userId },
            take: limit + 1,
            ...(cursor && { cursor: { id: cursor }, skip: 1 }),
            orderBy: { createdAt: "desc" },
            include: {
              User_Follow_followingIdToUser: {
                select: {
                  id: true,
                  name: true,
                  username: true,
                  image: true,
                  bio: true,
                },
              },
            },
          });

    const hasMore = followers.length > limit;
    const items = hasMore ? followers.slice(0, -1) : followers;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    // Check which users the current user is following
    let followingIds: string[] = [];
    if (session?.user?.id) {
      const userIds = items.map((f) => {
        if ("User_Follow_followerIdToUser" in f) {
          return f.User_Follow_followerIdToUser.id;
        }
        return f.User_Follow_followingIdToUser.id;
      });
      const userFollows = await prisma.follow.findMany({
        where: {
          followerId: session.user.id,
          followingId: { in: userIds },
        },
        select: { followingId: true },
      });
      followingIds = userFollows.map((f) => f.followingId);
    }

    const users = items.map((f) => {
      const user = "User_Follow_followerIdToUser" in f ? f.User_Follow_followerIdToUser : f.User_Follow_followingIdToUser;
      return {
        ...user,
        isFollowing: followingIds.includes(user.id),
        isOwnProfile: session?.user?.id === user.id,
      };
    });

    return NextResponse.json({
      users,
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
