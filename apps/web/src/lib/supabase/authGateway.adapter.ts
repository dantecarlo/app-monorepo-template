import {
  AppError,
  type IAuthGateway,
  SERVICE_ERROR_MESSAGE_KEY_BY_CODE,
  ServiceErrorCodeEnum
} from '@app/core'
import { createSupabaseAuthGateway } from '@app/supabase'

import {
  AUTH_NOT_CONFIGURED_MESSAGE,
  SIGN_IN_FAILURE_BY_SUPABASE_CODE,
  SIGN_IN_FAILURE_MESSAGE_KEY,
  SignInFailureEnum,
  SUPABASE_UNREACHABLE_ERROR_NAME
} from '@/lib/supabase/authGateway.constant'
import { getSupabaseClient } from '@/lib/supabase/client.adapter'

/**
 * The browser's auth gateway (`IAuthGateway` from @app/core), shared by the
 * auth provider and the auth service so both see one session.
 *
 * During server rendering, or without NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY, it is a no-op gateway: no session, and a
 * sign-in rejects with the not-configured failure. Otherwise one Supabase
 * auth gateway per browser, whose sign-in names the failures it knows.
 */
const toSignInFailure = ({
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

// The Supabase Auth error code of a rejection, which supabase-js puts on the
// error's `code`; an empty string when it has none.
const readSupabaseCode = ({ error }: { error: unknown }): string =>
  error instanceof Error &&
  'code' in error &&
  typeof error.code === 'string'
    ? error.code
    : ''

const isSupabaseUnreachable = ({ error }: { error: unknown }): boolean =>
  error instanceof Error && error.name === SUPABASE_UNREACHABLE_ERROR_NAME

// A Supabase rejection becomes the failure its code names, with its message
// key; one that never reached Supabase becomes the network error. Anything
// else passes through, and the auth service makes it the generic error.
const nameSignInFailure = ({ error }: { error: unknown }): unknown => {
  if (isSupabaseUnreachable({ error })) {
    return new AppError({
      cause: error,
      code: ServiceErrorCodeEnum.NETWORK_ERROR,
      messageKey:
        SERVICE_ERROR_MESSAGE_KEY_BY_CODE[
          ServiceErrorCodeEnum.NETWORK_ERROR
        ]
    })
  }
  const failure: SignInFailureEnum | undefined =
    SIGN_IN_FAILURE_BY_SUPABASE_CODE[readSupabaseCode({ error })]
  return failure === undefined
    ? error
    : toSignInFailure({ cause: error, failure })
}

const withNamedSignInFailures = ({
  gateway
}: {
  gateway: IAuthGateway
}): IAuthGateway => ({
  ...gateway,
  signIn: async (credentials) => {
    try {
      return await gateway.signIn(credentials)
    } catch (error) {
      throw nameSignInFailure({ error })
    }
  }
})

const NOOP_GATEWAY: IAuthGateway = {
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
}

let browserGateway: IAuthGateway | undefined

// Read one by one: Next.js inlines each NEXT_PUBLIC_ variable it sees named.
const hasSupabaseSettings = (): boolean =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

export const getAuthGateway = (): IAuthGateway => {
  if (typeof window === 'undefined' || !hasSupabaseSettings()) {
    return NOOP_GATEWAY
  }
  browserGateway ??= withNamedSignInFailures({
    gateway: createSupabaseAuthGateway({ client: getSupabaseClient() })
  })
  return browserGateway
}
