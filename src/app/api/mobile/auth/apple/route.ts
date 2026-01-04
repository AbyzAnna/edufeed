import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import * as jose from "jose";
import { getCorsHeaders, handleCorsPreflightRequest } from "@/lib/cors";

// Handle preflight requests with secure CORS
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
}

// Apple's public keys URL and cache
const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
let appleKeysCache: { keys: any[]; expiresAt: number } | null = null;

async function getAppleKeys() {
  const now = Date.now();
  // Cache keys for 1 hour
  if (appleKeysCache && now < appleKeysCache.expiresAt) {
    return appleKeysCache.keys;
  }

  const response = await fetch(APPLE_KEYS_URL);
  const { keys } = await response.json();
  appleKeysCache = { keys, expiresAt: now + 60 * 60 * 1000 };
  return keys;
}

async function verifyAppleToken(identityToken: string) {
  try {
    // Get Apple's public keys (cached)
    const keys = await getAppleKeys();

    // Decode the token header to get the key ID
    const tokenParts = identityToken.split(".");
    if (tokenParts.length !== 3) {
      throw new Error("Invalid JWT format: expected 3 parts");
    }
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
  const corsHeaders = getCorsHeaders(request);
  try {
    const { identityToken, user: appleUserId, fullName, email } =
      await request.json();

    if (!identityToken) {
      return NextResponse.json(
        { error: "Identity token is required" },
        { status: 400, headers: corsHeaders }
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

    // Find user by Apple user ID first (most reliable)
    let user = await prisma.user.findUnique({
      where: { appleUserId: sub },
    });

    if (!user && userEmail) {
      // Check if email exists in the system
      const existingUser = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          Account: {
            where: { provider: "apple" },
          },
        },
      });

      if (existingUser) {
        // SECURITY FIX: Only link if user already has Apple account linked
        // Otherwise, require them to log in via their original method and link Apple manually
        if (existingUser.Account.length > 0) {
          // User has Apple account linked, but appleUserId wasn't set - update it
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              appleUserId: sub,
              lastActiveAt: new Date(),
            },
          });
        } else {
          // User exists with email but hasn't linked Apple - potential account takeover
          return NextResponse.json(
            {
              error: "EMAIL_ALREADY_REGISTERED",
              message: "An account with this email already exists. Please sign in with your original method and link Apple from settings.",
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
          email: userEmail,
          name: userName,
          appleUserId: sub,
          updatedAt: new Date(),
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
    } else if (!user.appleUserId) {
      // Update existing user with Apple ID
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          appleUserId: sub,
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
    } else {
      // Just update last active time
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() },
      });
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
    console.error("Apple auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}
