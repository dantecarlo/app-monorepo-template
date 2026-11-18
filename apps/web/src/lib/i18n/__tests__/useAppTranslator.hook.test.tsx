import { LanguageEnum, resources } from '@app/i18n'
import type { ReactNode } from 'react'
import { describe, expect, test } from 'vitest'

import { AppI18nProvider } from '@/lib/i18n/AppI18nProvider.component'
import { useAppTranslator } from '@/lib/i18n/useAppTranslator.hook'
import { renderHook } from '@/test/test.helper'

const spanish = resources[LanguageEnum.ES].translation

const SpanishProvider = ({ children }: { children: ReactNode }) => (
  <AppI18nProvider locale={LanguageEnum.ES} messages={spanish}>
    {children}
  </AppI18nProvider>
)

const renderTranslator = () =>
  renderHook(() => useAppTranslator(), { wrapper: SpanishProvider })

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
