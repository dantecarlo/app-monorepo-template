#!/usr/bin/env node
// ---------------------------------------------------------------------------
// inner — the command a wrapper runs inside one simple command, and the
// words the wrapper keeps as its own: `eval`, an inner shell's `-c`,
// PowerShell's `-Command` and `-EncodedCommand`, `Invoke-Expression`,
// `find -exec`, `fd -x` and `xargs`, read through `sudo` and `env`.
//
// Usage:
//   node --test scripts/agent-harness/no-force/inner.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { LANGUAGE } from './forms.mjs'
import { innerOf } from './inner.mjs'

const wordsOf = ({ command }) => command.split(' ')

const encoded = ({ text }) => Buffer.from(text, 'utf16le').toString('base64')

for (const [words, inner, own] of [
  [['eval', 'rm', '-rf', 'x'], [{ language: LANGUAGE.bash, text: 'rm -rf x' }], ['eval']],
  [
    ['sh', '-c', 'git push -f', 'sh', '--force'],
    [{ language: LANGUAGE.bash, text: 'git push -f' }],
    ['sh', '-c']
  ],
  [
    ['sudo', 'bash', '-lc', 'rm -rf x'],
    [{ language: LANGUAGE.bash, text: 'rm -rf x' }],
    ['sudo', 'bash', '-lc']
  ],
  [
    ['pwsh', '-NoProfile', '-Command', 'git', 'push', '-f'],
    [{ language: LANGUAGE.powershell, text: 'git push -f' }],
    ['pwsh', '-NoProfile', '-Command']
  ],
  [
    ['powershell.exe', '-c', 'Remove-Item -Force x'],
    [{ language: LANGUAGE.powershell, text: 'Remove-Item -Force x' }],
    ['powershell.exe', '-c']
  ],
  [
    ['powershell', 'Remove-Item', '-Force', 'x'],
    [{ language: LANGUAGE.powershell, text: 'Remove-Item -Force x' }],
    ['powershell']
  ],
  [
    ['pwsh', '-ec', encoded({ text: 'git push -f' })],
    [{ language: LANGUAGE.powershell, text: 'git push -f' }],
    ['pwsh', '-ec']
  ],
  [
    ['Invoke-Expression', 'git push -f'],
    [{ language: LANGUAGE.powershell, text: 'git push -f' }],
    ['Invoke-Expression']
  ],
  [
    ['find', '.', '-exec', 'rm', '-rf', '{}', '+', '-exec', 'ls', ';'],
    [{ words: ['rm', '-rf', '{}'] }, { words: ['ls'] }],
    ['find', '.', '-exec', '+', '-exec', ';']
  ],
  [
    ['fd', 'x', '-x', 'rm', '-rf'],
    [{ words: ['rm', '-rf'] }],
    ['fd', 'x', '-x']
  ],
  [
    ['xargs', '-n', '1', 'git', 'branch', '-D'],
    [{ words: ['git', 'branch', '-D'] }],
    ['xargs', '-n', '1']
  ],
  [['env', 'X=1', 'sh', '-c', 'ls'], [{ language: LANGUAGE.bash, text: 'ls' }], ['env', 'X=1', 'sh', '-c']]
]) {
  test(`\`${words.join(' ')}\` runs ${JSON.stringify(inner)}`, () => {
    assert.deepEqual(innerOf({ words }), { inner, own })
  })
}

for (const command of [
  'git push -f',
  'bash script.sh --force',
  'pwsh -File build.ps1 -Force',
  'sh',
  'find . -name x -print',
  'xargs',
  'eval'
]) {
  test(`\`${command}\` runs no inner command`, () => {
    const words = wordsOf({ command })
    assert.deepEqual(innerOf({ words }), { inner: [], own: words })
  })
}
