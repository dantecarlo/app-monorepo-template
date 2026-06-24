import type { CookieMethodsServer } from '@supabase/ssr'
import { createServerClient as createSSRServerClient } from '@supabase/ssr'

import type { Database } from './types'

/**
 * Cookie-aware SSR Supabase factory.
 *
 * Uses @supabase/ssr so the authenticated user's session cookie is
 * propagated to Row-Level Security in Server Components and Route
 * Handlers. The caller owns the cookie store and injects it via the
 * single `cookies` adapter — this keeps the factory framework-agnostic.
 *
 * Usage (Next.js App Router):
 *
 *   import { cookies } from 'next/headers'
 *   import { createSupabaseSSRClient } from '@app/supabase/ssr'
 *
 *   const cookieStore = await cookies()
 *   const supabase = createSupabaseSSRClient({
 *     anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *     cookies: {
 *       getAll: () => cookieStore.getAll(),
 *       setAll: (toSet) =>
 *         toSet.forEach(({ name, options, value }) =>
 *           cookieStore.set(name, value, options)
 *         )
 *     },
 *     url: process.env.NEXT_PUBLIC_SUPABASE_URL!
 *   })
 */

export interface ICreateSupabaseSSRClientParams {
  anonKey: string
  cookies: CookieMethodsServer
  url: string
}

export const createSupabaseSSRClient = ({
  anonKey,
  cookies,
  url
}: ICreateSupabaseSSRClientParams) =>
  createSSRServerClient<Database>(url, anonKey, { cookies })
