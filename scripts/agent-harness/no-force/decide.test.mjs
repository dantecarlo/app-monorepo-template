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
  assert.equal(LAW, 'A check is never forced or skipped')
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

test('a skipped check is denied as a force is', () => {
  const verdict = decide({ payload: payloadOf({ command: 'rm -rf dist' }) })
  assert.equal(verdict?.decision, 'deny')
  assert.ok(verdict.reason.includes('`rm` passes `-rf`'), verdict.reason)
})

for (const payload of [
  payloadOf({ command: 'git push origin main' }),
  payloadOf({ command: 'rm -r dist' }),
  payloadOf({ command: 'Remove-Item dist', tool: 'PowerShell' }),
  payloadOf({ command: 'git push --force', tool: 'Edit' }),
  { tool_input: { file_path: 'a.md' }, tool_name: 'Write' },
  { tool_input: { command: 'git push -f' }, tool_name: 'Read' },
  {}
]) {
  test(`${JSON.stringify(payload)} gets no verdict`, () => {
    assert.equal(decide({ payload }), undefined)
  })
}

// A call the hook judges but cannot read fails closed, and the reason
// names the one recovery.
for (const payload of [
  { tool_input: {}, tool_name: 'Bash' },
  { tool_name: 'Bash' },
  { tool_input: { command: 7 }, tool_name: 'Bash' },
  { tool_input: { command: null }, tool_name: 'PowerShell' },
  { tool_input: 'git push -f', tool_name: 'PowerShell' },
  payloadOf({ command: `${'eval '.repeat(17)}ls` }),
  payloadOf({ command: `${'pwsh -c '.repeat(17)}ls`, tool: 'PowerShell' })
]) {
  test(`${JSON.stringify(payload).slice(0, 80)} is denied as unreadable`, () => {
    const verdict = decide({ payload })
    assert.equal(verdict?.decision, 'deny')
    assert.ok(verdict.reason.includes(`"${LAW}"`), verdict.reason)
    assert.ok(
      verdict.reason.includes('"disableAllHooks": true'),
      verdict.reason
    )
  })
}

test('a command nested exactly as deep as the reader reads gets its verdict', () => {
  assert.equal(
    decide({ payload: payloadOf({ command: `${'eval '.repeat(16)}ls` }) }),
    undefined
  )
  const verdict = decide({
    payload: payloadOf({ command: `${'eval '.repeat(16)}git push -f` })
  })
  assert.equal(verdict?.decision, 'deny')
  assert.ok(verdict.reason.includes('`git push` passes `-f`'), verdict.reason)
})
