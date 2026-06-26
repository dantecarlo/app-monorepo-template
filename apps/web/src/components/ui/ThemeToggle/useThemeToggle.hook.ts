'use client'

import { ThemeEnum } from '@app/tokens'
import { useCallback } from 'react'

import { useTheme } from '@/components/ThemeProvider/useTheme.hook'

export interface IUseThemeToggleResult {
  isLight: boolean
  onValueChange: (next: boolean) => void
}

// Bridges the boolean Toggle contract to the theme controller: the switch is
// "on" when the active theme is light, and flipping it maps back to the
// matching ThemeEnum value.
export const useThemeToggle = (): IUseThemeToggleResult => {
  const { setTheme, theme } = useTheme()

  const onValueChange = useCallback(
    (next: boolean) => {
      setTheme(next ? ThemeEnum.LIGHT : ThemeEnum.DARK)
    },
    [setTheme]
  )

  return { isLight: theme === ThemeEnum.LIGHT, onValueChange }
}
