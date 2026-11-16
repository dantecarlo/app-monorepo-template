import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  type SupportedLanguageType
} from '@app/i18n'

import { LOCALE_COOKIE_NAME } from '@/i18n/i18n.constant'

export interface IToSupportedLanguageParams {
  value: string | undefined
}

export interface IReadLocaleCookieParams {
  /** A cookie header or `document.cookie`: `name=value` pairs split by `; `. */
  cookie: string
}

const LOCALE_COOKIE_PATTERN = new RegExp(
  `(?:^|; )${LOCALE_COOKIE_NAME}=([^;]+)`
)

/** A supported language stays as it is; anything else is the default. */
export const toSupportedLanguage = ({
  value
}: IToSupportedLanguageParams): SupportedLanguageType =>
  (SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(value ?? '')
    ? (value as SupportedLanguageType)
    : DEFAULT_LANGUAGE

/** The supported language the locale cookie names, else the default. */
export const readLocaleCookie = ({
  cookie
}: IReadLocaleCookieParams): SupportedLanguageType =>
  toSupportedLanguage({ value: LOCALE_COOKIE_PATTERN.exec(cookie)?.[1] })
