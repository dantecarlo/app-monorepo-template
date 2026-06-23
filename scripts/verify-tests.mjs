#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-tests — tests-per-unit presence check.
//
// Fails (exit 1) if any source unit that MUST be tested lacks a sibling test
// file. A "unit" is any file matching one of the tracked suffixes below. A
// unit `Foo.service.ts` is satisfied by a sibling `Foo.service.test.ts` (or
// `.test.tsx`) in the same directory.
//
// This enforces the tests-per-unit convention structurally — it does NOT run
// the tests (that is `pnpm test`). It only checks that each unit HAS one.
//
// Usage:
//   node scripts/verify-tests.mjs            # scan default roots
//   node scripts/verify-tests.mjs apps/web   # scan a specific root
// ---------------------------------------------------------------------------

import { readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

// Suffixes that REQUIRE a sibling test. Order matters: longest match first so
// `.component.tsx` is not mis-read as a generic `.tsx`.
const TRACKED_SUFFIXES = [
  '.component.tsx',
  '.hook.ts',
  '.helper.ts',
  '.service.ts',
  '.adapter.ts'
]

// Directories never scanned for units.
const IGNORED_DIRS = new Set([
  '.expo',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules'
])

// Path segments that mark test-infrastructure files (helpers, mocks, setup).
// Units inside these are exempt from the rule.
const TEST_INFRA_SEGMENTS = ['__tests__', '__mocks__', '/test/']

// Documented exemptions: units matching any of these predicates do NOT require
// a sibling test. Keep this list SMALL and justified — every entry is a gap.
//
// React Native render/hook tests under apps/mobile are not yet wired:
// RN-under-vitest needs a react-native-web resolution + RN preset, and the
// RN testing library pulls a react-test-renderer that conflicts with this
// app's React version. The mobile vitest config is intentionally
// happy-dom + .tsx-collectable so that infra can be added later without
// changing the glob. Until then, mobile .component.tsx and .hook.ts units are
// exempt; mobile .service/.adapter/.helper (pure logic) units are still
// required, and ALL web units (including .component.tsx render tests) are
// required.
const isMobile = (path) =>
  path.replaceAll('\\', '/').includes('/apps/mobile/')

const EXEMPT_PREDICATES = [
  (path) => isMobile(path) && path.endsWith('.component.tsx'),
  (path) => isMobile(path) && path.endsWith('.hook.ts')
]

const isExempt = (path) =>
  EXEMPT_PREDICATES.some((predicate) => predicate(path))

const DEFAULT_ROOTS = ['apps/web/src', 'apps/mobile/src']

const isTestFile = (name) => /\.test\.[cm]?[jt]sx?$/.test(name)

const isTestInfra = (path) => {
  const normalized = path.replaceAll('\\', '/')
  return TEST_INFRA_SEGMENTS.some((seg) => normalized.includes(seg))
}

const trackedSuffixFor = (name) =>
  TRACKED_SUFFIXES.find((suffix) => name.endsWith(suffix)) ?? null

const walk = (dir, units) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stats = statSync(full)

    if (stats.isDirectory()) {
      if (IGNORED_DIRS.has(entry)) continue
      walk(full, units)
      continue
    }

    if (isTestFile(entry)) continue
    if (isTestInfra(full)) continue
    if (isExempt(full)) continue

    const suffix = trackedSuffixFor(entry)
    if (suffix) units.push({ dir, path: full, suffix })
  }
}

const hasSiblingTest = (unit) => {
  // A unit `Foo.service.ts` is satisfied by a sibling `Foo.service.test.*`:
  // keep the full unit name, drop the final extension, then expect `.test.`.
  // e.g. ItemCard.component.tsx -> ItemCard.component.test.tsx
  const fileName = unit.path.slice(unit.dir.length + 1)
  const stem = fileName.slice(0, fileName.lastIndexOf('.'))
  return readdirSync(unit.dir).some(
    (sibling) =>
      isTestFile(sibling) && sibling.startsWith(`${stem}.test.`)
  )
}

const roots = (process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_ROOTS)
  .map((root) => resolve(REPO_ROOT, root))
  .filter((root) => {
    try {
      return statSync(root).isDirectory()
    } catch {
      return false
    }
  })

const units = []
for (const root of roots) walk(root, units)

const missing = units.filter((unit) => !hasSiblingTest(unit))

if (missing.length > 0) {
  console.error(
    `\nverify-tests: ${missing.length} unit(s) missing a sibling *.test.* file:\n`
  )
  for (const unit of missing) {
    console.error(`  - ${unit.path.replace(`${REPO_ROOT}/`, '')}`)
  }
  console.error(
    '\nEvery .component.tsx / .hook.ts / .helper.ts / .service.ts / .adapter.ts'
  )
  console.error('must have a sibling test file. Add one next to each unit.\n')
  process.exit(1)
}

console.log(
  `verify-tests: OK — ${units.length} unit(s) checked, all have a sibling test.`
)
