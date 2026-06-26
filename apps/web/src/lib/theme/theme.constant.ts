import { ThemeEnum, type ThemeEnumType } from '@app/tokens'

// Persisted theme choice. Written by useTheme; read before paint by the
// no-flash head script to set <html data-theme> with no flash.
export const THEME_COOKIE_NAME = 'NEXT_THEME'

// One year — theme is a durable user preference.
export const THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

// The attribute toggled on <html>; @theme indirection vars key off it.
export const THEME_ATTRIBUTE = 'data-theme'

export const isThemeValue = (value: unknown): value is ThemeEnumType =>
  value === ThemeEnum.DARK || value === ThemeEnum.LIGHT
