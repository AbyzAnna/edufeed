import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Cookie options for production - ensures cookies persist across refreshes
function getCookieOptions(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === 'production'
  const isSecure = request.url.startsWith('https://') || isProduction

  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: isSecure,
    // Don't set domain - let browser handle it based on the request
    httpOnly: true,
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // E2E test mode bypass - ONLY enabled if E2E_TEST_SECRET is configured and matches
  // This prevents unauthorized access via simply setting a cookie
  const e2eTestSecret = process.env.E2E_TEST_SECRET;
  const e2eCookieValue = request.cookies.get('e2e-test-mode')?.value;
  const isValidE2ETest = e2eTestSecret &&
                          e2eCookieValue === e2eTestSecret &&
                          process.env.NODE_ENV !== 'production';

  if (isValidE2ETest) {
    // In test mode with valid secret, skip auth checks
    return supabaseResponse
  }

  const cookieOptions = getCookieOptions(request)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...cookieOptions,
              ...options,
            })
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ['/feed', '/study', '/study-room', '/study-rooms', '/profile', '/upload', '/generate', '/library', '/discover', '/notebook', '/notebooks', '/messages']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path =>
    request.nextUrl.pathname === path
  )

  if (isAuthPath && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
