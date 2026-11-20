#!/usr/bin/env node
// ---------------------------------------------------------------------------
// paths — one spelling for every form a path takes, and where a target sits:
// a sink, a scratch root, a checkout, or outside all of them. The host is
// synthetic, so no case reads the disk.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/paths.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { tmpdir } from 'node:os'
import { test } from 'node:test'

import { classify, liveHost, normalizePath } from './paths.mjs'

const REPO = 'C:\\work\\repo'
const SCRATCH = 'C:\\Users\\me\\AppData\\Local\\Temp'
const CHECKOUTS = [
  'c:/work/repo',
  'c:/work/repo-worktrees/write-guard',
  'c:/users/me/appdata/local/temp/clone'
]

const HOST = {
  env: {},
  isCheckout: ({ dir }) => CHECKOUTS.includes(dir.toLowerCase()),
  ownRoot: REPO,
  scratchRoots: [SCRATCH, '/tmp'],
  windows: true
}

const where = ({ cwd = REPO, text }) => classify({ cwd, host: HOST, text })

for (const [input, expected] of [
  ['/d/Documents/Dev', 'd:/Documents/Dev'],
  ['D:\\Documents\\Dev\\', 'd:/Documents/Dev'],
  ['C:\\', 'c:/'],
  ['/c', 'c:/'],
  ['C:/a/./b//c', 'c:/a/b/c'],
  ['/tmp/a/../b', '/tmp/b'],
  ['C:\\work\\repo\\docs\\..\\AGENTS.md', 'c:/work/repo/AGENTS.md']
]) {
  test(`a Windows path normalises to one spelling: ${input}`, () => {
    assert.equal(normalizePath({ path: input, windows: true }), expected)
  })
}

test('a Git Bash drive is read as a drive only on Windows', () => {
  assert.equal(normalizePath({ path: '/d/x', windows: false }), '/d/x')
})

for (const text of [
  'C:\\work\\repo\\AGENTS.md',
  '/c/work/repo/AGENTS.md',
  'c:/WORK/Repo/docs/../AGENTS.md',
  'AGENTS.md',
  './docs/../AGENTS.md'
]) {
  test(`every spelling of a repository file names it by the same relative path: ${text}`, () => {
    const found = where({ text })
    assert.equal(found.kind, 'repo')
    assert.equal(found.relative.toLowerCase(), 'agents.md')
    assert.equal(found.root.toLowerCase(), 'c:/work/repo')
  })
}

test('a relative target with no cwd resolves against the checkout the hook runs from', () => {
  const found = classify({ cwd: undefined, host: HOST, text: 'src/a.ts' })
  assert.deepEqual(
    { kind: found.kind, relative: found.relative },
    { kind: 'repo', relative: 'src/a.ts' }
  )
})

test('a target under a scratch root is scratch', () => {
  assert.equal(where({ text: `${SCRATCH}\\probe\\a.log` }).kind, 'scratch')
  assert.equal(where({ text: '/tmp/probe/a.log' }).kind, 'scratch')
})

test('a scratch path that walks back out is not scratch', () => {
  assert.equal(where({ text: `${SCRATCH}\\..\\..\\a.ts` }).kind, 'outside')
})

test('a repository that lives under a scratch root is still a repository', () => {
  const found = where({ text: `${SCRATCH}\\clone\\src\\probe.txt` })
  assert.deepEqual(
    { kind: found.kind, relative: found.relative },
    { kind: 'repo', relative: 'src/probe.txt' }
  )
})

test('scratch beside a repository under a scratch root stays scratch', () => {
  assert.equal(
    where({ text: `${SCRATCH}\\other\\probe.txt` }).kind,
    'scratch'
  )
})

test('a target in a sibling worktree is judged against that worktree', () => {
  const found = where({
    text: 'C:\\work\\repo-worktrees\\write-guard\\AGENTS.md'
  })
  assert.deepEqual(
    { kind: found.kind, relative: found.relative, root: found.root },
    {
      kind: 'repo',
      relative: 'AGENTS.md',
      root: 'c:/work/repo-worktrees/write-guard'
    }
  )
})

test('a target in no checkout and no scratch root is outside', () => {
  assert.equal(where({ text: 'C:\\Users\\me\\notes.txt' }).kind, 'outside')
})

for (const text of ['/dev/null', 'NUL', '/dev/stderr']) {
  test(`a sink is a sink: ${text}`, () => {
    assert.equal(where({ text }).kind, 'sink')
  })
}

test('the live host lists the OS temp dir among its scratch roots', () => {
  const host = liveHost({ environment: {}, ownRoot: REPO })
  assert.ok(
    host.scratchRoots.includes(tmpdir()),
    host.scratchRoots.join(', ')
  )
  assert.equal(host.ownRoot, REPO)
  assert.equal(typeof host.isCheckout({ dir: tmpdir() }), 'boolean')
})
