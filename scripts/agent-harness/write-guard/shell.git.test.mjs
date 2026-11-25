#!/usr/bin/env node
// ---------------------------------------------------------------------------
// shell.git — one git call's findings, by actor: every write refused to a
// read-only agent, a surface agent's stage and commit held to its surface,
// a subcommand that rewrites the tree asked about when it names a rule
// path, and `-C` moving the folder the pathspecs resolve against. The
// per-subcommand cases are in the decide.bash and decide.shell suites.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/shell.git.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { POLICY } from './decide.fixtures.mjs'
import { ON_DISK } from './decide.shell.fixtures.mjs'
import { literal } from './expansion.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { gitVerdict } from './shell.git.mjs'

const ACTORS = {
  main: { kind: ACTOR_KIND.main, name: null },
  readOnly: { kind: ACTOR_KIND.readOnly, name: 'validator' },
  surface: {
    kind: ACTOR_KIND.surface,
    name: 'e2e-author',
    surface: ['docs/qa']
  }
}

const judged = ({ actor, command }) =>
  gitVerdict({
    args: command.split(' ').map((text) => literal({ text })),
    state: {
      actor: ACTORS[actor],
      cwd: 'c:/work/repo',
      host: ON_DISK,
      policy: POLICY,
      vars: new Map()
    }
  })

for (const [actor, command, kind, level] of [
  ['readOnly', 'push', 'git', 'deny'],
  ['readOnly', 'add docs/qa/a.md', 'git', 'deny'],
  ['surface', 'add -A', 'surface', 'deny'],
  ['surface', 'add src/a.ts', 'surface', 'deny'],
  ['surface', 'stash push -- AGENTS.md', 'rule', 'deny'],
  ['main', 'stash push -- AGENTS.md', 'rule', 'ask'],
  ['main', 'checkout-index -f -- AGENTS.md', 'rule', 'ask'],
  ['main', '-C docs checkout -- ../AGENTS.md', 'rule', 'ask'],
  ['main', 'archive -o AGENTS.md HEAD', 'rule', 'ask']
]) {
  test(`a git call is judged by actor: ${actor} git ${command}`, () => {
    const finding = judged({ actor, command })
    assert.deepEqual([finding?.kind, finding?.level], [kind, level])
  })
}

for (const [actor, command] of [
  ['readOnly', 'status'],
  ['readOnly', 'log --oneline -5'],
  ['surface', 'add docs/qa/a.md'],
  ['surface', 'commit -m x'],
  ['main', 'add AGENTS.md'],
  ['main', 'commit -m x -- AGENTS.md'],
  ['main', 'stash push -- docs/a.md'],
  ['main', 'reset HEAD -- AGENTS.md']
]) {
  test(`a git call that writes nothing the actor is held to passes: ${actor} git ${command}`, () => {
    assert.equal(judged({ actor, command }), undefined)
  })
}
