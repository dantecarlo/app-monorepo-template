import type { IAuthGateway } from '@app/core'
import { createSupabaseAuthGateway } from '@app/supabase'

import { createNoopAuthGateway } from '@/lib/auth/noopAuthGateway.helper'
import {
  hasSupabaseSettings,
  supabase
} from '@/lib/supabase/client.adapter'

/** Why the gateway rejects a sign-in without the Supabase settings. */
const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Auth is not configured: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'

/**
 * The Supabase auth gateway (`IAuthGateway` from @app/core) over the app's
 * one client, which the gateway of src/lib/auth/ lists in its supabase
 * region; without the Supabase settings, the no-op gateway, whose sign-in
 * names them.
 */
export const authGateway: IAuthGateway = hasSupabaseSettings()
  ? createSupabaseAuthGateway({ client: supabase })
  : createNoopAuthGateway({ message: SUPABASE_NOT_CONFIGURED_MESSAGE })
