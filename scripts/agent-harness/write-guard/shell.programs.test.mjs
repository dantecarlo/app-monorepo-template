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
import { UNKNOWN } from './scan.mjs'
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

// -- inner shells, inline perl and ruby, npx ------------------------------------
for (const texts of [
  ['bash', '-c', 'ls'],
  ['sh', '-lc', 'ls'],
  ['eval', 'ls']
]) {
  test(`an inner shell is refused to a read-only agent and judged as Bash for anyone else: ${texts.join(' ')}`, () => {
    const denied = judged({ kind: ACTOR_KIND.readOnly, texts })
    assert.deepEqual([denied.kind, denied.level], ['shell', 'deny'])
    const seen = []
    const judgeText = ({ command }) => {
      seen.push(command)
      return { kind: 'rule', level: 'ask' }
    }
    for (const kind of [ACTOR_KIND.main, ACTOR_KIND.surface]) {
      assert.equal(judged({ judgeText, kind, texts })?.level, 'ask')
    }
    assert.deepEqual(seen, ['ls', 'ls'])
  })
}

test('an inner shell whose text the guard cannot see is opaque', () => {
  const args = [
    literal({ text: 'bash' }),
    literal({ text: '-c' }),
    {
      raw: '"$CMD"',
      text: `${UNKNOWN}`,
      unknown: ['$CMD']
    }
  ]
  const finding = programVerdict({
    args,
    command: { redirects: [], words: [] },
    name: 'bash',
    producer: undefined,
    rest: args.slice(1),
    state: stateFor({ kind: ACTOR_KIND.main })
  })
  assert.deepEqual([finding.kind, finding.level], ['shell', 'opaque'])
})

for (const [texts, writes] of [
  [['perl', '-e', 'open(F,">AGENTS.md")'], true],
  [['perl', '-ne', 'unlink $_'], true],
  [['perl', '-e', 'system("ls")'], true],
  [['perl', '-e', 'print 1'], false],
  [['perl', '-e', 'open(F,"<x")'], false],
  [['perl', '-MFile::Copy', '-e', 'copy("x","AGENTS.md")'], true],
  [['perl', '-e', 'use File::Copy; move("x","AGENTS.md")'], true],
  [['perl', '-e', '$^I=""; @ARGV=("AGENTS.md"); while(<>){print}'], true],
  [['perl', '-e', 'print $x'], false],
  [['ruby', '-e', 'File.write("AGENTS.md", "x")'], true],
  [['ruby', '-e', 'FileUtils.rm("a")'], true],
  [['ruby', '-e', 'puts 1'], false]
]) {
  test(`perl and ruby code is read for writes: ${texts.join(' ')}`, () => {
    const denied = judged({ kind: ACTOR_KIND.readOnly, texts })
    const opaque = judged({ kind: ACTOR_KIND.main, texts })
    if (writes) {
      assert.deepEqual([denied?.kind, denied?.level], ['code', 'deny'])
      assert.equal(opaque?.level, 'opaque')
    } else {
      assert.equal(denied, undefined)
      assert.equal(opaque, undefined)
    }
  })
}

test('npx running a JS tool in its read-only form is no finding for the main session, a package manager for a read-only agent', () => {
  const texts = ['npx', 'prettier', '--check', 'AGENTS.md']
  assert.equal(judged({ kind: ACTOR_KIND.main, texts }), undefined)
  assert.equal(judged({ kind: ACTOR_KIND.readOnly, texts })?.level, 'deny')
  assert.equal(
    judged({
      kind: ACTOR_KIND.main,
      texts: ['npx', 'prettier', '--write', 'a']
    })?.level,
    'opaque'
  )
  assert.equal(
    judged({ kind: ACTOR_KIND.main, texts: ['npx', 'create-x'] })?.level,
    'opaque'
  )
})
