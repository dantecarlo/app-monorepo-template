#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for validate-general-plan, the structural gate of a project's
// docs/GENERAL_PLAN.md. Each check runs the validator as a process over a
// plan written into a scratch tree in the OS temp directory, which
// `withScratchTree` removes, the way a project runs
// `node .claude/skills/general-plan/validate-general-plan.mjs docs/GENERAL_PLAN.md`.
//
// No script of package.json runs a test under .claude/skills/, so
// `pnpm verify:skills:test` imports GENERAL_PLAN_CHECKS and runs them with its
// own; `node --test` on this file runs them alone.
//
// Usage:
//   node --test .claude/skills/general-plan/validate-general-plan.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases } from '../../../scripts/gate/cases.mjs'
import { withScratchTree } from '../../../scripts/gate/scratch.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const VALIDATOR = join(HERE, 'validate-general-plan.mjs')
const TEMPLATE = join(HERE, 'general-plan.template.md')
const PLAN = 'docs/GENERAL_PLAN.md'
const TICKET_FLOW = 'docs/process/ticket-flow.md'
const PASSED = 0
const FAILED = 1
const OK_LINE = /validate-general-plan: OK/u
const PLAIN_CHECK_COUNT = 16
const ONE_FAILED = /validate-general-plan: FAIL — 1 of \d+ checks failed/u
const TICKET_FLOW_MARK = '(ticket flow)'
const CATALOG_PRESENT = 'Section "Closed Ticket Catalog" present (ticket flow)'
const CATALOG_TABLE = 'Closed Ticket Catalog holds its table (ticket flow)'
const BOARD_POINTED = 'PENDING section points at the board (ticket flow)'
const CATALOG_HEADER = '| Ticket | Title | Type | Version | Closed | Pull request |'
const BOARD_LINK = 'process/ticket-flow.md'

// The project layer of a ticket flow; the validator reads only that it
// exists beside the plan.
const LAYER = [
  '# Ticket flow — acme',
  '',
  '## Board adapter',
  '',
  '- **Kind:** `gh`, GitHub Issues',
  ''
].join('\n')

const BACKLOG = [
  '| Item | Technical detail | Size | Flags |',
  '|---|---|---|---|',
  '| Sign-in | `apps/web/src/app/sign-in` | M | BLOCKING |'
]
const BOARD_POINTER = [
  'Every open ticket lives on the board: read it there, through',
  'docs/process/ticket-flow.md § Board adapter.'
]
const CATALOG = [
  '## Closed Ticket Catalog',
  '',
  CATALOG_HEADER,
  '|---|---|---|---|---|---|',
  '| #12 | Sign in with a magic link | feature | 1.0.0 | 2026-11-18 | #34 |',
  ''
]

// A plan with every section the validator requires, as a project with no
// ticket flow writes it; `catalog` goes after What's PENDING.
const plan = ({ catalog = [], pending = BACKLOG } = {}) =>
  [
    '---',
    'project: acme',
    'last_updated: 2026-11-18',
    'status: in-progress',
    '---',
    '',
    '# Acme — General Plan',
    '',
    '## Status Snapshot',
    '',
    '| Area | Built % | State note |',
    '|---|---|---|',
    '| Foundation | 100% | 4 of 4 packages |',
    '',
    '## Product Vision & Scope',
    '',
    'Acme sells anvils to coyotes.',
    '',
    '## Current Stack & Architecture',
    '',
    'pnpm workspaces and Turborepo.',
    '',
    "## What's DONE (with technical evidence)",
    '',
    '- `packages/core` — REAL.',
    '',
    "## What's PENDING (the agent's backlog)",
    '',
    ...pending,
    '',
    ...catalog,
    '## Needs from user',
    '',
    '- A Supabase project.',
    '',
    '## Path to Launch (gated roadmap)',
    '',
    '| Gate | Content | Unlocks | Checkpoint |',
    '|---|---|---|---|',
    '| GATE 0 | foundation | the first release | `pnpm validate` |',
    '',
    '## Technical Details, Conventions & Gotchas',
    '',
    '- Arrow functions only.',
    '',
    '## Risks & Open Decisions',
    '',
    '- **R1** — none yet.',
    ''
  ].join('\n')

// The validator as a project runs it, over a scratch tree that holds the
// plan at docs/GENERAL_PLAN.md and every other file given.
const validate = ({ files }) =>
  withScratchTree({
    files,
    prefix: 'validate-general-plan-',
    use: ({ root }) =>
      spawnSync(process.execPath, [VALIDATOR, join(root, PLAN)], {
        encoding: 'utf8'
      })
  })

