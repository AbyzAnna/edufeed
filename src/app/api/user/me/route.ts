import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/supabase/auth";
import { rateLimiters } from "@/lib/rate-limit";

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

    // Apply rate limiting (60 requests per minute per user)
    const rateLimit = rateLimiters.userProfile(userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetTime / 1000)),
          },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        username: true,
        createdAt: true,
        _count: {
          select: {
            Video: true,
            Deck: true,
            Follow_Follow_followerIdToUser: true,
            Follow_Follow_followingIdToUser: true,
            FeedItem: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get unread messages count
    const unreadMessages = await prisma.directMessage.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    // Update last active time
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        bio: user.bio,
        username: user.username,
        createdAt: user.createdAt,
      },
      stats: {
        videos: user._count.Video,
        decks: user._count.Deck,
        followers: user._count.Follow_Follow_followerIdToUser,
        following: user._count.Follow_Follow_followingIdToUser,
        feedItems: user._count.FeedItem,
      },
      unreadMessages,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "Failed to get user" },
      { status: 500 }
    );
  }
}
