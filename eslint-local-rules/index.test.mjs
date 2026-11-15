// ---------------------------------------------------------------------------
// RuleTester suite for the boundary and contract rules in ./index.mjs.
//
// Each rule gets planted violations (must report) and legitimate shapes (must
// stay silent). The rules are scoped by globs in eslint.config.mjs, so these
// cases judge only the detection; the glob wiring is proven by `pnpm lint`.
//
// Run: pnpm verify:lint-rules:test
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, describe, test } from 'node:test'

import { RuleTester } from 'eslint'
import checkFile from 'eslint-plugin-check-file'
import tseslint from 'typescript-eslint'

import { FILENAME_RULES } from '../eslint.rules.mjs'
import localRules from './index.mjs'
import { toSrcAlias } from './package-src-alias.detect.mjs'
import {
  FILE_KIND,
  isAllowlisted,
  positionsOnlyScope,
  tokenValuesScope
} from './style-positioning.detect.mjs'

RuleTester.describe = describe
RuleTester.it = test
RuleTester.itOnly = test.only

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    parser: tseslint.parser,
    sourceType: 'module'
  }
})

const { rules } = localRules

const invalid = ({ code, errors }) => ({
  code,
  errors: errors.map((messageId) => ({ messageId }))
})

ruleTester.run('core-import-boundary', rules['core-import-boundary'], {
  invalid: [
    invalid({
      code: "import { AppError } from '@/errors/AppError.helper'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "import { readFileSync } from 'node:fs'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "import { useState } from 'react'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "import { createClient } from '@supabase/supabase-js'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "export { z } from 'zod'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "export * from '@/errors/AppError.helper'",
      errors: ['vendorInCore']
    }),
    // Only the `#src/` key is core's own: any other `#` key is not.
    invalid({
      code: "import { a } from '#vendor/a'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "export * from '#internal/a'",
      errors: ['vendorInCore']
    }),
    invalid({
      code: "const react = import('react')",
      errors: ['vendorInCore']
    })
  ],
  valid: [
    "const scrub = import('#src/utils/scrubPII.helper')",
    'const lazy = import(modulePath)',
    "import { scrubPII } from './scrubPII.helper'",
    "import type { IHostConsole } from '../../utils/hostConsole.helper'",
    "export { AppError } from './errors/AppError.helper'",
    "export * from './ports/observability/observabilityLevel.type'",
    "import { scrubPII } from '#src/utils/scrubPII.helper'",
    "import type { IHostConsole } from '#src/utils/hostConsole.helper'",
    "export { AppError } from '#src/errors/AppError.helper'",
    "export * from '#src/ports/observability/observabilityLevel.type'",
    'export const local = 1'
  ]
})

// core-import-boundary and package-src-alias pass `#src/` as the package's own
// module. That holds only while each package.json maps the key into its own
// src and nowhere else.
const SRC_IMPORTS = { '#src/*': './src/*.ts' }
const EXPECTED_IMPORTS = {
  cloudflare: SRC_IMPORTS,
  core: SRC_IMPORTS,
  i18n: { ...SRC_IMPORTS, '#src/*.json': './src/*.json' },
  supabase: SRC_IMPORTS,
  tokens: SRC_IMPORTS
}

for (const [name, expected] of Object.entries(EXPECTED_IMPORTS)) {
  test(`${name} maps its #src imports into its own src only`, () => {
    const manifest = JSON.parse(
      readFileSync(
        join(import.meta.dirname, '..', 'packages', name, 'package.json'),
        'utf8'
      )
    )

    assert.deepEqual(manifest.imports, expected)
  })
}

