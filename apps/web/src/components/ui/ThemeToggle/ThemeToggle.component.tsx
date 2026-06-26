'use client'

import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import { useThemeToggle } from '@/components/ui/ThemeToggle/useThemeToggle.hook'
import { Toggle } from '@/components/ui/Toggle/Toggle.component'

export interface IThemeToggleProps {
  accessibilityLabel?: string
}

/** Light/dark theme switch built on the generic Toggle and the theme controller. */
export const ThemeToggle = ({
  accessibilityLabel
}: IThemeToggleProps): JSX.Element => {
  const t = useTranslations('auth.themeToggle')
  const { isLight, onValueChange } = useThemeToggle()

  return (
    <Toggle
      accessibilityLabel={accessibilityLabel ?? t('label')}
      onValueChange={onValueChange}
      value={isLight}
    />
  )
}
