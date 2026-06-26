import type { ChangeEvent, FormEvent } from 'react'
import { describe, expect, test, vi } from 'vitest'

import { useLoginForm } from '@/screens/Login/hooks/useLoginForm.hook'
import {
  LOGIN_ERROR_KEY,
  LOGIN_MIN_PASSWORD_LENGTH
} from '@/screens/Login/Login.constant'
import { act, renderHook } from '@/test/test.helper'

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>

const fillValid = (result: {
  current: ReturnType<typeof useLoginForm>
}) => {
  act(() => {
    result.current.onEmailChange(changeEvent('user@example.com'))
  })
  act(() => {
    result.current.onPasswordChange(
      changeEvent('a'.repeat(LOGIN_MIN_PASSWORD_LENGTH))
    )
  })
}

describe('useLoginForm', () => {
  test('starts empty with no errors and not submitting', () => {
    const { result } = renderHook(() => useLoginForm())

    expect(result.current.values).toEqual({ email: '', password: '' })
    expect(result.current.errors).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
  })

  test('tracks email and password input', () => {
    const { result } = renderHook(() => useLoginForm())

    act(() => {
      result.current.onEmailChange(changeEvent('user@example.com'))
    })
    act(() => {
      result.current.onPasswordChange(changeEvent('secret-pass'))
    })

    expect(result.current.values.email).toBe('user@example.com')
    expect(result.current.values.password).toBe('secret-pass')
  })

  test('reports field error keys for an invalid submit', () => {
    const { result } = renderHook(() => useLoginForm())
    const event = submitEvent()

    act(() => {
      result.current.onSubmit(event)
    })

    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(result.current.errors.email).toBe(LOGIN_ERROR_KEY.EMAIL)
    expect(result.current.errors.password).toBe(LOGIN_ERROR_KEY.PASSWORD)
    expect(result.current.isSubmitting).toBe(false)
  })

  test('flips submitting on a valid submit and clears errors', () => {
    const { result } = renderHook(() => useLoginForm())
    fillValid(result)

    act(() => {
      result.current.onSubmit(submitEvent())
    })

    expect(result.current.errors).toEqual({})
    expect(result.current.isSubmitting).toBe(true)
  })
})
