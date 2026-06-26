'use client'

import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageType
} from '@app/i18n'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useCallback } from 'react'

import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME
} from '@/components/ui/LanguageSwitcher/languageSwitcher.constant'

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

// Cycles through SUPPORTED_LANGUAGES, persists the choice in the NEXT_LOCALE
// cookie, and triggers a server refresh so the next-intl request config
// re-resolves messages for the new locale.
export const useLanguageSwitcher = (): IUseLanguageSwitcherResult => {
  const router = useRouter()
  const locale = toSupportedLanguage(useLocale())

  const cycleLanguage = useCallback(() => {
    const next = toNextLanguage(locale)
    document.cookie = `${LOCALE_COOKIE_NAME}=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS};samesite=lax`
    router.refresh()
  }, [locale, router])

  return { cycleLanguage, locale }
}
