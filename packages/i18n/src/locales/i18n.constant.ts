import type defaultTranslation from '#src/locales/en.json'

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

// The shape of the English catalog, the catalog of DEFAULT_LANGUAGE and of
// FALLBACK_LANGUAGE: English is written first and every lookup falls back to
// it, so its keys are the complete set every other catalog must hold.
export type TranslationKeysType = typeof defaultTranslation

export interface ILocaleResources {
  translation: TranslationKeysType
}
