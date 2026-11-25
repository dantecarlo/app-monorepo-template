import type { IAuthGateway } from '@app/core'

/** Why the no-op gateway rejects a sign-in: the cause a report carries. */
const AUTH_NOT_CONFIGURED_MESSAGE =
  'Auth is not configured: the project keeps no backend'

/**
 * The gateway of a project that keeps no backend, or whose backend has no
 * settings: no session, no listener, and a sign-in that rejects with
 * `message`, in which a backend names the settings it lacks.
 */
export const createNoopAuthGateway = ({
  message = AUTH_NOT_CONFIGURED_MESSAGE
}: {
  message?: string
} = {}): IAuthGateway => ({
  getSession: () => Promise.resolve(null),
  onAuthStateChange: () => ({ unsubscribe: () => undefined }),
  signIn: () => Promise.reject(new Error(message)),
  signOut: () => Promise.resolve()
})
