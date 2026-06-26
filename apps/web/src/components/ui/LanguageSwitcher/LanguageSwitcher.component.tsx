'use client'

import { useTranslations } from 'next-intl'
import type { JSX } from 'react'

import { LANGUAGE_SWITCHER } from '@/components/ui/LanguageSwitcher/LanguageSwitcher.styles'
import { useLanguageSwitcher } from '@/components/ui/LanguageSwitcher/useLanguageSwitcher.hook'

export interface ILanguageSwitcherProps {
  accessibilityLabel?: string
}

/** Cycles the active locale across SUPPORTED_LANGUAGES, persisting via cookie. */
export const LanguageSwitcher = ({
  accessibilityLabel
}: ILanguageSwitcherProps): JSX.Element => {
  const t = useTranslations('auth.languageSwitcher')
  const { cycleLanguage, locale } = useLanguageSwitcher()

  return (
    <button
      aria-label={accessibilityLabel ?? t('label')}
      className={LANGUAGE_SWITCHER.BUTTON}
      onClick={cycleLanguage}
      type="button"
    >
      {locale}
    </button>
  )
}
