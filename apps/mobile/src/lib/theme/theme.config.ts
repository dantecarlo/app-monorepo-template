import { DEFAULT_THEME, ThemeEnum, type ThemeEnumType } from '@app/tokens'
import { Appearance } from 'react-native'

import { keyValueStorage } from '@/lib/storage'
import { applyTheme } from '@/lib/theme/colorScheme.adapter'

const THEME_STORAGE_KEY = 'app.theme'

export const getSafeTheme = (
  value: string | null | undefined
): ThemeEnumType =>
  value === ThemeEnum.LIGHT || value === ThemeEnum.DARK
    ? value
    : DEFAULT_THEME

/**
 * Persist + apply a theme. Mirrors the i18n setLanguage contract: writes
 * the device storage, through its key-value port, and applies it to the
 * live color scheme through applyTheme (which also flips useThemeTokens
 * consumers).
 */
export const setTheme = async (theme: ThemeEnumType): Promise<void> => {
  await keyValueStorage.setItem({ key: THEME_STORAGE_KEY, value: theme })
  applyTheme({ theme })
}

const resolveInitialTheme = async (): Promise<ThemeEnumType> => {
  try {
    const stored = await keyValueStorage.getItem({
      key: THEME_STORAGE_KEY
    })
    if (stored === ThemeEnum.LIGHT || stored === ThemeEnum.DARK) {
      return stored
    }
  } catch {
    // The device storage is unavailable — fall through to the device
    // appearance.
  }
  return getSafeTheme(Appearance.getColorScheme())
}

// Side-effect init: resolve stored → device appearance → default and apply it
// through applyTheme before the first screen paints. Imported once in
// _layout.tsx, exactly like the i18n config.
void resolveInitialTheme().then((theme) => {
  applyTheme({ theme })
})
