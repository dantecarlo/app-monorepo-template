import { createRequire } from 'node:module'

import { describe, expect, test } from 'vitest'

import {
  fontFallback,
  fontFamily,
  fontSize,
  glyphSize,
  inset,
  layoutWidth,
  radius,
  shadows,
  spacing,
  themes
} from '@/tokens.constant'

// The preset is CommonJS, which a TypeScript module cannot import; both apps
// load it with require(), as this test does.
const { theme } = createRequire(import.meta.url)('../tailwind-preset.cjs')
const { extend } = theme

const px = (value: number) => `${value}px`
const rem = (value: number) => `${value}rem`
const kebab = (key: string) =>
  key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

// Tailwind's own flattening of a colour palette: a nested key joins its
// parent with a dash, and DEFAULT names the parent itself.
const flattenColors = (
  palette: Record<string, unknown>,
  prefix = ''
): [string, string][] =>
  Object.entries(palette).flatMap(([key, value]) => {
    const name =
      key === 'DEFAULT' ? prefix : prefix ? `${prefix}-${key}` : key
    return typeof value === 'object' && value !== null
      ? flattenColors(value as Record<string, unknown>, name)
      : [[name, String(value)]]
  })

type LeafType = [string[], string]

const leaves = (value: unknown, path: string[] = []): LeafType[] =>
  value !== null && typeof value === 'object'
    ? Object.entries(value).flatMap(([key, child]) =>
        leaves(child, [...path, key])
      )
    : [[path, String(value)]]

const mapValues = ({
  format,
  scale
}: {
  format: (value: number) => string
  scale: Record<string, number>
}) =>
  Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [
      kebab(key),
      format(value)
    ])
  )

describe('tailwind preset', () => {
  test('the preset carries every scale token as a CSS length', () => {
    expect(extend.spacing).toEqual({
      ...mapValues({ format: px, scale: spacing }),
      ...mapValues({ format: px, scale: inset })
    })
    expect(extend.borderRadius).toEqual(
      mapValues({ format: px, scale: radius })
    )
    expect(extend.maxWidth).toEqual(
      mapValues({ format: rem, scale: layoutWidth })
    )
    expect(extend.fontSize).toEqual({
      ...Object.fromEntries(
        Object.entries(fontSize).map(([key, { lineHeight, size }]) => [
          kebab(key),
          [px(size), { lineHeight: px(lineHeight) }]
        ])
      ),
      ...mapValues({ format: px, scale: glyphSize })
    })
  })

  test('the preset carries every colour of the dark theme', () => {
    expect(Object.fromEntries(flattenColors(extend.colors))).toEqual(
      Object.fromEntries(
        leaves(themes.dark).map(([path, value]) => [
          path.map(kebab).join('-'),
          value
        ])
      )
    )
  })

  test('the preset writes each font family before its fallback', () => {
    expect(extend.fontFamily).toEqual(
      Object.fromEntries(
        Object.entries(fontFamily).map(([key, family]) => [
          kebab(key),
          [family, fontFallback]
        ])
      )
    )
  })

  test('the preset carries every shadow of the source', () => {
    expect(extend.boxShadow).toEqual(
      Object.fromEntries(
        Object.entries(shadows).map(([key, value]) => [kebab(key), value])
      )
    )
  })
})
