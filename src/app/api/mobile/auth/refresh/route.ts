import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

interface RefreshTokenPayload {
  userId: string;
  type: string;
}

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Verify the refresh token
    let payload: RefreshTokenPayload;
    try {
      payload = jwt.verify(
        refreshToken,
        process.env.NEXTAUTH_SECRET!
      ) as RefreshTokenPayload;
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    if (payload.type !== "refresh") {
      return NextResponse.json(
        { error: "Invalid token type" },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 401 }
      );
    }

    // Update last active time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // Generate new tokens
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "7d" }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id, type: "refresh" },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token: newToken,
      refreshToken: newRefreshToken,
      user,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Token refresh failed" },
      { status: 500 }
    );
  }
}