// The packages on disk the rule resolves against: each template package with
// the "imports" map the test above pins, and `shadow`, whose exact, null and
// conditional entries win over `#src/*` for some specifiers.
const SRC_ALIAS_FIXTURE = mkdtempSync(join(tmpdir(), 'package-src-alias-'))
const FIXTURE_MANIFESTS = {
  ...EXPECTED_IMPORTS,
  shadow: {
    ...SRC_IMPORTS,
    '#src/cond/*': { default: './src/cond/*.ts' },
    '#src/ports/b.constant': './src/other.ts',
    '#src/ports/n': null
  }
}
const FIXTURE_SOURCES = {
  cloudflare: ['cloudflare.constant.ts'],
  core: [
    'a.helper.ts',
    'data.json',
    'ports/sub/index.ts',
    'types/a.type.ts'
  ],
  i18n: ['data.json', 'locales/en.json'],
  shadow: ['cond/k.ts', 'other.ts', 'ports/b.constant.ts', 'ports/n.ts'],
  supabase: ['lazy.helper.ts'],
  tokens: ['a.helper.ts', 'tokens.constant.ts']
}
const writeFixture = ({ content = '', path }) => {
  const file = join(SRC_ALIAS_FIXTURE, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, content)
}
Object.entries(FIXTURE_MANIFESTS).forEach(([name, imports]) =>
  writeFixture({
    content: JSON.stringify({ imports }),
    path: join('packages', name, 'package.json')
  })
)
Object.entries(FIXTURE_SOURCES).forEach(([name, files]) =>
  files.forEach((file) =>
    writeFixture({ path: join('packages', name, 'src', file) })
  )
)
after(() => rmSync(SRC_ALIAS_FIXTURE, { force: true, recursive: true }))

// Absolute paths as ESLint hands them to the rule; the fix depends on the
// file's path and the files beside it, never on the folder ESLint runs from.
const inPackage = ({ name, file }) =>
  join(SRC_ALIAS_FIXTURE, 'packages', name, 'src', file)

const fixed = ({ code, filename, output }) => ({
  code,
  errors: [{ messageId: 'useSrcAlias' }],
  filename,
  output
})

