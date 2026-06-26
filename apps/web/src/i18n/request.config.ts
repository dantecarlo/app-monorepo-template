import {
  DEFAULT_LANGUAGE,
  resources,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageType
} from '@app/i18n'
import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

const I18N_TIME_ZONE = 'UTC'

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE'

const toSupportedLanguage = (
  value: string | undefined
): SupportedLanguageType =>
  (SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(value ?? '')
    ? (value as SupportedLanguageType)
    : DEFAULT_LANGUAGE

// Resolves the active locale per request: the NEXT_LOCALE cookie the
// LanguageSwitcher writes wins, then the routing-provided requestLocale, then
// DEFAULT_LANGUAGE. router.refresh() re-runs this on the server after a switch.
export default getRequestConfig(async ({ requestLocale }) => {
  const cookieStore = await cookies()
  const requested =
    cookieStore.get(LOCALE_COOKIE_NAME)?.value ?? (await requestLocale)
  const locale = toSupportedLanguage(requested)

  return {
    locale,
    messages: resources[locale].translation,
    timeZone: I18N_TIME_ZONE
  }
})
