import type { ILocaleResources, SupportedLanguageType } from '@app/i18n'
import type { ReactNode } from 'react'

/** A catalog: the shape of the English one, which every catalog holds. */
export type AppMessagesType = ILocaleResources['translation']

export interface IAppI18nProviderProps {
  children: ReactNode
  /** The active language, which the request config resolved. */
  locale: SupportedLanguageType
  /** The catalog of that language. */
  messages: AppMessagesType
}
