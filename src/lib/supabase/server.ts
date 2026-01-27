import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Default cookie options for server-side auth
const isProduction = process.env.NODE_ENV === 'production'
const defaultCookieOptions = {
  path: '/',
  sameSite: 'lax' as const,
  secure: isProduction,
  httpOnly: true,
  // Set maxAge to 1 year (in seconds) - ensures cookies persist across browser sessions
  maxAge: 60 * 60 * 24 * 365,
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...defaultCookieOptions,
                ...options,
              })
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Admin client with service role key for server-side operations
// Used for validating tokens - does NOT need cookies
export async function createAdminClient() {
  // Use createClient from @supabase/supabase-js directly for admin operations
  // This avoids issues with cookies when validating Bearer tokens from mobile apps
  const { createClient } = await import('@supabase/supabase-js')

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
