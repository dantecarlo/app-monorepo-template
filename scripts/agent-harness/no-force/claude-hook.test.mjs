#!/usr/bin/env node
// ---------------------------------------------------------------------------
// claude-hook — the Claude Code adapter of the no-force hook, end to end: a
// PreToolUse payload on stdin, a deny on stdout for a force option, and
// nothing for any other call or for stdin that is not a JSON object. It
// fails safe: when its engine cannot load or throws, it prints one line
// and lets the call run.
//
// Usage:
//   node --test scripts/agent-harness/no-force/claude-hook.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { answer } from './claude-hook.mjs'

const HOOK = join(
  dirname(fileURLToPath(import.meta.url)),
  'claude-hook.mjs'
)
const HOOK_BOUND_MS = 10_000

const runHook = ({ input }) =>
  spawnSync(process.execPath, [HOOK], {
    encoding: 'utf8',
    input,
    timeout: HOOK_BOUND_MS
  })

const payloadText = ({ command, tool = 'Bash' }) =>
  JSON.stringify({
    cwd: process.cwd(),
    hook_event_name: 'PreToolUse',
    tool_input: { command },
    tool_name: tool
  })

test('the hook denies a force option, naming the LAW', () => {
  const run = runHook({ input: payloadText({ command: 'git push -f' }) })
  assert.equal(run.status, 0)
  const output = JSON.parse(run.stdout).hookSpecificOutput
  assert.equal(output.hookEventName, 'PreToolUse')
  assert.equal(output.permissionDecision, 'deny')
  assert.match(
    output.permissionDecisionReason,
    /A force option is never used/u
  )
})

for (const input of [
  payloadText({ command: 'git push origin main' }),
  payloadText({ command: 'Get-ChildItem', tool: 'PowerShell' }),
  'not json',
  '[]'
]) {
  test(`the hook prints nothing for ${input}`, () => {
    const run = runHook({ input })
    assert.equal(run.status, 0)
    assert.equal(run.stdout, '')
  })
}

for (const [name, load] of [
  [
    'an engine that cannot load',
    async () => {
      throw new Error('cannot load')
    }
  ],
  [
    'an engine that throws',
    async () => ({
      decide: () => {
        throw new Error('broke')
      }
    })
  ]
]) {
  test(`${name} prints one line and lets the call run`, async () => {
    const out = await answer({
      load,
      text: payloadText({ command: 'git push --force' })
    })
    assert.equal(out.split('\n').length, 1)
    const parsed = JSON.parse(out)
    assert.deepEqual(Object.keys(parsed), ['systemMessage'])
    assert.match(parsed.systemMessage, /runs unchecked/u)
  })
}
