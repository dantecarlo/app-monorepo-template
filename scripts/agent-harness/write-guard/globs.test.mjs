#!/usr/bin/env node
// ---------------------------------------------------------------------------
// globs — a glob the guard cannot expand on the disk is judged as a pattern:
// whether it could name a rule file, decided by the intersection of the two
// globs, and which folder its matches stay in.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/globs.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { POLICY } from './decide.fixtures.mjs'
import { HOST } from './decide.shell.fixtures.mjs'
import {
  GLOB_MODE,
  globsIntersect,
  hasGlob,
  literalHead,
  patternRule,
  tokensOf
} from './globs.mjs'

const meet = ({ a, b, mode = GLOB_MODE.bash }) =>
  globsIntersect({
    a: tokensOf({ glob: a, mode }),
    b: tokensOf({ glob: b, mode: GLOB_MODE.manifest })
  })

for (const [a, b] of [
  ['*.md', 'AGENTS.md'],
  ['AGENT?.md', 'AGENTS.md'],
  ['[Aa]GENTS.md', 'agents.md'],
  ['scripts/*.mjs', 'scripts/verify-*'],
  ['.claude/skills/*/SKILL.md', '.claude/skills/**'],
  ['*', 'AGENTS.md'],
  ['docs/*.json', '**/*allowlist*.json']
]) {
  test(`two globs that can name one path meet: ${a} and ${b}`, () => {
    assert.equal(meet({ a, b }), true)
  })
}

for (const [a, b] of [
  ['*.ts', 'AGENTS.md'],
  ['docs/*.md', 'AGENTS.md'],
  ['docs/*', '.claude/skills/**'],
  ['*', '.claude/settings*.json'],
  ['\\*.md', 'AGENTS.md']
]) {
  test(`two globs that name no path in common do not: ${a} and ${b}`, () => {
    assert.equal(meet({ a, b }), false)
  })
}

test('a find path pattern lets * cross folders, a bash glob does not', () => {
  assert.equal(
    meet({
      a: '*/skills/*',
      b: '.claude/skills/**',
      mode: GLOB_MODE.findPath
    }),
    true
  )
  assert.equal(meet({ a: '*/skills/*', b: '.claude/skills/sdd/x' }), false)
  assert.equal(
    meet({ a: '**/AGENTS.md', b: 'AGENTS.md', mode: GLOB_MODE.findName }),
    true
  )
})

for (const [pattern, expected] of [
  ['*.md', true],
  ['a?b', true],
  ['[ab].md', true],
  ['\\*.md', false],
  ['a[b', false],
  ['plain.md', false]
]) {
  test(`hasGlob reads an unescaped wildcard: ${pattern}`, () => {
    assert.equal(hasGlob({ pattern }), expected)
  })
}

test('the literal head of a glob is the folder before its first wildcard', () => {
  assert.deepEqual(literalHead({ pattern: '.claude/skills/*/SKILL.md' }), {
    dir: '.claude/skills',
    rest: '*/SKILL.md'
  })
  assert.deepEqual(literalHead({ pattern: '*.md' }), {
    dir: '',
    rest: '*.md'
  })
  assert.deepEqual(literalHead({ pattern: '/tmp/x/*.log' }), {
    dir: '/tmp/x',
    rest: '*.log'
  })
})

for (const [pattern, glob] of [
  ['*.md', 'AGENTS.md'],
  ['scripts/verify-*', 'scripts/verify-*'],
  ['.clau*', '.claude/skills/**'],
  ['C:/work/repo/*.json', 'template.manifest.json']
]) {
  test(`a pattern that could name a rule file names that rule: ${pattern}`, () => {
    assert.equal(
      patternRule({
        cwd: 'C:\\work\\repo',
        host: HOST,
        mode: GLOB_MODE.bash,
        pattern,
        policy: POLICY
      })?.glob,
      glob
    )
  })
}

test('a pattern that can name no rule file names none', () => {
  for (const pattern of ['docs/*.md', 'src/*', '/tmp/*.md']) {
    assert.equal(
      patternRule({
        cwd: 'C:\\work\\repo',
        host: HOST,
        mode: GLOB_MODE.bash,
        pattern,
        policy: POLICY
      }),
      undefined,
      pattern
    )
  }
})

test('a recursive pattern names a .git only when its own last segment could be one', () => {
  const rule = ({ pattern }) =>
    patternRule({
      cwd: 'C:/work/repo',
      host: HOST,
      mode: GLOB_MODE.findName,
      pattern,
      policy: {
        ...POLICY,
        ruleFiles: [{ glob: 'AGENTS.md', what: 'the LAWs' }]
      }
    })?.glob
  assert.equal(rule({ pattern: 'docs/**/AGENTS.md' }), undefined)
  assert.equal(rule({ pattern: 'docs/**/*.orig' }), undefined)
  assert.equal(rule({ pattern: 'docs/**/.git*' }), '**/.git')
})
