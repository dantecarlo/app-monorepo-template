import { createClient } from '@supabase/supabase-js'

/**
 * Browser-side Supabase client.
 *
 * Required env vars (add to .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL   — your Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — your project anon/public key
 *
 * Import this only from client components and hooks ('use client').
 * For Server Components and Route Handlers, use createServerClient() instead.
 *
 * NOTE: The template uses mock data by default. Supabase is only required
 * when you swap the service layer for real API calls.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill in your Supabase credentials. ' +
      'The template uses mock data by default — Supabase is only required when ' +
      'you wire up real API calls.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
