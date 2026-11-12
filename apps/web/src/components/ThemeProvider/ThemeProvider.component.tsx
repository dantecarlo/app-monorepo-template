'use client'

import type { JSX } from 'react'

import type { IThemeProviderProps } from '@/components/ThemeProvider/ThemeProvider.type'
import { useThemeBootstrap } from '@/components/ThemeProvider/useThemeBootstrap.hook'

export const ThemeProvider = ({
  children
}: IThemeProviderProps): JSX.Element => {
  useThemeBootstrap()
  return <>{children}</>
}
