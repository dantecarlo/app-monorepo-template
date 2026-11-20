#!/usr/bin/env node
// ---------------------------------------------------------------------------
// target — the finding for one written path, by actor: what the file tools
// and every shell writer share. `contained` says whether the actor's
// containment applies to the writer; `holds` whether a folder that holds
// rule files counts as one; the placeholders an expansion leaves are read
// only when the caller says the text may hold them.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/target.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { POLICY } from './decide.fixtures.mjs'
import { HOST } from './decide.shell.fixtures.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { SAFE, UNKNOWN } from './scan.mjs'
import { judgeTarget, LEVEL, ruleOf } from './target.mjs'

const ACTORS = {
  main: { kind: ACTOR_KIND.main, name: null },
  readOnly: { kind: ACTOR_KIND.readOnly, name: 'validator' },
  surface: {
    kind: ACTOR_KIND.surface,
    name: 'e2e-author',
    surface: ['docs/qa']
  }
}

const found = ({
  actor,
  contained = true,
  cwd = 'c:/work/repo',
  holds = true,
  placeholders = true,
  text,
  unknown
}) =>
  judgeTarget({
    actor: ACTORS[actor],
    contained,
    cwd,
    holds,
    host: HOST,
    placeholders,
    policy: POLICY,
    text,
    unknown
  })

test('scratch and a sink are no finding for anyone', () => {
  for (const actor of Object.keys(ACTORS)) {
    assert.equal(found({ actor, text: '/tmp/a.log' }), undefined)
    assert.equal(found({ actor, text: '/dev/null' }), undefined)
  }
})

test('a rule file is refused to a read-only agent and asked of anyone else', () => {
  assert.equal(
    found({ actor: 'readOnly', text: 'AGENTS.md' }).level,
    LEVEL.deny
  )
  for (const actor of ['surface', 'main']) {
    const { kind, level, rule } = found({ actor, text: 'AGENTS.md' })
    assert.deepEqual(
      [kind, level, rule.glob],
      ['rule', 'ask', 'AGENTS.md']
    )
  }
})

test('a contained write outside the surface is refused, one that is not contained is left alone', () => {
  assert.equal(
    found({ actor: 'surface', text: 'src/a.ts' }).kind,
    'surface'
  )
  assert.equal(
    found({ actor: 'surface', contained: false, text: 'src/a.ts' }),
    undefined
  )
  assert.equal(
    found({ actor: 'surface', text: 'docs/qa/a.md' }),
    undefined
  )
})

test('a read-only agent is refused every write outside scratch, contained or not', () => {
  const { kind, level, where } = found({
    actor: 'readOnly',
    contained: false,
    text: 'C:/Users/me/a.txt'
  })
  assert.deepEqual([kind, level, where], ['read-only', 'deny', 'outside'])
})

test('a folder that holds rule files is a rule only when holds is set, and never the root', () => {
  const held = found({ actor: 'main', text: '.claude' })
  assert.equal(held.level, LEVEL.ask)
  assert.equal(held.rule.held, true)
  assert.equal(
    found({ actor: 'main', holds: false, text: '.claude' }),
    undefined
  )
  assert.equal(found({ actor: 'main', text: '.' }), undefined)
})

test('a target that depends on an unset variable is refused when contained, opaque otherwise', () => {
  const text = `${UNKNOWN}/log`
  assert.deepEqual(found({ actor: 'readOnly', text, unknown: ['$X'] }), {
    kind: 'variable',
    level: 'deny',
    names: ['$X']
  })
  assert.equal(
    found({ actor: 'main', text, unknown: ['$X'] }).level,
    LEVEL.opaque
  )
})

test('a relative target after a cd the guard cannot follow depends on the folder it runs in', () => {
  assert.deepEqual(found({ actor: 'readOnly', cwd: null, text: 'log' }), {
    kind: 'variable',
    level: 'deny',
    names: ['the directory it runs in']
  })
  assert.equal(
    found({ actor: 'readOnly', cwd: null, text: '/tmp/a' }),
    undefined
  )
})

test('a SAFE segment that may name a rule file is opaque, one under a rule folder is a rule', () => {
  assert.equal(
    found({ actor: 'main', text: `out-${SAFE}.log` }).kind,
    'uncertain'
  )
  assert.equal(
    found({ actor: 'main', text: `.claude/skills/${SAFE}` }).kind,
    'rule'
  )
  assert.equal(found({ actor: 'main', text: `/tmp/${SAFE}` }), undefined)
})

test('the placeholders are plain text when the caller says the path holds none', () => {
  assert.equal(
    found({ actor: 'main', placeholders: false, text: `${UNKNOWN}x` }),
    undefined
  )
})

test('ruleOf reads the user-level settings by their path in the home folder', () => {
  assert.equal(
    ruleOf({
      policy: POLICY,
      where: { homeRelative: '.claude/settings.json', roots: [] }
    }).glob,
    '~/.claude/settings.json'
  )
  assert.equal(
    ruleOf({
      holds: true,
      policy: POLICY,
      where: { homeRelative: '.claude' }
    }).held,
    true
  )
})
