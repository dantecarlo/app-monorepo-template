import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ChangeEvent, FormEvent } from 'react'
import React from 'react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { mockSignIn } = vi.hoisted(() => ({ mockSignIn: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() })
}))

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({
    has: () => false,
    locale: 'en',
    t: (key: string) => key
  })
}))

vi.mock('@/lib/supabase/authGateway.adapter', () => ({
  getAuthGateway: () => ({ signIn: mockSignIn })
}))

import { useLoginForm } from '@/screens/Login/hooks/useLoginForm.hook'
import {
  LOGIN_ERROR_KEY,
  LOGIN_MIN_PASSWORD_LENGTH
} from '@/screens/Login/Login.constant'
import { act, renderHook, waitFor } from '@/test/test.helper'

const VALID_EMAIL = 'user@example.com'
const VALID_PASSWORD = 'a'.repeat(LOGIN_MIN_PASSWORD_LENGTH)

const makeWrapper = () => {
  const queryClient = new QueryClient()
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  return Wrapper
}

const renderForm = () =>
  renderHook(() => useLoginForm(), { wrapper: makeWrapper() })

const changeEvent = (value: string) =>
  ({ target: { value } }) as ChangeEvent<HTMLInputElement>

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as FormEvent<HTMLFormElement>

const fillValid = (result: {
  current: ReturnType<typeof useLoginForm>
}) => {
  act(() => {
    result.current.onEmailChange(changeEvent(VALID_EMAIL))
  })
  act(() => {
    result.current.onPasswordChange(changeEvent(VALID_PASSWORD))
  })
}

describe('useLoginForm', () => {
  beforeEach(() => {
    mockSignIn.mockReset()
    mockSignIn.mockReturnValue(new Promise(() => {}))
  })

  test('starts empty with no errors and not submitting', () => {
    const { result } = renderForm()

    expect(result.current.values).toEqual({ email: '', password: '' })
    expect(result.current.errors).toEqual({})
    expect(result.current.isSubmitting).toBe(false)
  })

  test('tracks email and password input', () => {
    const { result } = renderForm()

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
    const { result } = renderForm()
    const event = submitEvent()

    act(() => {
      result.current.onSubmit(event)
    })

    expect(event.preventDefault).toHaveBeenCalledOnce()
    expect(result.current.errors.email).toBe(LOGIN_ERROR_KEY.EMAIL)
    expect(result.current.errors.password).toBe(LOGIN_ERROR_KEY.PASSWORD)
    expect(result.current.isSubmitting).toBe(false)
  })

  test('sends the values to the sign-in on a valid submit and clears errors', async () => {
    const { result } = renderForm()
    fillValid(result)

    act(() => {
      result.current.onSubmit(submitEvent())
    })

    expect(result.current.errors).toEqual({})
    await waitFor(() => expect(result.current.isSubmitting).toBe(true))
    expect(mockSignIn).toHaveBeenCalledOnce()
    expect(mockSignIn).toHaveBeenCalledWith({
      email: VALID_EMAIL,
      password: VALID_PASSWORD
    })
  })

  test('does not sign in on an invalid submit', () => {
    const { result } = renderForm()

    act(() => {
      result.current.onSubmit(submitEvent())
    })

    expect(mockSignIn).not.toHaveBeenCalled()
  })
})
