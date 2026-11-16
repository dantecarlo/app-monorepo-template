import type { IAuthGateway } from '@app/core'
import { createSupabaseAuthGateway } from '@app/supabase'

import { AUTH_NOT_CONFIGURED_MESSAGE } from '@/lib/supabase/authGateway.constant'
import { getSupabaseClient } from '@/lib/supabase/client.adapter'

/**
 * The browser's auth gateway (`IAuthGateway` from @app/core), shared by the
 * auth provider and the auth service so both see one session.
 *
 * During server rendering, or without NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY, it is a no-op gateway: no session, and a
 * sign-in rejects. Otherwise one Supabase auth gateway per browser.
 */
const NOOP_GATEWAY: IAuthGateway = {
  getSession: () => Promise.resolve(null),
  onAuthStateChange: () => ({ unsubscribe: () => undefined }),
  signIn: () => Promise.reject(new Error(AUTH_NOT_CONFIGURED_MESSAGE)),
  signOut: () => Promise.resolve()
}

let browserGateway: IAuthGateway | undefined

// Read one by one: Next.js inlines each NEXT_PUBLIC_ variable it sees named.
const hasSupabaseSettings = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

export const getAuthGateway = (): IAuthGateway => {
  if (typeof window === 'undefined' || !hasSupabaseSettings()) {
    return NOOP_GATEWAY
  }
  browserGateway ??= createSupabaseAuthGateway({
    client: getSupabaseClient()
  })
  return browserGateway
}
