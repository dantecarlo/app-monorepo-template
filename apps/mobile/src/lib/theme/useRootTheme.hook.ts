import { ThemeEnum } from '@app/tokens'

import type { IUseRootThemeResult } from '@/lib/theme/useRootTheme.type'
import { useThemeTokens } from '@/lib/theme/useThemeTokens.hook'

/**
 * Root-shell theme values for _layout: the StatusBar glyph style and the
 * navigator content background, both derived from the active theme so the app
 * frame flips with it instead of staying hardcoded dark.
 */
export const useRootTheme = (): IUseRootThemeResult => {
  const { colors, theme } = useThemeTokens()

  return {
    contentBackgroundColor: colors.bg.base,
    statusBarStyle: theme === ThemeEnum.LIGHT ? 'dark' : 'light'
  }
}
