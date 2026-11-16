import { DEFAULT_LANGUAGE, LanguageEnum } from '@app/i18n'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { LOCALE_COOKIE_NAME } from '@/i18n/i18n.constant'
import { NO_FLASH_LOCALE_SCRIPT } from '@/i18n/noFlashLocale.constant'

const UNSUPPORTED_LANGUAGE = 'fr'

// The script is the text the root layout inlines in <head>; the test runs it
// the way the browser does, against the document's cookie and <html>.

const runLocaleScript = (): void => new Function(NO_FLASH_LOCALE_SCRIPT)()

const setLocaleCookie = (value: string): void => {
  document.cookie = `${LOCALE_COOKIE_NAME}=${value};path=/`
}

describe('NO_FLASH_LOCALE_SCRIPT', () => {
  beforeEach(() => {
    document.documentElement.lang = DEFAULT_LANGUAGE
  })

  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=;path=/;max-age=0`
    document.documentElement.lang = DEFAULT_LANGUAGE
  })

  test('sets the document language from a supported locale cookie', () => {
    setLocaleCookie(LanguageEnum.ES)

    runLocaleScript()

    expect(document.documentElement.lang).toBe(LanguageEnum.ES)
  })

  test('keeps the default language for a missing or unsupported cookie', () => {
    runLocaleScript()
    expect(document.documentElement.lang).toBe(DEFAULT_LANGUAGE)

    setLocaleCookie(UNSUPPORTED_LANGUAGE)
    runLocaleScript()
    expect(document.documentElement.lang).toBe(DEFAULT_LANGUAGE)
  })
})