ruleTester.run('package-src-alias', rules['package-src-alias'], {
  invalid: [
    fixed({
      code: "import { HEADER } from './cloudflare.constant'",
      filename: inPackage({ file: 'hmac.helper.ts', name: 'cloudflare' }),
      output: "import { HEADER } from '#src/cloudflare.constant'"
    }),
    fixed({
      code: "import type { IA } from '../types/a.type'",
      filename: inPackage({ file: 'utils/b.helper.ts', name: 'core' }),
      output: "import type { IA } from '#src/types/a.type'"
    }),
    fixed({
      code: "export { a } from './a.helper'",
      filename: inPackage({ file: 'index.ts', name: 'tokens' }),
      output: "export { a } from '#src/a.helper'"
    }),
    fixed({
      code: "export * from './tokens.constant'",
      filename: inPackage({ file: 'index.ts', name: 'tokens' }),
      output: "export * from '#src/tokens.constant'"
    }),
    fixed({
      code: "const lazy = import('./lazy.helper')",
      filename: inPackage({ file: 'index.ts', name: 'supabase' }),
      output: "const lazy = import('#src/lazy.helper')"
    }),
    fixed({
      code: "import { HEADER } from '@/cloudflare.constant'",
      filename: inPackage({
        file: 'hmac/hmac.helper.ts',
        name: 'cloudflare'
      }),
      output: "import { HEADER } from '#src/cloudflare.constant'"
    }),
    fixed({
      code: "import en from './locales/en.json'",
      filename: inPackage({ file: 'index.ts', name: 'i18n' }),
      output: "import en from '#src/locales/en.json'"
    }),
    fixed({
      code: 'import { a } from "./a.helper"',
      filename: inPackage({ file: 'index.ts', name: 'core' }),
      output: 'import { a } from "#src/a.helper"'
    }),
    // A path out of the package's src, or src itself, has no `#src/` form.
    fixed({
      code: "import { b } from '../../cloudflare/src/b.helper'",
      filename: inPackage({ file: 'utils/a.helper.ts', name: 'core' }),
      output: null
    }),
    fixed({
      code: "import a from '.'",
      filename: inPackage({ file: 'a.helper.ts', name: 'core' }),
      output: null
    }),
    // An explicit extension, a folder and a `.json` resolve to the file they
    // name, and the alias names that file through the package's map.
    fixed({
      code: "import { HEADER } from './cloudflare.constant.ts'",
      filename: inPackage({ file: 'hmac.helper.ts', name: 'cloudflare' }),
      output: "import { HEADER } from '#src/cloudflare.constant'"
    }),
    fixed({
      code: "import { s } from './sub'",
      filename: inPackage({ file: 'ports/x.helper.ts', name: 'core' }),
      output: "import { s } from '#src/ports/sub/index'"
    }),
    fixed({
      code: "import data from '../data.json'",
      filename: inPackage({ file: 'locales/x.helper.ts', name: 'i18n' }),
      output: "import data from '#src/data.json'"
    }),
    // An alias the fix cannot resolve back to the same file is not written:
    // it would be a broken import, worse than the relative one.
    fixed({
      code: "import { m } from './missing'",
      filename: inPackage({ file: 'x.helper.ts', name: 'core' }),
      output: null
    }),
    // `#src/data.json` resolves to `./src/data.json.ts` under `./src/*.ts`.
    fixed({
      code: "import data from './data.json'",
      filename: inPackage({ file: 'x.helper.ts', name: 'core' }),
      output: null
    }),
    // An exact key sends `#src/ports/b.constant` to another file.
    fixed({
      code: "import { b } from './b.constant'",
      filename: inPackage({ file: 'ports/x.helper.ts', name: 'shadow' }),
      output: null
    }),
    // A null target leaves `#src/ports/n` unresolvable.
    fixed({
      code: "import { n } from './n'",
      filename: inPackage({ file: 'ports/x.helper.ts', name: 'shadow' }),
      output: null
    }),
    // A conditional pattern wins `#src/cond/k`; its target is not one path.
    fixed({
      code: "import { k } from '../cond/k'",
      filename: inPackage({ file: 'ports/x.helper.ts', name: 'shadow' }),
      output: null
    }),
    // Under the same map, a file no entry shadows keeps its fix.
    fixed({
      code: "import { o } from '../other'",
      filename: inPackage({ file: 'ports/x.helper.ts', name: 'shadow' }),
      output: "import { o } from '#src/other'"
    })
  ],
  valid: [
    {
      code: "import { HEADER } from '#src/cloudflare.constant'",
      filename: inPackage({ file: 'hmac.helper.ts', name: 'cloudflare' })
    },
    {
      code: "import { AppError } from '@app/core'",
      filename: inPackage({ file: 'a.adapter.ts', name: 'supabase' })
    },
    {
      code: "import { createClient } from '@supabase/supabase-js'",
      filename: inPackage({ file: 'a.adapter.ts', name: 'supabase' })
    },
    {
      code: 'const lazy = import(modulePath)',
      filename: inPackage({ file: 'index.ts', name: 'core' })
    }
  ]
})

test('the #src/ resolver judges own paths only, from the file it reads', () => {
  const file = inPackage({ file: 'ports/x.helper.ts', name: 'core' })
  assert.deepEqual(toSrcAlias({ filename: file, source: '../..' }), {
    alias: null
  })
  assert.equal(toSrcAlias({ filename: file, source: 'zod' }), null)
  assert.equal(
    toSrcAlias({ filename: file, source: '#src/ports/sub/index' }),
    null
  )
  assert.equal(toSrcAlias({ filename: file, source: '@app/core' }), null)
  assert.deepEqual(
    toSrcAlias({
      filename: join(SRC_ALIAS_FIXTURE, 'apps/web/src/lib/x.helper.ts'),
      source: './y.helper'
    }),
    { alias: null }
  )
})

