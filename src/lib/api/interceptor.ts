import { createClient } from '@/lib/supabase/client'

/**
 * Global fetch interceptor that handles 401 errors
 * by refreshing the session and retrying the request
 */

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

/**
 * Attempt to refresh the session
 * Prevents multiple simultaneous refresh attempts
 */
async function refreshSession(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise
  }

  isRefreshing = true
  refreshPromise = (async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('[FetchInterceptor] Session refresh failed:', error.message)
        return false
      }

      console.log('[FetchInterceptor] Session refreshed successfully')
      return true
    } catch (err) {
      console.error('[FetchInterceptor] Session refresh error:', err)
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/**
 * Wrap the global fetch to intercept 401 errors
 * Only intercepts requests to our own API
 */
export function setupFetchInterceptor() {
  if (typeof window === 'undefined') return

  const originalFetch = window.fetch

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    const isApiRequest = url.startsWith('/api/') || url.includes('/api/')

    // Make the initial request
    const response = await originalFetch(input, init)

    // If it's not our API or not a 401, return as-is
    if (!isApiRequest || response.status !== 401) {
      return response
    }

    console.log('[FetchInterceptor] 401 detected, attempting session refresh')

    // Try to refresh the session
    const refreshed = await refreshSession()

    if (!refreshed) {
      console.log('[FetchInterceptor] Session refresh failed, returning original 401')
      return response
    }

    // Retry the request
    console.log('[FetchInterceptor] Retrying request after session refresh')
    return originalFetch(input, init)
  }
}

/**
 * Check if the interceptor should be set up
 */
export function isInterceptorSetup(): boolean {
  if (typeof window === 'undefined') return false
  return (window as unknown as { __fetchInterceptorSetup?: boolean }).__fetchInterceptorSetup === true
}

/**
 * Mark the interceptor as set up
 */
export function markInterceptorSetup() {
  if (typeof window === 'undefined') return
  ;(window as unknown as { __fetchInterceptorSetup: boolean }).__fetchInterceptorSetup = true
}
