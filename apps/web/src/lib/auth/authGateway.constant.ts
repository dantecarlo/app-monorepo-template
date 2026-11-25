/** Why the no-op gateway rejects a sign-in: the cause a report carries. */
export const AUTH_NOT_CONFIGURED_MESSAGE =
  'Auth is not configured: the project keeps no backend, or its settings are unset'

/** The sign-in failures the app's auth gateways name, as AppError codes. */
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
