import { describe, expect, test } from 'vitest'

import en from '@/locales/en.json'
import es from '@/locales/es.json'

// Collect all dot-separated leaf paths from a nested object
const collectLeafPaths = (
  obj: Record<string, unknown>,
  prefix = ''
): string[] => {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return collectLeafPaths(value as Record<string, unknown>, path)
    }
    return [path]
  })
}

describe('catalog parity', () => {
  test('es.json and en.json have identical key sets', () => {
    const esPaths = collectLeafPaths(
      es as unknown as Record<string, unknown>
    ).sort()
    const enPaths = collectLeafPaths(
      en as unknown as Record<string, unknown>
    ).sort()
    expect(esPaths).toEqual(enPaths)
  })
})