// A plan of a project with a ticket flow: the layer beside it, the catalog,
// and a PENDING section that points at the board.
const ticketFlowPlan = ({ catalog = CATALOG, pending = BOARD_POINTER } = {}) => ({
  [PLAN]: plan({ catalog, pending }),
  [TICKET_FLOW]: LAYER
})

const assertOneFailure = ({ check, result, why }) => {
  assert.equal(result.status, FAILED, result.stdout)
  assert.ok(
    result.stderr.includes(`FAIL — ${check}`),
    `no FAIL line for ${check}: ${result.stderr}`
  )
  assert.ok(result.stderr.includes(why), `the FAIL line does not say ${why}`)
  assert.match(result.stderr, ONE_FAILED)
}

export const GENERAL_PLAN_CHECKS = [
  {
    name: 'a plan checked out with CRLF line endings passes',
    run: () => {
      const crlf = ({ text }) => text.replaceAll('\n', '\r\n')
      const plain = validate({ files: { [PLAN]: crlf({ text: plan() }) } })
      assert.equal(plain.status, PASSED, plain.stderr)
      assert.match(plain.stdout, OK_LINE)
      const files = ticketFlowPlan()
      const withFlow = validate({
        files: { ...files, [PLAN]: crlf({ text: files[PLAN] }) }
      })
      assert.equal(withFlow.status, PASSED, withFlow.stderr)
      assert.match(withFlow.stdout, OK_LINE)
    }
  },
  {
    name: 'a plan with a ticket flow, its closed ticket catalog and a pending section that points at the board passes',
    run: () => {
      const result = validate({ files: ticketFlowPlan() })
      assert.equal(result.status, PASSED, result.stderr)
      ;[CATALOG_PRESENT, CATALOG_TABLE, BOARD_POINTED].forEach((check) =>
        assert.ok(
          result.stdout.includes(`PASS — ${check}`),
          `no PASS line for ${check}: ${result.stdout}`
        )
      )
      assert.match(result.stdout, OK_LINE)
    }
  },
  {
    name: 'a plan with a ticket flow and no closed ticket catalog fails',
    run: () =>
      assertOneFailure({
        check: CATALOG_PRESENT,
        result: validate({ files: ticketFlowPlan({ catalog: [] }) }),
        why: '## Closed Ticket Catalog'
      })
  },
  {
    name: 'a plan with a ticket flow whose closed ticket catalog holds no table fails',
    run: () =>
      assertOneFailure({
        check: CATALOG_TABLE,
        result: validate({
          files: ticketFlowPlan({
            catalog: ['## Closed Ticket Catalog', '', 'None closed yet.', '']
          })
        }),
        why: CATALOG_HEADER
      })
  },
  {
    name: 'a plan with a ticket flow whose pending section does not point at the board fails',
    run: () => {
      assertOneFailure({
        check: BOARD_POINTED,
        result: validate({ files: ticketFlowPlan({ pending: BACKLOG }) }),
        why: BOARD_LINK
      })
      assertOneFailure({
        check: BOARD_POINTED,
        result: validate({
          files: ticketFlowPlan({
            pending: [`<!-- ${BOARD_LINK} -->`, ...BACKLOG]
          })
        }),
        why: BOARD_LINK
      })
    }
  },
  {
    name: 'a plan with no ticket flow passes without a closed ticket catalog',
    run: () => {
      const result = validate({ files: { [PLAN]: plan() } })
      assert.equal(result.status, PASSED, result.stderr)
      assert.ok(
        !result.stdout.includes(TICKET_FLOW_MARK),
        `a plan with no ticket flow was judged as one: ${result.stdout}`
      )
      assert.ok(
        result.stdout.includes(`OK — ${PLAIN_CHECK_COUNT} checks passed`),
        result.stdout
      )
    }
  },
  {
    name: 'a plan with no ticket flow and an empty pending section still fails',
    run: () => {
      const result = validate({ files: { [PLAN]: plan({ pending: [] }) } })
      assert.equal(result.status, FAILED, result.stdout)
      assert.ok(
        result.stderr.includes('FAIL — PENDING section is non-empty'),
        result.stderr
      )
      assert.match(result.stderr, ONE_FAILED)
    }
  },
  {
    name: 'the plan template passes with a ticket flow and without one',
    run: () => {
      const template = readFileSync(TEMPLATE, 'utf8')
      const plain = validate({ files: { [PLAN]: template } })
      assert.equal(plain.status, PASSED, plain.stderr)
      const withFlow = validate({
        files: { [PLAN]: template, [TICKET_FLOW]: LAYER }
      })
      assert.equal(withFlow.status, PASSED, withFlow.stderr)
      assert.ok(withFlow.stdout.includes(`PASS — ${BOARD_POINTED}`))
    }
  }
]

registerCases({
  cases: [],
  checks: GENERAL_PLAN_CHECKS,
  gate: undefined,
  meta: import.meta
})
