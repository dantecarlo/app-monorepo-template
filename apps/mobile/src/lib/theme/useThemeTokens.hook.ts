import {
  DEFAULT_THEME,
  type ThemeColorsType,
  ThemeEnum,
  type ThemeEnumType,
  themes
} from '@app/tokens'
import { useColorScheme } from 'nativewind'

export interface IUseThemeTokensResult {
  colors: ThemeColorsType
  theme: ThemeEnumType
}

/**
 * Reactive theme accessor for StyleSheet consumers. Most mobile components
 * read @app/tokens objects into StyleSheet.create rather than using NativeWind
 * `dark:` classes, so this hook returns themes[active] and re-renders when the
 * NativeWind color scheme flips.
 */
export const useThemeTokens = (): IUseThemeTokensResult => {
  const { colorScheme } = useColorScheme()
  const theme: ThemeEnumType =
    colorScheme === ThemeEnum.LIGHT ? ThemeEnum.LIGHT : DEFAULT_THEME

  return { colors: themes[theme], theme }
}
