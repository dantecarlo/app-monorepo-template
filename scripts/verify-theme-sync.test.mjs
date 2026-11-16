#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-theme-sync. The shipped outputs equal their
// regeneration, so the cases are the only evidence the gate can go red. Each
// case copies the token source and every generated output into a
// throwaway tree in the OS temp directory, plants one edit with a string
// replacement, and drives the gate's own collector over it. The checks then
// run the gate as a process over a planted edit, and re-run every failing
// case against a blinded gate.
//
// Usage:
//   node --test scripts/verify-theme-sync.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { collectContext, gate, SOURCES } from './verify-theme-sync.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const GATE = join(HERE, 'verify-theme-sync.mjs')
const REPO_ROOT = resolve(HERE, '..')
const FAILED = 1
const PASSED = 0
const REGENERATE = 'pnpm --filter @app/tokens generate'

const SHIPPED = Object.fromEntries(
  Object.values(SOURCES).map((path) => [
    path,
    readFileSync(join(REPO_ROOT, path), 'utf8')
  ])
)

// The shipped files with one replacement applied to one of them. A
// replacement that matches nothing throws, so a case cannot pass by planting
// nothing.
const plant = ({ file, from, to } = {}) => {
  if (!file) return SHIPPED
  const source = SHIPPED[file]
  if (!source.includes(from)) {
    throw new Error(`plant: ${JSON.stringify(from)} is not in ${file}`)
  }
  return { ...SHIPPED, [file]: source.replace(from, to) }
}

const without = (file) =>
  Object.fromEntries(
    Object.entries(SHIPPED).filter(([path]) => path !== file)
  )

const walk = (files) => () =>
  withScratchTree({
    files,
    prefix: 'theme-sync-',
    use: ({ root }) => collectContext({ root })
  })

const runGate = (files) =>
  withScratchTree({
    files,
    prefix: 'theme-sync-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

// A hand edit of the dark base background in the generated web theme.
const WEB_THEME_EDIT = {
  file: SOURCES.webTheme,
  from: '--c-bg-base: #0A0B0D;',
  to: '--c-bg-base: #0A0B0E;'
}

export const CASES = [
  {
    context: walk(plant()),
    expected: 0,
    name: 'the shipped outputs equal their regeneration'
  },
  {
    context: walk(plant(WEB_THEME_EDIT)),
    expected: 1,
    name: 'a planted edit in the web theme is caught'
  },
  {
    context: walk(
      plant({
        file: SOURCES.nativewindPreset,
        from: "raised: 'var(--c-bg-raised)'",
        to: "raised: 'var(--c-bg-raised-x)'"
      })
    ),
    expected: 1,
    name: 'a planted edit in the preset is caught'
  },
  {
    context: walk(
      plant({
        file: SOURCES.themeVars,
        from: "'--c-bg-raised': '#101216'",
        to: "'--c-bg-raised': '#101217'"
      })
    ),
    expected: 1,
    name: 'a planted edit in the mobile theme variables is caught'
  },
  {
    context: walk(
      plant({
        file: SOURCES.themeNames,
        from: "'pill-x'",
        to: "'pill-z'"
      })
    ),
    expected: 1,
    name: 'a planted edit in the theme names is caught'
  },
  {
    // The dark raised background reaches the web theme and the mobile
    // variables; the preset names its variable.
    context: walk(
      plant({
        file: SOURCES.tokens,
        from: "raised: '#101216'",
        to: "raised: '#101217'"
      })
    ),
    expected: 2,
    name: 'a source change that was not regenerated is caught in every output it reaches'
  },
  {
    // The preset carries no themed value.
    context: walk(
      plant({
        file: SOURCES.tokens,
        from: "base: '#F4F5F7'",
        to: "base: '#F4F5F8'"
      })
    ),
    expected: 2,
    name: 'a light-theme source change is caught in the web theme and the mobile variables'
  },
  {
    // A name, not a colour: it reaches the web theme, the preset and the
    // theme names, and not the mobile variables.
    context: walk(
      plant({
        file: SOURCES.tokens,
        from: 'pillY: 5',
        to: 'pillZ: 5'
      })
    ),
    expected: 3,
    name: 'a renamed token that was not regenerated is caught in the theme names too'
  },
  {
    context: walk(without(SOURCES.webTheme)),
    expected: 1,
    name: 'a missing output is named, not skipped'
  },
  {
    context: walk(
      plant({
        file: SOURCES.tokens,
        from: 'export const sharedColors = {',
        to: 'export const sharedColors = {{'
      })
    ),
    expected: 1,
    name: 'a source the generator cannot read is named, not passed'
  }
]

const checks = [
  {
    name: 'a drift finding names the file, its first differing line and the regenerate command',
    run: () => {
      const [finding] = gate.run(walk(plant(WEB_THEME_EDIT))())
      assert.match(
        finding,
        /^drift: packages\/tokens\/theme\.css differs from its regeneration at line \d+:/u
      )
      assert.match(finding, /expected " {2}--c-bg-base: #0A0B0D;"/u)
      assert.match(finding, /found " {2}--c-bg-base: #0A0B0E;"/u)
      assert.ok(finding.includes(REGENERATE), finding)
    }
  },
  {
    name: 'the gate exits 1 and prints the drift',
    run: () => {
      const result = runGate(plant(WEB_THEME_EDIT))
      assert.equal(result.status, FAILED, result.stderr)
      assert.match(result.stderr, /verify-theme-sync: 1 problem/u)
      assert.match(result.stderr, /packages\/tokens\/theme\.css/u)
    }
  },
  {
    name: 'the gate exits 0 over the shipped outputs',
    run: () => {
      const result = runGate(plant())
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /^verify-theme-sync: PASS/u)
    }
  },
  {
    name: 'every failing case fails against a blinded gate',
    run: () => {
      const failing = CASES.filter(({ expected }) => expected > 0)
      assert.equal(
        runCases({ cases: failing, gate: blindGate({ gate }) }).length,
        failing.length
      )
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
