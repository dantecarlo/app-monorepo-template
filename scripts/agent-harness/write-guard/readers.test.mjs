#!/usr/bin/env node
// ---------------------------------------------------------------------------
// readers — the programs the guard knows only read, and the finding for a
// program it does not know at all: refused to a read-only agent when an
// argument names a path outside the OS temp dir, and opaque for anyone else,
// so the main session is asked only when it names a rule path.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/readers.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { POLICY } from './decide.fixtures.mjs'
import { ON_DISK } from './decide.shell.fixtures.mjs'
import { literal } from './expansion.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { pathWordsOf, READERS, unknownProgramVerdict } from './readers.mjs'
import { UNKNOWN } from './scan.mjs'

const judged = ({ command, kind }) => {
  const args = command.split(' ').map((text) => literal({ text }))
  return unknownProgramVerdict({
    args,
    rest: args.slice(1),
    state: {
      actor: { kind, name: kind === ACTOR_KIND.main ? null : 'x' },
      cwd: 'c:/work/repo',
      host: ON_DISK,
      policy: POLICY
    }
  })
}

test('the readers are the donor workflow commands that only read', () => {
  for (const name of ['cat', 'grep', 'rg', 'head', 'ls', 'wc', 'jq', 'bat', 'diff', 'echo', 'cut', 'tr', 'sort', 'uniq', 'date', 'test', '[']) {
    assert.ok(READERS.has(name), name)
  }
  for (const name of ['make', 'docker', 'source', 'vim', 'dos2unix']) {
    assert.ok(!READERS.has(name), name)
  }
})

test('the words that may name a path are the operands and the values of long options', () => {
  assert.deepEqual(
    pathWordsOf({
      args: ['-v', 'a.md', '--out=b.md', '--flag', `${UNKNOWN}x`].map((text) =>
        literal({ text })
      )
    }).map(({ text }) => text),
    ['a.md', 'b.md', `${UNKNOWN}x`]
  )
})

for (const command of [
  'frob docs/a.md',
  'frob --out=docs/a.md',
  'make -C src',
  'frob *.md',
  `frob ${UNKNOWN}`,
  'frob C:/Users/me/a.txt'
]) {
  test(`an unknown program that names a path outside scratch is refused to a read-only agent: ${command}`, () => {
    const finding = judged({ command, kind: ACTOR_KIND.readOnly })
    assert.equal(finding?.level, 'deny')
    assert.equal(finding.kind, 'program')
  })
}

for (const command of ['frob --version', 'docker ps', 'frob /tmp/a.log', 'frob https://e.test/a']) {
  test(`an unknown program that names no path outside scratch passes a read-only agent: ${command}`, () => {
    assert.equal(judged({ command, kind: ACTOR_KIND.readOnly }), undefined)
  })
}

test('an unknown program is opaque for anyone else, with the words it names', () => {
  const finding = judged({ command: 'frob AGENTS.md -x', kind: ACTOR_KIND.main })
  assert.deepEqual(
    [finding.kind, finding.level, finding.words],
    ['program', 'opaque', ['AGENTS.md', '-x']]
  )
})
