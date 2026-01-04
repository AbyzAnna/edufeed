import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmailVerificationEmail } from "@/lib/email/sendgrid";
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
    const rateLimitResult = rateLimiters.resendVerification(rateLimitKey);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 5 minutes before trying again." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Always return success to prevent email enumeration attacks
    const successResponse = NextResponse.json(
      {
        success: true,
        message: "If an unverified account exists with this email, a new verification link has been sent.",
      },
      { headers: corsHeaders }
    );

    // First check Prisma for user existence (fast, indexed query)
    const prismaUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true, name: true, emailVerified: true },
    });

    if (!prismaUser) {
      // User doesn't exist in our database
      console.log(`Resend verification requested for non-existent email: ${normalizedEmail}`);
      return successResponse;
    }

    // Check if already verified via Prisma (faster than Supabase)
    if (prismaUser.emailVerified) {
      console.log(`Resend verification requested for already verified email: ${normalizedEmail}`);
      return successResponse;
    }

    // Verify with Supabase using the user ID (O(1) lookup instead of listing all users)
    const { data: supabaseUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(prismaUser.id);

    if (userError || !supabaseUser?.user) {
      console.error("Error fetching Supabase user:", userError);
      return successResponse;
    }

    // Double-check email confirmation status in Supabase
    if (supabaseUser.user.email_confirmed_at) {
      console.log(`Resend verification requested for already verified email: ${normalizedEmail}`);
      return successResponse;
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update or create verification token (we already have user name from earlier query)
    const userName = prismaUser.name;

    try {
      await prisma.emailVerificationToken.upsert({
        where: { email: normalizedEmail },
        update: { token: verificationTokenHash, expiresAt },
        create: { id: crypto.randomUUID(), email: normalizedEmail, token: verificationTokenHash, expiresAt },
      });
    } catch (dbError) {
      console.error("Database error creating verification token:", dbError);
      return successResponse;
    }

    // Generate verification link
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationLink = `${baseUrl}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send verification email via SendGrid (outside transaction)
    try {
      const emailResult = await sendEmailVerificationEmail(
        normalizedEmail,
        verificationLink,
        userName || undefined
      );

      if (!emailResult.success) {
        console.error("Failed to send verification email:", emailResult.error);
      } else {
        console.log(`Verification email resent to ${normalizedEmail}`);
      }
    } catch (emailError) {
      console.error("SendGrid error:", emailError);
    }

    return successResponse;
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500, headers: corsHeaders }
    );
  }
}
