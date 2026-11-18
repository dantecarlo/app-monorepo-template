import type { TranslationKeyType } from '@app/i18n'

/** Login form field values. */
export interface ILoginFormValues {
  email: string
  password: string
}

/** Per-field validation messages, as the keys of their translations. */
export interface ILoginFormErrors {
  email?: TranslationKeyType
  password?: TranslationKeyType
}

/** Public surface returned by the useLoginForm hook. */
export interface IUseLoginFormResult {
  errors: ILoginFormErrors
  isSubmitting: boolean
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onSubmit: () => void
  values: ILoginFormValues
}
