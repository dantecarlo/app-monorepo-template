import {
  type BackendClientType,
  createSupabaseClient
} from '@app/supabase'

/**
 * Browser-side Supabase client — thin wrapper over the single typed source
 * (@app/supabase). The client is the opaque BackendClientType, which only the
 * package's adapters unwrap, so the app names no Supabase type.
 *
 * Required env vars (add to .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL       — your Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  — your project anon/public key
 *
 * Import this only from client components and hooks ('use client').
 * For Server Components and Route Handlers, use the server factory instead.
 *
 * NOTE: The template uses mock data by default. Supabase is only required
 * when you swap the service layer for real API calls.
 */
let _supabase: BackendClientType | undefined

export const getSupabaseClient = (): BackendClientType => {
  if (_supabase) {
    return _supabase
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env.local and fill in your Supabase credentials. ' +
        'The template uses mock data by default — Supabase is only required when ' +
        'you wire up real API calls.'
    )
  }

  _supabase = createSupabaseClient({ anonKey, url })
  return _supabase
}
