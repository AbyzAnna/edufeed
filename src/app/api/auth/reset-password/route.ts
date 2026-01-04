import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPasswordResetSuccessEmail } from "@/lib/email/sendgrid";
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
    const { token, email, password } = body;

    // Validate inputs
    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Token, email, and password are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize email first for rate limiting
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit by IP and email using shared rate limiter
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = `${ip}:${normalizedEmail}`;
    const rateLimitResult = rateLimiters.passwordReset(rateLimitKey);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again in 15 minutes." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Validate password strength - enforce strong passwords (match signup requirements)
    const passwordErrors: string[] = [];
    if (password.length < 8) {
      passwordErrors.push("at least 8 characters");
    }
    if (password.length > 128) {
      passwordErrors.push("no more than 128 characters");
    }
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push("at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      passwordErrors.push("at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      passwordErrors.push("at least one number");
    }
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: `Password must have ${passwordErrors.join(", ")}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find and validate the reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: normalizedEmail,
        token: tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find the user in Prisma first (fast, indexed query) to get their Supabase ID
    const prismaUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, name: true },
    });

    if (!prismaUser) {
      // Delete the token since email doesn't match any user
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { error: "User not found. Please sign up for a new account." },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify user exists in Supabase using ID (O(1) lookup instead of listing all users)
    const { data: supabaseUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(prismaUser.id);

    if (userError || !supabaseUser?.user) {
      console.error("Error fetching Supabase user:", userError);
      return NextResponse.json(
        { error: "An error occurred. Please try again." },
        { status: 500, headers: corsHeaders }
      );
    }

    // Update the user's password in Supabase
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      supabaseUser.user.id,
      { password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500, headers: corsHeaders }
      );
    }

    // Delete all reset tokens for this email (we already have user name from earlier query)
    const userName = prismaUser.name;

    try {
      // Delete all reset tokens for this email in one operation
      await prisma.passwordResetToken.deleteMany({
        where: { email: normalizedEmail },
      });
    } catch (dbError) {
      console.error("Database error during token cleanup:", dbError);
      // Non-fatal - password was already reset successfully
    }

    // Send success email (outside transaction)
    try {
      const emailResult = await sendPasswordResetSuccessEmail(
        normalizedEmail,
        userName || undefined
      );

      if (!emailResult.success) {
        console.error("Failed to send password reset success email:", emailResult.error);
      }
    } catch (emailError) {
      console.error("SendGrid error:", emailError);
      // Don't fail the request if email fails
    }

    console.log(`Password successfully reset for ${normalizedEmail}`);

    return NextResponse.json(
      {
        success: true,
        message: "Password has been reset successfully. You can now sign in with your new password.",
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Validate token endpoint (for checking if token is valid before showing form)
export async function GET(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json(
        { valid: false, error: "Invalid reset link" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find and validate the reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        email: normalizedEmail,
        token: tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          valid: false,
          error: "This reset link has expired or is invalid. Please request a new one.",
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        email: normalizedEmail,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { valid: false, error: "An error occurred" },
      { status: 500, headers: corsHeaders }
    );
  }
}
