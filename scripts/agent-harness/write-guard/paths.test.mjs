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

import {
  absolutePath,
  cachedClassify,
  classify,
  isAbsolutePath,
  liveHost,
  normalizePath
} from './paths.mjs'

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

// -- Windows spellings that name a file another way ------------------------------
for (const text of [
  '\\\\?\\C:\\work\\repo\\AGENTS.md',
  '\\\\.\\C:\\work\\repo\\AGENTS.md',
  '\\\\?\\UNC\\localhost\\C$\\work\\repo\\AGENTS.md',
  '\\\\localhost\\C$\\work\\repo\\AGENTS.md',
  '\\\\127.0.0.1\\c$\\work\\repo\\AGENTS.md'
]) {
  test(`a device or local-share prefix is read as the drive path: ${text}`, () => {
    const found = where({ text })
    assert.deepEqual(
      { kind: found.kind, relative: found.relative },
      { kind: 'repo', relative: 'AGENTS.md' }
    )
  })
}

for (const [text, problem] of [
  ['C:\\work\\repo\\AGENTS.md::$DATA', /stream/],
  ['C:\\work\\repo\\AGENTS.md:x', /stream/],
  [
    'C:\\work\\repo\\.agents\\contracts::$INDEX_ALLOCATION\\a.json',
    /stream/
  ],
  ['C:AGENTS.md', /drive-relative/],
  ['\\\\?\\Volume{0d1e}\\AGENTS.md', /device path/]
]) {
  test(`a spelling the guard cannot read throws, naming why: ${text}`, () => {
    assert.throws(() => where({ text }), problem)
  })
}

test('a share on another host is outside, and its folders are never probed', () => {
  const probed = []
  const found = classify({
    cwd: REPO,
    host: {
      ...HOST,
      isCheckout: ({ dir }) => {
        probed.push(dir)
        return false
      },
      realpath: ({ path }) => {
        probed.push(path)
        return null
      }
    },
    text: '\\\\files.example\\share\\AGENTS.md'
  })
  assert.equal(found.kind, 'outside')
  assert.deepEqual(probed, [])
})

test('an admin share of a host outside localHosts throws, and is never probed', () => {
  const probed = []
  const host = {
    ...HOST,
    isCheckout: ({ dir }) => {
      probed.push(dir)
      return false
    },
    realpath: ({ path }) => {
      probed.push(path)
      return null
    }
  }
  for (const text of [
    '\\\\192.168.31.168\\C$\\work\\repo\\AGENTS.md',
    '\\\\?\\UNC\\0--1.ipv6-literal.net\\c$\\work\\repo\\AGENTS.md'
  ]) {
    assert.throws(
      () => classify({ cwd: REPO, host, text }),
      /admin share of a host/
    )
  }
  assert.deepEqual(probed, [])
})

// A disk that holds the repository, where `realpath` canonicalises an
// existing path (8.3 names, links, letter case) and returns null otherwise.
const DISK = {
  'c:/': 'C:\\',
  'c:/work': 'C:\\work',
  'c:/work/repo': 'C:\\work\\repo',
  'c:/work/repo/.agents': 'C:\\work\\repo\\.agents',
  'c:/work/repo/.agents/contracts': 'C:\\work\\repo\\.agents\\contracts',
  'c:/work/repo/agents~1': 'C:\\work\\repo\\.agents',
  'c:/work/repo/agents~1/contracts': 'C:\\work\\repo\\.agents\\contracts',
  'c:/work/repo/templa~1.jso': 'C:\\work\\repo\\template.manifest.json',
  'c:/work/repo/notes': 'C:\\work\\repo\\.agents\\contracts'
}
const ON_DISK = {
  ...HOST,
  realpath: ({ path }) => DISK[path.toLowerCase()] ?? null
}
const onDisk = ({ text }) => classify({ cwd: REPO, host: ON_DISK, text })

for (const [text, relative] of [
  [
    'C:\\work\\repo\\AGENTS~1\\contracts\\write-guard.json',
    '.agents/contracts/write-guard.json'
  ],
  ['C:\\work\\repo\\TEMPLA~1.JSO', 'template.manifest.json'],
  [
    'C:\\work\\repo\\notes\\write-guard.json',
    '.agents/contracts/write-guard.json'
  ]
]) {
  test(`the deepest existing folder is canonicalised, the rest appended: ${text}`, () => {
    assert.equal(onDisk({ text }).relative, relative)
  })
}

test('a short name that does not resolve throws instead of being read literally', () => {
  assert.throws(
    () => onDisk({ text: 'C:\\work\\repo\\NEWDIR~1\\a.md' }),
    /short name/
  )
  assert.equal(
    onDisk({ text: 'C:\\work\\repo\\notes~\\a.md' }).kind,
    'repo'
  )
})

