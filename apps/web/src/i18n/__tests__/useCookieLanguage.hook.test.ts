import { DEFAULT_LANGUAGE, LanguageEnum } from '@app/i18n'
import { afterEach, describe, expect, test } from 'vitest'

import { LOCALE_COOKIE_NAME } from '@/i18n/i18n.constant'
import { useCookieLanguage } from '@/i18n/useCookieLanguage.hook'
import { renderHook } from '@/test/test.helper'

describe('useCookieLanguage', () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE_NAME}=;path=/;max-age=0`
  })

  test('returns the supported language of the locale cookie', () => {
    expect(renderHook(() => useCookieLanguage()).result.current).toBe(
      DEFAULT_LANGUAGE
    )

    document.cookie = `${LOCALE_COOKIE_NAME}=${LanguageEnum.ES};path=/`

    expect(renderHook(() => useCookieLanguage()).result.current).toBe(
      LanguageEnum.ES
    )
  })
})
