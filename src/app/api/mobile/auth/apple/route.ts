import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import * as jose from "jose";

// Apple's public keys URL
const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";

async function verifyAppleToken(identityToken: string) {
  try {
    // Fetch Apple's public keys
    const response = await fetch(APPLE_KEYS_URL);
    const { keys } = await response.json();

    // Decode the token header to get the key ID
    const tokenParts = identityToken.split(".");
    const header = JSON.parse(Buffer.from(tokenParts[0], "base64").toString());

    // Find the matching key
    const key = keys.find((k: any) => k.kid === header.kid);
    if (!key) {
      throw new Error("No matching key found");
    }

    // Import the key and verify the token
    const publicKey = await jose.importJWK(key, "RS256");
    const { payload } = await jose.jwtVerify(identityToken, publicKey, {
      issuer: "https://appleid.apple.com",
      audience: process.env.APPLE_SERVICE_ID || "com.edufeed.app",
    });

    return payload;
  } catch (error) {
    console.error("Apple token verification error:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { identityToken, user: appleUserId, fullName, email } =
      await request.json();

    if (!identityToken) {
      return NextResponse.json(
        { error: "Identity token is required" },
        { status: 400 }
      );
    }

    // Verify the Apple identity token
    const payload = await verifyAppleToken(identityToken);
    const sub = payload.sub as string;
    const tokenEmail = payload.email as string | undefined;

    // Use provided email or email from token
    const userEmail = email || tokenEmail;

    // Build user name from Apple's fullName object
    let userName: string | null = null;
    if (fullName) {
      const parts = [
        fullName.givenName,
        fullName.middleName,
        fullName.familyName,
      ].filter(Boolean);
      if (parts.length > 0) {
        userName = parts.join(" ");
      }
    }

    // Find or create user by Apple user ID
    let user = await prisma.user.findUnique({
      where: { appleUserId: sub },
    });

    if (!user && userEmail) {
      // Try to find by email
      user = await prisma.user.findUnique({
        where: { email: userEmail },
      });
    }

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: userEmail,
          name: userName,
          appleUserId: sub,
          Account: {
            create: {
              id: crypto.randomUUID(),
              type: "oauth",
              provider: "apple",
              providerAccountId: sub,
            },
          },
        },
      });
    } else {
      // Update user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          appleUserId: sub,
          // Only update name if provided and user doesn't have one
          name: user.name || userName,
          lastActiveAt: new Date(),
        },
      });

      // Ensure account exists
      const account = await prisma.account.findFirst({
        where: {
          userId: user.id,
          provider: "apple",
        },
      });

      if (!account) {
        await prisma.account.create({
          data: {
            id: crypto.randomUUID(),
            userId: user.id,
            type: "oauth",
            provider: "apple",
            providerAccountId: sub,
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
    console.error("Apple auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
