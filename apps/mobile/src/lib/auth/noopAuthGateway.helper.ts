import type { IAuthGateway } from '@app/core'

/** Why the no-op gateway rejects a sign-in: the cause a report carries. */
const AUTH_NOT_CONFIGURED_MESSAGE =
  'Auth is not configured: the project keeps no backend'

/**
 * The gateway of a project that keeps no backend: no session, no
 * listener, and a sign-in that rejects.
 */
export const createNoopAuthGateway = (): IAuthGateway => ({
  getSession: () => Promise.resolve(null),
  onAuthStateChange: () => ({ unsubscribe: () => undefined }),
  signIn: () => Promise.reject(new Error(AUTH_NOT_CONFIGURED_MESSAGE)),
  signOut: () => Promise.resolve()
})
