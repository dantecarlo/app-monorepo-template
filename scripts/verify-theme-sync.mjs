#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-theme-sync — light/dark token drift guard.
//
// The design system carries the SAME color values in three hand-maintained
// places that cannot import each other:
//
//   1. packages/tokens/src/tokens.constant.ts   themes.dark / themes.light  (TS)
//   2. packages/tokens/tailwind-preset.cjs       theme.extend.colors        (CJS)
//   3. apps/web/src/app/globals.css              [data-theme] --c-* vars and
//                                                @theme --color-* values    (CSS)
//
// Light + dark doubles that duplication — the #1 risk of the theme system.
// This check re-derives every color of both themes from the TS source of
// truth and asserts the other two copies match. A theme-variant color is read
// from the CSS block of its theme; a theme-invariant one (the accent ramp,
// cool-glow) from the @theme block, which both themes share, so a light value
// that drifts from the dark one is caught too. The preset is single-valued
// (mobile flips at runtime via useThemeTokens), so it is compared against the
// dark theme only.
//
// Usage:
//   node scripts/verify-theme-sync.mjs [--root <dir>]
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { defineGate, reportGate } from './gate/gate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

export const SOURCES = Object.freeze({
  css: 'apps/web/src/app/globals.css',
  preset: 'packages/tokens/tailwind-preset.cjs',
  tokens: 'packages/tokens/src/tokens.constant.ts'
})

// ---------------------------------------------------------------------------
// Theme-variant semantic tokens. Each entry maps the THREE shapes of the same
// value: the TS leaf path (themes.<theme>.<tsPath>), the CSS indirection var
// (--c-<cssVar>) inside the [data-theme] block, and the preset path
// (theme.extend.colors.<presetPath>).
// ---------------------------------------------------------------------------
const VARIANT_TOKENS = [
  { cssVar: 'bg-base', preset: ['bg', 'base'], ts: ['bg', 'base'] },
  { cssVar: 'bg-raised', preset: ['bg', 'raised'], ts: ['bg', 'raised'] },
  {
    cssVar: 'glass-fill',
    preset: ['glass', 'fill'],
    ts: ['glass', 'fill']
  },
  {
    cssVar: 'glass-stroke',
    preset: ['glass', 'stroke'],
    ts: ['glass', 'stroke']
  },
  { cssVar: 'divider', preset: ['divider'], ts: ['divider'] },
  {
    cssVar: 'text-primary',
    preset: ['text', 'primary'],
    ts: ['text', 'primary']
  },
  {
    cssVar: 'text-secondary',
    preset: ['text', 'secondary'],
    ts: ['text', 'secondary']
  },
  {
    cssVar: 'text-tertiary',
    preset: ['text', 'tertiary'],
    ts: ['text', 'tertiary']
  },
  {
    cssVar: 'text-disabled',
    preset: ['text', 'disabled'],
    ts: ['text', 'disabled']
  },
  {
    cssVar: 'accent-surface',
    preset: ['accent', 'surface'],
    ts: ['accentSurface']
  },
  {
    cssVar: 'accent-text',
    preset: ['accent', 'text'],
    ts: ['accentText']
  },
  { cssVar: 'success', preset: ['success', 'DEFAULT'], ts: ['success'] },
  {
    cssVar: 'success-text',
    preset: ['success', 'text'],
    ts: ['successText']
  },
  {
    cssVar: 'success-tint',
    preset: ['success', 'tint'],
    ts: ['successTint']
  },
  { cssVar: 'warning', preset: ['warning', 'DEFAULT'], ts: ['warning'] },
  {
    cssVar: 'warning-text',
    preset: ['warning', 'text'],
    ts: ['warningText']
  },
  {
    cssVar: 'warning-tint',
    preset: ['warning', 'tint'],
    ts: ['warningTint']
  },
  {
    cssVar: 'warning-stroke',
    preset: ['warning', 'stroke'],
    ts: ['warningStroke']
  },
  { cssVar: 'danger', preset: ['danger', 'DEFAULT'], ts: ['danger'] },
  {
    cssVar: 'danger-text',
    preset: ['danger', 'text'],
    ts: ['dangerText']
  },
  {
    cssVar: 'danger-tint',
    preset: ['danger', 'tint'],
    ts: ['dangerTint']
  },
  {
    cssVar: 'neutral-tint',
    preset: ['neutral', 'tint'],
    ts: ['neutralTint']
  },
  { cssVar: 'scrim', preset: ['scrim'], ts: ['scrim'] },
  { cssVar: 'knob-off', preset: ['knob', 'off'], ts: ['knob', 'off'] },
  { cssVar: 'knob-on', preset: ['knob', 'on'], ts: ['knob', 'on'] }
]

