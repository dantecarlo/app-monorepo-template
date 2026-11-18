import { ThemeEnum, themes } from '@app/tokens'
import { afterEach, describe, expect, test } from 'vitest'

import { applyTheme } from '@/lib/theme/colorScheme.adapter'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'
import { renderHook } from '@/test/test.helper'

describe('applyTheme', () => {
  afterEach(() => {
    applyTheme({ theme: ThemeEnum.DARK })
  })

  test('applies a theme to the live color scheme', () => {
    const { rerender, result } = renderHook(() => useThemeTokens())
    expect(result.current.theme).toBe(ThemeEnum.DARK)

    applyTheme({ theme: ThemeEnum.LIGHT })
    rerender()
    expect(result.current).toEqual({
      colors: themes.light,
      theme: ThemeEnum.LIGHT
    })

    applyTheme({ theme: ThemeEnum.DARK })
    rerender()
    expect(result.current).toEqual({
      colors: themes.dark,
      theme: ThemeEnum.DARK
    })
  })
})
