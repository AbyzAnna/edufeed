import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use cookie-based storage for better cross-tab synchronization
        flowType: 'pkce',
        // Automatically detect and handle session from URL (OAuth callbacks)
        detectSessionInUrl: true,
        // Persist session to storage
        persistSession: true,
        // Auto-refresh tokens before they expire
        autoRefreshToken: true,
      },
      // Cookie options for the browser client
      cookieOptions: {
        // Use lax for cross-site navigation compatibility
        sameSite: 'lax',
        // Secure in production (Vercel always uses HTTPS)
        secure: process.env.NODE_ENV === 'production',
        // Root path for all routes
        path: '/',
        // Set maxAge to 1 year (in seconds) - ensures cookies persist across browser sessions
        maxAge: 60 * 60 * 24 * 365,
      },
    }
  )
}
