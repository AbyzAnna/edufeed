import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/supabase/auth";
import prisma from "@/lib/prisma";

// GET /api/users/search - Search for users
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limitParam = parseInt(searchParams.get("limit") || "10", 10);
    const limit = isNaN(limitParam) ? 10 : Math.min(Math.max(1, limitParam), 50);

    if (query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } }, // Exclude self
          {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { username: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
      },
    });

    // Check which users the current user is following
    const followingIds = await prisma.follow.findMany({
      where: {
        followerId: session.user.id,
        followingId: { in: users.map((u) => u.id) },
      },
      select: { followingId: true },
    });

    const followingSet = new Set(followingIds.map((f) => f.followingId));

    const usersWithFollowStatus = users.map((user) => ({
      ...user,
      isFollowing: followingSet.has(user.id),
    }));

    return NextResponse.json({ users: usersWithFollowStatus });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
