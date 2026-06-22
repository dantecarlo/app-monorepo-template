import {
  type CookieMethodsServer,
  createServerClient as createSsrServerClient
} from '@supabase/ssr'

import type { Database } from './types'

interface ICreateSupabaseServerClientArgs {
  anonKey: string
  cookies: CookieMethodsServer
  url: string
}

/**
 * Typed server Supabase factory (auth-aware SSR).
 *
 * Uses @supabase/ssr so the user's session cookie is propagated to RLS in
 * Server Components and Route Handlers. The caller owns the cookie store and
 * passes it in via the single `cookies` adapter — this keeps the factory
 * framework-agnostic (Next.js supplies `next/headers` cookies, but any SSR
 * runtime can plug in its own getAll/setAll implementation).
 *
 * Example (Next.js App Router):
 *
 *   import { cookies } from 'next/headers'
 *   import { createSupabaseServerClient } from '@app/supabase/server'
 *
 *   const cookieStore = await cookies()
 *   const supabase = createSupabaseServerClient({
 *     anonKey,
 *     cookies: {
 *       getAll: () => cookieStore.getAll(),
 *       setAll: (toSet) =>
 *         toSet.forEach(({ name, options, value }) =>
 *           cookieStore.set(name, value, options)
 *         )
 *     },
 *     url
 *   })
 */
export const createSupabaseServerClient = ({
  anonKey,
  cookies,
  url
}: ICreateSupabaseServerClientArgs) =>
  createSsrServerClient<Database>(url, anonKey, { cookies })
