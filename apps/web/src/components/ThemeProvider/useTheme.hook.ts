'use client'

import { type ThemeEnumType } from '@app/tokens'
import { useCallback } from 'react'

import {
  THEME_ATTRIBUTE,
  THEME_COOKIE_MAX_AGE_SECONDS,
  THEME_COOKIE_NAME
} from '@/lib/theme/theme.constant'
import {
  selectSetTheme,
  selectTheme,
  useThemeStore
} from '@/stores/theme.store'

export interface IUseThemeResult {
  setTheme: (theme: ThemeEnumType) => void
  theme: ThemeEnumType
}

/**
 * Theme controller for client components. `setTheme` performs a pure CSS-var
 * flip: it sets the data-theme attribute on <html>, writes the NEXT_THEME
 * cookie so the no-flash head script resolves the same theme on the next load,
 * and updates the store — no router.refresh, no reload.
 */
export const useTheme = (): IUseThemeResult => {
  const theme = useThemeStore(selectTheme)
  const setThemeState = useThemeStore(selectSetTheme)

  const setTheme = useCallback(
    (next: ThemeEnumType) => {
      document.documentElement.setAttribute(THEME_ATTRIBUTE, next)
      document.cookie = `${THEME_COOKIE_NAME}=${next};path=/;max-age=${THEME_COOKIE_MAX_AGE_SECONDS};samesite=lax`
      setThemeState(next)
    },
    [setThemeState]
  )

  return { setTheme, theme }
}
