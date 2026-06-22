import { createClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client factory.
 *
 * Call createServerClient() from Server Components and Route Handlers.
 * Returns a new instance per call — no shared singleton on the server.
 *
 * NOTE: for auth-aware SSR with cookie-based sessions, swap to
 * @supabase/ssr and createServerClient() with a cookie store.
 */
export const createServerClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
