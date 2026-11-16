import { themes, themeVars } from '@app/tokens'
import { colorScheme } from 'nativewind'
import { afterEach, describe, expect, test } from 'vitest'

import { useRootTheme } from '@/lib/theme/useRootTheme.hook'
import { flattenStyle } from '@/test/mocks/react-native'
import { renderHook } from '@/test/test.helper'

describe('useRootTheme', () => {
  afterEach(() => {
    colorScheme.set('dark')
  })

  test('derives the light base, dark glyphs and the light variables under the light theme', () => {
    colorScheme.set('light')
    const { result } = renderHook(() => useRootTheme())

    expect(result.current.statusBarStyle).toBe('dark')
    expect(result.current.contentBackgroundColor).toBe(
      themes.light.bg.base
    )
    expect(result.current.contentStyle).toEqual({
      backgroundColor: themes.light.bg.base
    })
    expect(flattenStyle(result.current.themeStyle)).toEqual({
      ...themeVars.light,
      flex: 1
    })
  })

  test('derives the dark base, light glyphs and the dark variables under the dark theme', () => {
    const { result } = renderHook(() => useRootTheme())

    expect(result.current.statusBarStyle).toBe('light')
    expect(result.current.contentBackgroundColor).toBe(themes.dark.bg.base)
    expect(flattenStyle(result.current.themeStyle)).toEqual({
      ...themeVars.dark,
      flex: 1
    })
  })
})
