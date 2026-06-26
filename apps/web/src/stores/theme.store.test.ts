import { DEFAULT_THEME, ThemeEnum } from '@app/tokens'
import { beforeEach, describe, expect, test } from 'vitest'

import {
  selectSetTheme,
  selectTheme,
  useThemeStore
} from '@/stores/theme.store'

describe('theme store', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: DEFAULT_THEME })
  })

  test('defaults to the design-system default theme', () => {
    expect(useThemeStore.getState().theme).toBe(DEFAULT_THEME)
  })

  test('setTheme replaces the current theme', () => {
    useThemeStore.getState().setTheme(ThemeEnum.LIGHT)

    expect(useThemeStore.getState().theme).toBe(ThemeEnum.LIGHT)
  })

  test('selectors read theme and setter off the state', () => {
    const state = useThemeStore.getState()

    expect(selectTheme(state)).toBe(DEFAULT_THEME)
    expect(selectSetTheme(state)).toBe(state.setTheme)
  })
})
