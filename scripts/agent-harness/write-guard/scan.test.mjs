#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scan — the bounded loop every reader runs, the error of a command the
// guard cannot read, the body of `$'...'`, and the two placeholders.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/scan.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ANSI_BODY, repeat, SAFE, UNKNOWN, unreadable } from './scan.mjs'

test('repeat stops when its step returns false, and after bound + 1 steps', () => {
  const counted = ({ bound, until }) => {
    let steps = 0
    repeat({
      bound,
      step: () => {
        steps += 1
        return steps < until
      }
    })
    return steps
  }
  assert.equal(counted({ bound: 10, until: 3 }), 3)
  assert.equal(counted({ bound: 4, until: 100 }), 5)
})

test('unreadable throws an error marked unreadable, deep only when told', () => {
  assert.throws(
    () => unreadable({ problem: 'an unterminated quote' }),
    (error) =>
      error.unreadable === true &&
      error.deep === false &&
      error.message === 'an unterminated quote'
  )
  assert.throws(
    () => unreadable({ deep: true, problem: 'nested' }),
    (error) => error.deep === true
  )
})

test("the body of $'...' ends at the first unescaped quote", () => {
  const source = "$'a\\'b' c'"
  ANSI_BODY.lastIndex = 2
  const match = ANSI_BODY.exec(source)
  assert.equal(match[1], "a\\'b")
})

test('the two placeholders are distinct characters no path holds', () => {
  assert.notEqual(SAFE, UNKNOWN)
  for (const placeholder of [SAFE, UNKNOWN]) {
    assert.equal(placeholder.length, 1)
    assert.ok(placeholder.charCodeAt(0) < ' '.charCodeAt(0))
  }
})
