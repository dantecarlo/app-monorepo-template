#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-theme-sync — light/dark token drift guard.
//
// The design system carries the SAME color values in three hand-maintained
// places that cannot import each other:
//
//   1. packages/tokens/src/tokens.constant.ts   themes.dark / themes.light  (TS)
//   2. packages/tokens/tailwind-preset.cjs       theme.extend.colors        (CJS, mobile)
//   3. apps/web/src/app/globals.css              [data-theme] --c-* vars     (CSS, web)
//
// Light + dark doubles that duplication — the #1 risk of the theme system.
// This check re-derives every theme-variant semantic color from the TS source
// of truth and asserts the other two copies match, per theme. The glass
// fill/stroke recipe is asserted explicitly because it is the surface that
// silently breaks when only one copy is edited.
//
// Theme-INVARIANT tokens (the accent ramp, cool-glow) are intentionally not
// compared per-theme — they are single-valued by design.
//
// Usage:
//   node scripts/verify-theme-sync.mjs
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

const TOKENS_TS = resolve(
  REPO_ROOT,
  'packages/tokens/src/tokens.constant.ts'
)
const PRESET_CJS = resolve(
  REPO_ROOT,
  'packages/tokens/tailwind-preset.cjs'
)
const GLOBALS_CSS = resolve(REPO_ROOT, 'apps/web/src/app/globals.css')

// ---------------------------------------------------------------------------
// Theme-variant semantic tokens. Each entry maps the THREE shapes of the same
// value: the TS leaf path (themes.<theme>.<tsPath>), the CSS indirection var
// (--<cssVar>) inside the [data-theme] block, and the preset path
// (theme.extend.colors.<presetPath>). The preset is single-valued (mobile
// flips via NativeWind colorScheme + useThemeTokens), so it is compared
// against the DARK theme only — but the check still proves the preset has not
// drifted from the canonical dark values.
// ---------------------------------------------------------------------------
const VARIANT_TOKENS = [
  { ts: ['bg', 'base'], cssVar: 'bg-base', preset: ['bg', 'base'] },
  { ts: ['bg', 'raised'], cssVar: 'bg-raised', preset: ['bg', 'raised'] },
  { ts: ['glass', 'fill'], cssVar: 'glass-fill', preset: ['glass', 'fill'] },
  {
    ts: ['glass', 'stroke'],
    cssVar: 'glass-stroke',
    preset: ['glass', 'stroke']
  },
  { ts: ['divider'], cssVar: 'divider', preset: ['divider'] },
  {
    ts: ['text', 'primary'],
    cssVar: 'text-primary',
    preset: ['text', 'primary']
  },
  {
    ts: ['text', 'secondary'],
    cssVar: 'text-secondary',
    preset: ['text', 'secondary']
  },
  {
    ts: ['text', 'tertiary'],
    cssVar: 'text-tertiary',
    preset: ['text', 'tertiary']
  },
  {
    ts: ['text', 'disabled'],
    cssVar: 'text-disabled',
    preset: ['text', 'disabled']
  },
  {
    ts: ['accentSurface'],
    cssVar: 'accent-surface',
    preset: ['accent', 'surface']
  },
  {
    ts: ['accentText'],
    cssVar: 'accent-text',
    preset: ['accent', 'text']
  },
  { ts: ['success'], cssVar: 'success', preset: ['success', 'DEFAULT'] },
  {
    ts: ['successText'],
    cssVar: 'success-text',
    preset: ['success', 'text']
  },
  {
    ts: ['successTint'],
    cssVar: 'success-tint',
    preset: ['success', 'tint']
  },
  { ts: ['warning'], cssVar: 'warning', preset: ['warning', 'DEFAULT'] },
  {
    ts: ['warningText'],
    cssVar: 'warning-text',
    preset: ['warning', 'text']
  },
  {
    ts: ['warningTint'],
    cssVar: 'warning-tint',
    preset: ['warning', 'tint']
  },
  { ts: ['danger'], cssVar: 'danger', preset: ['danger', 'DEFAULT'] },
  {
    ts: ['dangerText'],
    cssVar: 'danger-text',
    preset: ['danger', 'text']
  },
  { ts: ['dangerTint'], cssVar: 'danger-tint', preset: ['danger', 'tint'] },
  {
    ts: ['neutralTint'],
    cssVar: 'neutral-tint',
    preset: ['neutral', 'tint']
  },
  { ts: ['scrim'], cssVar: 'scrim', preset: ['scrim'] },
  { ts: ['knob', 'off'], cssVar: 'knob-off', preset: ['knob', 'off'] },
  { ts: ['knob', 'on'], cssVar: 'knob-on', preset: ['knob', 'on'] }
]

const THEMES = ['dark', 'light']

// ---------------------------------------------------------------------------
// Color normalization — compare colors by VALUE, not formatting. Collapses
// whitespace, lowercases hex, and canonicalizes every numeric component so
// 'rgba(0,0,0,0.60)' === 'rgba(0, 0, 0, 0.6)' and '#FFFFFF' === '#ffffff'.
// Numeric canonicalization is what makes the guard robust to trailing-zero
// alpha differences between the TS source and CSS authoring.
// ---------------------------------------------------------------------------
const canonicalizeNumbers = (text) =>
  text.replace(/-?\d*\.?\d+/g, (n) => String(Number(n)))

const normalizeColor = (raw) =>
  canonicalizeNumbers(String(raw).trim().toLowerCase().replace(/\s+/g, ''))

// ---------------------------------------------------------------------------
// Source readers
// ---------------------------------------------------------------------------

const readSource = (path, label) => {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    throw new Error(`verify-theme-sync: cannot read ${label} at ${path}`)
  }
}

