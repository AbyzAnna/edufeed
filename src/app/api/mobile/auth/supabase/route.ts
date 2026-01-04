import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

// CORS headers for mobile app access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Create Supabase admin client to verify tokens
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    // CRITICAL FIX: Verify the caller owns this Supabase user ID via their access token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401, headers: corsHeaders }
      );
    }

    const accessToken = authHeader.substring(7);

    // Verify the token and get the authenticated user
    const { data: { user: authenticatedUser }, error: authError } =
      await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !authenticatedUser) {
      return NextResponse.json(
        { error: "Invalid or expired access token" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { supabaseUserId, email, name, image } = await request.json();

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: "Supabase user ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // CRITICAL FIX: Ensure the authenticated user matches the requested user ID
    if (authenticatedUser.id !== supabaseUserId) {
      return NextResponse.json(
        { error: "User ID mismatch - you can only sync your own account" },
        { status: 403, headers: corsHeaders }
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
          updatedAt: new Date(),
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
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Supabase auth sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500, headers: corsHeaders }
    );
  }
}