// ---------------------------------------------------------------------------
// Theme-invariant colors: one value both themes share, written once as a
// literal in the CSS @theme block (--color-<cssVar>). Each theme's TS value is
// compared with it, so a light value that drifts from the shared one fails.
// ---------------------------------------------------------------------------
const INVARIANT_TOKENS = [
  { cssVar: 'accent', preset: ['accent', 'DEFAULT'], ts: ['accent'] },
  {
    cssVar: 'accent-light',
    preset: ['accent', 'light'],
    ts: ['accentLight']
  },
  { cssVar: 'accent-ink', preset: ['accent', 'ink'], ts: ['accentInk'] },
  {
    cssVar: 'accent-tint',
    preset: ['accent', 'tint'],
    ts: ['accentTint']
  },
  { cssVar: 'cool-glow', preset: ['cool-glow'], ts: ['coolGlow'] }
]

const THEMES = ['dark', 'light']

// ---------------------------------------------------------------------------
// Color normalization — compare colors by VALUE, not formatting. Collapses
// whitespace, lowercases hex, and canonicalizes every numeric component so
// 'rgba(0,0,0,0.60)' === 'rgba(0, 0, 0, 0.6)' and '#FFFFFF' === '#ffffff'.
// ---------------------------------------------------------------------------
const canonicalizeNumbers = (text) =>
  text.replace(/-?\d*\.?\d+/g, (n) => String(Number(n)))

const normalizeColor = (raw) =>
  canonicalizeNumbers(String(raw).trim().toLowerCase().replace(/\s+/g, ''))

// ---------------------------------------------------------------------------
// Source readers
// ---------------------------------------------------------------------------

// The body of the block that opens at `open` (the index of its `{`),
// brace-balanced so nested blocks are kept whole.
const blockBodyAt = ({ open, source }) => {
  let depth = 0
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i]
    if (ch === '{') depth += 1
    else if (ch === '}') {
      depth -= 1
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  return null
}

// Slice the body of a named object literal or CSS block.
const sliceBody = ({ anchorRe, source }) => {
  const match = anchorRe.exec(source)
  if (!match) return null
  const open = source.indexOf('{', match.index + match[0].length - 1)
  return open === -1 ? null : blockBodyAt({ open, source })
}

// A key of an object literal, bare or quoted, and not the tail of a longer
// key (`ink` never matches `pink`).
const keyPattern = (key) => `(?<![\\w-])['"]?${key}['"]?\\s*:`

// Read a (possibly nested) string value out of an object-literal body.
const readNestedValue = ({ body, path }) => {
  let scope = body
  for (let i = 0; i < path.length; i += 1) {
    const key = path[i]
    const isLeaf = i === path.length - 1
    if (isLeaf) {
      const leaf = new RegExp(`${keyPattern(key)}\\s*'([^']*)'`).exec(
        scope
      )
      return leaf ? leaf[1] : null
    }
    const nested = sliceBody({
      anchorRe: new RegExp(`${keyPattern(key)}\\s*\\{`),
      source: scope
    })
    if (nested === null) return null
    scope = nested
  }
  return null
}

// A theme value: read from the theme's own body, else from an object the
// body spreads (`...accentRamp`), as the TS source shares the accent ramp.
const readThemeValue = ({ path, theme }) => {
  const own = readNestedValue({ body: theme.body, path })
  if (own !== null) return own
  for (const spread of theme.spreads) {
    const value = readNestedValue({ body: spread, path })
    if (value !== null) return value
  }
  return null
}

const spreadBodies = ({ body, source }) =>
  [...body.matchAll(/\.\.\.(\w+)/g)]
    .map(([, name]) =>
      sliceBody({
        anchorRe: new RegExp(`const ${name}\\s*=\\s*\\{`),
        source
      })
    )
    .filter((spread) => spread !== null)

// Every `--<prefix><name>: <value>;` declaration of a CSS block body.
const readCssVars = ({ body, prefix }) =>
  Object.fromEntries(
    [
      ...body.matchAll(
        new RegExp(`--${prefix}([a-z-]+)\\s*:\\s*([^;]+);`, 'g')
      )
    ].map(([, name, value]) => [name, value])
  )

