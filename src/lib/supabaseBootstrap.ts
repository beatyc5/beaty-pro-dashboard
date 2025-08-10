// Early bootstrap to ensure Supabase singleton and duplicate-warning tracing
// are initialized before any page/component code runs.

import { getBrowserClient } from './supabaseClient';

// Patch console.warn once to capture duplicate-client stacks
(() => {
  if (typeof window === 'undefined') return;
  const g = globalThis as any;
  // Mark when we are on an auth route very early
  try {
    const path = window.location?.pathname || '';
    if (path.startsWith('/auth')) {
      g.__AUTH_ROUTE__ = true;
    }
  } catch {}
  if (g.__SUPABASE_WARN_PATCHED__) return;
  g.__SUPABASE_WARN_PATCHED__ = true;

  const originalWarn = console.warn.bind(console);
  console.warn = (...args: any[]) => {
    try {
      if (typeof args[0] === 'string' && args[0].includes('Multiple GoTrueClient instances detected')) {
        const stack = new Error('[Supabase][TRACE] duplicate warning stack').stack;
        originalWarn('[Supabase][TRACE] duplicate warning context', {
          createdCount: g.__SUPABASE_CREATED__ ?? 0,
          instanceIds: g.__SUPABASE_INSTANCE_IDS__ ?? [],
          build: process.env.NEXT_PUBLIC_BUILD_ID || 'dev'
        });
        if (stack) originalWarn(stack.split('\n').slice(0, 12).join('\n'));
      }
    } catch {}
    return originalWarn(...args);
  };
})();

// Force-create or reuse the singleton immediately on app bootstrap
(() => {
  if (typeof window === 'undefined') return;
  // On auth routes, block REST calls defensively to avoid any accidental queries
  try {
    const g = globalThis as any;
    const path = window.location?.pathname || '';
    if (path.startsWith('/auth') && !g.__REST_BLOCKED_ON_AUTH__) {
      g.__REST_BLOCKED_ON_AUTH__ = true;
      const originalFetch = window.fetch.bind(window);
      window.fetch = ((...args: any[]) => {
        try {
          const req = args[0];
          const url = typeof req === 'string' ? req : (req?.url || '');
          if (typeof url === 'string' && /supabase\.co\/rest\/v1/.test(url)) {
            // eslint-disable-next-line no-console
            console.warn('[Supabase][BOOTSTRAP] Blocked REST on auth route:', url);
            return Promise.resolve(new Response(null, { status: 204, statusText: 'Blocked on auth route' }));
          }
        } catch {}
        return originalFetch(...(args as [any]));
      }) as any;
    }
  } catch {}
  try {
    const client = getBrowserClient();
    if (client) {
      // Light-touch subscription to surface auth readiness in logs
      client.auth.getSession().then(({ data }) => {
        const ready = !!data?.session?.access_token;
        // eslint-disable-next-line no-console
        console.log('[Supabase][BOOTSTRAP] session ready:', ready);
      });
    } else {
      // eslint-disable-next-line no-console
      console.warn('[Supabase][BOOTSTRAP] client not available at bootstrap');
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[Supabase][BOOTSTRAP] error initializing client', e);
  }
})();
