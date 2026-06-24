import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@app/i18n'
import { describe, expect, test, vi } from 'vitest'

vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }]
}))

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: vi.fn().mockResolvedValue(null), setItem: vi.fn() }
}))

vi.mock('i18next-icu', () => ({ default: {} }))
vi.mock('react-i18next', () => ({ initReactI18next: {} }))
vi.mock('i18next', () => ({
  default: {
    changeLanguage: vi.fn(),
    init: vi.fn().mockResolvedValue(undefined),
    use: vi.fn().mockReturnThis()
  }
}))

import { getSafeLanguage } from './i18n.config'

describe('getSafeLanguage', () => {
  test('returns the default language for null input', () => {
    expect(getSafeLanguage(null)).toBe(DEFAULT_LANGUAGE)
  })

  test('returns the default language for undefined input', () => {
    expect(getSafeLanguage(undefined)).toBe(DEFAULT_LANGUAGE)
  })

  test('returns the default language for empty string', () => {
    expect(getSafeLanguage('')).toBe(DEFAULT_LANGUAGE)
  })

  test('normalizes BCP-47 tag to a supported language', () => {
    const result = getSafeLanguage('en-US')
    expect(
      (SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(result)
    ).toBe(true)
  })

  test('falls back to default for an unsupported language tag', () => {
    expect(getSafeLanguage('xx-UNKNOWN')).toBe(DEFAULT_LANGUAGE)
  })
})
