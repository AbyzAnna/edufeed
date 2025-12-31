import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
  email?: string;
}

function getUserIdFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET!
    ) as TokenPayload;
    return payload.userId;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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
