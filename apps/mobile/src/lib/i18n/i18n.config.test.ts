import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@app/i18n'
import { describe, expect, it } from 'vitest'

import { getSafeLanguage } from './i18n.config'

describe('getSafeLanguage', () => {
  it('returns the default language for null input', () => {
    expect(getSafeLanguage(null)).toBe(DEFAULT_LANGUAGE)
  })

  it('returns the default language for undefined input', () => {
    expect(getSafeLanguage(undefined)).toBe(DEFAULT_LANGUAGE)
  })

  it('returns the default language for empty string', () => {
    expect(getSafeLanguage('')).toBe(DEFAULT_LANGUAGE)
  })

  it('normalizes BCP-47 tag to a supported language', () => {
    const result = getSafeLanguage('en-US')
    expect(
      (SUPPORTED_LANGUAGES as ReadonlyArray<string>).includes(result)
    ).toBe(true)
  })

  it('falls back to default for an unsupported language tag', () => {
    expect(getSafeLanguage('xx-UNKNOWN')).toBe(DEFAULT_LANGUAGE)
  })
})
