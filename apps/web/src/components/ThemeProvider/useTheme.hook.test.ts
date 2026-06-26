import { ThemeEnum } from '@app/tokens'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { useTheme } from '@/components/ThemeProvider/useTheme.hook'
import {
  THEME_ATTRIBUTE,
  THEME_COOKIE_NAME
} from '@/lib/theme/theme.constant'
import { useThemeStore } from '@/stores/theme.store'
import { act, renderHook } from '@/test/test.helper'

describe('useTheme', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: ThemeEnum.DARK })
    document.documentElement.setAttribute(THEME_ATTRIBUTE, ThemeEnum.DARK)
  })

  afterEach(() => {
    document.cookie = `${THEME_COOKIE_NAME}=;path=/;max-age=0`
  })

  test('exposes the current theme from the store', () => {
    const { result } = renderHook(() => useTheme())

    expect(result.current.theme).toBe(ThemeEnum.DARK)
  })

  test('setTheme flips the data-theme attribute on the document element', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme(ThemeEnum.LIGHT)
    })

    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe(
      ThemeEnum.LIGHT
    )
    expect(result.current.theme).toBe(ThemeEnum.LIGHT)
  })

  test('setTheme persists the choice to the NEXT_THEME cookie', () => {
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.setTheme(ThemeEnum.LIGHT)
    })

    expect(document.cookie).toContain(
      `${THEME_COOKIE_NAME}=${ThemeEnum.LIGHT}`
    )
  })
})