const THEME_BLOCK_RE = {
  dark: /\[data-theme='dark'\]\s*\{/,
  light: /\[data-theme='light'\]\s*\{/
}

export const collectContext = ({ root }) => {
  const read = (path) => readFileSync(join(root, path), 'utf8')
  const tokensSource = read(SOURCES.tokens)
  const cssSource = read(SOURCES.css)
  const themeBlocks = Object.fromEntries(
    THEMES.map((theme) => [
      theme,
      sliceBody({ anchorRe: THEME_BLOCK_RE[theme], source: cssSource })
    ])
  )
  const sharedBlock = sliceBody({
    anchorRe: /@theme\s*\{/,
    source: cssSource
  })
  const themeBody = (name) =>
    sliceBody({
      anchorRe: new RegExp(`const ${name}Colors\\s*=\\s*\\{`),
      source: tokensSource
    })
  return {
    cssShared:
      sharedBlock === null
        ? null
        : readCssVars({ body: sharedBlock, prefix: 'color-' }),
    cssVars: Object.fromEntries(
      THEMES.map((theme) => [
        theme,
        themeBlocks[theme] === null
          ? null
          : readCssVars({ body: themeBlocks[theme], prefix: 'c-' })
      ])
    ),
    presetColors: sliceBody({
      anchorRe: /colors\s*:\s*\{/,
      source: read(SOURCES.preset)
    }),
    themeBodies: Object.fromEntries(
      THEMES.map((theme) => {
        const body = themeBody(theme)
        return [
          theme,
          body === null
            ? null
            : {
                body,
                spreads: spreadBodies({ body, source: tokensSource })
              }
        ]
      })
    )
  }
}

const missingSources = ({
  cssShared,
  cssVars,
  presetColors,
  themeBodies
}) => [
  ...THEMES.filter((theme) => !themeBodies[theme]).map(
    (theme) => `tokens.constant.ts: ${theme}Colors not found`
  ),
  ...(presetColors
    ? []
    : ['tailwind-preset.cjs: theme.extend.colors not found']),
  ...THEMES.filter((theme) => !cssVars[theme]).map(
    (theme) => `globals.css: [data-theme='${theme}'] block not found`
  ),
  ...(cssShared ? [] : ['globals.css: @theme block not found'])
]

// The dark theme's value against the preset, the single-valued copy.
const comparePreset = ({ id, path, presetColors, tsRaw }) => {
  const presetRaw = readNestedValue({ body: presetColors, path })
  if (presetRaw === null)
    return [`missing value: preset ${path.join('.')}`]
  return normalizeColor(presetRaw) === normalizeColor(tsRaw)
    ? []
    : [
        `PRESET drift [${id}]: tokens="${tsRaw}" vs tailwind-preset.cjs="${presetRaw}"`
      ]
}

// One finding per theme-invariant color whose TS value, in either theme,
// differs from the shared CSS literal or, in the dark theme, from the preset.
const compareInvariantTokens = ({
  cssShared,
  presetColors,
  themeBodies
}) =>
  THEMES.flatMap((theme) =>
    INVARIANT_TOKENS.flatMap((token) => {
      const id = `${theme}.${token.ts.join('.')}`
      const tsRaw = readThemeValue({
        path: token.ts,
        theme: themeBodies[theme]
      })
      const cssRaw = cssShared[token.cssVar]
      if (tsRaw === null) return [`missing value: tokens ${id}`]
      if (cssRaw === undefined) {
        return [`missing value: globals.css --color-${token.cssVar}`]
      }
      const findings =
        normalizeColor(tsRaw) === normalizeColor(cssRaw)
          ? []
          : [
              `CSS drift [${id}]: tokens="${tsRaw}" vs globals.css --color-${token.cssVar}="${cssRaw}"`
            ]
      return theme === 'dark'
        ? [
            ...findings,
            ...comparePreset({
              id,
              path: token.preset,
              presetColors,
              tsRaw
            })
          ]
        : findings
    })
  )

// One finding per color whose copies disagree, or that a copy lacks.
const compareVariantTokens = ({ cssVars, presetColors, themeBodies }) =>
  THEMES.flatMap((theme) =>
    VARIANT_TOKENS.flatMap((token) => {
      const id = `${theme}.${token.ts.join('.')}`
      const tsRaw = readThemeValue({
        path: token.ts,
        theme: themeBodies[theme]
      })
      const cssRaw = cssVars[theme][token.cssVar]
      if (tsRaw === null) return [`missing value: tokens ${id}`]
      if (cssRaw === undefined) {
        return [
          `missing value: globals.css --c-${token.cssVar} (${theme})`
        ]
      }
      const findings =
        normalizeColor(tsRaw) === normalizeColor(cssRaw)
          ? []
          : [
              `CSS drift [${id}]: tokens="${tsRaw}" vs globals.css --c-${token.cssVar}="${cssRaw}"`
            ]
      return theme === 'dark'
        ? [
            ...findings,
            ...comparePreset({
              id,
              path: token.preset,
              presetColors,
              tsRaw
            })
          ]
        : findings
    })
  )

export const gate = defineGate({
  claims:
    'every color of tokens.constant.ts, in both themes, equals its ' +
    'globals.css copy (a themed one in its [data-theme] block, a ' +
    'theme-invariant one in @theme), and the dark theme equals ' +
    'tailwind-preset.cjs.',
  id: 'verify-theme-sync',
  notCovered:
    'the spacing, radius, type and shadow scales, which the preset and ' +
    'tokens.constant.ts each carry and nothing compares; and whether a ' +
    'color is the right one, which only review judges.',
  run: (context) => {
    const missing = missingSources(context)
    return missing.length > 0
      ? missing
      : [
          ...compareVariantTokens(context),
          ...compareInvariantTokens(context)
        ]
  }
})

const main = () => {
  const { values } = parseArgs({
    options: { root: { default: REPO_ROOT, type: 'string' } }
  })
  reportGate({
    context: collectContext({ root: resolve(values.root) }),
    denominator:
      `${VARIANT_TOKENS.length} theme-variant and ${INVARIANT_TOKENS.length} ` +
      `theme-invariant color(s) × ${THEMES.length} theme(s) across ` +
      'tokens.constant.ts, tailwind-preset.cjs and globals.css',
    gate
  })
}

if (import.meta.main) main()
