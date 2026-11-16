/** Why the no-op gateway rejects a sign-in: the cause a report carries. */
export const AUTH_NOT_CONFIGURED_MESSAGE =
  'Auth is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'

/** The sign-in failures the browser's auth gateway names, as AppError codes. */
export enum SignInFailureEnum {
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  NOT_CONFIGURED = 'NOT_CONFIGURED',
  RATE_LIMITED = 'RATE_LIMITED'
}

/** The catalog message of each failure, which the mutation toast shows. */
export const SIGN_IN_FAILURE_MESSAGE_KEY: Record<
  SignInFailureEnum,
  string
> = {
  [SignInFailureEnum.EMAIL_NOT_CONFIRMED]: 'auth.error.emailNotConfirmed',
  [SignInFailureEnum.INVALID_CREDENTIALS]: 'auth.error.invalidCredentials',
  [SignInFailureEnum.NOT_CONFIGURED]: 'auth.error.notConfigured',
  [SignInFailureEnum.RATE_LIMITED]: 'auth.error.rateLimited'
}

/**
 * The `name` of the error a Supabase sign-in rejects with when the auth
 * server cannot be reached (supabase-js `AuthRetryableFetchError`).
 */
export const SUPABASE_UNREACHABLE_ERROR_NAME = 'AuthRetryableFetchError'

/**
 * The Supabase Auth error codes, the `code` of the error a sign-in rejects
 * with, by the failure each names.
 */
export const SIGN_IN_FAILURE_BY_SUPABASE_CODE: Readonly<
  Partial<Record<string, SignInFailureEnum>>
> = {
  email_not_confirmed: SignInFailureEnum.EMAIL_NOT_CONFIRMED,
  invalid_credentials: SignInFailureEnum.INVALID_CREDENTIALS,
  over_request_rate_limit: SignInFailureEnum.RATE_LIMITED
}
