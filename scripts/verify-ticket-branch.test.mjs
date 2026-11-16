#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-ticket-branch. The template's own branches carry no
// ticket id, so the check never runs over this repository: these cases are
// the only evidence that it passes a ticket branch and refuses everything
// else.
//
// Each case is one branch name and one pull request body, handed to the
// check's `run` as data. The checks then run the check as a process, as a
// project's CI would, and read the template's own `validate` script, which
// runs this test and never the check.
//
// Usage:
//   node --test scripts/verify-ticket-branch.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import {
  BRANCH_SHAPE,
  FINDING_KIND,
  gate,
  TICKET_TYPES
} from './verify-ticket-branch.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CHECK = join(HERE, 'verify-ticket-branch.mjs')
const PACKAGE_JSON = join(HERE, '..', 'package.json')
const FAILED = 1
const PASSED = 0

const ISSUE_BRANCH = 'feature/123-add-sign-in'
const KEYED_BRANCH = 'fix/PROJ-42-null-total'
const ISSUE_BODY = 'Adds the sign-in form.\n\nRefs #123\n'
const KEYED_BODY = 'Fixes the null total.\n\nTicket: PROJ-42\n'

const pair =
  ({ body, branch }) =>
  () => ({ body, branch })

export const CASES = [
  {
    context: pair({ body: ISSUE_BODY, branch: ISSUE_BRANCH }),
    expected: 0,
    name: 'a ticket branch whose pull request body names its issue passes'
  },
  {
    context: pair({ body: KEYED_BODY, branch: KEYED_BRANCH }),
    expected: 0,
    name: 'a branch with a keyed id and a body that names the key passes'
  },
  {
    context: pair({
      body: 'Refs #123 and depends on #120\n',
      branch: 'tech/123-split-the-query-hooks'
    }),
    expected: 0,
    name: 'a body that names other tickets beside its own passes'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: 'feature/add-sign-in' }),
    expected: 1,
    name: 'a branch with no id is refused'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: 'feat/123-add-sign-in' }),
    expected: 1,
    name: 'a branch with an unknown type is refused'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: 'feature/123' }),
    expected: 1,
    name: 'a branch missing the slug is refused'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: 'feature/123-Add_Sign_In' }),
    expected: 1,
    name: 'a slug that is not lower-case kebab is refused'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: '123-add-sign-in' }),
    expected: 1,
    name: 'a branch with no type is refused'
  },
  {
    context: pair({ body: 'Refs #124\n', branch: ISSUE_BRANCH }),
    expected: 1,
    name: 'a body that names another id is refused'
  },
  {
    context: pair({ body: 'Refs #1234\n', branch: ISSUE_BRANCH }),
    expected: 1,
    name: 'a body that names a longer id is refused'
  },
  {
    context: pair({ body: 'Ticket: PROJ-421\n', branch: KEYED_BRANCH }),
    expected: 1,
    name: 'a body that names a longer key is refused'
  },
  {
    context: pair({ body: 'Refs 123\n', branch: ISSUE_BRANCH }),
    expected: 1,
    name: 'a body that names a number without its hash is refused'
  },
  {
    context: pair({ body: 'Refs #124\n', branch: 'feat/123' }),
    expected: 3,
    name: 'every defect of one branch is named on its own'
  }
]

const runCheck = ({ body, branch }) =>
  spawnSync(
    process.execPath,
    [CHECK, '--branch', branch, '--body', body],
    { encoding: 'utf8' }
  )

const checks = [
  {
    name: 'a finding names the branch and the shape it owes',
    run: () => {
      const [finding] = gate.run({ body: ISSUE_BODY, branch: 'feature/add' })
      assert.equal(finding.kind, FINDING_KIND.id)
      assert.ok(
        finding.detail.includes('feature/add'),
        `the finding does not name the branch: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(BRANCH_SHAPE),
        `the finding does not name the shape: ${finding.detail}`
      )
    }
  },
  {
    name: 'an unknown type is named with the four types',
    run: () => {
      const [finding] = gate.run({
        body: ISSUE_BODY,
        branch: 'feat/123-add-sign-in'
      })
      assert.equal(finding.kind, FINDING_KIND.type)
      TICKET_TYPES.forEach((type) =>
        assert.ok(
          finding.detail.includes(type),
          `the finding does not name ${type}: ${finding.detail}`
        )
      )
    }
  },
  {
    name: 'a body that names another id is told the id it owes and the one it names',
    run: () => {
      const [finding] = gate.run({ body: 'Refs #124\n', branch: ISSUE_BRANCH })
      assert.equal(finding.kind, FINDING_KIND.body)
      assert.match(finding.detail, /#123/u)
      assert.match(finding.detail, /#124/u)
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
    name: 'the check exits 1 and names the id the body owes',
    run: () => {
      const result = runCheck({ body: 'Refs #124\n', branch: ISSUE_BRANCH })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /#123/u)
      assert.match(result.stderr, /verify-ticket-branch: 1 problem/u)
    }
  },
  {
    name: 'the check exits 0 and states what it judged',
    run: () => {
      const result = runCheck({ body: ISSUE_BODY, branch: ISSUE_BRANCH })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-ticket-branch: PASS/u)
      assert.ok(
        result.stdout.includes(ISSUE_BRANCH),
        `the pass line does not name the branch: ${result.stdout}`
      )
      assert.match(result.stdout, /NOT covered: /u)
    }
  },
  {
    name: 'the check run with no arguments refuses an empty branch and body',
    run: () => {
      const result = spawnSync(process.execPath, [CHECK], {
        encoding: 'utf8'
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.ok(
        result.stderr.includes(BRANCH_SHAPE),
        `the refusal does not name the shape: ${result.stderr}`
      )
    }
  },
  {
    name: "the template's validate runs the tests and not the check",
    run: () => {
      const { scripts } = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'))
      const steps = scripts.validate.split('&&').map((step) => step.trim())
      assert.ok(
        steps.includes('pnpm verify:ticket-branch:test'),
        'validate does not run pnpm verify:ticket-branch:test'
      )
      assert.ok(
        !steps.includes('pnpm verify:ticket-branch'),
        'validate runs pnpm verify:ticket-branch, which fails on every ' +
          'branch of the template: they carry no ticket id'
      )
      assert.equal(
        scripts['verify:ticket-branch'],
        'node scripts/verify-ticket-branch.mjs'
      )
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
