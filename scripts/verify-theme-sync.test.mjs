#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-theme-sync. The shipped copies agree, so the cases are
// the only evidence the gate can go red. Each case copies the three real
// sources into a throwaway tree in the OS temp directory, plants one drift
// with a string replacement, and drives the gate's own collector over it.
// The checks then run the gate as a process over a planted drift, and re-run
// every failing case against a blinded gate.
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

const SHIPPED = Object.fromEntries(
  Object.values(SOURCES).map((path) => [
    path,
    readFileSync(join(REPO_ROOT, path), 'utf8')
  ])
)

// The shipped sources with one replacement applied to one of them. A
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

// The light theme's own block of tokens.constant.ts starts here, so a
// replacement after it lands in the light theme only.
const LIGHT_ANCHOR = 'const lightColors = {'

const plantInLight = ({ from, to }) => {
  const source = SHIPPED[SOURCES.tokens]
  const start = source.indexOf(LIGHT_ANCHOR)
  const at = source.indexOf(from, start)
  if (start === -1 || at === -1) {
    throw new Error(`plant: ${JSON.stringify(from)} is not in lightColors`)
  }
  return {
    ...SHIPPED,
    [SOURCES.tokens]:
      source.slice(0, at) + to + source.slice(at + from.length)
  }
}

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

export const CASES = [
  {
    context: walk(plant()),
    expected: 0,
    name: 'the shipped copies agree'
  },
  {
    // The cool glow is shared, so a drift of it reaches both themes: the
    // CSS copy of each, and the preset for the dark one.
    context: walk(
      plant({
        file: SOURCES.tokens,
        from: "coolGlow: '#5B6CFF'",
        to: "coolGlow: '#5B6CFE'"
      })
    ),
    expected: 3,
    name: 'a light-theme drift of a theme-invariant colour is caught'
  },
  {
    context: walk(
      plant({
        file: SOURCES.css,
        from: '--c-bg-base: #f4f5f7;',
        to: '--c-bg-base: #f4f5f8;'
      })
    ),
    expected: 1,
    name: 'a light-theme drift of a themed colour is caught'
  },
  {
    context: walk(
      plant({
        file: SOURCES.css,
        from: '--c-bg-base: #0a0b0d;',
        to: '--c-bg-base: #0a0b0e;'
      })
    ),
    expected: 1,
    name: 'a dark-theme drift of a themed colour is caught'
  },
  {
    context: walk(
      plant({
        file: SOURCES.preset,
        from: "raised: '#101216'",
        to: "raised: '#101217'"
      })
    ),
    expected: 1,
    name: 'a preset drift from the dark theme is caught'
  },
  {
    context: walk(
      plant({
        file: SOURCES.css,
        from: '--color-accent: #ff6a1a;',
        to: '--color-accent: #ff6a1b;'
      })
    ),
    expected: 2,
    name: 'a CSS drift of the accent is caught against both themes'
  },
  {
    context: walk(
      plant({
        file: SOURCES.preset,
        from: "light: '#FF8A3D'",
        to: "light: '#FF8A3E'"
      })
    ),
    expected: 1,
    name: 'a preset drift of the accent ramp is caught'
  },
  {
    context: walk(
      plant({
        file: SOURCES.css,
        from: "[data-theme='light'] {",
        to: "[data-theme='lite'] {"
      })
    ),
    expected: 1,
    name: 'a missing light block is named, not skipped'
  }
]

const checks = [
  {
    name: 'a drift finding names the theme, the token and both values',
    run: () => {
      const [finding] = gate.run(
        walk(
          plantInLight({
            from: "base: '#F4F5F7'",
            to: "base: '#F4F5F8'"
          })
        )()
      )
      assert.match(finding, /^CSS drift \[light\.bg\.base\]/u)
      assert.match(finding, /tokens="#F4F5F8"/u)
      assert.match(finding, /globals\.css --c-bg-base="#f4f5f7"/u)
    }
  },
  {
    name: 'the gate exits 1 and prints the drift',
    run: () => {
      const result = runGate(
        plantInLight({
          from: "base: '#F4F5F7'",
          to: "base: '#F4F5F8'"
        })
      )
      assert.equal(result.status, FAILED, result.stderr)
      assert.match(result.stderr, /verify-theme-sync: 1 problem/u)
      assert.match(result.stderr, /light\.bg\.base/u)
    }
  },
  {
    name: 'the gate exits 0 over the shipped copies',
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
