import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { getCorsHeaders, handleCorsPreflightRequest } from "@/lib/cors";

// Handle preflight requests with secure CORS
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID!,
        process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID!,
        process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID!,
      ].filter(Boolean),
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 401, headers: corsHeaders }
      );
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find user by Google account first (most reliable)
    let user = await prisma.user.findFirst({
      where: {
        Account: {
          some: {
            provider: "google",
            providerAccountId: googleId,
          },
        },
      },
    });

    if (!user && email) {
      // Check if email exists in the system
      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: {
          Account: {
            where: { provider: "google" },
          },
        },
      });

      if (existingUser) {
        // SECURITY FIX: Only link if user already has Google account linked
        // Otherwise, require them to log in via their original method and link Google manually
        if (existingUser.Account.length > 0) {
          // User has Google account linked already
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: name || existingUser.name,
              image: picture || existingUser.image,
              lastActiveAt: new Date(),
            },
          });
        } else {
          // User exists with email but hasn't linked Google - potential account takeover
          return NextResponse.json(
            {
              error: "EMAIL_ALREADY_REGISTERED",
              message: "An account with this email already exists. Please sign in with your original method and link Google from settings.",
            },
            { status: 409, headers: corsHeaders }
          );
        }
      }
    }

    if (!user) {
      // Create new user - no existing email conflict
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email,
          name,
          image: picture,
          updatedAt: new Date(),
          Account: {
            create: {
              id: crypto.randomUUID(),
              type: "oauth",
              provider: "google",
              providerAccountId: googleId!,
            },
          },
        },
      });
    } else {
      // Just update user info and last active time
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          image: picture || user.image,
          lastActiveAt: new Date(),
        },
      });

      // Ensure account exists
      const account = await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: "google",
        },
      });

      if (!account) {
        await prisma.account.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            type: "oauth",
            provider: "google",
            providerAccountId: googleId!,
          },
        });
      }
    }

    // Generate JWT tokens
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "7d" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: "refresh" },
      process.env.NEXTAUTH_SECRET!,
      { expiresIn: "30d" }
    );

    return NextResponse.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
