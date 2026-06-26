import { DEFAULT_THEME, type ThemeEnumType } from '@app/tokens'
import { create } from 'zustand'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IThemeState {
  setTheme: (theme: ThemeEnumType) => void
  theme: ThemeEnumType
}

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export const selectTheme = (s: IThemeState): ThemeEnumType => s.theme
export const selectSetTheme = (s: IThemeState) => s.setTheme

// ---------------------------------------------------------------------------
// Store — current theme only. Persistence is the NEXT_THEME cookie (written by
// useTheme) so the server layout can render the right data-theme on first
// paint; localStorage would be invisible to SSR and reintroduce a flash.
// ---------------------------------------------------------------------------

export const useThemeStore = create<IThemeState>()((set) => ({
  setTheme(theme) {
    set({ theme })
  },
  theme: DEFAULT_THEME
}))
