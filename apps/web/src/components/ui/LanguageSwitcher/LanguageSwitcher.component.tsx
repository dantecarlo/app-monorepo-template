'use client'

import type { JSX } from 'react'

import { LANGUAGE_SWITCHER } from '@/components/ui/LanguageSwitcher/LanguageSwitcher.style'
import type { ILanguageSwitcherProps } from '@/components/ui/LanguageSwitcher/LanguageSwitcher.type'
import { useLanguageSwitcher } from '@/components/ui/LanguageSwitcher/useLanguageSwitcher.hook'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

/** Cycles the active locale across SUPPORTED_LANGUAGES, persisting via cookie. */
export const LanguageSwitcher = ({
  accessibilityLabel
}: ILanguageSwitcherProps): JSX.Element => {
  const { t } = useAppTranslator()
  const { cycleLanguage, locale } = useLanguageSwitcher()

  return (
    <button
      aria-label={accessibilityLabel ?? t('auth.languageSwitcher.label')}
      className={LANGUAGE_SWITCHER.BUTTON}
      onClick={cycleLanguage}
      type="button"
    >
      {locale}
    </button>
  )
}
