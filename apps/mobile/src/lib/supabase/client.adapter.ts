import { createSupabaseClient } from '@app/supabase'

// Valid-format placeholders so the client never throws when env is absent
// (UI preview / dev without a backend). Real values come from apps/mobile/.env.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_ANON_KEY = 'public-anon-placeholder'

const url = process.env['EXPO_PUBLIC_SUPABASE_URL'] ?? PLACEHOLDER_URL
const anonKey =
  process.env['EXPO_PUBLIC_SUPABASE_ANON_KEY'] ?? PLACEHOLDER_ANON_KEY

if (url === PLACEHOLDER_URL || anonKey === PLACEHOLDER_ANON_KEY) {
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — ' +
      'using placeholders. Auth and data calls fail until you add apps/mobile/.env.'
  )
}

/**
 * Thin app wrapper over the single typed source (@app/supabase).
 *
 * To persist sessions on device, install
 * @react-native-async-storage/async-storage and extend the @app/supabase
 * client factory to accept an `auth.storage` option.
 */
export const supabase = createSupabaseClient({ anonKey, url })
