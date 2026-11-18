import type { TranslationKeyType } from '@app/i18n'

import type { ILoginFormValues } from '@/screens/Login/models/Login.type'

/** Minimum acceptable password length for client-side validation. */
export const LOGIN_MIN_PASSWORD_LENGTH = 8

/** Pragmatic email shape check — server remains the source of truth. */
export const LOGIN_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Translation keys returned by the validator for each field error. */
export const LOGIN_ERROR_KEY = {
  EMAIL: 'auth.login.errors.email',
  PASSWORD: 'auth.login.errors.password'
} as const satisfies Record<string, TranslationKeyType>

/** Initial, empty login form values. */
export const EMPTY_VALUES: ILoginFormValues = { email: '', password: '' }
