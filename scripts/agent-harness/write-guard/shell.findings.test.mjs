#!/usr/bin/env node
// ---------------------------------------------------------------------------
// shell.findings — the order findings are kept in, the finding for one
// path a shell writer names, and the folder a cd moves to.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/shell.findings.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { literal } from './expansion.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { UNKNOWN } from './scan.mjs'
import {
  changedDirectory,
  isPoliced,
  opaqueLevel,
  strongestOf,
  targetFinding
} from './shell.findings.mjs'

const HOST = {
  env: {},
  isCheckout: ({ dir }) => dir.toLowerCase() === 'c:/work/repo',
  ownRoot: 'C:\\work\\repo',
  scratchRoots: ['/tmp'],
  windows: true
}

test('strongestOf returns the first deny at once, else the first ask, else the first opaque', () => {
  const judged = []
  const judge = (level) => {
    judged.push(level)
    return level === undefined ? undefined : { level }
  }
  assert.equal(
    strongestOf({ items: ['opaque', 'ask', 'deny', 'ask'], judge }).level,
    'deny'
  )
  assert.deepEqual(judged, ['opaque', 'ask', 'deny'])
  const ask = strongestOf({
    items: [undefined, 'opaque', 'ask', 'ask'],
    judge: (level) =>
      level === undefined ? undefined : { level, at: judged.length }
  })
  assert.equal(ask.level, 'ask')
  assert.equal(
    strongestOf({ items: [undefined, 'opaque'], judge }).level,
    'opaque'
  )
  assert.equal(strongestOf({ items: [], judge }), undefined)
})

test('an opaque result carries every opaque finding it stands for, nested ones included', () => {
  const first = { level: 'opaque', shape: 'frob', words: ['docs/x.md'] }
  const second = { level: 'opaque', shape: 'pnpm exec prettier' }
  const third = { level: 'opaque', shape: 'npx prettier' }
  const inner = strongestOf({
    items: [second, third],
    judge: (one) => one
  })
  const outer = strongestOf({ items: [first, inner], judge: (one) => one })
  assert.equal(outer.shape, 'frob')
  assert.deepEqual(outer.opaques, [first, second, third])
  assert.equal(
    strongestOf({ items: [first], judge: (one) => one }).opaques,
    undefined
  )
})

test('who is policed, and the level of what the guard does not read', () => {
  for (const [kind, policed, level] of [
    [ACTOR_KIND.readOnly, true, 'deny'],
    [ACTOR_KIND.surface, true, 'opaque'],
    [ACTOR_KIND.writer, false, 'opaque'],
    [ACTOR_KIND.main, false, 'opaque']
  ]) {
    const state = { actor: { kind } }
    assert.equal(isPoliced({ state }), policed, kind)
    assert.equal(opaqueLevel({ state }), level, kind)
  }
})

test('a target finding carries the shape the reason quotes', () => {
  const finding = targetFinding({
    contained: false,
    state: {
      actor: { kind: ACTOR_KIND.main, name: null },
      cwd: 'c:/work/repo',
      host: HOST,
      policy: {
        ruleFiles: [{ glob: 'AGENTS.md', what: 'the LAWs' }],
        switchOff: { value: 'off', variable: 'ATL_WRITE_GUARD' }
      }
    },
    target: literal({ text: 'AGENTS.md' }),
    via: '>'
  })
  assert.deepEqual([finding.level, finding.shape], ['ask', '> AGENTS.md'])
})

for (const [cwd, text, folder] of [
  ['c:/work/repo', 'docs', 'c:/work/repo/docs'],
  ['c:/work/repo', '/tmp', '/tmp'],
  [null, '/tmp', '/tmp'],
  [null, 'docs', null],
  ['c:/work/repo', `${UNKNOWN}/a`, null],
  ['c:/work/repo', 'a::$DATA', null]
]) {
  test(`a cd moves to the folder it names, or to one the guard cannot tell: ${cwd} ${JSON.stringify(text)}`, () => {
    assert.equal(changedDirectory({ cwd, host: HOST, text }), folder)
  })
}
