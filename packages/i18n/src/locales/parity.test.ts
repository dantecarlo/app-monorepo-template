import { describe, expect, test } from 'vitest'

import en from './en'
import es from './es'

const flattenKeys = (
  obj: Record<string, unknown>,
  prefix = ''
): string[] =>
  Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return typeof value === 'object' && value !== null
      ? flattenKeys(value as Record<string, unknown>, fullKey)
      : [fullKey]
  })

describe('i18n catalog parity', () => {
  test('en and es have identical keys', () => {
    const enKeys = flattenKeys(
      en as unknown as Record<string, unknown>
    ).sort()
    const esKeys = flattenKeys(
      es as unknown as Record<string, unknown>
    ).sort()
    expect(enKeys).toEqual(esKeys)
  })
})
