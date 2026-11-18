import { readdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { fontSize, glyphSize, motion, themeNames } from '@app/tokens'
import { getDefaultConfig, twMerge } from 'tailwind-merge'
import { compile } from 'tailwindcss'
import { describe, expect, expectTypeOf, test } from 'vitest'

import {
  tv,
  type VariantUnionsType
} from '@/components/ui/variants.helper'

// The Tailwind key of a token, as the tokens preset writes it: the token
// amountHero is the utility text-amount-hero.
const kebab = (key: string) =>
  key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

const TOKEN_FONT_SIZE_CLASSES = [
  ...Object.keys(fontSize),
  ...Object.keys(glyphSize)
].map((key) => `text-${kebab(key)}`)

const UI_DIR = join(import.meta.dirname, '..')

// One class string resolved through the shared tv, as a block's base.
const merged = (classes: string) => tv({ base: classes })()

// A utility of each namespace of the theme names: <utility>-<name> is the
// class a token of that namespace makes.
const NAMESPACE_UTILITY: Record<string, string> = {
  color: 'bg',
  container: 'max-w',
  ease: 'ease',
  font: 'font',
  radius: 'rounded',
  shadow: 'shadow',
  spacing: 'p',
  text: 'text'
}

// Two classes of one utility that carry token names, and what stays: one
// pair per namespace of the theme names.
const TOKEN_PAIRS: [string, string][] = [
  ['p-sm p-lg', 'p-lg'],
  ['px-pill-x px-lg', 'px-lg'],
  ['px-pill-x p-lg', 'p-lg'],
  ['py-pill-y py-sm', 'py-sm'],
  ['gap-xs gap-xl', 'gap-xl'],
  ['top-knob-inset top-sm', 'top-sm'],
  ['w-content w-dialog', 'w-dialog'],
  ['max-w-narrow max-w-wide', 'max-w-wide'],
  ['rounded-md rounded-full', 'rounded-full'],
  ['shadow-rim-light shadow-none', 'shadow-none'],
  ['ease-shimmer ease-linear', 'ease-linear'],
  ['font-body font-display', 'font-display'],
  ['text-caption text-amount-hero', 'text-amount-hero'],
  ['bg-bg-base bg-accent-tint', 'bg-accent-tint']
]

// Pairs tailwind-merge resolved before the token names were registered.
const RESOLVED_PAIRS: [string, string][] = [
  ['rounded-sm rounded-xl', 'rounded-xl'],
  ['rounded-lg rounded-full', 'rounded-full'],
  ['font-body font-display', 'font-display'],
  ['font-display font-bold', 'font-display font-bold'],
  ['text-accent text-button', 'text-accent text-button'],
  ['text-caption text-title', 'text-title'],
  ['bg-bg-base bg-accent', 'bg-accent'],
  ['text-text-primary text-accent-text', 'text-accent-text'],
  ['shadow-card shadow-accent-glow', 'shadow-accent-glow'],
  ['duration-300 duration-500', 'duration-500'],
  ['p-2 p-4', 'p-4']
]

const require = createRequire(import.meta.url)

// The web theme as the web app compiles it: Tailwind, then the generated
// tokens (src/app/globals.css imports both).
const compileWebTheme = () => {
  const theme = require.resolve('@app/tokens/theme.css')
  const tailwind = require.resolve('tailwindcss/index.css')
  const css = ["@import 'tailwindcss';", readFileSync(theme, 'utf8')]
  return compile(css.join('\n'), {
    base: dirname(theme),
    // eslint-disable-next-line local/single-object-params -- mirrors the loadStylesheet(id, base) callback shape of Tailwind's compile()
    loadStylesheet: async (id, base) => {
      const path =
        id === 'tailwindcss'
          ? tailwind
          : require.resolve(id, { paths: [base] })
      return {
        base: dirname(path),
        content: readFileSync(path, 'utf8'),
        path
      }
    }
  })
}

const styleFiles = () =>
  readdirSync(UI_DIR, { encoding: 'utf8', recursive: true })
    .filter((path) => path.endsWith('.style.ts'))
    .map((path) => ({
      path,
      source: readFileSync(join(UI_DIR, path), 'utf8')
    }))

describe('variants helper', () => {
  test('keeps every token font size beside a text colour', () => {
    for (const size of TOKEN_FONT_SIZE_CLASSES) {
      const variants = tv({
        base: `${size} text-text-primary`,
        variants: { tone: { success: 'text-success-text' } }
      })

      expect(variants({ tone: 'success' })).toBe(
        `${size} text-success-text`
      )
    }
  })

  test('lets a later token font size replace an earlier one', () => {
    const variants = tv({
      base: 'text-button text-accent-ink',
      variants: { size: { lg: 'text-heading' } }
    })

    expect(variants({ size: 'lg' })).toBe('text-accent-ink text-heading')
  })

  test('merges every other class as tailwind-merge does by default', () => {
    const base = 'px-2 text-text-primary bg-bg-base'
    const tone = 'px-4 text-success-text rounded-md'
    const variants = tv({ base, variants: { tone: { success: tone } } })

    expect(variants({ tone: 'success' })).toBe(twMerge(base, tone))
  })

  test('is the tv every ui block builds its variants with', () => {
    const files = styleFiles()
    const builders = files.filter(({ source }) => source.includes('tv('))
    const direct = files
      .filter(({ source }) => source.includes("from 'tailwind-variants'"))
      .map(({ path }) => path)

    expect(builders).not.toHaveLength(0)
    expect(direct).toEqual([])
  })

  test('keeps only the last of two classes of one utility that carry token names', () => {
    expect(TOKEN_PAIRS.map(([classes]) => merged(classes))).toEqual(
      TOKEN_PAIRS.map(([, kept]) => kept)
    )
  })

  test('keeps a shadow size beside a shadow colour, and the last of two shadow sizes', () => {
    expect(merged('shadow-card shadow-accent')).toBe(
      'shadow-card shadow-accent'
    )
    expect(merged('shadow-accent shadow-card')).toBe(
      'shadow-accent shadow-card'
    )
    expect(merged('shadow-accent-glow shadow-card')).toBe('shadow-card')
  })

  test('resolves as before the pairs tailwind-merge already resolved', () => {
    expect(RESOLVED_PAIRS.map(([classes]) => merged(classes))).toEqual(
      RESOLVED_PAIRS.map(([, kept]) => kept)
    )
  })

  test('registers every theme name of @app/tokens under a tailwind-merge theme key', () => {
    const namespaces = Object.keys(themeNames)
    const themeKeys = Object.keys(getDefaultConfig().theme)
    // Each name of a namespace after the one before it: only it stays.
    const pairs = Object.entries(themeNames).flatMap(
      ([namespace, names]) =>
        names.slice(1).map((name, index): [string, string] => {
          const utility = NAMESPACE_UTILITY[namespace]
          return [
            `${utility}-${names[index]} ${utility}-${name}`,
            `${utility}-${name}`
          ]
        })
    )

    expect(namespaces.filter((key) => !themeKeys.includes(key))).toEqual(
      []
    )
    expect(
      namespaces.filter((key) => !Object.hasOwn(NAMESPACE_UTILITY, key))
    ).toEqual([])
    expect(pairs.map(([classes]) => merged(classes))).toEqual(
      pairs.map(([, kept]) => kept)
    )
  })

  test("lists only theme names the web's Tailwind turns into a utility", async () => {
    const compiler = await compileWebTheme()
    // A namespace the table has no utility for compiles as its own name.
    const listed = Object.entries(themeNames).flatMap(
      ([namespace, names]) =>
        names.map(
          (name) => `${NAMESPACE_UTILITY[namespace] ?? namespace}-${name}`
        )
    )
    const durations = Object.keys(motion.duration).map(
      (key) => `duration-${kebab(key)}`
    )
    const css = compiler.build([...listed, ...durations, 'duration-300'])
    // The class of every rule the build wrote.
    const rules = new Set(
      [...css.matchAll(/\.([\w-]+) \{/gu)].map(([, name]) => name)
    )
    const hasRule = (candidate: string) => rules.has(candidate)

    expect(listed.filter((candidate) => !hasRule(candidate))).toEqual([])
    expect(hasRule('duration-300')).toBe(true)
    expect(durations.filter(hasRule)).toEqual([])
  })

  test('reads the variants a tv config takes, and tells a union that drops or adds an option from them', () => {
    const probe = tv({
      variants: {
        size: { lg: 'p-lg', sm: 'p-sm' },
        wide: { true: 'w-full' }
      }
    })

    expect(probe({ size: 'lg', wide: true })).toBe('p-lg w-full')
    expectTypeOf<VariantUnionsType<typeof probe>>().toEqualTypeOf<{
      size: 'lg' | 'sm'
      wide: boolean
    }>()
    expectTypeOf<VariantUnionsType<typeof probe>>().not.toEqualTypeOf<{
      size: 'lg'
      wide: boolean
    }>()
    expectTypeOf<VariantUnionsType<typeof probe>>().not.toEqualTypeOf<{
      size: 'lg' | 'md' | 'sm'
      wide: boolean
    }>()
    expectTypeOf<VariantUnionsType<typeof probe>>().not.toEqualTypeOf<{
      size: 'lg' | 'sm'
    }>()
  })
})
