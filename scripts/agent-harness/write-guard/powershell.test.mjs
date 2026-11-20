#!/usr/bin/env node
// ---------------------------------------------------------------------------
// powershell — the write a PowerShell command holds: a write cmdlet, one of
// its aliases, or a redirection to a file; and the finding of one call, by
// actor. The guard does not parse PowerShell, so a policed agent is refused
// it and anyone else is asked only when it writes and names a rule path.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/powershell.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { POLICY } from './decide.fixtures.mjs'
import { HOST } from './decide.shell.fixtures.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { judgePowerShell, WRITE_CMDLETS, writeOf } from './powershell.mjs'

for (const [command, write] of [
  ['Set-Content a x', 'Set-Content'],
  ['set-content a x', 'set-content'],
  ['Microsoft.PowerShell.Management\\Set-Content a x', 'Set-Content'],
  ['Get-Item a | Remove-Item', 'Remove-Item'],
  ['$(Out-File a)', 'Out-File'],
  ['ni a', 'ni'],
  ['del a', 'del'],
  ["'x' > a", '>'],
  ["'x' >> a", '>>'],
  ['Get-ChildItem 2> a.log', '2>'],
  ['Get-ChildItem *> a.log', '*>']
]) {
  test(`a PowerShell write is found: ${command}`, () => {
    assert.equal(writeOf({ command }), write)
  })
}

for (const command of [
  'Get-Content a',
  'Get-ChildItem 2>&1',
  'Get-ChildItem *>&1 | Out-Null',
  "Write-Output 'a > b'",
  'Write-Output "a >> b"',
  'if (1 -gt 0) { Get-Date }',
  'Get-Remove-Itemish',
  'Invoke-ni'
]) {
  test(`a PowerShell command with no write holds none: ${command}`, () => {
    assert.equal(writeOf({ command }), undefined)
  })
}

test('the write cmdlets are the brief list, Tee-Object, and their aliases', () => {
  for (const name of [
    'Set-Content',
    'Out-File',
    'Add-Content',
    'New-Item',
    'Copy-Item',
    'Move-Item',
    'Remove-Item',
    'Rename-Item',
    'Clear-Content',
    'Tee-Object',
    'sc',
    'ac',
    'clc',
    'ni',
    'md',
    'mkdir',
    'cp',
    'copy',
    'cpi',
    'mv',
    'move',
    'mi',
    'rm',
    'del',
    'erase',
    'rd',
    'rmdir',
    'ri',
    'ren',
    'rni',
    'tee'
  ]) {
    assert.ok(WRITE_CMDLETS.includes(name), name)
  }
})

const judged = ({ command, kind }) =>
  judgePowerShell({
    actor: { kind, name: kind === ACTOR_KIND.main ? null : 'x' },
    command,
    cwd: 'C:\\work\\repo',
    host: HOST,
    policy: POLICY
  })

test('a policed agent is refused PowerShell, whatever it runs', () => {
  for (const kind of [ACTOR_KIND.readOnly, ACTOR_KIND.surface]) {
    assert.deepEqual(judged({ command: 'Get-Date', kind }), {
      kind: 'powershell',
      level: 'deny'
    })
  }
})

test('anyone else is asked when the command writes and names a rule path', () => {
  for (const kind of [ACTOR_KIND.main, ACTOR_KIND.writer]) {
    const finding = judged({ command: 'Set-Content AGENTS.md x', kind })
    assert.equal(finding.level, 'ask')
    assert.equal(finding.write, 'Set-Content')
    assert.equal(finding.named.token, 'AGENTS.md')
    assert.equal(
      judged({ command: 'Get-Content AGENTS.md', kind }),
      undefined
    )
    assert.equal(
      judged({ command: 'Set-Content a.md x', kind }),
      undefined
    )
  }
})
