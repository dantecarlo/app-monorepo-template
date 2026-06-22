import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from './types'

interface ICreateSupabaseClientArgs {
  anonKey: string
  url: string
}

/**
 * Typed browser/client Supabase factory (anon key).
 *
 * Single source of truth for the monorepo: apps pass their own env
 * (EXPO_PUBLIC_* on mobile, NEXT_PUBLIC_* on web) into this factory rather
 * than constructing their own client. RLS policies are enforced from the
 * authenticated user's JWT.
 *
 * Auth options (storage, persistSession, flowType) are intentionally left to
 * the SDK defaults here; platform-specific concerns (e.g. AsyncStorage on
 * React Native) belong in the app wrapper that calls this factory.
 */
export const createSupabaseClient = ({
  anonKey,
  url
}: ICreateSupabaseClientArgs): SupabaseClient<Database> =>
  createClient<Database>(url, anonKey)
