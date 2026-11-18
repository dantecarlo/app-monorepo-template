import type { BackendClientType } from '@app/supabase'
import { createSupabaseServerClient } from '@app/supabase/server'
import { cookies } from 'next/headers'

/**
 * Server-side Supabase client — thin wrapper over the single typed source
 * (@app/supabase/server).
 *
 * Call this from Server Components and Route Handlers. It wires the
 * Next.js cookie store into the auth-aware @supabase/ssr factory so the
 * user's session is propagated to RLS. Returns a new instance per call, as
 * the opaque BackendClientType.
 */
export const createServerClient = async (): Promise<BackendClientType> => {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return createSupabaseServerClient({
    anonKey,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) =>
        cookiesToSet.forEach(({ name, options, value }) =>
          cookieStore.set(name, value, options)
        )
    },
    url
  })
}
