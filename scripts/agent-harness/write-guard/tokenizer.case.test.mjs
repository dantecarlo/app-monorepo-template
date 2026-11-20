#!/usr/bin/env node
// ---------------------------------------------------------------------------
// tokenizer.case — a `case` statement is read as a group of its subject, its
// patterns and its arms, so the judge sees every command they run. Built
// from the case statements of Certifipago's enforce-agent-writes test.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/tokenizer.case.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createParser } from './tokenizer.mjs'

const parse = ({ source }) => createParser({ source }).parseAll()

// The raw words of every command a case group holds.
const armsOf = ({ source }) => {
  const [group] = parse({ source })
  assert.equal(group.type, 'group')
  return group.script.map((item) =>
    item.words.map((word) => word.raw).join(' ')
  )
}

for (const [source, arms] of [
  [
    'case "$1" in a) echo a ;; b|c) echo b ;; *) echo z ;; esac',
    [
      'case "$1"',
      'case a',
      'echo a',
      'case b c',
      'echo b',
      'case *',
      'echo z'
    ]
  ],
  [
    'case x in\n  a)\n    rg a src\n    ;;\nesac',
    ['case x', 'case a', 'rg a src']
  ],
  [
    'case x in (a) touch src/a ;; esac',
    ['case x', 'case a', 'touch src/a']
  ],
  [
    'case x in a) ls ;& b) ls ;;& esac',
    ['case x', 'case a', 'ls', 'case b', 'ls']
  ]
]) {
  test(`a case statement is read arm by arm: ${JSON.stringify(source)}`, () => {
    assert.deepEqual(armsOf({ source }), arms)
  })
}

test('a case inside a loop is read', () => {
  const script = parse({
    source: 'for f in a b; do case $f in (a) echo 1;; esac; done'
  })
  assert.ok(script.some((item) => item.type === 'group'))
})

test('a substitution in a pattern is kept for the judge', () => {
  const [group] = parse({ source: 'case x in $(touch apps/x)) ;; esac' })
  const pattern = group.script[1].words[1]
  assert.ok(pattern.parts.some((part) => 'sub' in part))
})

for (const [source, problem] of [
  ['case x in a) ls', /an unterminated case/],
  ['case x a) ls ;; esac', /a case with no in/],
  ['case x in a ls ;; esac', /a case pattern with no \)/]
]) {
  test(`a case it cannot read throws, naming why: ${JSON.stringify(source)}`, () => {
    assert.throws(
      () => parse({ source }),
      (error) => error.unreadable === true && problem.test(error.message)
    )
  })
}
