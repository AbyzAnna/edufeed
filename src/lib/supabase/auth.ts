import { createClient, createAdminClient } from './server'
import { prisma } from '../prisma'
import type { User } from '@supabase/supabase-js'
import { headers } from 'next/headers'

/**
 * Session type compatible with NextAuth session format
 * Used for API route authentication
 */
export interface AuthSession {
  user: {
    id: string
    email: string | null
    name: string | null
    image: string | null
  }
}

/**
 * Get the current authenticated user from Supabase
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Get user from Authorization Bearer token (for mobile apps)
 * Validates the Supabase access token and returns the user
 */
export async function getUserFromToken(): Promise<User | null> {
  try {
    const headersList = await headers()
    const authHeader = headersList.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('[Auth] No Bearer token found in request')
      return null
    }

    const token = authHeader.substring(7)
    console.log('[Auth] Validating Bearer token, length:', token.length)

    // Use admin client to verify the token
    const supabase = await createAdminClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error) {
      console.error('[Auth] Token validation error:', error.message)
      return null
    }

    if (!user) {
      console.log('[Auth] Token valid but no user returned')
      return null
    }

    console.log('[Auth] Token validated for user:', user.id)
    return user
  } catch (error) {
    console.error('[Auth] getUserFromToken error:', error)
    return null
  }
}

/**
 * Get auth session for API routes
 * Tries Supabase cookie auth first, then Bearer token auth
 * Returns a session object compatible with NextAuth format
 */
export async function getAuthSession(): Promise<AuthSession | null> {
  // First try cookie-based auth (web app)
  let supabaseUser = await getUser()

  // If no cookie auth, try Bearer token (mobile app)
  if (!supabaseUser) {
    supabaseUser = await getUserFromToken()
  }

  if (!supabaseUser) {
    return null
  }

  // Sync with Prisma and get user data
  const prismaUser = await getOrCreatePrismaUser(supabaseUser)

  return {
    user: {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.name,
      image: prismaUser.image,
    }
  }
}

/**
 * Get or create a Prisma user from Supabase auth user
 * This syncs the Supabase auth user with our Prisma User model
 */
export async function getOrCreatePrismaUser(supabaseUser: User) {
  // First, try to find existing user by Supabase ID
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: supabaseUser.id },
        { email: supabaseUser.email },
      ],
    },
  })

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
        image: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
        emailVerified: supabaseUser.email_confirmed_at ? new Date(supabaseUser.email_confirmed_at) : null,
        updatedAt: new Date(),
      },
    })
  } else if (user.id !== supabaseUser.id) {
    // User exists with email but different ID - update to use Supabase ID
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        id: supabaseUser.id,
        emailVerified: supabaseUser.email_confirmed_at ? new Date(supabaseUser.email_confirmed_at) : user.emailVerified,
      },
    })
  }

  return user
}

/**
 * Get the current session user with Prisma data
 */
export async function getCurrentUser() {
  const supabaseUser = await getUser()

  if (!supabaseUser) {
    return null
  }

  const prismaUser = await getOrCreatePrismaUser(supabaseUser)
  return prismaUser
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Authentication required')
  }

  return user
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
