#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-allowlist-freshness. The template's allowlist ships
// empty, so its cases are the only evidence the gate can go red: a detector
// never seen failing is indistinguishable from one that cannot.
//
// The cases build a throwaway tree in the OS temp directory, an app source
// file and an allowlist each, and drive the gate's own collector over it, so
// the walk, the parse and the detection the ESLint rules run are each part of
// the verdict. The checks then run the gate as a process over a stale entry,
// so the report and the exit code are seen failing, and re-run every case
// against a blinded gate.
//
// Usage:
//   node --test scripts/verify-allowlist-freshness.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import {
  collectContext,
  FINDING_KIND,
  gate
} from './verify-allowlist-freshness.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-allowlist-freshness.mjs'
)
const FAILED = 1
const PASSED = 0
const ALLOWLIST = 'eslint-style-positioning-allowlist.json'

const SCREEN_STYLE = 'apps/web/src/screens/Login/Login.style.ts'
const UI_STYLE = 'apps/web/src/components/ui/Chip/Chip.style.ts'
const MOBILE_SCREEN = 'apps/mobile/src/screens/Login/Login.screen.tsx'

const POSITIONS_ONLY = 'style-positions-only'
const TOKEN_VALUES = 'style-token-values'

const LOOK_IN_SCREEN = "export const LOGIN = { TITLE: 'mt-lg text-accent' }"
const POSITIONS_IN_SCREEN = "export const LOGIN = { FORM: 'flex gap-lg' }"
const ARBITRARY_IN_UI = "export const CHIP = { ROOT: 'px-[11px] rounded-full' }"
const TOKENS_IN_UI = "export const CHIP = { ROOT: 'px-3 rounded-full' }"

const entry = ({ path, reason = 'cannot move yet', rule }) => ({
  path,
  reason,
  rule
})

const treeOf = ({ entries, files }) => ({
  ...files,
  [ALLOWLIST]:
    typeof entries === 'string' ? entries : JSON.stringify(entries)
})

const walk =
  ({ entries = [], files }) =>
  () =>
    withScratchTree({
      files: treeOf({ entries, files }),
      prefix: 'allowlist-freshness-',
      use: ({ root }) => collectContext({ root })
    })

