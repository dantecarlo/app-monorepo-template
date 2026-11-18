import { colorScheme } from 'nativewind'

import type { IApplyThemeParams } from '@/lib/theme/colorScheme.type'

/**
 * Applies a theme to NativeWind's live color scheme, without storing it, so
 * every block that reads the theme tokens renders in it. setTheme of
 * theme.config.ts also stores the choice.
 */
export const applyTheme = ({ theme }: IApplyThemeParams): void => {
  colorScheme.set(theme)
}
