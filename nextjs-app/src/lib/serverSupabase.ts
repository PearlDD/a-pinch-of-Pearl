import { createClient } from '@supabase/supabase-js';

/** Public server reads must reflect the latest saved record. The browser client
 * does not use Next's fetch cache, so a cached server read can otherwise disagree
 * with the editor even while the page response itself has no-store headers. */
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    },
  );
}
