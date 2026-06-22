// NOTE: Requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
// in a .env file at the project root (apps/mobile/.env — not committed).
// Expo surfaces EXPO_PUBLIC_* vars at build time via process.env.
//
// For session persistence on device, install @react-native-async-storage/async-storage
// and pass it to createClient({ auth: { storage: AsyncStorage } }).
// Currently using in-memory auth (fine for the base template).

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env['EXPO_PUBLIC_SUPABASE_URL'] as string
const supabaseAnonKey = process.env[
  'EXPO_PUBLIC_SUPABASE_ANON_KEY'
] as string

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn at runtime — do not throw, so the app boots in dev without .env
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Create apps/mobile/.env with these values before connecting to the backend.'
  )
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
)
