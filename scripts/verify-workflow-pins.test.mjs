#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-workflow-pins. Once the repository's workflows are
// pinned the gate has no finding there, so its cases are the only evidence
// it can go red at all.
//
// The cases hand the gate's `run` synthetic workflows, each differing from a
// pinned one by one `uses:` line. The checks then run the gate as a process
// over a scratch tree in the OS temp directory, which `withScratchTree`
// removes, and over the repository itself.
//
// Usage:
//   node --test scripts/verify-workflow-pins.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { gate } from './verify-workflow-pins.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-workflow-pins.mjs'
)
const FAILED = 1
const PASSED = 0
const CI = '.github/workflows/ci.yml'
const RELEASE = '.github/workflows/release.yaml'
const SHA = '11d5960a326750d5838078e36cf38b85af677262'
const OTHER_SHA = '49933ea5288caeca8642d1e84afbd3f7d6820020'
const SHORT_SHA = SHA.slice(0, 7)
const PINNED_STEP = `      - uses: actions/checkout@${SHA} # v4.4.0`

// A workflow every `uses:` of which is pinned: a step with its tag as a
// comment, a quoted step with options under it, and a job that calls a
// reusable workflow.
const workflowWith = ({ step = PINNED_STEP } = {}) =>
  [
    'name: CI',
    'on: pull_request',
    'jobs:',
    '  validate:',
    '    runs-on: ubuntu-latest',
    '    steps:',
    step,
    `      - uses: "actions/setup-node@${OTHER_SHA}" # v4.4.0`,
    '        with:',
    "          node-version: '24'",
    '  shared:',
    `    uses: octo-org/ci/.github/workflows/lint.yml@${SHA} # v2.0.0`,
    ''
  ].join('\n')

const workflows =
  ({ files }) =>
  () => ({
    workflows: Object.entries(files).map(([path, text]) => ({ path, text }))
  })

const one = ({ step }) =>
  workflows({ files: { [CI]: workflowWith({ step }) } })

export const CASES = [
  {
    context: workflows({ files: { [CI]: workflowWith() } }),
    expected: 0,
    name: 'a workflow whose every uses: is a full commit SHA passes'
  },
  {
    context: one({ step: '      - uses: actions/checkout@v4' }),
    expected: 1,
    name: 'a uses: pinned to a tag is refused'
  },
  {
    context: one({ step: '      - uses: actions/checkout@main' }),
    expected: 1,
    name: 'a uses: pinned to a branch is refused'
  },
  {
    context: one({ step: `      - uses: actions/checkout@${SHORT_SHA}` }),
    expected: 1,
    name: 'a uses: pinned to a short SHA is refused'
  },
  {
    context: one({ step: '      - uses: actions/checkout' }),
    expected: 1,
    name: 'a uses: that names no ref is refused'
  },
  {
    context: one({ step: "      - uses: 'actions/checkout@v4' # v4" }),
    expected: 1,
    name: 'a quoted uses: pinned to a tag is refused'
  },
  {
    context: workflows({
      files: {
        [CI]: workflowWith().replace(`lint.yml@${SHA}`, 'lint.yml@v2')
      }
    }),
    expected: 1,
    name: 'a reusable workflow pinned to a tag is refused'
  },
  {
    context: one({ step: '      - uses: ./.github/actions/setup' }),
    expected: 0,
    name: 'a local action is exempt'
  },
  {
    context: one({ step: '      - uses: docker://alpine:3.20' }),
    expected: 0,
    name: 'a Docker image is exempt'
  },
  {
    context: workflows({
      files: {
        [CI]: workflowWith(),
        [RELEASE]: workflowWith({ step: '      - uses: actions/checkout@v4' })
      }
    }),
    expected: 1,
    name: 'a workflow with the .yaml extension is judged too'
  },
  {
    context: one({
      step: [
        '      - run: |',
        '          echo "uses: actions/checkout@v4"',
        '          uses: not-a-key@v1',
        PINNED_STEP
      ].join('\n')
    }),
    expected: 0,
    name: 'a uses: line inside a run script is not judged'
  },
  {
    context: one({
      step: [
        '      - name: >-',
        '          A long step name',
        '        uses: actions/checkout@v4'
      ].join('\n')
    }),
    expected: 1,
    name: 'a uses: after a block scalar that opens a step is still judged'
  },
  {
    context: one({
      step: [
        '      - if: |',
        "          github.event_name == 'push'",
        '        uses: actions/checkout@v4'
      ].join('\n')
    }),
    expected: 1,
    name: 'a uses: after an if: block that opens a step is still judged'
  },
  {
    context: one({
      step: ['    # Note: |', '      - uses: actions/checkout@v4'].join('\n')
    }),
    expected: 1,
    name: 'a comment ending in a block indicator opens no block scalar'
  },
  {
    context: one({
      step: [
        '      - name: x # see: >',
        '        uses: actions/checkout@v4'
      ].join('\n')
    }),
    expected: 1,
    name: 'a trailing comment ending in a block indicator opens no block scalar'
  },
  {
    context: one({ step: '      - "uses": actions/checkout@v4' }),
    expected: 1,
    name: 'a double-quoted uses: key is judged'
  },
  {
    context: one({ step: "      - 'uses': actions/checkout@v4" }),
    expected: 1,
    name: 'a single-quoted uses: key is judged'
  },
  {
    context: one({
      step: [
        '      - uses: actions/checkout@v4',
        '      - uses: actions/upload-artifact@v4'
      ].join('\n')
    }),
    expected: 2,
    name: 'every unpinned uses: is a finding of its own'
  }
]

const runGate = ({ files }) =>
  withScratchTree({
    files,
    prefix: 'workflow-pins-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

const checks = [
  {
    name: 'a finding names the file, the line, the uses: value and its ref',
    run: () => {
      const [finding] = gate.run(
        one({ step: '      - uses: actions/checkout@v4 # v4' })()
      )
      assert.equal(
        finding.detail,
        `${CI}:7: uses: actions/checkout@v4 is pinned to v4, not to a ` +
          'full 40-character commit SHA'
      )
    }
  },
  {
    name: 'the cases fail against a gate that finds nothing',
    run: () => {
      const failures = runCases({ cases: CASES, gate: blindGate({ gate }) })
      assert.ok(failures.length > 0, 'every case passed a blinded gate')
    }
  },
  {
    name: 'the gate run over a workflow pinned to a tag exits 1 and names it',
    run: () => {
      const result = runGate({
        files: {
          [CI]: workflowWith({ step: '      - uses: actions/checkout@v4' })
        }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-workflow-pins: 1 problem/u)
      assert.match(result.stderr, /ci\.yml:7: uses: actions\/checkout@v4/u)
    }
  },
  {
    name: 'the gate exits 0 over the repository and states what it judged',
    run: () => {
      const result = spawnSync(process.execPath, [GATE], { encoding: 'utf8' })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-workflow-pins: PASS/u)
      assert.match(result.stdout, /\d+ uses: line\(s\) across \d+ workflow/u)
      assert.match(result.stdout, /NOT covered: /u)
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
