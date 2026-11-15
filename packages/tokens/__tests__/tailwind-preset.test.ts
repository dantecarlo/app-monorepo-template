import { createRequire } from 'node:module'

import { describe, expect, test } from 'vitest'

import {
  fontSize,
  glyphSize,
  inset,
  layoutWidth,
  radius,
  spacing
} from '@/tokens.constant'

// The preset is CommonJS, which a TypeScript module cannot import; both apps
// load it with require(), as this test does.
const { theme } = createRequire(import.meta.url)('../tailwind-preset.cjs')
const { extend } = theme

const px = (value: number) => `${value}px`
const rem = (value: number) => `${value}rem`
const kebab = (key: string) =>
  key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

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
      'knob-inset': px(inset.knob),
      'pill-x': px(inset.pillX),
      'pill-y': px(inset.pillY)
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
})
