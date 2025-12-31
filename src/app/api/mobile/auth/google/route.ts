import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
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
        { status: 401 }
      );
    }

    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          {
            Account: {
              some: {
                provider: "google",
                providerAccountId: googleId,
              },
            },
          },
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email,
          name,
          image: picture,
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
      // Update user info
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
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
