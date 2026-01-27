import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/supabase/auth";

export async function POST(request: NextRequest) {
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

export async function DELETE() {
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
