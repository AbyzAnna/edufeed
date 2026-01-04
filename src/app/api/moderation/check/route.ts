import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { moderationService } from '@/lib/moderation';
import { ModerationContentType } from '@prisma/client';
import { ContentBlockedError } from '@/lib/moderation/errors';

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute
const MAX_MAP_SIZE = 10000; // Maximum entries to prevent memory leak
let lastCleanup = 0;

// SECURITY FIX: Cleanup expired entries to prevent memory leak
function cleanupRateLimitMap(): void {
  const now = Date.now();
  // Only run cleanup once per minute
  if (now - lastCleanup < 60000 && rateLimitMap.size < MAX_MAP_SIZE) return;
  lastCleanup = now;

  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }

  // Emergency cleanup if still too large
  if (rateLimitMap.size >= MAX_MAP_SIZE) {
    const entriesToDelete = Math.floor(MAX_MAP_SIZE * 0.2);
    let deleted = 0;
    for (const key of rateLimitMap.keys()) {
      if (deleted >= entriesToDelete) break;
      rateLimitMap.delete(key);
      deleted++;
    }
  }
}

/**
 * POST /api/moderation/check
 * Pre-check content before submission
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Rate limiting with cleanup
    cleanupRateLimitMap(); // SECURITY FIX: Clean up expired entries first
    const rateLimitKey = `moderation:${user.id}`;
    const now = Date.now();
    const rateLimit = rateLimitMap.get(rateLimitKey);

    if (rateLimit) {
      if (now < rateLimit.resetAt) {
        if (rateLimit.count >= RATE_LIMIT) {
          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              retryAfter: Math.ceil((rateLimit.resetAt - now) / 1000),
            },
            { status: 429 }
          );
        }
        rateLimit.count++;
      } else {
        // Reset window - delete expired entry first
        rateLimitMap.delete(rateLimitKey);
        rateLimitMap.set(rateLimitKey, { count: 1, resetAt: now + RATE_WINDOW });
      }
    } else {
      rateLimitMap.set(rateLimitKey, { count: 1, resetAt: now + RATE_WINDOW });
    }

    // Parse request body
    const body = await request.json();
    const { content, type } = body as {
      content?: string;
      type?: ModerationContentType;
    };

    // Validate required fields
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid content field' },
        { status: 400 }
      );
    }

    if (!type || !Object.values(ModerationContentType).includes(type)) {
      return NextResponse.json(
        { error: 'Missing or invalid type field' },
        { status: 400 }
      );
    }

    // Check if user is muted
    const isMuted = await moderationService.isUserMuted(user.id);
    if (isMuted) {
      return NextResponse.json(
        {
          error: 'USER_MUTED',
          message: 'Your account is temporarily muted due to repeated policy violations',
        },
        { status: 403 }
      );
    }

    // Run moderation
    const result = await moderationService.moderate({
      content,
      contentType: type,
      userId: user.id,
    });

    // Return result
    if (!result.approved) {
      const error = new ContentBlockedError(
        result.violations,
        result.report.id,
        true // canAppeal
      );

      return NextResponse.json(
        {
          approved: false,
          ...error.toResponse(),
        },
        { status: 200 } // Return 200 so client can handle the response
      );
    }

    return NextResponse.json({
      approved: true,
      requiresReview: result.requiresReview,
      reportId: result.report.id,
    });
  } catch (error) {
    console.error('Moderation check error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