// A package whose package.json is missing, is not JSON or is not an object
// names no `#src/` map: the specifier is reported with no fix, and the lint
// run goes on.
const UNREADABLE_MANIFESTS = { broken: '{ not json', nullish: 'null' }
Object.entries(UNREADABLE_MANIFESTS).forEach(([name, content]) =>
  writeFixture({ content, path: join('packages', name, 'package.json') })
)
;['broken', 'missing', 'nullish'].forEach((name) =>
  writeFixture({ path: join('packages', name, 'src', 'a.helper.ts') })
)

ruleTester.run(
  'package-src-alias without a readable map',
  rules['package-src-alias'],
  {
    invalid: ['broken', 'missing', 'nullish'].map((name) =>
      fixed({
        code: "import { a } from './a.helper'",
        filename: inPackage({ file: 'x.helper.ts', name }),
        output: null
      })
    ),
    valid: []
  }
)

// The map is read once per package for the run: a package.json rewritten
// after the first lookup does not change the next fix.
test('the #src/ resolver reads each package map once per run', () => {
  writeFixture({
    content: JSON.stringify({ imports: SRC_IMPORTS }),
    path: join('packages', 'cached', 'package.json')
  })
  writeFixture({ path: join('packages', 'cached', 'src', 'a.helper.ts') })
  const filename = inPackage({ file: 'x.helper.ts', name: 'cached' })
  const first = toSrcAlias({ filename, source: './a.helper' })
  writeFixture({
    content: JSON.stringify({ imports: {} }),
    path: join('packages', 'cached', 'package.json')
  })
  const second = toSrcAlias({ filename, source: './a.helper' })
  assert.deepEqual(first, { alias: '#src/a.helper' })
  assert.deepEqual(second, first)
})

ruleTester.run('suffix-contract', rules['suffix-contract'], {
  invalid: [
    invalid({
      code: 'export interface IButtonProps { label: string }',
      errors: ['typeInView']
    }),
    invalid({
      code: 'type StateType = "idle" | "busy"',
      errors: ['typeInView']
    }),
    invalid({
      code: 'export enum ToneEnum { Calm = "calm" }',
      errors: ['typeInView']
    }),
    invalid({
      code: 'export const MAX_RETRY = 3',
      errors: ['constInView']
    }),
    invalid({
      code: 'const DEFAULT_LIMIT = 50, _PRIVATE_KEY = "k"',
      errors: ['constInView', 'constInView']
    })
  ],
  valid: [
    'export const useItems = () => ({ items: [] })',
    'export const Button = () => null',
    'const helperValue = 3',
    'let MUTABLE_FLAG = false',
    'const useLocal = () => { const LIMIT = 2; return LIMIT }',
    'const build = () => { interface ILocal { id: string }; return {} as ILocal }'
  ]
})

ruleTester.run('pure-domain-adapter', rules['pure-domain-adapter'], {
  invalid: [
    invalid({
      code: 'export const adaptItem = async (dto) => dto',
      errors: ['asyncAdapter']
    }),
    invalid({
      code: 'export const adaptItem = async (load) => { const dto = await load(); return dto }',
      errors: ['asyncAdapter', 'awaitInAdapter']
    }),
    invalid({
      code: 'export async function adaptItem(dto) { return dto }',
      errors: ['asyncAdapter']
    }),
    invalid({
      code: 'export const adaptItem = async function (dto) { return dto }',
      errors: ['asyncAdapter']
    }),
    invalid({
      code: "export const adaptItem = () => fetch('/items')",
      errors: ['ioInAdapter']
    }),
    invalid({
      code: "export const adaptItem = (client) => client.fetch('/items')",
      errors: ['ioInAdapter']
    })
  ],
  valid: [
    'export const adaptItem = (dto) => ({ id: dto.id, title: dto.title })',
    'export const adaptItems = (dtos) => dtos.map((dto) => ({ id: dto.id }))',
    'export const toDate = (iso) => new Date(iso)'
  ]
})

