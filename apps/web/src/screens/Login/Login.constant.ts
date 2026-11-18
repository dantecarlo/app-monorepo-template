import type { TranslationKeyType } from '@app/i18n'

import type { ILoginFormValues } from '@/screens/Login/models/Login.type'

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
  EMAIL: 'auth.login.errors.email',
  PASSWORD: 'auth.login.errors.password'
} as const satisfies Record<string, TranslationKeyType>

/** The route a sign-in replaces the login route with: the home page. */
export const SIGN_IN_REDIRECT_PATH = '/'

/**
 * How long a settled sign-in stays in the mutation cache, which holds its
 * email and password: not at all, rather than TanStack's default 5 minutes.
 */
export const SIGN_IN_GC_TIME_MS = 0

/** Initial, empty login form values. */
export const EMPTY_VALUES: ILoginFormValues = { email: '', password: '' }
