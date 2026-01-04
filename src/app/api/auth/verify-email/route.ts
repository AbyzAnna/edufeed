import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email/sendgrid";
import prisma from "@/lib/prisma";
import crypto from "crypto";
import { rateLimiters } from "@/lib/rate-limit";

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

    // Rate limit by IP and email using shared rate limiter
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitKey = `${ip}:${normalizedEmail}`;
    const rateLimitResult = rateLimiters.emailVerification(rateLimitKey);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again in 5 minutes." },
        { status: 429 }
      );
    }

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

    // Find user in Prisma first (fast, indexed query) to get their Supabase ID
    const prismaUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, name: true },
    });

    if (!prismaUser) {
      return NextResponse.json(
        { error: "User not found. Please sign up again." },
        { status: 404 }
      );
    }

    // Verify user exists in Supabase using ID (O(1) lookup instead of listing all users)
    const { data: supabaseUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(prismaUser.id);

    if (userError || !supabaseUser?.user) {
      console.error("Error fetching Supabase user:", userError);
      return NextResponse.json(
        { error: "An error occurred. Please try again." },
        { status: 500 }
      );
    }

    // Confirm the user's email in Supabase
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      supabaseUser.user.id,
      { email_confirm: true }
    );

    if (updateError) {
      console.error("Error confirming email:", updateError);
      return NextResponse.json(
        { error: "Failed to verify email. Please try again." },
        { status: 500 }
      );
    }

    // Update Prisma user and delete token (we already have user name from earlier query)
    const userName = prismaUser.name;

    try {
      await prisma.$transaction(async (tx) => {
        // Update user's emailVerified field
        await tx.user.update({
          where: { email: normalizedEmail },
          data: {
            emailVerified: new Date(),
            updatedAt: new Date(),
          },
        });

        // Delete all verification tokens for this email
        await tx.emailVerificationToken.deleteMany({
          where: { email: normalizedEmail },
        });
      });
    } catch (prismaError) {
      // Non-fatal - user might not exist in Prisma yet
      console.error("Error in verification transaction:", prismaError);

      // Try to delete token separately
      try {
        await prisma.emailVerificationToken.deleteMany({
          where: { email: normalizedEmail },
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
