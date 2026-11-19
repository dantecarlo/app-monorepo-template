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
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases } from '../../../scripts/gate/cases.mjs'
import { withScratchTree } from '../../../scripts/gate/scratch.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const VALIDATOR = join(HERE, 'validate-general-plan.mjs')
const PLAN = 'docs/GENERAL_PLAN.md'
const PASSED = 0
const OK_LINE = /validate-general-plan: OK/u

const BACKLOG = [
  '| Item | Technical detail | Size | Flags |',
  '|---|---|---|---|',
  '| Sign-in | `apps/web/src/app/sign-in` | M | BLOCKING |'
]

// A plan with every section the validator requires, as a project with no
// ticket flow writes it.
const plan = ({ pending = BACKLOG } = {}) =>
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

export const GENERAL_PLAN_CHECKS = [
  {
    name: 'a plan checked out with CRLF line endings passes',
    run: () => {
      const result = validate({
        files: { [PLAN]: plan().replaceAll('\n', '\r\n') }
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, OK_LINE)
    }
  }
]

registerCases({
  cases: [],
  checks: GENERAL_PLAN_CHECKS,
  gate: undefined,
  meta: import.meta
})
