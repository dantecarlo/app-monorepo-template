#!/usr/bin/env node
// ---------------------------------------------------------------------------
// reasons — every reason names who, what, the rule that fired and how to
// proceed: an ask cites the LAW and says to approve only an edit the owner
// asked for; a deny says what to do instead. The decide suites check each
// reason in its context; these check the shapes the builders share.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/reasons.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ACTOR_KIND } from './policy.mjs'
import { askReason, brief, denyReason, MAX_SHOWN } from './reasons.mjs'

const MAIN = { kind: ACTOR_KIND.main, name: null }
const READ_ONLY = { kind: ACTOR_KIND.readOnly, name: 'validator' }
const SURFACE = {
  kind: ACTOR_KIND.surface,
  name: 'e2e-author',
  surface: ['docs/qa', 'apps/mobile/.maestro']
}
const RULE = { glob: 'AGENTS.md', what: 'the LAWs and the router' }
const HELD = { glob: '.claude/skills/**', held: true, what: 'a skill' }

test('a long command is shown cut short', () => {
  const text = 'x'.repeat(MAX_SHOWN + 10)
  assert.equal(brief({ text }), `${'x'.repeat(MAX_SHOWN)}…`)
  assert.equal(brief({ text: 'ls' }), 'ls')
})

test('an ask for a rule file names the shape, the rule and the LAW', () => {
  const reason = askReason({
    actor: MAIN,
    finding: { kind: 'rule', rule: RULE, shape: '> AGENTS.md' },
    tool: 'Bash'
  })
  assert.match(reason, /^Bash `> AGENTS\.md` edits a rule file/)
  assert.match(reason, /"A rule is not edited to fit the work"/)
  assert.match(reason, /Approve only if the owner asked/)
})

test('an ask for a folder that holds rule files says so', () => {
  assert.match(
    askReason({
      actor: MAIN,
      finding: { kind: 'rule', rule: HELD, shape: 'rm -rf .claude' },
      tool: 'Bash'
    }),
    /writes a folder that holds rule files: `\.claude\/skills\/\*\*`/
  )
})

test('an ask for a command the guard cannot read names what it could not read and the rule path', () => {
  const reason = askReason({
    actor: { kind: ACTOR_KIND.writer, name: 'sdd-steward' },
    command: "bash -c 'echo x > AGENTS.md'",
    finding: { kind: 'shell', level: 'opaque', shape: 'bash -c' },
    named: { rule: RULE, token: 'AGENTS.md' },
    tool: 'Bash'
  })
  assert.match(reason, /by sdd-steward/)
  assert.match(reason, /runs text the write guard does not read/)
  assert.match(reason, /names `AGENTS\.md`, a rule file/)
})

test('an ask for a command too long to check says so', () => {
  assert.match(
    askReason({
      actor: MAIN,
      command: 'x',
      finding: { kind: 'unreadable', level: 'opaque', problem: 'p' },
      named: { tooLong: true },
      tool: 'Bash'
    }),
    /too long for the write guard to check/
  )
})

test('a deny names who is refused, and the surface of a surface agent', () => {
  assert.match(
    denyReason({
      actor: READ_ONLY,
      finding: { kind: 'git', shape: 'git push' },
      tool: 'Bash'
    }),
    /^validator is read-only .*`git push` changes the working tree/
  )
  assert.match(
    denyReason({
      actor: SURFACE,
      finding: { kind: 'unreadable', problem: 'an unterminated quote' },
      tool: 'Bash'
    }),
    /^e2e-author writes only under docs\/qa\/, apps\/mobile\/\.maestro\/ or the OS temp dir.*cannot be read \(an unterminated quote\)/
  )
})

test('a PowerShell deny says to run the command through Bash', () => {
  assert.match(
    denyReason({
      actor: READ_ONLY,
      finding: { kind: 'powershell' },
      tool: 'PowerShell'
    }),
    /through the Bash tool/
  )
})
