#!/usr/bin/env node
// ---------------------------------------------------------------------------
// claude-hook, Bash and PowerShell — end to end: the real hook as Claude
// Code runs it on a shell tool, with the committed policy and agent context
// of this checkout. The donor's two end-to-end cases are here too.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/claude-hook.shell.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { shellPayload, spawnHook } from './claude-hook.fixtures.mjs'

test('END TO END: Bash writing AGENTS.md asks the main session and refuses the validator', () => {
  const main = spawnHook({
    input: shellPayload({ command: 'echo x > AGENTS.md' })
  })
  assert.equal(main?.permissionDecision, 'ask')
  assert.match(main.permissionDecisionReason, /^Bash `> AGENTS.md`/)
  assert.equal(
    spawnHook({
      input: shellPayload({
        agent: 'validator',
        command: 'echo x > AGENTS.md'
      })
    })?.permissionDecision,
    'deny'
  )
})

test('END TO END: Bash writing a file no rule names prints nothing for the main session', () => {
  assert.equal(
    spawnHook({
      input: shellPayload({ command: 'echo x > docs/notes.md' })
    }),
    null
  )
})

// The donor's two end-to-end cases.
test('END TO END: a validator git write is denied', () => {
  assert.equal(
    spawnHook({
      input: shellPayload({
        agent: 'validator',
        command: 'git commit -m x'
      })
    })?.permissionDecision,
    'deny'
  )
})

test('END TO END: a validator Bash write under the OS temp dir passes', () => {
  const target = join(tmpdir(), 'agent-writes-probe.log')
  assert.equal(
    spawnHook({
      input: shellPayload({
        agent: 'validator',
        command: `echo x > "${target}"`
      })
    }),
    null
  )
})

test('END TO END: PowerShell asks the main session before a write cmdlet that names a rule file, and refuses the validator', () => {
  const command = 'Set-Content -Path AGENTS.md -Value x'
  assert.equal(
    spawnHook({ input: shellPayload({ command, tool: 'PowerShell' }) })
      ?.permissionDecision,
    'ask'
  )
  assert.equal(
    spawnHook({
      input: shellPayload({
        agent: 'validator',
        command,
        tool: 'PowerShell'
      })
    })?.permissionDecision,
    'deny'
  )
})
