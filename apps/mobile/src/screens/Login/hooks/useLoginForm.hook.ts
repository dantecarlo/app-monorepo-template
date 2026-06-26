import { useCallback, useState } from 'react'

import {
  LOGIN_EMAIL_PATTERN,
  LOGIN_ERROR_KEY,
  LOGIN_MIN_PASSWORD_LENGTH
} from '@/screens/Login/Login.constant'
import type {
  ILoginFormErrors,
  ILoginFormValues,
  IUseLoginFormResult
} from '@/screens/Login/models/Login.type'

const EMPTY_VALUES: ILoginFormValues = { email: '', password: '' }

const validate = ({
  email,
  password
}: ILoginFormValues): ILoginFormErrors => {
  const errors: ILoginFormErrors = {}

  if (!LOGIN_EMAIL_PATTERN.test(email)) {
    errors.email = LOGIN_ERROR_KEY.EMAIL
  }
  if (password.length < LOGIN_MIN_PASSWORD_LENGTH) {
    errors.password = LOGIN_ERROR_KEY.PASSWORD
  }

  return errors
}

/**
 * Owns all LoginScreen form behaviour — field state, validation, and submit
 * handling — so the view stays render-only (code-standards: logic-in-hook).
 * Returns translation KEYS for errors; the view localises them.
 */
export const useLoginForm = (): IUseLoginFormResult => {
  const [values, setValues] = useState<ILoginFormValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<ILoginFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onEmailChange = useCallback((email: string) => {
    setValues((prev) => ({ ...prev, email }))
  }, [])

  const onPasswordChange = useCallback((password: string) => {
    setValues((prev) => ({ ...prev, password }))
  }, [])

  const onSubmit = useCallback(() => {
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setIsSubmitting(true)
  }, [values])

  return {
    errors,
    isSubmitting,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    values
  }
}
