import { describe, expect, test } from 'vitest'

import { useAuthField } from '@/components/ui/AuthField/useAuthField.hook'
import { act, renderHook } from '@/test/test.helper'

describe('useAuthField', () => {
  test('starts hidden and resolves a password type for password fields', () => {
    const { result } = renderHook(() =>
      useAuthField({ isError: false, isPassword: true })
    )

    expect(result.current.showPassword).toBe(false)
    expect(result.current.inputType).toBe('password')
  })

  test('toggling reveals the value and switches the input type to text', () => {
    const { result } = renderHook(() =>
      useAuthField({ isError: false, isPassword: true })
    )

    act(() => {
      result.current.onTogglePassword()
    })

    expect(result.current.showPassword).toBe(true)
    expect(result.current.inputType).toBe('text')
  })

  test('falls back to the provided type for non-password fields', () => {
    const { result } = renderHook(() =>
      useAuthField({ isError: false, isPassword: false, type: 'email' })
    )

    expect(result.current.inputType).toBe('email')
  })

  test('defaults to a text type when none is provided', () => {
    const { result } = renderHook(() =>
      useAuthField({ isError: false, isPassword: false })
    )

    expect(result.current.inputType).toBe('text')
  })

  test('appends the error class to the wrapper when isError is true', () => {
    const { result } = renderHook(() =>
      useAuthField({ isError: true, isPassword: false })
    )

    expect(result.current.wrapperClass).toContain('border-danger')
  })
})
