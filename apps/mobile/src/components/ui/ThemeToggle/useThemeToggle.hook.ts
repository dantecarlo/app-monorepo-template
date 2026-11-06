import { ThemeEnum } from '@app/tokens'
import { useCallback } from 'react'

import type { IUseThemeToggleResult } from '@/components/ui/ThemeToggle/ThemeToggle.type'
import { setTheme } from '@/lib/theme/theme.config'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

// Bridges the boolean Toggle contract to the persisted NativeWind theme: the
// switch is "on" when the active theme is light, and flipping it persists the
// matching ThemeEnum value.
export const useThemeToggle = (): IUseThemeToggleResult => {
  const { theme } = useThemeTokens()

  const onValueChange = useCallback((next: boolean) => {
    void setTheme(next ? ThemeEnum.LIGHT : ThemeEnum.DARK)
  }, [])

  return { isLight: theme === ThemeEnum.LIGHT, onValueChange }
}
