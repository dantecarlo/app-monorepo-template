import { DEFAULT_LANGUAGE, LanguageEnum } from '@app/i18n'
import { describe, expect, test } from 'vitest'

import { LOCALE_COOKIE_NAME } from '@/i18n/i18n.constant'
import {
  readLocaleCookie,
  toSupportedLanguage
} from '@/i18n/locale.helper'

const UNSUPPORTED_LANGUAGE = 'fr'

describe('locale helpers', () => {
  test('keeps a supported language and turns anything else into the default', () => {
    expect(toSupportedLanguage({ value: LanguageEnum.ES })).toBe(
      LanguageEnum.ES
    )
    expect(toSupportedLanguage({ value: UNSUPPORTED_LANGUAGE })).toBe(
      DEFAULT_LANGUAGE
    )
    expect(toSupportedLanguage({ value: undefined })).toBe(
      DEFAULT_LANGUAGE
    )
  })

  test('reads the supported language of the locale cookie', () => {
    expect(
      readLocaleCookie({
        cookie: `NEXT_THEME=light; ${LOCALE_COOKIE_NAME}=${LanguageEnum.ES}`
      })
    ).toBe(LanguageEnum.ES)
    expect(
      readLocaleCookie({
        cookie: `${LOCALE_COOKIE_NAME}=${UNSUPPORTED_LANGUAGE}`
      })
    ).toBe(DEFAULT_LANGUAGE)
    expect(
      readLocaleCookie({
        cookie: `X${LOCALE_COOKIE_NAME}=${LanguageEnum.ES}`
      })
    ).toBe(DEFAULT_LANGUAGE)
    expect(readLocaleCookie({ cookie: '' })).toBe(DEFAULT_LANGUAGE)
  })
})
