'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { useCallback, useState } from 'react'

import { useSignIn } from '@/screens/Login/hooks/useSignIn.hook'
import {
  EMPTY_VALUES,
  LOGIN_EMAIL_PATTERN,
  LOGIN_ERROR_KEY,
  LOGIN_MIN_PASSWORD_LENGTH
} from '@/screens/Login/Login.constant'
import type {
  ILoginFormErrors,
  ILoginFormValues,
  IUseLoginFormResult
} from '@/screens/Login/models/Login.type'

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
 * Returns translation KEYS for errors; the view localises them. A valid
 * submit signs in through useSignIn; a failed sign-in is its toast, never a
 * field error (code-standards §19).
 */
export const useLoginForm = (): IUseLoginFormResult => {
  const [values, setValues] = useState<ILoginFormValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<ILoginFormErrors>({})
  const { isPending: isSubmitting, mutate: signIn } = useSignIn()

  const onEmailChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const email = event.target.value
      setValues((prev) => ({ ...prev, email }))
    },
    []
  )

  const onPasswordChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const password = event.target.value
      setValues((prev) => ({ ...prev, password }))
    },
    []
  )

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const nextErrors = validate(values)
      setErrors(nextErrors)
      if (Object.keys(nextErrors).length > 0) return
      signIn(values)
    },
    [signIn, values]
  )

  return {
    errors,
    isSubmitting,
    onEmailChange,
    onPasswordChange,
    onSubmit,
    values
  }
}
