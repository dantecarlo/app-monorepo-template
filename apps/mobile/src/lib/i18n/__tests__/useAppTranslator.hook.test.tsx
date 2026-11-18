import { FALLBACK_LANGUAGE, LanguageEnum, resources } from '@app/i18n'
import i18next from 'i18next'
import ICU from 'i18next-icu'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, test } from 'vitest'

import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { renderHook } from '@/test/test.helper'

const spanish = resources[LanguageEnum.ES].translation

// An instance on the real catalogs, started synchronously in Spanish.
const createSpanishI18n = () => {
  const instance = i18next.createInstance()
  void instance.use(ICU).init({
    compatibilityJSON: 'v4',
    fallbackLng: FALLBACK_LANGUAGE,
    initAsync: false,
    interpolation: { escapeValue: false },
    lng: LanguageEnum.ES,
    react: { useSuspense: false },
    resources
  })
  return instance
}

const renderTranslator = () => {
  const instance = createSpanishI18n()
  const SpanishProvider = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={instance}>{children}</I18nextProvider>
  )
  return renderHook(() => useAppTranslator(), { wrapper: SpanishProvider })
}

describe('useAppTranslator', () => {
  test('formats a message of the active catalog with its values', () => {
    const { result } = renderTranslator()

    expect(result.current.t('items.dashboard.title')).toBe(
      spanish.items.dashboard.title
    )
    expect(result.current.t('auth.logo.label', { name: 'Acme' })).toBe(
      spanish.auth.logo.label.replace('{name}', 'Acme')
    )
    expect(
      result.current.t('items.dashboard.listResults', { count: 3 })
    ).toBe(spanish.items.dashboard.listResults.replace('{count}', '3'))
  })

  test('tells a key the active catalog holds from one it lacks', () => {
    const { result } = renderTranslator()

    expect(result.current.has('helper.error.network')).toBe(true)
    expect(result.current.has('helper.error.missing')).toBe(false)
    expect(result.current.has('helper.error')).toBe(false)
  })

  test('reports the active locale', () => {
    const { result } = renderTranslator()

    expect(result.current.locale).toBe(LanguageEnum.ES)
  })
})
