import { ThemeEnum } from '@app/tokens'

import type { IUseRootThemeResult } from '@/lib/theme/useRootTheme.type'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

/**
 * Root-shell theme values: the StatusBar glyph style, the navigator content
 * background and the content style _layout hands the Stack, all derived from
 * the active theme so the app frame flips with it. The navigator's style is
 * theme wiring the router takes as an option, so it lives here and not in the
 * route file, which only positions.
 */
export const useRootTheme = (): IUseRootThemeResult => {
  const { colors, theme } = useThemeTokens()

  return {
    contentBackgroundColor: colors.bg.base,
    contentStyle: { backgroundColor: colors.bg.base },
    statusBarStyle: theme === ThemeEnum.LIGHT ? 'dark' : 'light'
  }
}
