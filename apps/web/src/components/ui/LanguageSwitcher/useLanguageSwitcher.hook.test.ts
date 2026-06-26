import { LanguageEnum } from '@app/i18n'
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const refresh = vi.fn()
let currentLocale: string = LanguageEnum.EN

vi.mock('next-intl', () => ({
  useLocale: () => currentLocale
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh })
}))

import { useLanguageSwitcher } from './useLanguageSwitcher.hook'

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
