import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmailVerificationEmail } from "@/lib/email/sendgrid";
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
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const maxRequests = 3; // Max 3 resend requests per 5 minutes

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

    // Check if user exists in Supabase
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();

    if (userError) {
      console.error("Error fetching users:", userError);
      return successResponse;
    }

    const supabaseUser = userData.users.find(
      (u) => u.email?.toLowerCase() === normalizedEmail
    );

    if (!supabaseUser) {
      // User doesn't exist
      console.log(`Resend verification requested for non-existent email: ${normalizedEmail}`);
      return successResponse;
    }

    // Check if email is already confirmed
    if (supabaseUser.email_confirmed_at) {
      console.log(`Resend verification requested for already verified email: ${normalizedEmail}`);
      return successResponse;
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto.createHash("sha256").update(verificationToken).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // Update or create verification token and get user name in transaction
    let userName: string | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        // Upsert token
        await tx.emailVerificationToken.upsert({
          where: { email: normalizedEmail },
          update: { token: verificationTokenHash, expiresAt },
          create: { email: normalizedEmail, token: verificationTokenHash, expiresAt },
        });

        // Get user name for personalization
        const prismaUser = await tx.user.findFirst({
          where: { email: normalizedEmail },
          select: { name: true },
        });
        userName = prismaUser?.name || null;
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
