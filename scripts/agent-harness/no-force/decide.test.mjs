#!/usr/bin/env node
// ---------------------------------------------------------------------------
// decide — the no-force hook's verdict on one PreToolUse payload: a deny
// whose reason names the LAW, the program and the option, for a Bash or
// PowerShell command that passes a force option; nothing for any other.
//
// Usage:
//   node --test scripts/agent-harness/no-force/decide.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { decide, LAW } from './decide.mjs'

const payloadOf = ({ command, tool = 'Bash' }) => ({
  tool_input: { command },
  tool_name: tool
})

test('a Bash force option is denied with a reason that names the LAW', () => {
  const verdict = decide({
    payload: payloadOf({ command: 'git push --force origin main' })
  })
  assert.equal(verdict?.decision, 'deny')
  assert.equal(LAW, 'A force option is never used')
  for (const part of [
    `"${LAW}"`,
    'AGENTS.md',
    '`git push`',
    '`--force`',
    'fix its cause',
    'the owner decides'
  ]) {
    assert.ok(verdict.reason.includes(part), `the reason names ${part}`)
  }
})

test('a PowerShell force option is denied', () => {
  const verdict = decide({
    payload: payloadOf({
      command: 'Remove-Item -Recurse -Force dist',
      tool: 'PowerShell'
    })
  })
  assert.equal(verdict?.decision, 'deny')
  assert.ok(verdict.reason.includes('`-Force`'))
})

for (const payload of [
  payloadOf({ command: 'git push origin main' }),
  payloadOf({ command: 'rm -rf dist' }),
  payloadOf({ command: 'Remove-Item dist', tool: 'PowerShell' }),
  payloadOf({ command: 'git push --force', tool: 'Edit' }),
  { tool_input: { file_path: 'a.md' }, tool_name: 'Write' },
  { tool_input: {}, tool_name: 'Bash' },
  { tool_name: 'Bash' },
  {}
]) {
  test(`${JSON.stringify(payload)} gets no verdict`, () => {
    assert.equal(decide({ payload }), undefined)
  })
}
