import type {
  IBackendClientProvider,
  ICreateBackendClientParams
} from '@app/core'
import { createClient } from '@supabase/supabase-js'

import { toBackendClient } from '#src/backendClient.adapter'
import type { BackendClientType } from '#src/backendClient.type'
import type { Database } from '#src/types'

/**
 * Browser/client Supabase factory (anon key), typed by the Database schema
 * inside this package and handed out as the opaque BackendClientType.
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
}: ICreateBackendClientParams): BackendClientType =>
  toBackendClient({ client: createClient<Database>(url, anonKey) })

const _providerCheck: IBackendClientProvider<BackendClientType> = {
  createClient: createSupabaseClient
}

void _providerCheck
