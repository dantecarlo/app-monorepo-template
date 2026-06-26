'use client'

import type { JSX, ReactNode } from 'react'

import { useThemeBootstrap } from '@/components/ThemeProvider/useThemeBootstrap.hook'

export interface IThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider = ({
  children
}: IThemeProviderProps): JSX.Element => {
  useThemeBootstrap()
  return <>{children}</>
}