ruleTester.run('no-justifying-comment', rules['no-justifying-comment'], {
  invalid: [
    invalid({
      code: '// Kept here not because it is faster.\nconst a = 1',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '/* This helper exists because the SDK leaks. */\nconst b = 2',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '// The seam exists to keep tests honest.\nconst c = 3',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '// A shortcut here trains everyone to skip the port.\nconst d = 4',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '// The old doc says the opposite.\nconst e = 5',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '// Memoizing buys nothing here.\nconst f = 6',
      errors: ['justifyingComment']
    }),
    invalid({
      code: '// Measured 2026-07-27 at 40ms.\nconst g = 7',
      errors: ['justifyingComment']
    })
  ],
  valid: [
    '// Loads the module under test. Dynamic so vi.mock applies first.\nconst a = 1',
    '// Returns the fallback key instead of an empty string.\nconst b = 2',
    '// measured 2026-07-27 in a lowercase prose mention.\nconst c = 3',
    "const d = 'this string is not because of anything'"
  ]
})

// The filename suffix contract (code-standards §3) is a check-file rule, not a
// local one. These cases run it with the options eslint.rules.mjs configures,
// so they pin the suffix glob itself: the style-constant suffix is the
// singular `.style.ts`, like every other binding suffix.
const [, suffixPatterns, suffixOptions] =
  FILENAME_RULES['check-file/filename-naming-convention']

const sourceFile = ({ path }) => ({
  code: 'export const A = 1',
  filename: join(process.cwd(), path),
  options: [suffixPatterns, suffixOptions]
})

ruleTester.run(
  'check-file/filename-naming-convention',
  checkFile.rules['filename-naming-convention'],
  {
    invalid: [
      {
        ...sourceFile({
          path: 'apps/web/src/components/ui/Chip/Chip.styles.ts'
        }),
        errors: [{ message: suffixOptions.errorMessage }]
      },
      {
        ...sourceFile({ path: 'apps/web/src/screens/Login/Login.css.ts' }),
        errors: [{ message: suffixOptions.errorMessage }]
      }
    ],
    valid: [
      sourceFile({
        path: 'apps/web/src/components/ui/Chip/Chip.style.ts'
      }),
      sourceFile({ path: 'apps/mobile/src/screens/Login/Login.style.ts' }),
      sourceFile({
        path: 'apps/web/src/components/ui/Chip/Chip.constant.ts'
      }),
      sourceFile({ path: 'apps/web/src/components/ui/Chip/index.ts' })
    ]
  }
)

// ---------------------------------------------------------------------------
// The styling pillar (AGENTS.md § Styling lives in the components). The
// rules scope themselves from the file's path, so every case names one.
// ---------------------------------------------------------------------------

const viewTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
    sourceType: 'module'
  }
})

const at = ({ app, file }) => ({
  filename: `/repo/apps/${app}/src/${file}`
})

const reports = ({ app, code, file, messageIds }) => ({
  ...at({ app, file }),
  code,
  errors: messageIds.map((messageId) => ({ messageId }))
})

const silent = ({ app, code, file }) => ({ ...at({ app, file }), code })

const WEB_SCREEN_STYLE = { app: 'web', file: 'screens/X/X.style.ts' }
const MOBILE_SCREEN_STYLE = { app: 'mobile', file: 'screens/X/X.style.ts' }
const WEB_ROUTE = { app: 'web', file: 'app/page.tsx' }
const MOBILE_SCREEN = { app: 'mobile', file: 'screens/X/X.screen.tsx' }

