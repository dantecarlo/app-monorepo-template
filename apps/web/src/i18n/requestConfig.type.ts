import type { SupportedLanguageType } from '@app/i18n'

import type { AppMessagesType } from '@/lib/i18n/AppI18nProvider.type'

export interface IResolveRequestConfigParams {
  /** The locale the routing hands over, when it names one. */
  requestLocale: Promise<string | undefined>
}

/** What a request translates with: next-intl's request config shape. */
export interface IRequestConfig {
  locale: SupportedLanguageType
  messages: AppMessagesType
  timeZone: string
}
