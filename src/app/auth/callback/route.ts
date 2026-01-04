import { createClient } from '@/lib/supabase/server'
import { getOrCreatePrismaUser } from '@/lib/supabase/auth'
import { NextResponse } from 'next/server'

// SECURITY FIX: Whitelist of allowed redirect paths to prevent open redirect attacks
const ALLOWED_REDIRECT_PATHS = [
  '/notebooks',
  '/feed',
  '/study',
  '/study-rooms',
  '/library',
  '/messages',
  '/profile',
  '/generate',
  '/discover',
  '/upload',
]

function isValidRedirectPath(path: string): boolean {
  // Must be a relative path starting with /
  if (!path.startsWith('/')) {
    return false
  }
  // Prevent protocol-relative URLs like //evil.com
  if (path.startsWith('//')) {
    return false
  }
  // Check if the path starts with an allowed prefix
  const normalizedPath = path.split('?')[0].split('#')[0] // Remove query and hash
  return ALLOWED_REDIRECT_PATHS.some(allowed =>
    normalizedPath === allowed || normalizedPath.startsWith(allowed + '/')
  )
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/notebooks'

  // SECURITY FIX: Validate the redirect path to prevent open redirect attacks
  const next = isValidRedirectPath(rawNext) ? rawNext : '/notebooks'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Sync the user with Prisma database after successful auth
      try {
        await getOrCreatePrismaUser(data.user)
      } catch (syncError) {
        console.error('Failed to sync user with Prisma:', syncError)
        // Continue anyway - user is authenticated in Supabase
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
