import { ThemeEnum } from '@app/tokens'
import { beforeEach, describe, expect, test } from 'vitest'

import { useThemeBootstrap } from '@/components/ThemeProvider/useThemeBootstrap.hook'
import { THEME_ATTRIBUTE } from '@/lib/theme/theme.constant'
import { useThemeStore } from '@/stores/theme.store'
import { renderHook } from '@/test/test.helper'

describe('useThemeBootstrap', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: ThemeEnum.DARK })
  })

  test('adopts the theme already painted on the document element', () => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, ThemeEnum.LIGHT)

    renderHook(() => useThemeBootstrap())

    expect(useThemeStore.getState().theme).toBe(ThemeEnum.LIGHT)
  })

  test('leaves the store untouched when the painted value is not a theme', () => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, 'sepia')

    renderHook(() => useThemeBootstrap())

    expect(useThemeStore.getState().theme).toBe(ThemeEnum.DARK)
  })
})
