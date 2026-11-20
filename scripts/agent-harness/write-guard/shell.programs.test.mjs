#!/usr/bin/env node
// ---------------------------------------------------------------------------
// shell.programs — a program whose writes the guard does not read is
// refused to a read-only agent and opaque for anyone else; inline code is
// read for the commands it starts and the paths it writes. The per-program
// cases are in the decide.bash suites.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/shell.programs.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { literal } from './expansion.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { programVerdict } from './shell.programs.mjs'

const stateFor = ({ kind, judgeText = () => undefined }) => ({
  actor: { kind, name: kind === ACTOR_KIND.main ? null : 'x' },
  cwd: 'c:/work/repo',
  host: {
    env: {},
    isCheckout: ({ dir }) => dir.toLowerCase() === 'c:/work/repo',
    ownRoot: 'C:\\work\\repo',
    scratchRoots: ['/tmp'],
    windows: true
  },
  judgeText,
  policy: {
    ruleFiles: [{ glob: 'AGENTS.md', what: 'the LAWs and the router' }],
    switchOff: { value: 'off', variable: 'ATL_WRITE_GUARD' }
  },
  vars: new Map()
})

const judged = ({ texts, kind, judgeText }) => {
  const args = texts.map((text) => literal({ text }))
  return programVerdict({
    args,
    command: { redirects: [], words: [] },
    name: texts[0],
    producer: undefined,
    rest: args.slice(1),
    state: stateFor({ judgeText, kind })
  })
}

for (const [texts, kind, shape] of [
  [['bash', '-c', 'ls'], 'shell', 'bash -c'],
  [['eval', 'ls'], 'shell', 'eval'],
  [['npm', 'install'], 'tool', 'npm install'],
  [['pnpm', 'build'], 'tool', 'pnpm build'],
  [['codegraph', 'init'], 'tool', 'codegraph init']
]) {
  test(`a program the guard does not read is refused to a read-only agent, opaque for others: ${texts.join(' ')}`, () => {
    const denied = judged({ kind: ACTOR_KIND.readOnly, texts })
    assert.deepEqual(
      [denied.kind, denied.level, denied.shape],
      [kind, 'deny', shape]
    )
    for (const actor of [ACTOR_KIND.main, ACTOR_KIND.surface]) {
      assert.equal(judged({ kind: actor, texts }).level, 'opaque')
    }
  })
}

for (const texts of [
  ['bash', 'scripts/a.sh'],
  ['pnpm', 'verify:maps'],
  ['node', 'scripts/probe.mjs'],
  ['codegraph', 'explore', 'x']
]) {
  test(`a program that reads, or runs a script file, has no finding: ${texts.join(' ')}`, () => {
    for (const kind of [ACTOR_KIND.readOnly, ACTOR_KIND.main]) {
      assert.equal(judged({ kind, texts }), undefined)
    }
  })
}

test('a report file is judged as a target, for anyone', () => {
  const texts = ['eslint', '-o', 'AGENTS.md', 'src']
  assert.equal(judged({ kind: ACTOR_KIND.main, texts }).kind, 'rule')
  assert.equal(judged({ kind: ACTOR_KIND.readOnly, texts }).level, 'deny')
})

test('inline code writing a rule file asks the main session', () => {
  const finding = judged({
    kind: ACTOR_KIND.main,
    texts: ['node', '-e', "require('fs').writeFileSync('AGENTS.md', '1')"]
  })
  assert.deepEqual([finding.kind, finding.level], ['rule', 'ask'])
})

test('a command inline code starts is judged as Bash, and a deny of it names the command', () => {
  const texts = [
    'node',
    '-e',
    "require('child_process').execSync('git add .')"
  ]
  const judgeText = ({ command }) =>
    command === 'git add .' ? { kind: 'git', level: 'deny' } : undefined
  const finding = judged({ judgeText, kind: ACTOR_KIND.readOnly, texts })
  assert.deepEqual(
    [finding.kind, finding.why],
    ['code', 'starts `git add .`']
  )
  const asked = judged({
    judgeText: () => ({ kind: 'rule', level: 'ask' }),
    kind: ACTOR_KIND.main,
    texts
  })
  assert.equal(asked.level, 'ask')
})
