import en from '@/../packages/i18n/src/locales/en'
import es from '@/../packages/i18n/src/locales/es'

export const locales = ['en', 'es'] as const
export type LocaleType = (typeof locales)[number]

export const DEFAULT_LOCALE: LocaleType = 'en'

export { en, es }
