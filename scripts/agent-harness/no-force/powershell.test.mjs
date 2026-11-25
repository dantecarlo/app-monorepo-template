#!/usr/bin/env node
// ---------------------------------------------------------------------------
// powershell — the force option a PowerShell command passes, read with a
// small reader of its statements and words: quotes, escapes, comments,
// here-strings, script blocks, subexpressions and the call operator.
//
// Usage:
//   node --test scripts/agent-harness/no-force/powershell.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { powershellForce, statementsOf } from './powershell.mjs'

for (const [command, statements] of [
  ['git push origin main', [['git', 'push', 'origin', 'main']]],
  ["Write-Output 'it''s here'", [['Write-Output', "it's here"]]],
  ['Write-Output "a ""b"" `$c"', [['Write-Output', 'a "b" $c']]],
  ['git `\n  status', [['git', 'status']]],
  [
    'git log; git status',
    [
      ['git', 'log'],
      ['git', 'status']
    ]
  ],
  ['a | b && c', [['a'], ['b'], ['c']]],
  ['& "C:\\Git\\git.exe" status', [['C:\\Git\\git.exe', 'status']]],
  ['ls | % { git status }', [['ls'], ['%'], ['git', 'status']]],
  ['git status # --force', [['git', 'status']]],
  ['git <# --force #> status', [['git', 'status']]],
  [
    "$t = @'\n--force\n'@\ngit status",
    [
      ['$t', '=', '\u0000'],
      ['git', 'status']
    ]
  ],
  ['git status 2>&1 > out.txt', [['git', 'status', 'out.txt']]],
  [
    'echo "x $(git status) y"',
    [
      ['echo', 'x \u0000 y'],
      ['git', 'status']
    ]
  ]
]) {
  test(`\`${command}\` reads as its statements`, () => {
    assert.deepEqual(statementsOf({ command }), statements)
  })
}

for (const [command, option, program] of [
  ['Remove-Item -Recurse -Force dist', '-Force', 'remove-item'],
  ['Stop-Process -Id 4 -force', '-force', 'stop-process'],
  ['git push --force-with-lease', '--force-with-lease', 'git push'],
  ["git push '-f'", '-f', 'git push'],
  ['& git.exe branch -D old', '-D', 'git branch'],
  ['taskkill /F /PID 4', '/F', 'taskkill'],
  ['Get-Item x | ForEach-Object { git clean -fd }', '-fd', 'git clean'],
  ['if ($x) { git checkout -B main }', '-B', 'git checkout'],
  ['Write-Output "$(git push --force)"', '--force', 'git push']
]) {
  test(`\`${command}\` passes a force option`, () => {
    assert.deepEqual(powershellForce({ command }), { option, program })
  })
}

for (const command of [
  'Remove-Item -Recurse dist',
  'Copy-Item -Force:$false a b',
  "git commit -m 'never use --force'",
  "$m = @'\ngit push --force\n'@",
  'echo --force',
  "'{0}' -f 'x'",
  'git status # then git push --force',
  'git push origin main'
]) {
  test(`\`${command}\` passes no force option`, () => {
    assert.equal(powershellForce({ command }), undefined)
  })
}
