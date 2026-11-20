import { AppError, type IAuthGateway } from '@app/core'

import {
  AUTH_NOT_CONFIGURED_MESSAGE,
  SIGN_IN_FAILURE_MESSAGE_KEY,
  SignInFailureEnum
} from '@/lib/auth/authGateway.constant'

/** A sign-in failure the app names, as an AppError with its message key. */
export const toSignInFailure = ({
  cause,
  failure
}: {
  cause: unknown
  failure: SignInFailureEnum
}): AppError =>
  new AppError({
    cause,
    code: failure,
    messageKey: SIGN_IN_FAILURE_MESSAGE_KEY[failure]
  })

/**
 * The gateway of a project that keeps no backend, or whose backend has no
 * settings: no session, no listener, and a sign-in that rejects with the
 * not-configured failure.
 */
export const createNoopAuthGateway = (): IAuthGateway => ({
  getSession: () => Promise.resolve(null),
  onAuthStateChange: () => ({ unsubscribe: () => undefined }),
  signIn: () =>
    Promise.reject(
      toSignInFailure({
        cause: new Error(AUTH_NOT_CONFIGURED_MESSAGE),
        failure: SignInFailureEnum.NOT_CONFIGURED
      })
    ),
  signOut: () => Promise.resolve()
})
