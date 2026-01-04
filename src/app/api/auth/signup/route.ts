import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmailVerificationEmail, sendWelcomeEmail } from "@/lib/email/sendgrid";
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
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate password strength - enforce strong passwords
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

    // Rate limit by IP using shared rate limiter with memory leak prevention
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimitResult = rateLimiters.signup(ip);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again in 15 minutes." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Check if user already exists in Prisma (fast, indexed query)
    const existingPrismaUser = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingPrismaUser) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create user in Supabase with email NOT auto-confirmed
    // We'll handle confirmation via SendGrid
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: false, // Don't auto-confirm - we'll send verification via SendGrid
      user_metadata: {
        name: name || undefined,
      },
    });

    if (authError) {
      console.error("Supabase signup error:", authError);
      return NextResponse.json(
        { error: authError.message || "Failed to create account" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Create user in Prisma database and verification token in a single transaction
    // This prevents race conditions and ensures data consistency
    try {
      await prisma.$transaction(async (tx) => {
        // Create user
        await tx.user.create({
          data: {
            id: authData.user.id,
            email: normalizedEmail,
            name: name || null,
            emailVerified: null,
            updatedAt: new Date(),
          },
        });

        // Create verification token
        await tx.emailVerificationToken.upsert({
          where: { email: normalizedEmail },
          update: {
            token: verificationTokenHash,
            expiresAt,
          },
          create: {
            id: crypto.randomUUID(),
            email: normalizedEmail,
            token: verificationTokenHash,
            expiresAt,
          },
        });
      });
    } catch (prismaError: any) {
      // If Prisma fails, still allow signup - user sync API will handle later
      console.error("Prisma transaction error:", prismaError);

      // Try to create just the verification token
      try {
        await prisma.emailVerificationToken.upsert({
          where: { email: normalizedEmail },
          update: { token: verificationTokenHash, expiresAt },
          create: { id: crypto.randomUUID(), email: normalizedEmail, token: verificationTokenHash, expiresAt },
        });
      } catch (tokenError) {
        console.error("Failed to create verification token:", tokenError);
      }
    }

    // Generate verification link
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationLink = `${baseUrl}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send verification email via SendGrid (outside transaction)
    try {
      const emailResult = await sendEmailVerificationEmail(
        normalizedEmail,
        verificationLink,
        name || undefined
      );

      if (!emailResult.success) {
        console.error("Failed to send verification email:", emailResult.error);
      } else {
        console.log(`Verification email sent to ${normalizedEmail}`);
      }
    } catch (emailError) {
      console.error("SendGrid error:", emailError);
      // Don't fail signup - user can request resend
    }

    return NextResponse.json(
      {
        success: true,
        message: "Account created! Please check your email to verify your account.",
        requiresEmailVerification: true,
        email: normalizedEmail,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred. Please try again later." },
      { status: 500, headers: corsHeaders }
    );
  }
}
