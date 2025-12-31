import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmailVerificationEmail, sendWelcomeEmail } from "@/lib/email/sendgrid";
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
  const maxRequests = 5; // Max 5 signup attempts per 15 minutes

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
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again in 15 minutes." },
        { status: 429, headers: corsHeaders }
      );
    }

    // Check if user already exists in Supabase
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (existingUser) {
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
          create: { email: normalizedEmail, token: verificationTokenHash, expiresAt },
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
