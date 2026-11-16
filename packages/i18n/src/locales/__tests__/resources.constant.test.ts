import { describe, expect, test } from 'vitest'

import { SUPPORTED_LANGUAGES } from '@/locales/i18n.constant'
import { resources } from '@/locales/resources.constant'

interface ICollectLeafPathsParams {
  obj: Record<string, unknown>
  prefix?: string
}

// Collect all dot-separated leaf paths from a nested object
const collectLeafPaths = ({
  obj,
  prefix = ''
}: ICollectLeafPathsParams): string[] => {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return collectLeafPaths({
        obj: value as Record<string, unknown>,
        prefix: path
      })
    }
    return [path]
  })
}

const leafPathsByLanguage = Object.entries(resources).map(
  ([language, { translation }]) => ({
    language,
    paths: new Set(
      collectLeafPaths({
        obj: translation as unknown as Record<string, unknown>
      })
    )
  })
)

describe('catalog parity', () => {
  test('every catalog holds every key another catalog has', () => {
    const missing = leafPathsByLanguage.flatMap((catalog) =>
      leafPathsByLanguage
        .filter((other) => other.language !== catalog.language)
        .flatMap((other) =>
          [...other.paths]
            .filter((path) => !catalog.paths.has(path))
            .map((path) => `${catalog.language} lacks ${path}`)
        )
    )

    expect(missing).toEqual([])
  })

  test('holds a catalog for every supported language', () => {
    expect(Object.keys(resources).sort()).toEqual(
      [...SUPPORTED_LANGUAGES].sort()
    )
  })
})
