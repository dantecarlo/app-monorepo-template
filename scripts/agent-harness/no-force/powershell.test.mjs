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

import { powershellForce } from './command.mjs'
import { readStatements, statementsOf } from './powershell.mjs'

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
  ['Write-Output "$(git push --force)"', '--force', 'git push'],
  ["$env:HUSKY = '0'; git commit -m x", 'HUSKY=0', '$env:husky'],
  ['$env:husky=0', 'HUSKY=0', '$env:husky=0'],
  ['git commit --no-verify -m x', '--no-verify', 'git commit'],
  // Every way PowerShell sets HUSKY=0.
  ['${env:HUSKY} = 0', 'HUSKY=0', '${env:husky}'],
  ['$Env:Husky="0"', 'HUSKY=0', '$env:husky=0'],
  ['Set-Item env:HUSKY 0', 'HUSKY=0', 'set-item'],
  ['Set-Item -Path Env:\\HUSKY -Value 0', 'HUSKY=0', 'set-item'],
  ['New-Item -Path env:HUSKY -Value 0', 'HUSKY=0', 'new-item'],
  [
    "[Environment]::SetEnvironmentVariable('HUSKY','0')",
    'HUSKY=0',
    '[environment]::setenvironmentvariable'
  ],
  [
    '[System.Environment]::SetEnvironmentVariable("HUSKY", "0", "User")',
    'HUSKY=0',
    '[system.environment]::setenvironmentvariable'
  ],
  // A parameter abbreviated, as PowerShell binds it.
  ['Remove-Item -Recurse -Fo dist', '-Fo', 'remove-item'],
  ['Remove-Item dist -forc', '-forc', 'remove-item'],
  // A command another shell or Invoke-Expression runs.
  ["pwsh -c 'git push -f'", '-f', 'git push'],
  ['powershell -NoProfile -Command "git clean -fdx"', '-fdx', 'git clean'],
  ["bash -c 'rm -rf x'", '-rf', 'rm'],
  ["Invoke-Expression 'git push --force'", '--force', 'git push'],
  ['iex "git branch -D old"', '-D', 'git branch']
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
  "$env:HUSKY = '1'",
  'git push origin main',
  'Set-Item env:HUSKY 1',
  "[Environment]::SetEnvironmentVariable('HUSKY','1')",
  "[Environment]::GetEnvironmentVariable('HUSKY')",
  // Text, not an option.
  "Select-String -Pattern '--force' -Path docs/*.md",
  "sls '--no-verify' notes.txt",
  'Write-Output --no-verify',
  'Write-Host -- --force',
  'Get-Date -Format yyyy',
  "pwsh -c 'echo --force'"
]) {
  test(`\`${command}\` passes no force option`, () => {
    assert.equal(powershellForce({ command }), undefined)
  })
}

test('the nesting of a command is read with its statements', () => {
  assert.equal(readStatements({ command: 'git status' }).depth, 0)
  assert.equal(
    readStatements({ command: '& { if ($x) { git status } }' }).depth,
    2
  )
  assert.equal(
    readStatements({ command: 'echo "$(echo "$(git status)")"' }).depth,
    2
  )
})
