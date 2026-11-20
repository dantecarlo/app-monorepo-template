#!/usr/bin/env node
// ---------------------------------------------------------------------------
// braces — Bash's brace expansion, before the words are judged: lists,
// sequences, nesting, and the bound past which a word cannot be read.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/braces.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { braceExpand, MAX_BRACE_WORDS } from './braces.mjs'
import { createParser } from './tokenizer.mjs'

const wordOf = ({ text }) =>
  createParser({ source: `echo ${text}` }).parseAll()[0].words[1]

const texts = ({ text }) => {
  const found = braceExpand({ word: wordOf({ text }) })
  return found.overflow
    ? 'overflow'
    : found.words.map((word) => word.parts.map((part) => part.lit ?? '?').join(''))
}

for (const [text, words] of [
  ['AGENTS.md{,.bak}', ['AGENTS.md', 'AGENTS.md.bak']],
  ['AGENTS.md{.bak,}', ['AGENTS.md.bak', 'AGENTS.md']],
  ['{a,b}/{c,d}', ['a/c', 'a/d', 'b/c', 'b/d']],
  ['x{a,{b,c}}y', ['xay', 'xby', 'xcy']],
  ['f{1..3}', ['f1', 'f2', 'f3']],
  ['f{3..1}', ['f3', 'f2', 'f1']],
  ['f{01..03}', ['f01', 'f02', 'f03']],
  ['{a..c}', ['a', 'b', 'c']],
  ['{1..9..4}', ['1', '5', '9']],
  ['plain', ['plain']],
  ['{a}', ['{a}']],
  ['{}', ['{}']],
  ['a{b', ['a{b']]
]) {
  test(`a brace expansion gives the words Bash gives: ${text}`, () => {
    assert.deepEqual(texts({ text }), words)
  })
}

test('quoted braces are not expanded', () => {
  assert.deepEqual(texts({ text: "'{a,b}'" }), ['{a,b}'])
  assert.deepEqual(texts({ text: '"{a,b}"' }), ['{a,b}'])
})

test('a brace expansion past the bound cannot be read', () => {
  assert.equal(texts({ text: `{1..${MAX_BRACE_WORDS + 1}}` }), 'overflow')
  assert.equal(texts({ text: '{a,b}{c,d}{e,f}{g,h}{i,j}{k,l}{m,n}{o,p}{q,r}' }), 'overflow')
  assert.equal(texts({ text: `{1..${MAX_BRACE_WORDS}}` }).length, MAX_BRACE_WORDS)
})

test('the parts around the braces are kept', () => {
  const { words } = braceExpand({ word: wordOf({ text: '"$X"{a,b}' }) })
  assert.equal(words.length, 2)
  assert.ok(words.every((word) => word.parts[0].quoted === true))
})
