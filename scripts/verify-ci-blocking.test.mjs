#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-ci-blocking. Once no workflow and no doc carries
// `continue-on-error`, the gate has no finding in the repository, so its
// cases are the only evidence it can go red at all.
//
// The cases hand the gate's `run` synthetic workflows and docs. The checks
// then run the gate as a process over a scratch tree in the OS temp
// directory, which `withScratchTree` removes, and over the repository.
//
// Usage:
//   node --test scripts/verify-ci-blocking.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { gate } from './verify-ci-blocking.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-ci-blocking.mjs'
)
const FAILED = 1
const PASSED = 0
const CI = '.github/workflows/ci.yml'
const DOC = 'docs/e2e.md'

const workflowWith = ({ line = '    runs-on: ubuntu-latest' } = {}) =>
  [
    'jobs:',
    '  e2e:',
    '    needs: validate',
    line,
    '    steps:',
    '      - run: pnpm test',
    ''
  ].join('\n')

const docWith = ({ fence = '```yaml', line }) =>
  [
    '# CI',
    '',
    'Every job blocks: none carries `continue-on-error`.',
    '',
    fence,
    'jobs:',
    '  e2e:',
    line,
    '```',
    ''
  ].join('\n')

const context =
  ({ docs = {}, workflows = {} }) =>
  () => ({
    docs: Object.entries(docs).map(([path, text]) => ({ path, text })),
    workflows: Object.entries(workflows).map(([path, text]) => ({
      path,
      text
    }))
  })

export const CASES = [
  {
    context: context({
      docs: { [DOC]: docWith({ line: '    runs-on: ubuntu-latest' }) },
      workflows: { [CI]: workflowWith() }
    }),
    expected: 0,
    name: 'a workflow and a doc with no continue-on-error pass'
  },
  {
    context: context({
      workflows: {
        [CI]: workflowWith({ line: '    continue-on-error: true' })
      }
    }),
    expected: 1,
    name: 'a job that carries continue-on-error is refused'
  },
  {
    context: context({
      workflows: {
        [CI]: workflowWith().replace(
          '      - run: pnpm test',
          '      - run: pnpm test\n        continue-on-error: ${{ matrix.ok }}'
        )
      }
    }),
    expected: 1,
    name: 'a step that carries continue-on-error, an expression too, is refused'
  },
  {
    context: context({
      workflows: {
        [CI]: workflowWith({ line: "    'continue-on-error': true" })
      }
    }),
    expected: 1,
    name: 'a quoted continue-on-error key is refused'
  },
  {
    context: context({
      workflows: {
        [CI]: workflowWith({ line: '    continue-on-error: false' })
      }
    }),
    expected: 0,
    name: 'continue-on-error: false lets no failure through, and passes'
  },
  {
    context: context({
      docs: { [DOC]: docWith({ line: '    continue-on-error: true' }) }
    }),
    expected: 1,
    name: 'a fenced yaml block of a doc that carries continue-on-error is refused'
  },
  {
    context: context({
      docs: {
        [DOC]: docWith({ fence: '~~~yml', line: '    continue-on-error: true' })
      }
    }),
    expected: 1,
    name: 'a ~~~yml fence is a yaml block too'
  },
  {
    context: context({
      docs: {
        [DOC]: docWith({ fence: '```text', line: '    continue-on-error: true' })
      }
    }),
    expected: 0,
    name: 'a fence of another language is not judged'
  },
  {
    context: context({
      docs: {
        [DOC]: [
          'A job with `continue-on-error: true` is a skipped check.',
          ''
        ].join('\n')
      }
    }),
    expected: 0,
    name: 'prose that names continue-on-error outside a fence is not judged'
  },
  {
    context: context({
      workflows: {
        [CI]: workflowWith().replace(
          '      - run: pnpm test',
          '      - run: |\n          echo "continue-on-error: true"'
        )
      }
    }),
    expected: 0,
    name: 'a continue-on-error line inside a run script is text'
  }
]

const runGate = ({ files }) =>
  withScratchTree({
    files,
    prefix: 'ci-blocking-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

const checks = [
  {
    name: 'a finding names the file, the line and the key',
    run: () => {
      const [finding] = gate.run(
        context({
          docs: { [DOC]: docWith({ line: '    continue-on-error: true' }) }
        })()
      )
      assert.equal(
        finding.detail,
        `${DOC}:8: continue-on-error: true lets a failing job or step ` +
          'pass, which skips the check it is'
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
    name: 'the gate run over a doc that carries continue-on-error exits 1 and names it',
    run: () => {
      const result = runGate({
        files: {
          [CI]: workflowWith(),
          [DOC]: docWith({ line: '    continue-on-error: true' })
        }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-ci-blocking: 1 problem/u)
      assert.match(result.stderr, /docs\/e2e\.md:8: continue-on-error/u)
    }
  },
  {
    name: 'the gate exits 0 over the repository and states what it judged',
    run: () => {
      const result = spawnSync(process.execPath, [GATE], { encoding: 'utf8' })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-ci-blocking: PASS/u)
      assert.match(result.stdout, /NOT covered: /u)
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
