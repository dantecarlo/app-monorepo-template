import { DEFAULT_THEME, ThemeEnum, type ThemeEnumType } from '@app/tokens'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colorScheme } from 'nativewind'
import { Appearance } from 'react-native'

const THEME_STORAGE_KEY = 'app.theme'

export const getSafeTheme = (
  value: string | null | undefined
): ThemeEnumType =>
  value === ThemeEnum.LIGHT || value === ThemeEnum.DARK
    ? value
    : DEFAULT_THEME

/**
 * Persist + apply a theme. Mirrors the i18n setLanguage contract: writes
 * AsyncStorage and drives the live NativeWind color scheme (which also flips
 * useThemeTokens consumers).
 */
export const setTheme = async (theme: ThemeEnumType): Promise<void> => {
  await AsyncStorage.setItem(THEME_STORAGE_KEY, theme)
  colorScheme.set(theme)
}

const resolveInitialTheme = async (): Promise<ThemeEnumType> => {
  try {
    const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY)
    if (stored === ThemeEnum.LIGHT || stored === ThemeEnum.DARK) {
      return stored
    }
  } catch {
    // AsyncStorage unavailable — fall through to the device appearance.
  }
  return getSafeTheme(Appearance.getColorScheme())
}

// Side-effect init: resolve stored → device appearance → default and apply it
// to NativeWind before the first screen paints. Imported once in _layout.tsx,
// exactly like the i18n config.
void resolveInitialTheme().then((theme) => {
  colorScheme.set(theme)
})
