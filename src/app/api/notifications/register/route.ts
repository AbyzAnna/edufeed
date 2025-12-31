import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

interface TokenPayload {
  userId: string;
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

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { pushToken, platform } = await request.json();

    if (!pushToken) {
      return NextResponse.json(
        { error: "Push token is required" },
        { status: 400 }
      );
    }

    // Update user with push token
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushToken,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error) {
    console.error("Push token registration error:", error);
    return NextResponse.json(
      { error: "Failed to register push token" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Remove push token
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushToken: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Push token removed successfully",
    });
  } catch (error) {
    console.error("Push token removal error:", error);
    return NextResponse.json(
      { error: "Failed to remove push token" },
      { status: 500 }
    );
  }
}
