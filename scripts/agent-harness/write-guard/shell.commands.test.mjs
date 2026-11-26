#!/usr/bin/env node
// ---------------------------------------------------------------------------
// shell.commands — one simple command's findings: the command a wrapper
// runs, the name it is read by, and a find, fd, xargs or git call read
// through to what it writes. The per-command cases are in the decide.bash
// suites.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/shell.commands.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { literal } from './expansion.mjs'
import {
  commandName,
  fdCommand,
  findExecs,
  judgeArgs,
  unwrap,
  xargsCommand
} from './shell.commands.mjs'

const words = ({ command }) =>
  command.split(' ').map((text) => literal({ text }))

for (const [command, inner] of [
  ['timeout 60 rm a', 'rm a'],
  ['timeout -s KILL 60 rm a', 'rm a'],
  ['env FOO=1 -u BAR touch a', 'touch a'],
  ['sudo -u me nice -n 5 rm -rf src', 'rm -rf src'],
  ['nohup stdbuf -o L tee a', 'tee a'],
  ['command -v rm', ''],
  ['rm a', 'rm a']
]) {
  test(`a wrapper runs the command after its own options: ${command}`, () => {
    assert.equal(
      unwrap({ args: words({ command }) })
        .map(({ text }) => text)
        .join(' '),
      inner
    )
  })
}

for (const [text, name] of [
  ['/usr/bin/rm', 'rm'],
  ['C:\\Git\\usr\\bin\\TEE.EXE', 'tee'],
  ['node.cmd', 'node'],
  ['Git', 'git']
]) {
  test(`a command is read by its bare name: ${text}`, () => {
    assert.equal(commandName({ arg: literal({ text }) }), name)
  })
}

const STATE = {
  actor: { kind: 'main', name: null },
  cwd: 'c:/work/repo',
  host: {
    isCheckout: ({ dir }) => dir.toLowerCase() === 'c:/work/repo',
    ownRoot: 'C:\\work\\repo',
    scratchRoots: ['/tmp'],
    windows: true
  },
  policy: {
    ruleFiles: [{ glob: 'AGENTS.md', what: 'the LAWs and the router' }]
  },
  vars: new Map()
}

const judged = ({ command }) =>
  judgeArgs({
    args: words({ command }),
    command: { redirects: [], words: [] },
    producer: undefined,
    state: STATE
  })

for (const [command, shape] of [
  ['find . -name AGENTS.md -exec rm {} ;', 'rm {}'],
  ['xargs -I % cp /tmp/a %', 'cp <input>'],
  ['git -C docs checkout -- ../AGENTS.md', 'git checkout ../AGENTS.md'],
  ['timeout 9 tee AGENTS.md', 'tee AGENTS.md']
]) {
  test(`a command is read through to what it writes: ${command}`, () => {
    const finding = judged({ command })
    assert.ok(finding !== undefined, command)
    assert.equal(finding.shape, shape)
  })
}

test('find names the commands its -exec actions run, and where each ends', () => {
  const args = words({ command: '. -exec rm -rf {} + -name x -ok ls ;' })
  assert.deepEqual(
    findExecs({ args }).map(({ from, inner, to }) => ({
      from,
      inner: inner.map(({ text }) => text),
      to
    })),
    [
      { from: 1, inner: ['rm', '-rf', '{}'], to: 5 },
      { from: 8, inner: ['ls'], to: 10 }
    ]
  )
  assert.deepEqual(findExecs({ args: words({ command: '. -exec rm' }) })[0].to, 3)
})

test('fd names the command its -x runs', () => {
  const found = fdCommand({ args: words({ command: 'x src -x rm -rf ;' }) })
  assert.equal(found.at, 2)
  assert.deepEqual(
    found.inner.map(({ text }) => text),
    ['rm', '-rf']
  )
  assert.equal(fdCommand({ args: words({ command: 'x src' }) }), undefined)
})

test('xargs names the command it runs and the string -I replaces', () => {
  const found = xargsCommand({
    args: words({ command: '-n 1 -I {} git branch -D {}' })
  })
  assert.equal(found.start, 4)
  assert.equal(found.replace, '{}')
  assert.deepEqual(
    found.inner.map(({ text }) => text),
    ['git', 'branch', '-D', '{}']
  )
})
