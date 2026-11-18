import { resources } from '@app/i18n'
import { cookies } from 'next/headers'

import { I18N_TIME_ZONE, LOCALE_COOKIE_NAME } from '@/i18n/i18n.constant'
import { toSupportedLanguage } from '@/i18n/locale.helper'
import type {
  IRequestConfig,
  IResolveRequestConfigParams
} from '@/i18n/requestConfig.type'

// Resolves the active locale per request: the NEXT_LOCALE cookie the
// LanguageSwitcher writes wins, then the routing-provided requestLocale, then
// DEFAULT_LANGUAGE. router.refresh() re-runs it on the server after a switch,
// and LocaleProviders hands its locale and messages to the client providers.
export const resolveRequestConfig = async ({
  requestLocale
}: IResolveRequestConfigParams): Promise<IRequestConfig> => {
  const cookieStore = await cookies()
  const requested =
    cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? (await requestLocale)
  const locale = toSupportedLanguage({ value: requested })

  return {
    locale,
    messages: resources[locale].translation,
    timeZone: I18N_TIME_ZONE
  }
}
