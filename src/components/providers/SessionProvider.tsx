"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { setupFetchInterceptor, isInterceptorSetup, markInterceptorSetup } from "@/lib/api/interceptor";
import type { User, Session } from "@supabase/supabase-js";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
  refreshSession: async () => false,
});

export const useAuth = () => useContext(AuthContext);

// How long before expiry to refresh (5 minutes)
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
// Check session every minute
const SESSION_CHECK_INTERVAL_MS = 60 * 1000;

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const supabaseRef = useRef(createClient());

  const supabase = supabaseRef.current;

  // Manual session refresh function
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[SessionProvider] Manually refreshing session...');
      const { data: { session: newSession }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[SessionProvider] Session refresh failed:', error.message);
        return false;
      }

      if (newSession) {
        console.log('[SessionProvider] Session refreshed successfully');
        setSession(newSession);
        setUser(newSession.user);
        return true;
      }

      return false;
    } catch (err) {
      console.error('[SessionProvider] Session refresh error:', err);
      return false;
    }
  }, [supabase.auth]);

  // Proactive session refresh before expiry
  const scheduleSessionRefresh = useCallback((currentSession: Session | null) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!currentSession?.expires_at) return;

    const expiresAt = currentSession.expires_at * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = expiresAt - now;

    // If already expired or expiring very soon, refresh immediately
    if (timeUntilExpiry < REFRESH_THRESHOLD_MS) {
      console.log('[SessionProvider] Session expiring soon, refreshing immediately');
      refreshSession();
      return;
    }

    // Schedule refresh for 5 minutes before expiry
    const refreshIn = timeUntilExpiry - REFRESH_THRESHOLD_MS;
    console.log(`[SessionProvider] Scheduling session refresh in ${Math.round(refreshIn / 1000 / 60)} minutes`);

    refreshTimerRef.current = setTimeout(() => {
      console.log('[SessionProvider] Scheduled refresh triggered');
      refreshSession();
    }, refreshIn);
  }, [refreshSession]);

  useEffect(() => {
    // Set up global fetch interceptor for 401 handling (once)
    if (!isInterceptorSetup()) {
      setupFetchInterceptor();
      markInterceptorSetup();
      console.log('[SessionProvider] Global fetch interceptor set up');
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);

      // Schedule proactive refresh
      if (initialSession) {
        scheduleSessionRefresh(initialSession);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[SessionProvider] Auth state changed:', event);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);

      // Reschedule refresh when session changes
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        scheduleSessionRefresh(newSession);
      }

      // Clear refresh timer on sign out
      if (event === 'SIGNED_OUT') {
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = null;
        }
      }
    });

    // Periodic session check (backup for missed refreshes)
    const checkInterval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession?.expires_at) {
        const expiresAt = currentSession.expires_at * 1000;
        const now = Date.now();

        // If expiring within threshold, refresh
        if (expiresAt - now < REFRESH_THRESHOLD_MS) {
          console.log('[SessionProvider] Periodic check: Session expiring soon, refreshing');
          refreshSession();
        }
      }
    }, SESSION_CHECK_INTERVAL_MS);

    return () => {
      subscription.unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      clearInterval(checkInterval);
    };
  }, [supabase.auth, scheduleSessionRefresh, refreshSession]);

  const signOut = async () => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
