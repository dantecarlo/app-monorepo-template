import type { ThemeEnumType } from '@app/tokens'
import type { ReactNode } from 'react'

export interface IThemeProviderProps {
  children: ReactNode
}

export interface IUseThemeResult {
  setTheme: (theme: ThemeEnumType) => void
  theme: ThemeEnumType
}
