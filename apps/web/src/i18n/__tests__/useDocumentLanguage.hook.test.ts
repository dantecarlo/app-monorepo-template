import type { SupportedLanguageType } from '@app/i18n'
import { DEFAULT_LANGUAGE, LanguageEnum } from '@app/i18n'
import { afterEach, describe, expect, test } from 'vitest'

import { useDocumentLanguage } from '@/i18n/useDocumentLanguage.hook'
import { renderHook } from '@/test/test.helper'

describe('useDocumentLanguage', () => {
  afterEach(() => {
    document.documentElement.lang = DEFAULT_LANGUAGE
  })

  test('sets the document language to the locale and follows it', () => {
    const { rerender } = renderHook(
      ({ locale }: { locale: SupportedLanguageType }) =>
        useDocumentLanguage({ locale }),
      {
        initialProps: { locale: LanguageEnum.ES as SupportedLanguageType }
      }
    )
    expect(document.documentElement.lang).toBe(LanguageEnum.ES)

    rerender({ locale: LanguageEnum.EN })

    expect(document.documentElement.lang).toBe(LanguageEnum.EN)
  })
})
