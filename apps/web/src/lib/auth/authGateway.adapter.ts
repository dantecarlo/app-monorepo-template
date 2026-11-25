import type { IAuthGateway } from '@app/core'

import { createNoopAuthGateway } from '@/lib/auth/noopAuthGateway.helper'
// region supabase
import { getAuthGateway as getSupabaseAuthGateway } from '@/lib/supabase/authGateway.adapter'
// endregion supabase

// The gateway of each backend capability the project keeps, each in that
// capability's region (docs/manifest.md § Regions): its prune drops the
// entry with its import, and with no entry left the app signs no one in.
const BACKEND_GATEWAYS: readonly (() => IAuthGateway)[] = [
  // A backend capability lists its gateway below, in a region of its own.
  // region supabase
  getSupabaseAuthGateway
  // endregion supabase
]

/**
 * The browser's auth gateway (`IAuthGateway` from @app/core), shared by the
 * auth provider and the auth service: the first backend's, or the no-op one.
 */
export const getAuthGateway = (): IAuthGateway =>
  (BACKEND_GATEWAYS.at(0) ?? createNoopAuthGateway)()
