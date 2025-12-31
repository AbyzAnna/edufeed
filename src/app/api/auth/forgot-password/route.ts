import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPasswordResetEmail } from "@/lib/email/sendgrid";
import prisma from "@/lib/prisma";
import crypto from "crypto";

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

// Create Supabase admin client
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

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 3; // Max 3 requests per 15 minutes

  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit by IP and email
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = `${ip}:${normalizedEmail}`;

    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again in 15 minutes." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    const successResponse = NextResponse.json(
      {
        success: true,
        message: "If an account exists with this email, you will receive a password reset link.",
      },
      { headers: corsHeaders }
    );

    // Check if user exists in Supabase
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Error fetching users:", userError);
      // Still return success to prevent enumeration
      return successResponse;
    }

    const supabaseUser = userData.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!supabaseUser) {
      // User doesn't exist, but return success to prevent enumeration
      console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
      return successResponse;
    }

    // Check if user signed up with OAuth only (no password)
    const identities = supabaseUser.identities || [];
    const hasEmailIdentity = identities.some((i) => i.provider === "email");

    if (!hasEmailIdentity && identities.length > 0) {
      // User signed up with OAuth, they should use that provider
      console.log(`Password reset requested for OAuth-only user: ${normalizedEmail}`);
      // Still return success to prevent enumeration
      return successResponse;
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database using transaction to prevent race conditions
    let userName: string | null = null;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // First, invalidate any existing tokens for this user
        await tx.passwordResetToken.deleteMany({
          where: { email: normalizedEmail },
        });

        // Create new token
        await tx.passwordResetToken.create({
          data: {
            email: normalizedEmail,
            token: resetTokenHash,
            expiresAt,
          },
        });

        // Get user name for personalization (within same transaction)
        const prismaUser = await tx.user.findFirst({
          where: { email: normalizedEmail },
          select: { name: true },
        });

        return prismaUser;
      });

      userName = result?.name || null;
    } catch (dbError) {
      console.error("Database error creating reset token:", dbError);
      // Still return success to prevent enumeration
      return successResponse;
    }

    // Generate reset link
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetLink = `${baseUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send email via SendGrid (outside transaction - email sending is idempotent)
    try {
      const emailResult = await sendPasswordResetEmail(
        normalizedEmail,
        resetLink,
        userName || undefined
      );

      if (!emailResult.success) {
        console.error("Failed to send password reset email:", emailResult.error);
        // Don't expose email sending errors to the user
      } else {
        console.log(`Password reset email sent to ${normalizedEmail}`);
      }
    } catch (emailError) {
      console.error("SendGrid error:", emailError);
      // Don't fail - token is created, user can retry
    }

    return successResponse;
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500, headers: corsHeaders }
    );
  }
}
