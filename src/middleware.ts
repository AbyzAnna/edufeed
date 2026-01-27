import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createServerClient } from "@supabase/ssr";

// Cookie options for production - ensures cookies persist across refreshes
function getCookieOptions(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production'
  const isSecure = request.url.startsWith('https://') || isProduction

  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: isSecure,
    httpOnly: true,
  }
}

/**
 * Handle API route session refresh
 * This ensures API calls also get their sessions refreshed
 */
async function handleApiSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const cookieOptions = getCookieOptions(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...cookieOptions,
              ...options,
            })
          );
        },
      },
    }
  );

  // Refresh the session if needed - this will update cookies automatically
  await supabase.auth.getUser();

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle API routes separately - refresh session but don't redirect
  if (pathname.startsWith("/api/")) {
    return handleApiSession(request);
  }

  // Handle page routes with full session management
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * Now also includes API routes for session refresh
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
