import type { TranslationKeyType } from '@app/i18n'
import type { ChangeEvent, FormEvent } from 'react'

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
  onEmailChange: (event: ChangeEvent<HTMLInputElement>) => void
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  values: ILoginFormValues
}