const runGate = ({ entries, files }) =>
  withScratchTree({
    files: treeOf({ entries, files }),
    prefix: 'allowlist-freshness-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

export const CASES = [
  {
    context: walk({ files: { [SCREEN_STYLE]: POSITIONS_IN_SCREEN } }),
    expected: 0,
    name: 'a clean tree with an empty list passes'
  },
  {
    context: walk({
      entries: [entry({ path: SCREEN_STYLE, rule: POSITIONS_ONLY })],
      files: { [SCREEN_STYLE]: LOOK_IN_SCREEN }
    }),
    expected: 0,
    name: 'an entry whose file still breaks its rule passes'
  },
  {
    context: walk({
      entries: [entry({ path: SCREEN_STYLE, rule: POSITIONS_ONLY })],
      files: { [SCREEN_STYLE]: POSITIONS_IN_SCREEN }
    }),
    expected: 1,
    name: 'an entry whose file no longer breaks its rule is stale'
  },
  {
    context: walk({
      entries: [entry({ path: SCREEN_STYLE, rule: POSITIONS_ONLY })],
      files: { [UI_STYLE]: TOKENS_IN_UI }
    }),
    expected: 1,
    name: 'an entry whose file is gone is stale'
  },
  {
    context: walk({
      entries: [entry({ path: UI_STYLE, rule: POSITIONS_ONLY })],
      files: { [UI_STYLE]: "export const CHIP = { ROOT: 'bg-accent' }" }
    }),
    expected: 1,
    name: 'a positions-only entry for a component block is stale: the rule never reads it'
  },
  {
    context: walk({
      entries: [entry({ path: UI_STYLE, rule: TOKEN_VALUES })],
      files: { [UI_STYLE]: ARBITRARY_IN_UI }
    }),
    expected: 0,
    name: 'a token-values entry for a component block that holds an arbitrary value passes'
  },
  {
    context: walk({
      entries: [entry({ path: UI_STYLE, rule: TOKEN_VALUES })],
      files: { [UI_STYLE]: TOKENS_IN_UI }
    }),
    expected: 1,
    name: 'a token-values entry is stale once the value is a token'
  },
  {
    context: walk({
      entries: [entry({ path: SCREEN_STYLE, rule: TOKEN_VALUES })],
      files: { [SCREEN_STYLE]: LOOK_IN_SCREEN }
    }),
    expected: 2,
    name: 'an entry exempts one rule only: a file listed under the other is stale and unlisted'
  },
  {
    context: walk({ files: { [SCREEN_STYLE]: LOOK_IN_SCREEN } }),
    expected: 1,
    name: 'a violating file the list does not carry is named'
  },
  {
    context: walk({
      files: {
        [MOBILE_SCREEN]:
          'const S = () => <View style={{ backgroundColor: bg }} />'
      }
    }),
    expected: 1,
    name: 'a mobile view is read through the same detection'
  },
  {
    context: walk({
      entries: [
        entry({ path: SCREEN_STYLE, reason: ' ', rule: POSITIONS_ONLY })
      ],
      files: { [SCREEN_STYLE]: LOOK_IN_SCREEN }
    }),
    expected: 2,
    name: 'an entry without a reason is malformed, and exempts nothing'
  },
  {
    context: walk({
      entries: [entry({ path: SCREEN_STYLE, rule: 'style-anything' })],
      files: { [SCREEN_STYLE]: POSITIONS_IN_SCREEN }
    }),
    expected: 1,
    name: 'an entry naming another rule is malformed'
  },
  {
    context: walk({
      entries: [
        entry({ path: SCREEN_STYLE, rule: POSITIONS_ONLY }),
        entry({ path: SCREEN_STYLE, rule: POSITIONS_ONLY })
      ],
      files: { [SCREEN_STYLE]: LOOK_IN_SCREEN }
    }),
    expected: 1,
    name: 'a file listed twice under one rule is a duplicate'
  },
  {
    context: walk({
      entries: '{ "path": "x" }',
      files: { [SCREEN_STYLE]: POSITIONS_IN_SCREEN }
    }),
    expected: 1,
    name: 'a list that is not a JSON array is refused'
  },
  {
    context: walk({
      files: {
        'apps/web/src/screens/Login/__tests__/Login.fixture.tsx':
          'const T = () => <div className="bg-accent h-[7px]" />',
        'apps/web/src/screens/Login/Login.constant.ts':
          "export const LOOK = 'bg-black/60 text-[13px]'"
      }
    }),
    expected: 0,
    name: 'tests and constant files are outside both rules'
  }
]

const checks = [
  {
    name: 'a stale finding names the file, the rule and the remedy',
    run: () => {
      const [finding] = gate.run(
        walk({
          entries: [entry({ path: SCREEN_STYLE, rule: POSITIONS_ONLY })],
          files: { [SCREEN_STYLE]: POSITIONS_IN_SCREEN }
        })()
      )
      assert.equal(finding.kind, FINDING_KIND.stale)
      assert.equal(finding.path, SCREEN_STYLE)
      assert.match(finding.detail, /no longer breaks style-positions-only/u)
      assert.match(finding.detail, /remove the entry, the list only shrinks/u)
    }
  },
  {
    name: 'an unlisted finding counts what the file breaks',
    run: () => {
      const [finding] = gate.run(
        walk({ files: { [SCREEN_STYLE]: LOOK_IN_SCREEN } })()
      )
      assert.equal(finding.kind, FINDING_KIND.unlisted)
      assert.match(
        finding.detail,
        /Login\.style\.ts breaks style-positions-only 1 time\(s\)/u
      )
    }
  },
  {
    name: 'the gate exits 1 and prints the stale entry',
    run: () => {
      const result = runGate({
        entries: [entry({ path: SCREEN_STYLE, rule: POSITIONS_ONLY })],
        files: { [SCREEN_STYLE]: POSITIONS_IN_SCREEN }
      })
      assert.equal(result.status, FAILED, result.stderr)
      assert.match(result.stderr, /verify-allowlist-freshness: 1 problem/u)
      assert.match(result.stderr, /Login\.style\.ts no longer breaks/u)
    }
  },
  {
    name: 'the gate exits 0 over a clean tree and states what it judged',
    run: () => {
      const result = runGate({
        entries: [],
        files: { [SCREEN_STYLE]: POSITIONS_IN_SCREEN }
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(
        result.stdout,
        /PASS — 0 allowlist entries against 1 app source file\(s\), 0 file-rule pair/u
      )
    }
  },
  {
    name: 'every case fails against a blinded gate',
    run: () => {
      const failures = runCases({
        cases: CASES.filter(({ expected }) => expected > 0),
        gate: blindGate({ gate })
      })
      assert.equal(
        failures.length,
        CASES.filter(({ expected }) => expected > 0).length
      )
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
