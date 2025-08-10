import { createClient } from '@supabase/supabase-js';

// Supabase credentials - using env variables is preferred for security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tujvrmtvzweetklemhzd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1anZybXR2endlZXRrbGVtaHpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NjE4NDgsImV4cCI6MjA2OTQzNzg0OH0.-7P_XAGCGJn7GXAGlfqDKj3P6zOP4lttk5cThjKRoXs';

// This is a server-side client for server components
export const createServerClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    }
  });
};

// This is a singleton browser client for consistent auth state management
// Use a globalThis cache to survive HMR in dev and avoid duplicate instances
const BROWSER_CLIENT_CACHE_KEY = '__beatypro_supabase_browser_client__';
let browserClientInstance: ReturnType<typeof createClient> | null = null;
let browserClientInstanceId: string | null = null;

export const getBrowserClient = () => {
  if (typeof window === 'undefined') {
    // We're on the server, return null or a server client
    return null;
  }

  // Reuse client across HMR reloads
  const w = globalThis as any;
  const LOCK = '__LOCK__';
  const cached = w[BROWSER_CLIENT_CACHE_KEY];
  if (cached && cached !== LOCK) {
    browserClientInstance = cached as ReturnType<typeof createClient>;
  }

  if (!browserClientInstance) {
    // Place a lock to prevent parallel creators from racing before cache is set
    if (!w[BROWSER_CLIENT_CACHE_KEY]) {
      w[BROWSER_CLIENT_CACHE_KEY] = LOCK;
    }
    // If another creator already finished while we were here, reuse it
    if (w[BROWSER_CLIENT_CACHE_KEY] && w[BROWSER_CLIENT_CACHE_KEY] !== LOCK) {
      browserClientInstance = w[BROWSER_CLIENT_CACHE_KEY] as ReturnType<typeof createClient>;
      return browserClientInstance;
    }
    browserClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Persist only for the lifetime of the tab/window
        // Using sessionStorage ensures automatic logout when the browser is closed
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        // Keep a unique key even in sessionStorage to avoid collisions
        storageKey: 'beatypro-auth-v2-2b9a10e8'
      }
    });
    w[BROWSER_CLIENT_CACHE_KEY] = browserClientInstance;
    browserClientInstanceId = Math.random().toString(36).slice(2, 10);
    // Stamp globals for debug/verification in prod
    try {
      const w = globalThis as any;
      w.__BEATYPRO_SUPABASE = w.__BEATYPRO_SUPABASE || {};
      w.__BEATYPRO_SUPABASE.build = process.env.NEXT_PUBLIC_BUILD_ID;
      w.__BEATYPRO_SUPABASE.instanceIds = w.__BEATYPRO_SUPABASE.instanceIds || [];
      w.__BEATYPRO_SUPABASE.createdCount = (w.__BEATYPRO_SUPABASE.createdCount || 0) + 1;
      w.__BEATYPRO_SUPABASE.instanceIds.push(browserClientInstanceId);
      // Patch console.warn once to trace duplicate-client warnings
      if (!w.__BEATYPRO_SUPABASE.warnPatched) {
        w.__BEATYPRO_SUPABASE.warnPatched = true;
        const origWarn = console.warn.bind(console);
        console.warn = (...args: any[]) => {
          try {
            const msg = args && args[0];
            if (typeof msg === 'string' && msg.includes('Multiple GoTrueClient instances detected')) {
              origWarn(...args);
              const info = w.__BEATYPRO_SUPABASE || {};
              console.info('[Supabase][TRACE] duplicate warning context', {
                build: info.build,
                createdCount: info.createdCount,
                instanceIds: info.instanceIds,
              });
              console.info('[Supabase][TRACE] stack:', new Error('GoTrue duplicate trace').stack);
              return;
            }
          } catch {}
          origWarn(...args);
        };
      }
    } catch (_) {}
    // Always log in production too
    console.warn('[Supabase][CREATE] browser client', {
      build: process.env.NEXT_PUBLIC_BUILD_ID,
      instanceId: browserClientInstanceId,
      createdCount: (globalThis as any)?.__BEATYPRO_SUPABASE?.createdCount
    });
  } else {
    // Always log reuse in all environments to diagnose duplication in prod
    console.info('[Supabase][REUSE] browser client', {
      build: process.env.NEXT_PUBLIC_BUILD_ID,
      instanceId: browserClientInstanceId,
      createdCount: (globalThis as any)?.__BEATYPRO_SUPABASE?.createdCount
    });
  }

  return browserClientInstance;
};

// Auth utilities using the singleton pattern
export const signOut = async () => {
  try {
    const client = getBrowserClient();
    if (!client) {
      throw new Error('Cannot sign out: No browser client available');
    }

    console.log('Starting sign-out process...');
    
    // Schedule a hard redirect regardless of network timing
    const doRedirect = () => {
      try {
        if (typeof window !== 'undefined') {
          window.location.replace('/auth/signin?loggedOut=1');
        }
      } catch (e) {
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/signin?loggedOut=1';
        }
      }
    };
    
    // Primary redirect after short delay
    const redirectTimer = setTimeout(doRedirect, 300);
    // Secondary failsafe redirect
    const failsafeTimer = setTimeout(doRedirect, 1500);

    // Clear client-side storage immediately
    if (typeof window !== 'undefined') {
      // Clear localStorage tokens
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-refresh-token');
      localStorage.removeItem('sb-access-token');
      
      // Clear any other potential token storage
      const authKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('supabase') || 
        key.startsWith('sb-') ||
        key.includes('auth')
      );
      
      authKeys.forEach(key => localStorage.removeItem(key));
      
      // Clear cookies that might be keeping session alive
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      console.log('Cleared all client-side auth data');
    }
    
    // Fire-and-forget global sign out; don't block redirect scheduling
    client.auth.signOut({ scope: 'global' })
      .then(({ error }: { error: unknown }) => {
        if (error) {
          console.error('Error signing out from Supabase:', error);
        } else {
          console.log('Successfully signed out from Supabase');
        }
      })
      .catch((e: unknown) => console.error('Sign-out promise rejected:', e))
      .finally(() => {
        // Reset the browser client instance to force a new one on next usage
        browserClientInstance = null;
        // Clear timers if redirect already happened
        clearTimeout(redirectTimer);
        clearTimeout(failsafeTimer);
        // Ensure redirect one more time at the end
        doRedirect();
      });
    
    // Return immediately; redirect will occur shortly
    return { error: null } as any;
  } catch (e) {
    console.error('Exception during sign out:', e);
    // Fallback redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/signin';
    }
    return { error: e };
  }
};

export const getCurrentUser = async () => {
  const client = getBrowserClient();
  if (!client) {
    return { user: null, error: new Error('No browser client available') };
  }
  
  const { data: { session }, error } = await client.auth.getSession();
  return { user: session?.user ?? null, error };
};
