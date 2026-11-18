import '@/lib/i18n/intlPolyfill.config'

import {
  DEFAULT_LANGUAGE,
  FALLBACK_LANGUAGE,
  resources,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageType
} from '@app/i18n'
import { getLocales } from 'expo-localization'
import i18n from 'i18next'
import ICU from 'i18next-icu'
import { initReactI18next } from 'react-i18next'

import { keyValueStorage } from '@/lib/storage'

const LANGUAGE_STORAGE_KEY = 'app.language'

export const getSafeLanguage = (
  tag: string | null | undefined
): SupportedLanguageType => {
  if (!tag) return DEFAULT_LANGUAGE
  const code = tag.split('-')[0].toLowerCase() as SupportedLanguageType
  return (SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(code)
    ? (code as SupportedLanguageType)
    : DEFAULT_LANGUAGE
}

export const setLanguage = async (
  lang: SupportedLanguageType
): Promise<void> => {
  await keyValueStorage.setItem({ key: LANGUAGE_STORAGE_KEY, value: lang })
  await i18n.changeLanguage(lang)
}

const resolveInitialLanguage =
  async (): Promise<SupportedLanguageType> => {
    try {
      const stored = await keyValueStorage.getItem({
        key: LANGUAGE_STORAGE_KEY
      })
      if (
        stored &&
        (SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(stored)
      ) {
        return stored as SupportedLanguageType
      }
    } catch {
      // The device storage is unavailable — fall through to device locale
    }
    const locales = getLocales()
    const deviceTag = locales[0]?.languageCode ?? null
    return getSafeLanguage(deviceTag)
  }

resolveInitialLanguage().then((lng) => {
  i18n
    .use(ICU)
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      fallbackLng: FALLBACK_LANGUAGE,
      interpolation: { escapeValue: false },
      lng,
      resources
    })
})

export default i18n
