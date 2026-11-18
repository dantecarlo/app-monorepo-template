import type { IAuthGateway } from '@app/core'
import { createSupabaseAuthGateway } from '@app/supabase'

import { supabase } from '@/lib/supabase/client.adapter'

/**
 * The app's one auth gateway (`IAuthGateway` from @app/core): a Supabase
 * auth gateway over the app's one client, which the root layout hands the
 * auth provider.
 */
export const authGateway: IAuthGateway = createSupabaseAuthGateway({
  client: supabase
})
