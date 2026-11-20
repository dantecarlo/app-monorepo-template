#!/usr/bin/env node
// ---------------------------------------------------------------------------
// shell — the walk over a whole Bash command: the strongest finding wins (a
// deny over an ask, an ask over a command the guard cannot read), state
// carries from one command to the next (assignments, cd, loops), and a
// command it cannot parse is one finding with the reason why.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/shell.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { POLICY } from './decide.fixtures.mjs'
import { HOST, REPO } from './decide.shell.fixtures.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { judgeBash } from './shell.mjs'

const ACTORS = {
  main: { kind: ACTOR_KIND.main, name: null },
  readOnly: { kind: ACTOR_KIND.readOnly, name: 'validator' },
  surface: {
    kind: ACTOR_KIND.surface,
    name: 'e2e-author',
    surface: ['docs/qa']
  }
}

const judged = ({ actor = 'main', command, cwd = REPO }) =>
  judgeBash({
    actor: ACTORS[actor],
    command,
    cwd,
    host: HOST,
    policy: POLICY
  })

test('a deny wins over an ask that comes before it', () => {
  const finding = judged({
    actor: 'surface',
    command: 'echo y > AGENTS.md; touch src/a.ts'
  })
  assert.equal(finding.level, 'deny')
  assert.equal(finding.shape, 'touch src/a.ts')
})

test('an ask wins over a command the guard cannot read', () => {
  const finding = judged({ command: 'bash -c ls; echo x > AGENTS.md' })
  assert.deepEqual(
    [finding.level, finding.kind, finding.shape],
    ['ask', 'rule', '> AGENTS.md']
  )
})

test('the first finding of the strongest level is the one returned', () => {
  assert.equal(
    judged({
      command: 'echo x > AGENTS.md; echo y > template.manifest.json'
    }).rule.glob,
    'AGENTS.md'
  )
})

test('a command the guard cannot read is opaque for the main session, with its shape', () => {
  const finding = judged({ command: "bash -c 'ls'" })
  assert.deepEqual([finding.level, finding.kind], ['opaque', 'shell'])
  assert.equal(finding.shape, 'bash -c')
})

test('an assignment and a cd carry to the next command', () => {
  assert.equal(
    judged({ command: 'S=.claude; cd $S && echo x > settings.json' }).rule
      .glob,
    '.claude/settings*.json'
  )
})

test('a cd the guard cannot follow leaves a relative target unknown', () => {
  const finding = judged({
    actor: 'readOnly',
    command: 'cd $X && echo x > log'
  })
  assert.deepEqual([finding.level, finding.kind], ['deny', 'variable'])
})

test('a loop variable is judged item by item, and the loop body persists', () => {
  assert.equal(
    judged({ command: 'for f in a.md AGENTS.md; do echo x > $f; done' })
      .shape,
    '> $f'
  )
  assert.equal(
    judged({
      command: 'for f in a b; do S=/tmp; done; echo x > $S/x'
    }),
    undefined
  )
})

test('a command it cannot parse is one finding naming why', () => {
  for (const [command, problem, deep] of [
    ['echo "x', /an unterminated quote/, false],
    ['echo $(\\\n(1))', /a line continuation splits/, false],
    [`echo ${'$('.repeat(40)}x${')'.repeat(40)}`, /nested deeper/, true]
  ]) {
    const finding = judged({ actor: 'readOnly', command })
    assert.equal(finding.kind, 'unreadable')
    assert.equal(finding.level, 'deny')
    assert.match(finding.problem, problem)
    assert.equal(finding.deep, deep)
  }
})

test('a target spelling the guard cannot read throws, for decide to judge', () => {
  assert.throws(
    () => judged({ command: "echo x > 'AGENTS.md::$DATA'" }),
    /stream/
  )
})

test('an empty command has nothing to judge', () => {
  assert.equal(judged({ command: '' }), undefined)
  assert.equal(judged({ command: '   # a note' }), undefined)
})
