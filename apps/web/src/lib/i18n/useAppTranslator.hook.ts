import type { IAppTranslator, TranslationKeyType } from '@app/i18n'
import { useLocale, useTranslations } from 'next-intl'

import { toSupportedLanguage } from '@/i18n/locale.helper'

/**
 * The translator of a client component, over the context AppI18nProvider
 * gives: the messages of the active locale's catalog by full key, whether
 * the catalog holds a message at a key, and the active locale.
 */
export const useAppTranslator = (): IAppTranslator => {
  const translate = useTranslations()
  const locale = toSupportedLanguage({ value: useLocale() })

  return {
    has: (key: string): key is TranslationKeyType =>
      translate.has(key) && typeof translate.raw(key) === 'string',
    locale,
    t: translate
  }
}