viewTester.run('style-positions-only', rules['style-positions-only'], {
  invalid: [
    reports({
      ...WEB_SCREEN_STYLE,
      code: "export const X = { TITLE: 'mt-lg text-accent-text' }",
      messageIds: ['classToken']
    }),
    // A styling token is reported whatever variant prefixes it.
    reports({
      ...WEB_SCREEN_STYLE,
      code: "export const X = { LINK: 'lg:flex hover:text-text-primary' }",
      messageIds: ['classToken']
    }),
    // A custom utility nobody listed as positioning is reported.
    reports({
      ...WEB_SCREEN_STYLE,
      code: "export const X = { CARD: 'glass-card p-lg' }",
      messageIds: ['classToken']
    }),
    reports({
      ...WEB_SCREEN_STYLE,
      code: 'export const X = { ROW: `flex ${GAP} rounded-md` }',
      messageIds: ['classToken']
    }),
    // An arbitrary property is judged by the CSS property it sets.
    reports({
      ...WEB_SCREEN_STYLE,
      code: "export const X = { RIG: 'flex [filter:blur(2px)]' }",
      messageIds: ['classToken']
    }),
    // A token assembled around an expression is judged by its visible half.
    reports({
      ...WEB_SCREEN_STYLE,
      code: 'export const X = { ROW: `flex text-${TONE}` }',
      messageIds: ['classToken']
    }),
    // A React Native StyleSheet entry is judged by its declaration keys.
    reports({
      ...MOBILE_SCREEN_STYLE,
      code: 'export const S = StyleSheet.create({ title: { color: colors.text.primary, marginTop: 4 } })',
      messageIds: ['styleKey']
    }),
    reports({
      ...MOBILE_SCREEN_STYLE,
      code: "export const S = StyleSheet.create({ card: { borderRadius: 8, fontWeight: '700' } })",
      messageIds: ['styleKey', 'styleKey']
    }),
    // NativeWind class strings in a mobile style file are class lists.
    reports({
      ...MOBILE_SCREEN_STYLE,
      code: "export const X = { TITLE: 'mt-2 text-text-primary' }",
      messageIds: ['classToken']
    }),
    // A route entry is a section: its classes and styles only position.
    reports({
      ...WEB_ROUTE,
      code: 'const P = () => <body className="min-h-screen bg-bg-base" />',
      messageIds: ['classToken']
    }),
    reports({
      ...WEB_ROUTE,
      code: 'const P = () => <div style={{ opacity: 0 }} />',
      messageIds: ['styleKey']
    }),
    reports({
      ...WEB_ROUTE,
      code: 'const P = () => <div style={{ ...rest }} />',
      messageIds: ['styleNotLiteral']
    }),
    // In a view, a style slot is a `*Style` constant, a style prop or option.
    reports({
      ...MOBILE_SCREEN,
      code: 'const textStyle = { color: colors.accentInk }',
      messageIds: ['styleKey']
    }),
    reports({
      ...MOBILE_SCREEN,
      code: 'const S = () => <View style={[styles.a, { backgroundColor: bg }]} />',
      messageIds: ['styleKey']
    }),
    reports({
      ...MOBILE_SCREEN,
      code: 'const S = () => <Stack screenOptions={{ contentStyle: { backgroundColor: bg } }} />',
      messageIds: ['styleKey']
    }),
    reports({
      app: 'mobile',
      code: 'const B = () => <View style={{ backgroundColor: bg, flex: 1 }} />',
      file: 'components/RootErrorBoundary/RootErrorBoundary.component.tsx',
      messageIds: ['styleKey']
    })
  ],
  valid: [
    silent({
      ...WEB_SCREEN_STYLE,
      code: "export const X = { ROOT: 'relative flex min-h-screen flex-col gap-lg px-lg lg:grid lg:grid-cols-2', SR: 'sr-only text-center whitespace-nowrap truncate z-10 [grid-template-columns:1fr_auto]' }"
    }),
    // Variant names in a tailwind-variants config are not classes.
    silent({
      ...WEB_SCREEN_STYLE,
      code: "export const X = tv({ base: 'flex', variants: { tone: { neutral: 'gap-sm' } }, defaultVariants: { tone: 'neutral' }, compoundVariants: [{ tone: 'neutral', class: 'px-lg' }] })"
    }),
    silent({
      ...WEB_SCREEN_STYLE,
      code: 'export const X = { ROW: `${BASE} flex gap-${STEP} px-lg` }'
    }),
    silent({
      ...MOBILE_SCREEN_STYLE,
      code: "export const S = StyleSheet.create({ row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, height: StyleSheet.hairlineWidth, marginVertical: 4, paddingHorizontal: spacing.lg } })"
    }),
    silent({
      ...WEB_ROUTE,
      code: "const P = () => <div style={{ '--fy': offset, gridColumn: 2, marginTop: 4, width } as CSSProperties} />"
    }),
    // A prop or constant that holds no style object is not read.
    silent({
      ...WEB_ROUTE,
      code: 'const P = () => <Chart lineStyle={dashed} />'
    }),
    silent({
      ...WEB_ROUTE,
      code: "export const viewport = { colorScheme: 'dark light' }"
    }),
    silent({
      ...MOBILE_SCREEN,
      code: 'const S = () => <View style={[styles.a, { paddingBottom: 120 }]} />'
    }),
    silent({
      ...MOBILE_SCREEN,
      code: "const navContainerStyle = { bottom: 0, position: 'absolute' }"
    }),
    // The component blocks own their look, and tests are no product surface.
    silent({
      app: 'web',
      code: "export const X = { ROOT: 'rounded-full bg-accent text-accent-ink' }",
      file: 'components/ui/Chip/Chip.style.ts'
    }),
    silent({
      app: 'mobile',
      code: 'export const S = StyleSheet.create({ a: { color: colors.accent } })',
      file: 'screens/X/components/Card/Card.style.ts'
    }),
    silent({
      app: 'web',
      code: 'const T = () => <div className="bg-accent" />',
      file: 'screens/X/X.screen.test.tsx'
    }),
    {
      code: "export const X = { A: 'bg-accent' }",
      filename: '/repo/packages/tokens/src/x.style.ts'
    }
  ]
})

