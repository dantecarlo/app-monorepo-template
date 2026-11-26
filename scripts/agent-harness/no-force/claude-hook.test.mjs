#!/usr/bin/env node
// ---------------------------------------------------------------------------
// claude-hook — the Claude Code adapter of the no-force hook, end to end: a
// PreToolUse payload on stdin, a deny on stdout for a force option, and
// nothing for a tool it does not judge. It fails closed: stdin that is no
// JSON object, a Bash or PowerShell call with no command, a command nested
// past what it reads, and an engine that cannot load or throws, each get
// one line that denies and names the one recovery, "disableAllHooks".
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
    /A check is never forced or skipped/u
  )
})

for (const command of [
  'for ((i=0;i<3;i++)); do rm -rf x$i; done',
  'git push --force <<EOF',
  'ls apps/(group)/x.tsx && git push -f'
]) {
  test(`the hook denies \`${command}\`, a line bash runs or the reader cannot read`, () => {
    const run = runHook({ input: payloadText({ command }) })
    assert.equal(run.status, 0)
    assert.equal(
      JSON.parse(run.stdout).hookSpecificOutput.permissionDecision,
      'deny'
    )
  })
}

for (const input of [
  payloadText({ command: 'git push origin main' }),
  payloadText({ command: 'Get-ChildItem', tool: 'PowerShell' }),
  JSON.stringify({ tool_input: { file_path: 'a.md' }, tool_name: 'Read' })
]) {
  test(`the hook prints nothing for ${input}`, () => {
    const run = runHook({ input })
    assert.equal(run.status, 0)
    assert.equal(run.stdout, '')
  })
}

for (const [name, input] of [
  ['empty stdin', ''],
  ['malformed JSON', '{"tool_name": "Bash"'],
  ['a JSON array', '[]'],
  ['a JSON string', '"git push -f"'],
  ['JSON null', 'null'],
  ['a Bash call whose command is no string', JSON.stringify({ tool_input: { command: 7 }, tool_name: 'Bash' })],
  [
    'a PowerShell call with no command',
    JSON.stringify({ tool_input: {}, tool_name: 'PowerShell' })
  ],
  [
    'a command nested deeper than 16 levels',
    payloadText({ command: `${'eval '.repeat(17)}ls` })
  ]
]) {
  test(`the hook fails closed on ${name}: one line that denies, naming the recovery`, () => {
    const run = runHook({ input })
    assert.equal(run.status, 0)
    assert.equal(run.stdout.split('\n').length, 1)
    const output = JSON.parse(run.stdout).hookSpecificOutput
    assert.equal(output.permissionDecision, 'deny')
    assert.match(output.permissionDecisionReason, /"disableAllHooks": true/u)
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
  test(`${name} fails closed: one line that denies, naming the error and the recovery`, async () => {
    const out = await answer({
      load,
      text: payloadText({ command: 'git status' })
    })
    assert.equal(out.split('\n').length, 1)
    const output = JSON.parse(out).hookSpecificOutput
    assert.equal(output.permissionDecision, 'deny')
    assert.match(output.permissionDecisionReason, /cannot load|broke/u)
    assert.match(output.permissionDecisionReason, /"disableAllHooks": true/u)
  })
}
