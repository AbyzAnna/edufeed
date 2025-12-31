import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email/sendgrid";
import prisma from "@/lib/prisma";
import crypto from "crypto";

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

// Verify email token and activate account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find and validate the verification token
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        email: normalizedEmail,
        token: tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json(
        { error: "Invalid or expired verification link. Please request a new one." },
        { status: 400 }
      );
    }

    // Find the Supabase user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Error fetching users:", userError);
      return NextResponse.json(
        { error: "An error occurred. Please try again." },
        { status: 500 }
      );
    }

    const supabaseUser = userData.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!supabaseUser) {
      return NextResponse.json(
        { error: "User not found. Please sign up again." },
        { status: 404 }
      );
    }

    // Confirm the user's email in Supabase
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      supabaseUser.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error("Error confirming email:", updateError);
      return NextResponse.json(
        { error: "Failed to verify email. Please try again." },
        { status: 500 }
      );
    }

    // Update Prisma user and delete token in a single transaction
    let userName: string | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        // Update user's emailVerified field
        const updatedUser = await tx.user.update({
          where: { email: normalizedEmail },
          data: {
            emailVerified: new Date(),
            updatedAt: new Date(),
          },
          select: { name: true },
        });
        userName = updatedUser.name;

        // Delete the used verification token
        await tx.emailVerificationToken.delete({
          where: { id: verificationToken.id },
        });
      });
    } catch (prismaError) {
      // Non-fatal - user might not exist in Prisma yet
      console.error("Error in verification transaction:", prismaError);

      // Try to delete token separately
      try {
        await prisma.emailVerificationToken.delete({
          where: { id: verificationToken.id },
        });
      } catch (deleteError) {
        console.error("Error deleting verification token:", deleteError);
      }
    }

    // Send welcome email (outside transaction)
    try {
      const emailResult = await sendWelcomeEmail(
        normalizedEmail,
        userName || undefined
      );

      if (!emailResult.success) {
        console.error("Failed to send welcome email:", emailResult.error);
      }
    } catch (emailError) {
      console.error("SendGrid error:", emailError);
      // Don't fail the request if welcome email fails
    }

    console.log(`Email verified for ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: "Email verified successfully! You can now sign in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500 }
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
        { valid: false, error: "Invalid verification link" },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find and validate the verification token
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: {
        email: normalizedEmail,
        token: tokenHash,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      return NextResponse.json({
        valid: false,
        error: "This verification link has expired or is invalid. Please request a new one.",
      });
    }

    return NextResponse.json({
      valid: true,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json(
      { valid: false, error: "An error occurred" },
      { status: 500 }
    );
  }
}
