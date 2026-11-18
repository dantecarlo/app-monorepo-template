import {
  DEFAULT_LANGUAGE,
  type IAppTranslator,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageType,
  type TranslationKeyType
} from '@app/i18n'
import { useTranslation } from 'react-i18next'

// i18next's active language is one the config started or switched to; any
// other value reads as the default.
const toSupportedLanguage = (value: string): SupportedLanguageType =>
  (SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(value)
    ? (value as SupportedLanguageType)
    : DEFAULT_LANGUAGE

/**
 * The translator of a block, over the active i18next instance: the messages
 * of the active language's catalog by full key, whether the catalog holds a
 * message at a key, and the active language.
 */
export const useAppTranslator = (): IAppTranslator => {
  const { i18n, t: translate } = useTranslation()

  return {
    has: (key: string): key is TranslationKeyType =>
      i18n.exists(key) &&
      typeof translate(key, { returnObjects: true }) === 'string',
    locale: toSupportedLanguage(i18n.language),
    t: (...[key, values]: Parameters<IAppTranslator['t']>) =>
      translate(key, values)
  }
}
