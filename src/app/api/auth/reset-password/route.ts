import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPasswordResetSuccessEmail } from "@/lib/email/sendgrid";
import prisma from "@/lib/prisma";
import crypto from "crypto";

// CORS headers for mobile app access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

export async function POST(request: NextRequest) {
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

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
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
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Find the Supabase user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Error fetching users:", userError);
      return NextResponse.json(
        { error: "An error occurred. Please try again." },
        { status: 500, headers: corsHeaders }
      );
    }

    const supabaseUser = userData.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!supabaseUser) {
      // Delete the token since email doesn't match any user
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      return NextResponse.json(
        { error: "User not found. Please sign up for a new account." },
        { status: 404, headers: corsHeaders }
      );
    }

    // Update the user's password in Supabase
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      supabaseUser.id,
      { password }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      return NextResponse.json(
        { error: "Failed to update password. Please try again." },
        { status: 500, headers: corsHeaders }
      );
    }

    // Delete tokens and get user name in a single transaction
    let userName: string | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        // Delete the used reset token
        await tx.passwordResetToken.delete({
          where: { id: resetToken.id },
        });

        // Delete any other reset tokens for this email
        await tx.passwordResetToken.deleteMany({
          where: { email: normalizedEmail },
        });

        // Get user name for personalization
        const prismaUser = await tx.user.findFirst({
          where: { email: normalizedEmail },
          select: { name: true },
        });
        userName = prismaUser?.name || null;
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
