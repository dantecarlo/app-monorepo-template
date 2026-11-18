import { LanguageEnum } from '@app/i18n'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
let currentLocale: string = LanguageEnum.EN

vi.mock('@/lib/i18n/useAppTranslator.hook', () => ({
  useAppTranslator: () => ({ locale: currentLocale })
}))

vi.mock('@/lib/routing', async () =>
  (await import('@/test/routing.helper')).createRoutingDouble({
    router: { refresh }
  })
)

import { useLanguageSwitcher } from '@/components/ui/LanguageSwitcher/useLanguageSwitcher.hook'

describe('useLanguageSwitcher', () => {
  beforeEach(() => {
    refresh.mockClear()
    document.cookie = ''
  })

  test('exposes the current locale', () => {
    currentLocale = LanguageEnum.ES
    const { result } = renderHook(() => useLanguageSwitcher())
    expect(result.current.locale).toBe(LanguageEnum.ES)
  })

  test('cycling from en advances to es and writes the cookie', () => {
    currentLocale = LanguageEnum.EN
    const { result } = renderHook(() => useLanguageSwitcher())
    act(() => result.current.cycleLanguage())
    expect(document.cookie).toContain(`NEXT_LOCALE=${LanguageEnum.ES}`)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  test('cycling wraps from es back to en', () => {
    currentLocale = LanguageEnum.ES
    const { result } = renderHook(() => useLanguageSwitcher())
    act(() => result.current.cycleLanguage())
    expect(document.cookie).toContain(`NEXT_LOCALE=${LanguageEnum.EN}`)
  })
})
