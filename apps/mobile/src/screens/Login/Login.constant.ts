/** Minimum acceptable password length for client-side validation. */
export const LOGIN_MIN_PASSWORD_LENGTH = 8

/** Pragmatic email shape check — server remains the source of truth. */
export const LOGIN_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Translation keys (relative to the auth.login prefix) for field errors. */
export const LOGIN_ERROR_KEY = {
  EMAIL: 'errors.email',
  PASSWORD: 'errors.password'
} as const
