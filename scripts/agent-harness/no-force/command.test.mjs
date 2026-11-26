#!/usr/bin/env node
// ---------------------------------------------------------------------------
// command — the judge of a Bash or PowerShell command: each simple command's
// own words by forms.mjs, then every command a wrapper runs inside it, in
// its own language, as deep as MAX_NESTING levels; past that, or when the
// tokenizer gives up on nesting, the command is unreadable, which the hook
// refuses.
//
// Usage:
//   node --test scripts/agent-harness/no-force/command.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { bashForce, MAX_NESTING, powershellForce } from './command.mjs'

const deepEval = ({ levels, tail }) => `${'eval '.repeat(levels)}${tail}`

const deepSubstitution = ({ levels, tail }) =>
  `echo ${'"$('.repeat(levels)}${tail}${')"'.repeat(levels)}`

test('the reader reads 16 levels of commands inside commands', () => {
  assert.equal(MAX_NESTING, 16)
})

for (const [name, make] of [
  ['eval', deepEval],
  ['substitution', deepSubstitution]
]) {
  test(`a force ${MAX_NESTING} ${name} levels deep is found`, () => {
    assert.deepEqual(
      bashForce({ command: make({ levels: MAX_NESTING, tail: 'git push -f' }) }),
      { option: '-f', program: 'git push' }
    )
  })

  test(`a command ${MAX_NESTING + 1} ${name} levels deep is unreadable`, () => {
    const found = bashForce({
      command: make({ levels: MAX_NESTING + 1, tail: 'ls' })
    })
    assert.match(found?.unreadable ?? '', /nested deeper than 16/u)
  })
}

test('a force the tokenizer cannot reach for nesting is unreadable, not let through', () => {
  const found = bashForce({
    command: `echo ${'$('.repeat(40)}git push -f${')'.repeat(40)}`
  })
  assert.match(found?.unreadable ?? '', /nested deeper than/u)
})

test('a PowerShell command nested past the limit is unreadable', () => {
  const found = powershellForce({
    command: `${'& { '.repeat(MAX_NESTING + 1)}ls${' }'.repeat(MAX_NESTING + 1)}`
  })
  assert.match(found?.unreadable ?? '', /nested deeper than 16/u)
})

test('Bash inside PowerShell inside Bash is judged in each language', () => {
  assert.deepEqual(
    bashForce({
      command: `pwsh -c "bash -c 'git push --force'"`
    }),
    { option: '--force', program: 'git push' }
  )
  assert.deepEqual(
    powershellForce({ command: `bash -c "pwsh -c 'Remove-Item -Fo x'"` }),
    { option: '-Fo', program: 'remove-item' }
  )
})
