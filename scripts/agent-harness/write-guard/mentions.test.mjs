#!/usr/bin/env node
// ---------------------------------------------------------------------------
// mentions — the rule path a command names somewhere in its text, read for
// a command the guard cannot read: every word, split on the shell's and
// PowerShell's separators, on `=` and on `:` past a drive, with the home
// folder's spellings expanded, is read as a path against the folder the
// command runs in.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/mentions.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { POLICY } from './decide.fixtures.mjs'
import { HOST } from './decide.shell.fixtures.mjs'
import { MAX_MENTIONS, namedRule } from './mentions.mjs'

const named = ({ text }) =>
  namedRule({ cwd: 'C:\\work\\repo', host: HOST, policy: POLICY, text })

for (const [text, token] of [
  ["bash -c 'echo x > AGENTS.md'", 'AGENTS.md'],
  ['eslint --output-file=AGENTS.md', 'AGENTS.md'],
  ['git show HEAD:AGENTS.md', 'AGENTS.md'],
  ['echo > AGENTS.md::$DATA', 'AGENTS.md'],
  ['type C:AGENTS.md', 'AGENTS.md'],
  ['Set-Content -Path .\\AGENTS.md', '.\\AGENTS.md'],
  ['x C:\\work\\repo\\AGENTS.md', 'C:\\work\\repo\\AGENTS.md'],
  [
    'x /c/work/repo/.claude/skills/a/SKILL.md',
    '/c/work/repo/.claude/skills/a/SKILL.md'
  ],
  [
    'x(".agents/contracts/write-guard.json")',
    '.agents/contracts/write-guard.json'
  ],
  ['rm -rf .claude', '.claude']
]) {
  test(`a rule path named in the text is found: ${text}`, () => {
    assert.equal(named({ text })?.token, token)
  })
}

for (const text of [
  'cat ~/.claude/settings.json',
  'cat $HOME/.claude/settings.json',
  'cat ${HOME}/.claude/settings.json',
  'Get-Content $env:USERPROFILE\\.claude\\settings.json',
  'Get-Content ~\\.claude\\settings.json'
]) {
  test(`the home folder's spellings are expanded: ${text}`, () => {
    assert.equal(named({ text })?.rule.glob, '~/.claude/settings.json')
  })
}

for (const text of [
  'ls src',
  'echo $S/AGENTS.md',
  'curl https://example.test/AGENTS.md',
  'echo -o',
  'cat .',
  "echo 'a::b'"
]) {
  test(`a text that names no rule path it can read finds none: ${text}`, () => {
    assert.equal(named({ text }), undefined)
  })
}

test('a text with more distinct words than the guard reads is too long', () => {
  const words = Array.from({ length: MAX_MENTIONS + 1 }, (_, n) => `w${n}`)
  assert.deepEqual(named({ text: words.join(' ') }), { tooLong: true })
  assert.equal(
    named({ text: [...words.slice(0, 10), 'AGENTS.md'].join(' ') })?.token,
    'AGENTS.md'
  )
})

test('a word the guard cannot read as a path is skipped', () => {
  assert.equal(
    named({
      text: 'x \\\\?\\Volume{1}\\a \\\\localhost\\share\\AGENTS.md'
    }),
    undefined
  )
})
