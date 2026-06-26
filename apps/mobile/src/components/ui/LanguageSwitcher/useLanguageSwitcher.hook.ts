import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageType
} from '@app/i18n'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { setLanguage } from '@/lib/i18n/i18n.config'

export interface IUseLanguageSwitcherResult {
  cycleLanguage: () => void
  locale: SupportedLanguageType
}

const toNextLanguage = (
  current: SupportedLanguageType
): SupportedLanguageType => {
  const index = SUPPORTED_LANGUAGES.indexOf(current)
  if (index === -1) return DEFAULT_LANGUAGE
  const nextIndex = (index + 1) % SUPPORTED_LANGUAGES.length
  return SUPPORTED_LANGUAGES[nextIndex] ?? DEFAULT_LANGUAGE
}

const toSupportedLanguage = (value: string): SupportedLanguageType =>
  (SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(value)
    ? (value as SupportedLanguageType)
    : DEFAULT_LANGUAGE

// Cycles through SUPPORTED_LANGUAGES and persists the choice via the i18n
// config's setLanguage (AsyncStorage + changeLanguage).
export const useLanguageSwitcher = (): IUseLanguageSwitcherResult => {
  const { i18n } = useTranslation()
  const locale = toSupportedLanguage(i18n.language)

  const cycleLanguage = useCallback(() => {
    void setLanguage(toNextLanguage(locale))
  }, [locale])

  return { cycleLanguage, locale }
}
