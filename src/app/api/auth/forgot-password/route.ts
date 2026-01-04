import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPasswordResetEmail } from "@/lib/email/sendgrid";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { getCorsHeaders, handleCorsPreflightRequest } from "@/lib/cors";
import { rateLimiters } from "@/lib/rate-limit";

// Handle preflight requests with secure CORS
export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflightRequest(request);
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

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Rate limit by IP and email using shared rate limiter with memory leak prevention
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = `${ip}:${normalizedEmail}`;
    const rateLimitResult = rateLimiters.passwordReset(rateLimitKey);

    if (!rateLimitResult.allowed) {
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

    // First check Prisma for user existence (fast, indexed query)
    const prismaUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, name: true },
    });

    if (!prismaUser) {
      // User doesn't exist, but return success to prevent enumeration
      console.log(`Password reset requested for non-existent email: ${normalizedEmail}`);
      return successResponse;
    }

    // Check if user signed up with OAuth only using Supabase (O(1) lookup by ID)
    const { data: supabaseUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(prismaUser.id);

    if (userError || !supabaseUser?.user) {
      console.error("Error fetching Supabase user:", userError);
      return successResponse;
    }

    const identities = supabaseUser.user.identities || [];
    const hasEmailIdentity = identities.some((i) => i.provider === "email");

    if (!hasEmailIdentity && identities.length > 0) {
      // User signed up with OAuth, they should use that provider
      console.log(`Password reset requested for OAuth-only user: ${normalizedEmail}`);
      return successResponse;
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database (we already have user name)
    const userName = prismaUser.name;

    try {
      await prisma.$transaction(async (tx) => {
        // First, invalidate any existing tokens for this user
        await tx.passwordResetToken.deleteMany({
          where: { email: normalizedEmail },
        });

        // Create new token
        await tx.passwordResetToken.create({
          data: {
            id: crypto.randomUUID(),
            email: normalizedEmail,
            token: resetTokenHash,
            expiresAt,
          },
        });
      });
    } catch (dbError) {
      console.error("Database error creating reset token:", dbError);
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
