import { createClient } from '@/lib/supabase/client'

interface FetchOptions extends RequestInit {
  /**
   * Whether to retry on 401 errors after refreshing the session
   * Default: true
   */
  retryOn401?: boolean
  /**
   * Maximum number of retry attempts
   * Default: 1
   */
  maxRetries?: number
}

/**
 * Resilient fetch wrapper for API calls
 * Automatically handles 401 errors by refreshing the Supabase session and retrying
 */
export async function apiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  const { retryOn401 = true, maxRetries = 1, ...fetchOptions } = options
  let retryCount = 0

  const makeRequest = async (): Promise<Response> => {
    return fetch(url, {
      ...fetchOptions,
      credentials: 'include', // Always include cookies for session
    })
  }

  let response = await makeRequest()

  // Handle 401 errors with session refresh and retry
  while (response.status === 401 && retryOn401 && retryCount < maxRetries) {
    console.log(`[apiFetch] 401 received, attempting session refresh (retry ${retryCount + 1}/${maxRetries})`)

    const supabase = createClient()
    const { error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.error('[apiFetch] Session refresh failed:', refreshError.message)
      break
    }

    console.log('[apiFetch] Session refreshed, retrying request')
    retryCount++
    response = await makeRequest()
  }

  // Parse response
  let data: T | null = null
  let error: string | null = null

  try {
    const json = await response.json()

    if (response.ok) {
      data = json as T
    } else {
      error = json.error || json.message || `Request failed with status ${response.status}`
    }
  } catch {
    if (!response.ok) {
      error = `Request failed with status ${response.status}`
    }
  }

  return { data, error, status: response.status }
}

/**
 * Ensure the user has an active session before making API calls
 * Returns the current user or null if not authenticated
 */
export async function ensureSession() {
  const supabase = createClient()

  // Try to get the current session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    console.log('[ensureSession] No active session')
    return null
  }

  // Check if session is expiring soon (within 5 minutes)
  const expiresAt = session.expires_at ? session.expires_at * 1000 : 0
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  if (expiresAt - now < fiveMinutes) {
    console.log('[ensureSession] Session expiring soon, refreshing...')
    const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

    if (refreshError) {
      console.error('[ensureSession] Refresh failed:', refreshError.message)
      return null
    }

    if (!refreshedSession) {
      console.log('[ensureSession] No session after refresh')
      return null
    }

    console.log('[ensureSession] Session refreshed successfully')
    return refreshedSession.user
  }

  return session.user
}

/**
 * GET request with automatic 401 retry
 */
export async function apiGet<T = unknown>(
  url: string,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  return apiFetch<T>(url, { ...options, method: 'GET' })
}

/**
 * POST request with automatic 401 retry
 */
export async function apiPost<T = unknown>(
  url: string,
  body: unknown,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  return apiFetch<T>(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  })
}

/**
 * PATCH request with automatic 401 retry
 */
export async function apiPatch<T = unknown>(
  url: string,
  body: unknown,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  return apiFetch<T>(url, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(body),
  })
}

/**
 * DELETE request with automatic 401 retry
 */
export async function apiDelete<T = unknown>(
  url: string,
  options: Omit<FetchOptions, 'method' | 'body'> = {}
): Promise<{ data: T | null; error: string | null; status: number }> {
  return apiFetch<T>(url, { ...options, method: 'DELETE' })
}
