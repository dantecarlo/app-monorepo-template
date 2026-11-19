import type { SupabaseClient } from '@supabase/supabase-js'

import type { BackendClientType } from '#src/backendClient.type'
import type { Database } from '#src/types'

/**
 * The one place the opaque backend client meets the SDK client: a factory
 * wraps the client it builds, and an adapter of this package unwraps the
 * client it is handed. Both are the same object; only the type changes.
 */
export const toBackendClient = ({
  client
}: {
  client: SupabaseClient<Database>
}): BackendClientType => client as unknown as BackendClientType

export const fromBackendClient = ({
  client
}: {
  client: BackendClientType
}): SupabaseClient<Database> =>
  client as unknown as SupabaseClient<Database>
