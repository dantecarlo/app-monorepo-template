import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

// The web package root, where package.json sits.
const APP_DIR = join(import.meta.dirname, '..', '..', '..')
const requireFromApp = createRequire(join(APP_DIR, 'package.json'))
const THEME_IMPORT = '@app/tokens/theme.css'

const readCss = () =>
  readFileSync(join(APP_DIR, 'src/app/globals.css'), 'utf8')

// The CSS with its comments removed, so prose never reads as a value.
const withoutComments = (css: string) =>
  css.replace(/\/\*[\s\S]*?\*\//g, '')

describe('web CSS entry', () => {
  test('imports the generated theme and loads no JS config', () => {
    const css = withoutComments(readCss())

    expect(css).toContain(`@import '${THEME_IMPORT}';`)
    expect(css).not.toContain('@config')
    expect(existsSync(join(APP_DIR, 'tailwind.config.cjs'))).toBe(false)
    expect(
      requireFromApp.resolve(THEME_IMPORT).replace(/\\/g, '/')
    ).toMatch(/\/packages\/tokens\/theme\.css$/)
  })

  test('reads every colour, shadow, font and motion value of its own rules from a generated variable', () => {
    const css = withoutComments(readCss())
    const theme = readFileSync(
      requireFromApp.resolve(THEME_IMPORT),
      'utf8'
    )
    const declared = new Set(
      [...theme.matchAll(/(--[\w-]+):/g)].map(([, name]) => name)
    )
    const read = [...css.matchAll(/var\((--[\w-]+)/g)].map(
      ([, name]) => name
    )

    expect(read.length).toBeGreaterThan(0)
    expect(read.filter((name) => !declared.has(name))).toEqual([])
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(css).not.toMatch(/\b(rgba?|hsla?|oklch)\(/i)
    expect(css).not.toMatch(/--(c|color|shadow|font|text|spacing)-[\w-]+:/)
  })
})
