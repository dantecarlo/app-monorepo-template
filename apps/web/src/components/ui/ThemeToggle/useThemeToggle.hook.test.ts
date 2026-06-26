import { ThemeEnum } from '@app/tokens'
import { act, renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'

const setTheme = vi.fn()
let currentTheme: string = ThemeEnum.DARK

vi.mock('@/components/ThemeProvider/useTheme.hook', () => ({
  useTheme: () => ({ setTheme, theme: currentTheme })
}))

import { useThemeToggle } from './useThemeToggle.hook'

describe('useThemeToggle', () => {
  test('isLight is false when the active theme is dark', () => {
    currentTheme = ThemeEnum.DARK
    const { result } = renderHook(() => useThemeToggle())
    expect(result.current.isLight).toBe(false)
  })

  test('isLight is true when the active theme is light', () => {
    currentTheme = ThemeEnum.LIGHT
    const { result } = renderHook(() => useThemeToggle())
    expect(result.current.isLight).toBe(true)
  })

  test('onValueChange(true) sets the light theme', () => {
    currentTheme = ThemeEnum.DARK
    const { result } = renderHook(() => useThemeToggle())
    act(() => result.current.onValueChange(true))
    expect(setTheme).toHaveBeenCalledWith(ThemeEnum.LIGHT)
  })

  test('onValueChange(false) sets the dark theme', () => {
    currentTheme = ThemeEnum.LIGHT
    const { result } = renderHook(() => useThemeToggle())
    act(() => result.current.onValueChange(false))
    expect(setTheme).toHaveBeenCalledWith(ThemeEnum.DARK)
  })
})
