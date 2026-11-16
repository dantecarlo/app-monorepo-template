'use client'

import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageType
} from '@app/i18n'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useCallback } from 'react'

import type { IUseLanguageSwitcherResult } from '@/components/ui/LanguageSwitcher/LanguageSwitcher.type'
import {
  LOCALE_COOKIE_MAX_AGE_SECONDS,
  LOCALE_COOKIE_NAME
} from '@/i18n/i18n.constant'
import { toSupportedLanguage } from '@/i18n/locale.helper'

const toNextLanguage = (
  current: SupportedLanguageType
): SupportedLanguageType => {
  const index = SUPPORTED_LANGUAGES.indexOf(current)
  if (index === -1) return DEFAULT_LANGUAGE
  const nextIndex = (index + 1) % SUPPORTED_LANGUAGES.length
  return SUPPORTED_LANGUAGES[nextIndex] ?? DEFAULT_LANGUAGE
}

// Cycles through SUPPORTED_LANGUAGES from the active locale, persists the
// choice in the NEXT_LOCALE cookie, and triggers a server refresh so the
// next-intl request config re-resolves the locale and messages, which
// LocaleProviders hands to the client providers.
export const useLanguageSwitcher = (): IUseLanguageSwitcherResult => {
  const router = useRouter()
  const locale = toSupportedLanguage({ value: useLocale() })

  const cycleLanguage = useCallback(() => {
    const next = toNextLanguage(locale)
    document.cookie = `${LOCALE_COOKIE_NAME}=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE_SECONDS};samesite=lax`
    router.refresh()
  }, [locale, router])

  return { cycleLanguage, locale }
}
