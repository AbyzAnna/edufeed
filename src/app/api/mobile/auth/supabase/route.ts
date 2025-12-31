import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { supabaseUserId, email, name, image } = await request.json();

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: "Supabase user ID is required" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: supabaseUserId },
          { email: email || undefined },
        ],
      },
    });

    if (!user) {
      // Create new user with Supabase ID
      user = await prisma.user.create({
        data: {
          id: supabaseUserId,
          email,
          name,
          image,
          emailVerified: email ? new Date() : null,
        },
      });
    } else if (user.id !== supabaseUserId) {
      // User exists with email but different ID - update to use Supabase ID
      // First, delete the old user record to avoid conflicts
      const oldUserId = user.id;

      // Update the user ID to match Supabase
      user = await prisma.user.update({
        where: { id: oldUserId },
        data: {
          id: supabaseUserId,
          name: name || user.name,
          image: image || user.image,
        },
      });
    } else {
      // Update user info if changed
      user = await prisma.user.update({
        where: { id: supabaseUserId },
        data: {
          name: name || user.name,
          image: image || user.image,
          lastActiveAt: new Date(),
        },
      });
    }

    // Get user stats
    const [videosCount, decksCount, followersCount, followingCount, unreadMessages] = await Promise.all([
      prisma.video.count({ where: { userId: user.id } }),
      prisma.deck.count({ where: { userId: user.id } }),
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.directMessage.count({
        where: {
          receiverId: user.id,
          isRead: false,
        },
      }),
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
      stats: {
        videos: videosCount,
        decks: decksCount,
        followers: followersCount,
        following: followingCount,
      },
      unreadMessages,
    });
  } catch (error) {
    console.error("Supabase auth sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
