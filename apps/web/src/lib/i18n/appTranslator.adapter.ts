import type {
  IAppTranslator,
  SupportedLanguageType,
  TranslationKeyType
} from '@app/i18n'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'

import { toSupportedLanguage } from '@/i18n/locale.helper'
import type { AppMessagesType } from '@/lib/i18n/AppI18nProvider.type'

// The request's translation, as the request config resolved it, for server
// components: the same IAppTranslator the client hook gives, and the locale
// and catalog LocaleProviders hands to the client providers.

/** The request's locale, reduced to a supported language. */
export const getAppLocale = async (): Promise<SupportedLanguageType> =>
  toSupportedLanguage({ value: await getLocale() })

/** The request's catalog: the request config loads it from @app/i18n. */
export const getAppMessages = async (): Promise<AppMessagesType> =>
  (await getMessages()) as AppMessagesType

/** The translator of a server component, in the request's locale. */
export const getAppTranslator = async (): Promise<IAppTranslator> => {
  const [locale, translate] = await Promise.all([
    getAppLocale(),
    getTranslations()
  ])

  return {
    has: (key: string): key is TranslationKeyType =>
      translate.has(key) && typeof translate.raw(key) === 'string',
    locale,
    t: translate
  }
}
