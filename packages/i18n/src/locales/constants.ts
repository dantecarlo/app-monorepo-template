import type esTranslation from './es.json'

export enum LanguageEnum {
  EN = 'en',
  ES = 'es'
}

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
