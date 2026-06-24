import type esTranslation from './es.json'

export const LanguageEnum = {
  EN: 'en',
  ES: 'es'
} as const

export type LanguageEnumType =
  (typeof LanguageEnum)[keyof typeof LanguageEnum]

export const DEFAULT_LANGUAGE = LanguageEnum.EN
export const FALLBACK_LANGUAGE = LanguageEnum.EN
export const FORMATTING_LOCALE = 'en-US'
export const SUPPORTED_LANGUAGES = [
  LanguageEnum.EN,
  LanguageEnum.ES
] as const

export type SupportedLanguageType = (typeof SUPPORTED_LANGUAGES)[number]

export type TranslationKeysType = typeof esTranslation

export interface ILocaleResources {
  translation: TranslationKeysType
}
