import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { functions } from "@/lib/inngest/functions";
import { NextRequest, NextResponse } from "next/server";

// Inngest serve handler with automatic signature verification
// When INNGEST_SIGNING_KEY is set, the SDK verifies X-Inngest-Signature header
const handler = serve({
  client: inngest,
  functions,
  // In production, require signature verification
  // The SDK reads INNGEST_SIGNING_KEY from environment automatically
});

// Context type for route handlers (Next.js App Router)
type RouteContext = { params: Promise<Record<string, string>> };

// Wrapper to add security logging and explicit signature check warning
async function secureHandler(
  request: NextRequest,
  context: RouteContext,
  method: "GET" | "POST" | "PUT"
) {
  // Log webhook access for security monitoring
  const signature = request.headers.get("x-inngest-signature");
  const hasSigningKey = !!process.env.INNGEST_SIGNING_KEY;

  if (process.env.NODE_ENV === "production") {
    if (!hasSigningKey) {
      console.error("[Inngest Security] CRITICAL: No signing key configured in production!");
      return NextResponse.json(
        { error: "Webhook security not configured" },
        { status: 503 }
      );
    }

    if (!signature) {
      console.warn("[Inngest Security] Request without signature rejected");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }
  }

  // Delegate to Inngest SDK which handles signature verification
  if (method === "GET") {
    return handler.GET(request, context);
  } else if (method === "POST") {
    return handler.POST(request, context);
  } else {
    return handler.PUT(request, context);
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  return secureHandler(request, context, "GET");
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return secureHandler(request, context, "POST");
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  return secureHandler(request, context, "PUT");
}