viewTester.run('style-token-values', rules['style-token-values'], {
  invalid: [
    reports({
      app: 'web',
      code: "export const X = { PILL: 'px-[11px] rounded-full' }",
      file: 'components/ui/Chip/Chip.style.ts',
      messageIds: ['arbitraryValue']
    }),
    reports({
      app: 'web',
      code: "export const X = { DOT: 'bg-white/[0.08]', SCRIM: 'bg-black/60' }",
      file: 'components/ui/Modal/Modal.style.ts',
      messageIds: ['arbitraryValue', 'paletteColor']
    }),
    reports({
      app: 'web',
      code: "export const X = { BOX: 'max-w-(--container-md) text-[#fff]' }",
      file: 'screens/X/X.style.ts',
      messageIds: ['arbitraryValue', 'arbitraryValue']
    }),
    reports({
      app: 'mobile',
      code: "const AVATAR_BG = '#241A12'",
      file: 'screens/X/components/Card/Card.style.ts',
      messageIds: ['rawColor']
    }),
    reports({
      app: 'mobile',
      code: "export const S = StyleSheet.create({ a: { backgroundColor: 'rgba(0,0,0,0.5)' } })",
      file: 'components/ui/Banner/Banner.style.ts',
      messageIds: ['rawColor']
    }),
    reports({
      app: 'mobile',
      code: "export const GRADIENT = ['#FF8A3D', '#FF6A1A'] as const",
      file: 'screens/X/components/Card/Card.style.ts',
      messageIds: ['rawColor', 'rawColor']
    }),
    reports({
      app: 'web',
      code: 'const C = () => <Icon color="#fff" />',
      file: 'components/ui/Icon/Icon.component.tsx',
      messageIds: ['rawColor']
    }),
    reports({
      app: 'web',
      code: 'const C = () => <span className="h-[7px] w-2" />',
      file: 'components/ui/Chip/Chip.component.tsx',
      messageIds: ['arbitraryValue']
    }),
    reports({
      app: 'mobile',
      code: "const C = () => <View style={{ backgroundColor: '#000' }} />",
      file: 'screens/X/X.screen.tsx',
      messageIds: ['rawColor']
    })
  ],
  valid: [
    silent({
      app: 'web',
      code: "export const X = { A: 'bg-accent text-text-primary rounded-full px-lg data-[state=open]:flex w-1/2 bg-accent/50 bg-neutral-tint' }",
      file: 'components/ui/Chip/Chip.style.ts'
    }),
    silent({
      app: 'mobile',
      code: "export const S = StyleSheet.create({ a: { backgroundColor: colors.accent, fontWeight: '700' } })",
      file: 'components/ui/Chip/Chip.style.ts'
    }),
    // Only class attributes, style slots and colour attributes are read.
    silent({
      app: 'web',
      code: 'const C = () => <a href="#add" title="rgb(1,2,3)">x</a>',
      file: 'screens/X/X.screen.tsx'
    }),
    silent({
      app: 'web',
      code: "export const X = { A: 'h-[7px]' }",
      file: 'screens/X/__tests__/X.fixture.style.ts'
    })
  ]
})

