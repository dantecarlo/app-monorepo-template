import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageType
} from '@app/i18n'
import { useCallback } from 'react'

import type { IUseLanguageSwitcherResult } from '@/components/ui/LanguageSwitcher/LanguageSwitcher.type'
import { setLanguage } from '@/lib/i18n/i18n.config'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'

const toNextLanguage = (
  current: SupportedLanguageType
): SupportedLanguageType => {
  const index = SUPPORTED_LANGUAGES.indexOf(current)
  if (index === -1) return DEFAULT_LANGUAGE
  const nextIndex = (index + 1) % SUPPORTED_LANGUAGES.length
  return SUPPORTED_LANGUAGES[nextIndex] ?? DEFAULT_LANGUAGE
}

// Cycles through SUPPORTED_LANGUAGES and persists the choice via the i18n
// config's setLanguage (the device storage + changeLanguage).
export const useLanguageSwitcher = (): IUseLanguageSwitcherResult => {
  const { locale } = useAppTranslator()

  const cycleLanguage = useCallback(() => {
    void setLanguage(toNextLanguage(locale))
  }, [locale])

  return { cycleLanguage, locale }
}