// Slice the body of a named object literal: `const <name> = { ... } as const`
// or `<name>: { ... }`. Brace-balanced so nested objects are kept whole.
const sliceObjectBody = ({ source, anchorRe }) => {
  const match = anchorRe.exec(source)
  if (!match) return null
  const open = source.indexOf('{', match.index + match[0].length - 1)
  if (open === -1) return null
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

// Read a (possibly nested) string value out of an object-literal body.
const readNestedValue = ({ body, path }) => {
  let scope = body
  for (let i = 0; i < path.length; i += 1) {
    const key = path[i]
    const isLeaf = i === path.length - 1
    if (isLeaf) {
      const leafRe = new RegExp(`${key}\\s*:\\s*'([^']*)'`)
      const leaf = leafRe.exec(scope)
      return leaf ? leaf[1] : null
    }
    const nested = sliceObjectBody({
      source: scope,
      anchorRe: new RegExp(`${key}\\s*:\\s*\\{`)
    })
    if (nested === null) return null
    scope = nested
  }
  return null
}

// Pull every --c-<name>: <value>; declaration inside a [data-theme='<theme>']
// (or :root) block of globals.css into a { cssVar: value } map.
const readCssThemeVars = ({ source, theme }) => {
  const selector =
    theme === 'dark'
      ? /\[data-theme='dark'\]\s*\{/
      : /\[data-theme='light'\]\s*\{/
  const open = selector.exec(source)
  if (!open) return null
  const start = source.indexOf('{', open.index)
  let depth = 0
  let end = -1
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end === -1) return null
  const block = source.slice(start + 1, end)
  const vars = {}
  const declRe = /--c-([a-z-]+)\s*:\s*([^;]+);/g
  let decl
  while ((decl = declRe.exec(block)) !== null) {
    vars[decl[1]] = decl[2]
  }
  return vars
}

// ---------------------------------------------------------------------------
// Build the canonical maps from each source.
// ---------------------------------------------------------------------------

const tokensSource = readSource(TOKENS_TS, 'tokens.constant.ts')
const presetSource = readSource(PRESET_CJS, 'tailwind-preset.cjs')
const cssSource = readSource(GLOBALS_CSS, 'globals.css')

const themeBodies = {
  dark: sliceObjectBody({
    source: tokensSource,
    anchorRe: /const darkColors\s*=\s*\{/
  }),
  light: sliceObjectBody({
    source: tokensSource,
    anchorRe: /const lightColors\s*=\s*\{/
  })
}

const presetColorsBody = sliceObjectBody({
  source: presetSource,
  anchorRe: /colors\s*:\s*\{/
})

const cssVars = {
  dark: readCssThemeVars({ source: cssSource, theme: 'dark' }),
  light: readCssThemeVars({ source: cssSource, theme: 'light' })
}

const failures = []

const requireFound = (value, where) => {
  if (value === null || value === undefined) {
    failures.push(`missing value: ${where}`)
    return false
  }
  return true
}

if (!themeBodies.dark) failures.push('tokens.constant.ts: darkColors not found')
if (!themeBodies.light)
  failures.push('tokens.constant.ts: lightColors not found')
if (!presetColorsBody)
  failures.push('tailwind-preset.cjs: theme.extend.colors not found')
if (!cssVars.dark)
  failures.push("globals.css: [data-theme='dark'] block not found")
if (!cssVars.light)
  failures.push("globals.css: [data-theme='light'] block not found")

// ---------------------------------------------------------------------------
// Compare per theme.
// ---------------------------------------------------------------------------

if (failures.length === 0) {
  for (const theme of THEMES) {
    for (const token of VARIANT_TOKENS) {
      const tsRaw = readNestedValue({
        body: themeBodies[theme],
        path: token.ts
      })
      const cssRaw = cssVars[theme][token.cssVar]
      const id = `${theme}.${token.ts.join('.')}`

      if (!requireFound(tsRaw, `tokens ${id}`)) continue
      if (!requireFound(cssRaw, `globals.css --c-${token.cssVar} (${theme})`))
        continue

      const tsValue = normalizeColor(tsRaw)
      const cssValue = normalizeColor(cssRaw)

      if (tsValue !== cssValue) {
        failures.push(
          `CSS drift [${id}]: tokens="${tsRaw}" vs globals.css --c-${token.cssVar}="${cssRaw}"`
        )
      }

      // The preset is single-valued — compare it against the dark canon only.
      if (theme === 'dark') {
        const presetRaw = readNestedValue({
          body: presetColorsBody,
          path: token.preset
        })
        if (!requireFound(presetRaw, `preset ${token.preset.join('.')}`)) {
          continue
        }
        if (normalizeColor(presetRaw) !== tsValue) {
          failures.push(
            `PRESET drift [${id}]: tokens="${tsRaw}" vs tailwind-preset.cjs="${presetRaw}"`
          )
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (failures.length === 0) {
  console.log(
    `verify-theme-sync: PASS — ${VARIANT_TOKENS.length} token(s) × ${THEMES.length} theme(s) ` +
      'in sync across tokens.constant.ts, tailwind-preset.cjs, and globals.css.'
  )
  process.exit(0)
}

console.error(
  `\nverify-theme-sync: FAIL — ${failures.length} drift / lookup issue(s):\n`
)
for (const line of failures) {
  console.error(`  • ${line}`)
}
console.error(
  '\nFix: the three token copies must carry identical values per theme.\n' +
    '  1. packages/tokens/src/tokens.constant.ts (themes.dark / themes.light)\n' +
    '  2. packages/tokens/tailwind-preset.cjs (theme.extend.colors — dark canon)\n' +
    "  3. apps/web/src/app/globals.css ([data-theme] --c-* vars)\n"
)
process.exit(1)