// -- every enclosing checkout ---------------------------------------------------
test('a target lists every checkout that holds it, nearest first', () => {
  const found = classify({
    cwd: REPO,
    host: {
      ...HOST,
      isCheckout: ({ dir }) =>
        ['c:/work/repo', 'c:/work/repo/.agents'].includes(
          dir.toLowerCase()
        )
    },
    text: 'C:\\work\\repo\\.agents\\contracts\\write-guard.json'
  })
  assert.deepEqual(
    found.roots.map(({ relative }) => relative),
    ['contracts/write-guard.json', '.agents/contracts/write-guard.json']
  )
})

test('a clone under a scratch root lists only the checkouts below that root', () => {
  const found = classify({
    cwd: REPO,
    host: {
      ...HOST,
      isCheckout: ({ dir }) =>
        ['c:/users/me', 'c:/users/me/appdata/local/temp/clone'].includes(
          dir.toLowerCase()
        )
    },
    text: `${SCRATCH}\\clone\\AGENTS.md`
  })
  assert.deepEqual(
    found.roots.map(({ relative }) => relative),
    ['AGENTS.md']
  )
})

test('the live host lists the OS temp dir among its scratch roots', () => {
  const host = liveHost({ environment: {}, ownRoot: REPO })
  assert.ok(
    host.scratchRoots.includes(tmpdir()),
    host.scratchRoots.join(', ')
  )
  assert.equal(host.ownRoot, REPO)
  assert.equal(typeof host.isCheckout({ dir: tmpdir() }), 'boolean')
  assert.equal(typeof host.realpath({ path: tmpdir() }), 'string')
  assert.equal(
    host.realpath({ path: `${tmpdir()}/write-guard-no-such-file` }),
    null
  )
})

// -- the folder a shell command runs in ----------------------------------------
for (const [text, path] of [
  ['src', 'c:/work/repo/src'],
  ['..\\other', 'c:/work/other'],
  ['/c/work/x', 'c:/work/x'],
  ['D:\\a\\', 'd:/a']
]) {
  test(`a cd target resolves against the folder it runs from: ${text}`, () => {
    assert.equal(absolutePath({ cwd: REPO, host: HOST, text }), path)
  })
}

test('a cd target the guard cannot read throws', () => {
  assert.throws(
    () => absolutePath({ cwd: REPO, host: HOST, text: 'notes::$DATA' }),
    /stream/
  )
})

for (const [text, absolute] of [
  ['/tmp', true],
  ['C:\\x', true],
  ['c:', true],
  ['\\\\server\\share', true],
  ['src', false],
  ['./a', false],
  ['~/a', false]
]) {
  test(`isAbsolutePath reads ${text} as ${absolute ? 'absolute' : 'relative'}`, () => {
    assert.equal(isAbsolutePath({ host: HOST, text }), absolute)
  })
}

// -- the checkout root itself, and the cache of one call ---------------------
test('a checkout root that exists is inside that checkout, by an empty relative path', () => {
  const found = classify({
    cwd: REPO,
    host: { ...HOST, realpath: ({ path }) => path },
    text: '.'
  })
  assert.equal(found.kind, 'repo')
  assert.equal(found.relative, '')
})

test('cachedClassify reads one target from the disk once per call', () => {
  let walks = 0
  const host = {
    ...HOST,
    cache: new Map(),
    isCheckout: (call) => {
      walks += 1
      return HOST.isCheckout(call)
    }
  }
  const first = cachedClassify({ cwd: REPO, host, text: 'docs/a.md' })
  const probes = walks
  assert.deepEqual(
    cachedClassify({ cwd: REPO, host, text: 'docs/a.md' }),
    first
  )
  assert.equal(walks, probes)
})

test('cachedClassify throws once the call is past its deadline', () => {
  const host = { ...HOST, cache: new Map(), deadline: 10, now: () => 11 }
  assert.throws(
    () => cachedClassify({ cwd: REPO, host, text: 'docs/a.md' }),
    /deadline/
  )
})

test('the live host globs, tells a folder and tells what exists', () => {
  const host = liveHost({ environment: {}, ownRoot: REPO })
  assert.equal(host.isDirectory({ path: tmpdir() }), true)
  assert.equal(host.exists({ path: tmpdir() }), true)
  assert.equal(
    host.exists({ path: `${tmpdir()}/write-guard-no-such` }),
    false
  )
  assert.ok(Array.isArray(host.glob({ cwd: tmpdir(), pattern: '*' })))
  assert.equal(host.glob({ cwd: tmpdir(), pattern: '**/*' }), undefined)
})
