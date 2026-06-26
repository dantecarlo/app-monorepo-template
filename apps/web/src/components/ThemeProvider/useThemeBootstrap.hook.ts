'use client'

import { useEffect } from 'react'

import { isThemeValue, THEME_ATTRIBUTE } from '@/lib/theme/theme.constant'
import { selectSetTheme, useThemeStore } from '@/stores/theme.store'

/**
 * Adopts the theme already painted on <html> by the blocking no-flash head
 * script (NEXT_THEME cookie, else prefers-color-scheme) into the store, so
 * client reads match what the user already sees. Read-only side effect; never
 * writes the attribute or cookie.
 */
export const useThemeBootstrap = (): void => {
  const setTheme = useThemeStore(selectSetTheme)

  useEffect(() => {
    const painted = document.documentElement.getAttribute(THEME_ATTRIBUTE)
    if (isThemeValue(painted)) {
      setTheme(painted)
    }
  }, [setTheme])
}
