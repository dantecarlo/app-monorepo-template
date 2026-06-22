// Typed browser/client factory (anon key — pass app env into it)
export { createSupabaseClient } from './client'

// Database types (regenerate with: pnpm --filter @app/supabase gen:types)
export type { Database } from './types'

// Server factory lives behind the './server' entry point so client bundles
// never pull in @supabase/ssr / server-only cookie handling:
//   import { createSupabaseServerClient } from '@app/supabase/server'
