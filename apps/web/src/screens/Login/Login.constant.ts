/** Minimum acceptable password length for client-side validation. */
export const LOGIN_MIN_PASSWORD_LENGTH = 8

/** Pragmatic email shape check — server remains the source of truth. */
export const LOGIN_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Stable DOM ids wiring labels to their inputs. */
export const LOGIN_FIELD_ID = {
  EMAIL: 'login-email',
  PASSWORD: 'login-password'
} as const

/** Translation keys returned by the validator for each field error. */
export const LOGIN_ERROR_KEY = {
  EMAIL: 'errors.email',
  PASSWORD: 'errors.password'
} as const
