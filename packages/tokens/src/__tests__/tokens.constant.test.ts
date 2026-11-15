import { describe, expect, test } from 'vitest'

import {
  colors,
  DEFAULT_THEME,
  fontFallback,
  motion,
  sharedColors,
  ThemeEnum,
  themes,
  webFontVariable
} from '@/tokens.constant'

// Collect every dot-separated leaf path of a nested object.
const collectLeafPaths = (
  obj: Record<string, unknown>,
  prefix = ''
): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return collectLeafPaths(value as Record<string, unknown>, path)
    }
    return [path]
  })

describe('theme tokens', () => {
  test('dark and light themes expose an identical semantic key set', () => {
    const darkPaths = collectLeafPaths(
      themes.dark as unknown as Record<string, unknown>
    ).sort()
    const lightPaths = collectLeafPaths(
      themes.light as unknown as Record<string, unknown>
    ).sort()
    expect(lightPaths).toEqual(darkPaths)
  })

  test('glass recipe values are pinned per theme (drift anchor)', () => {
    expect(themes.dark.glass.fill).toBe('rgba(24,27,34,0.42)')
    expect(themes.dark.glass.stroke).toBe('rgba(255,255,255,0.10)')
    expect(themes.light.glass.fill).toBe('rgba(255,255,255,0.66)')
    expect(themes.light.glass.stroke).toBe('rgba(0,0,0,0.08)')
  })

  test('flat colors alias stays bound to the dark theme for back-compat', () => {
    expect(colors).toBe(themes.dark)
  })

  test('default theme is a member of the theme enum', () => {
    expect(Object.values(ThemeEnum)).toContain(DEFAULT_THEME)
    expect(themes[DEFAULT_THEME]).toBeDefined()
  })

  test('both themes carry the shared colours', () => {
    expect(sharedColors).toEqual({
      accent: '#FF6A1A',
      accentInk: '#2A1402',
      accentLight: '#FF8A3D',
      accentTint: 'rgba(255,106,26,0.16)',
      coolGlow: '#5B6CFF'
    })
    for (const [key, value] of Object.entries(sharedColors)) {
      expect(themes.dark).toHaveProperty(key, value)
      expect(themes.light).toHaveProperty(key, value)
    }
  })

  test('the font fallback, the web font variables and the shimmer motion are tokens', () => {
    expect(fontFallback).toBe('sans-serif')
    expect(webFontVariable).toEqual({
      body: '--font-inter',
      display: '--font-montserrat'
    })
    expect(motion).toEqual({
      duration: { shimmer: 1600 },
      easing: { shimmer: 'linear' }
    })
  })
})