const STYLE_FILE = 'apps/web/src/screens/Login/Login.style.ts'

describe('style pillar scope', () => {
  test('positions-only reads screens, routes and containers, never a component block', () => {
    assert.deepEqual(
      [
        STYLE_FILE,
        'apps/web/src/app/layout.tsx',
        'apps/mobile/src/components/RootErrorBoundary/RootErrorBoundary.component.tsx',
        'apps/web/src/helpers/layout.style.ts',
        'apps/web/src/components/ui/Button/Button.style.ts',
        'apps/mobile/src/screens/ItemsDashboard/components/ItemCard/ItemCard.style.ts',
        'apps/web/src/screens/Login/Login.constant.ts',
        'apps/mobile/src/app/__tests__/index.test.tsx'
      ].map((path) => positionsOnlyScope(path)?.kind ?? null),
      [
        FILE_KIND.STYLE,
        FILE_KIND.VIEW,
        FILE_KIND.VIEW,
        FILE_KIND.STYLE,
        null,
        null,
        null,
        null
      ]
    )
  })

  test('token-values reads every style file and view of both apps', () => {
    assert.deepEqual(
      [
        'C:/repo/apps/web/src/components/ui/Button/Button.style.ts'.replaceAll(
          '/',
          '\\'
        ),
        'apps/mobile/src/screens/ItemsDashboard/components/ItemCard/ItemCard.style.ts',
        'apps/web/src/screens/Login/Login.constant.ts',
        'apps/web/src/test/test.helper.ts',
        'packages/tokens/src/tokens.constant.ts'
      ].map((path) => tokenValuesScope(path)?.path ?? null),
      [
        'apps/web/src/components/ui/Button/Button.style.ts',
        'apps/mobile/src/screens/ItemsDashboard/components/ItemCard/ItemCard.style.ts',
        null,
        null,
        null
      ]
    )
  })

  test('an allowlist entry exempts its own path under its own rule only', () => {
    const allowlist = [
      { path: STYLE_FILE, reason: 'r', rule: 'style-positions-only' }
    ]

    assert.deepEqual(
      [
        isAllowlisted({
          allowlist,
          path: STYLE_FILE,
          rule: 'style-positions-only'
        }),
        isAllowlisted({
          allowlist,
          path: STYLE_FILE,
          rule: 'style-token-values'
        }),
        isAllowlisted({
          allowlist,
          path: 'apps/web/src/screens/X/X.style.ts',
          rule: 'style-positions-only'
        })
      ],
      [true, false, false]
    )
  })
})
