import type { IAuthGateway } from '@app/core'
import { createSupabaseAuthGateway } from '@app/supabase'

import { supabase } from '@/lib/supabase/client.adapter'

/**
 * The Supabase auth gateway (`IAuthGateway` from @app/core) over the app's
 * one client, which the gateway of src/lib/auth/ lists in its supabase
 * region.
 */
export const authGateway: IAuthGateway = createSupabaseAuthGateway({
  client: supabase
})
