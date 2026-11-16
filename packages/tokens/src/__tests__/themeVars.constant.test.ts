import { describe, expect, test } from 'vitest'

import { themeVars } from '@/themeVars.constant'
import { sharedColors, ThemeEnum, themes } from '@/tokens.constant'

const kebab = (key: string) =>
  key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

type LeafType = [string[], string]

const leaves = (value: unknown, path: string[] = []): LeafType[] =>
  value !== null && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) =>
        leaves(child, [...path, key])
      )
    : [[path, String(value)]]

const isShared = (path: string[]) =>
  path.length === 1 && Object.hasOwn(sharedColors, path[0])

describe('theme variables', () => {
  test('maps every themed colour of each theme to its --c- variable', () => {
    Object.values(ThemeEnum).forEach((theme) => {
      expect(themeVars[theme]).toEqual(
        Object.fromEntries(
          leaves(themes[theme])
            .filter(([path]) => !isShared(path))
            .map(([path, value]) => [
              `--c-${path.map(kebab).join('-')}`,
              value
            ])
        )
      )
    })
  })

  test('carries no shared colour', () => {
    Object.values(ThemeEnum).forEach((theme) => {
      Object.keys(sharedColors).forEach((key) => {
        expect(Object.keys(themeVars[theme])).not.toContain(
          `--c-${kebab(key)}`
        )
      })
    })
  })
})
