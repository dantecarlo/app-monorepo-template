import { SignInFailureEnum } from '@/lib/auth/authGateway.constant'

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
