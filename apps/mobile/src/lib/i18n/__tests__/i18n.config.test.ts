import { createMemoryKeyValueStorage } from '@app/core'
import {
  DEFAULT_LANGUAGE,
  LanguageEnum,
  SUPPORTED_LANGUAGES
} from '@app/i18n'
import { afterEach, describe, expect, test, vi } from 'vitest'

vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }]
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

import { getSafeLanguage } from '@/lib/i18n/i18n.config'

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

const LANGUAGE_KEY = 'app.language'

// A fresh launch: the project module that owns the device storage is
// replaced by the in-memory storage of @app/core, and the language config,
// whose import starts the bootstrap, is loaded on it. The device locale is
// English (the expo-localization mock above).
const launch = async ({ stored }: { stored?: string } = {}) => {
  vi.resetModules()
  const device = createMemoryKeyValueStorage()
  if (stored !== undefined) {
    await device.setItem({ key: LANGUAGE_KEY, value: stored })
  }
  vi.doMock('@/lib/storage', () => ({ keyValueStorage: device }))
  // The i18next mock above is one instance for the whole file: the import
  // at the top already started it once.
  const { default: i18n } = await import('i18next')
  vi.mocked(i18n.init).mockClear()
  vi.mocked(i18n.changeLanguage).mockClear()
  const config = await import('@/lib/i18n/i18n.config')
  await vi.waitFor(() => expect(i18n.init).toHaveBeenCalledOnce())
  return { config, device, i18n }
}

describe('the language bootstrap', () => {
  afterEach(() => {
    vi.doUnmock('@/lib/storage')
  })

  test('starts i18next in the language the device storage holds', async () => {
    const { i18n } = await launch({ stored: LanguageEnum.ES })

    expect(i18n.init).toHaveBeenCalledWith(
      expect.objectContaining({ lng: LanguageEnum.ES })
    )
  })

  test('stores a chosen language in the device storage and switches i18next to it', async () => {
    const { config, device, i18n } = await launch()

    await config.setLanguage(LanguageEnum.ES)

    expect(await device.getItem({ key: LANGUAGE_KEY })).toBe(
      LanguageEnum.ES
    )
    expect(i18n.changeLanguage).toHaveBeenCalledWith(LanguageEnum.ES)
  })
})
