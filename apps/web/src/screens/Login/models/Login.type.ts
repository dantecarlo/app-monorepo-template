import type { ChangeEvent, FormEvent } from 'react'

/** Login form field values. */
export interface ILoginFormValues {
  email: string
  password: string
}

/** Per-field validation messages, keyed to translation lookups. */
export interface ILoginFormErrors {
  email?: string
  password?: string
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
