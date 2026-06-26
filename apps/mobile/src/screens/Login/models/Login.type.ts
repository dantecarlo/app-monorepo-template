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
  onEmailChange: (email: string) => void
  onPasswordChange: (password: string) => void
  onSubmit: () => void
  values: ILoginFormValues
}
