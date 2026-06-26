import { ThemeEnum } from '@app/tokens'
import type { ColorValue } from 'react-native'

import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

export type GlassCardTintType = 'dark' | 'light'

export interface IUseGlassCardResult {
  borderColor: ColorValue
  overlayColor: ColorValue
  tint: GlassCardTintType
}

/**
 * Resolves the theme-variant glass surface values (BlurView tint + overlay
 * fill + stroke) from the active theme. Layout (positions, radius, shadow)
 * stays static in GlassCard.styles.ts.
 */
export const useGlassCard = (): IUseGlassCardResult => {
  const { colors, theme } = useThemeTokens()

  return {
    borderColor: colors.glass.stroke,
    overlayColor: colors.glass.fill,
    tint: theme === ThemeEnum.LIGHT ? 'light' : 'dark'
  }
}
