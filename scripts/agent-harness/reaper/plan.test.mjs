#!/usr/bin/env node
// ---------------------------------------------------------------------------
// plan — the pure core of the reaper, over synthetic process tables: which
// orphan trees it would end, which it keeps and why. Every table is made up;
// the families are the committed contract's.
//
// Usage:
//   node --test scripts/agent-harness/reaper/plan.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { loadContract } from './contract.mjs'
import { KEPT, planReap } from './plan.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTRACT = loadContract({ root: resolve(HERE, '..', '..', '..') })

const NOW = Date.UTC(2026, 10, 20, 12, 0, 0)
const MS_PER_SECOND = 1000
const BYTES_PER_MB = 1_048_576
const HOUR = 3600
const WINDOWS = 'win32'
const LINUX = 'linux'

const LAUNCHER =
  '"C:\\nodejs\\node.exe" "C:\\nodejs\\node_modules\\npm\\bin\\npx-cli.js" "-y" "next-devtools-mcp"'
const SHIM = 'C:\\WINDOWS\\system32\\cmd.exe /d /s /c next-devtools-mcp'
const SERVER =
  '"node" "C:\\u\\npm-cache\\_npx\\1a2b\\node_modules\\next-devtools-mcp\\dist\\index.js"'
const WRAP =
  'C:\\WINDOWS\\system32\\cmd.exe /d /s /c "npx ^"-y^" ^"next-devtools-mcp^""'
const CONSOLE = '\\??\\C:\\WINDOWS\\system32\\conhost.exe 0x4'
const TURBO =
  '"C:\\r\\node_modules\\turbo-windows-64\\bin\\turbo.exe" --skip-infer run lint'

// A process `ago` seconds old holding `mb` MB; `ago: null` reads no age.
const proc = ({ ago = HOUR, command, mb = 10, name = 'node.exe', pid, ppid }) => ({
  bytes: mb * BYTES_PER_MB,
  command,
  name,
  pid,
  ppid,
  startMs: ago === null ? null : NOW - ago * MS_PER_SECOND
})

// The session the reaper runs in: explorer, the session, its shell and the
// reaper itself, pid 900.
const SELF = 900
const SESSION = [
  proc({ ago: 9 * HOUR, command: 'explorer.exe', name: 'explorer.exe', pid: 50, ppid: 4 }),
  proc({ ago: 2 * HOUR, command: 'claude.exe', name: 'claude.exe', pid: 100, ppid: 50 }),
  proc({ ago: 10, command: 'bash.exe -c reap', name: 'bash.exe', pid: 899, ppid: 100 }),
  proc({ ago: 9, command: 'node reap.mjs', pid: SELF, ppid: 899 })
]

// An npx server under a dead parent: launcher 10, its shim 11, server 12.
const npxTree = ({ ppid = 7, serverAgo = HOUR } = {}) => [
  proc({ command: LAUNCHER, mb: 90, pid: 10, ppid }),
  proc({ command: SHIM, mb: 5, name: 'cmd.exe', pid: 11, ppid: 10 }),
  proc({ ago: serverAgo, command: SERVER, mb: 80, pid: 12, ppid: 11 })
]

const plan = ({ platform = WINDOWS, processes }) =>
  planReap({ contract: CONTRACT, now: NOW, platform, processes, selfPid: SELF })

test('an orphan of a family is a candidate with its whole tree', () => {
  const result = plan({ processes: [...SESSION, ...npxTree()] })
  assert.deepEqual(result.candidates, [
    {
      ageSeconds: HOUR,
      family: 'npx-mcp',
      mb: 175,
      pid: 10,
      pids: [10, 11, 12],
      strayChild: false,
      via: null
    }
  ])
  assert.deepEqual(result.kept, [])
  assert.equal(result.totalMb, 175)
})

test('a process whose parent is alive is no candidate', () => {
  const result = plan({ processes: [...SESSION, ...npxTree({ ppid: 100 })] })
  assert.deepEqual(result.candidates, [])
  assert.deepEqual(result.kept, [])
  assert.equal(result.totalMb, 0)
})

test('a parent pid reused by a process that started after its child makes the child an orphan', () => {
  // Pid 7 now names a turbo started a minute and a half ago, long after the
  // launcher; it is an orphan too, and the launcher is no child of it.
  const reused = proc({ ago: 90, command: TURBO, mb: 40, name: 'turbo.exe', pid: 7, ppid: 3 })
  const result = plan({ processes: [...SESSION, reused, ...npxTree({ ppid: 7 })] })
  assert.deepEqual(
    result.candidates.map(({ family, pid, pids }) => ({ family, pid, pids })),
    [
      { family: 'npx-mcp', pid: 10, pids: [10, 11, 12] },
      { family: 'turbo', pid: 7, pids: [7] }
    ]
  )
})

test("on POSIX a process under pid 1 or the user's subreaper is an orphan", () => {
  const processes = [
    proc({ ago: 9 * HOUR, command: '/sbin/init', name: 'init', pid: 1, ppid: 0 }),
    proc({ ago: 8 * HOUR, command: '/lib/systemd/systemd --user', name: 'systemd', pid: 1000, ppid: 1 }),
    proc({ ago: 2 * HOUR, command: '-bash', name: 'bash', pid: 3000, ppid: 1000 }),
    proc({ command: 'node /r/node_modules/turbo/bin/turbo run lint', name: 'node', pid: 2000, ppid: 1 }),
    proc({ command: 'node /r/node_modules/vitest/vitest.mjs run', name: 'node', pid: 2001, ppid: 1000 }),
    proc({ command: 'node /r/node_modules/typescript/bin/tsc -w', name: 'node', pid: 2002, ppid: 3000 }),
    proc({ ago: 9, command: 'node reap.mjs', name: 'node', pid: SELF, ppid: 3000 })
  ]
  const result = plan({ platform: LINUX, processes })
  assert.deepEqual(
    result.candidates.map(({ family, pid }) => ({ family, pid })),
    [
      { family: 'turbo', pid: 2000 },
      { family: 'vitest', pid: 2001 }
    ]
  )
})

test('on Windows a process under pid 1 is judged by its parent like any other', () => {
  const processes = [
    ...SESSION,
    proc({ ago: 9 * HOUR, command: 'svc.exe', name: 'svc.exe', pid: 1, ppid: 0 }),
    proc({ command: TURBO, name: 'turbo.exe', pid: 2000, ppid: 1 })
  ]
  assert.deepEqual(plan({ processes }).candidates, [])
})

test('an orphan outside every family is never touched', () => {
  const processes = [
    ...SESSION,
    proc({ command: 'slack.exe --startup', name: 'slack.exe', pid: 60, ppid: 7 }),
    proc({ command: '"C:\\Git\\usr\\bin\\sh.exe" .husky/pre-push origin', name: 'sh.exe', pid: 61, ppid: 8 }),
    proc({ command: 'node C:\\pnpm\\pnpm.cjs validate', pid: 62, ppid: 9 }),
    proc({ command: TURBO, name: 'turbo.exe', pid: 63, ppid: 62 })
  ]
  const result = plan({ processes })
  assert.deepEqual(result.candidates, [])
  assert.deepEqual(result.kept, [])
})

test('a wrapper whose only child is reapable is a candidate, its console aside', () => {
  const processes = [
    ...SESSION,
    proc({ command: WRAP, mb: 4, name: 'cmd.exe', pid: 20, ppid: 7 }),
    proc({ command: CONSOLE, mb: 6, name: 'conhost.exe', pid: 21, ppid: 20 }),
    proc({ command: LAUNCHER, mb: 90, pid: 22, ppid: 20 }),
    proc({ command: SHIM, mb: 4, name: 'cmd.exe', pid: 23, ppid: 22 }),
    proc({ command: SERVER, mb: 80, pid: 24, ppid: 23 }),
    proc({ command: CONSOLE, mb: 6, name: 'conhost.exe', pid: 25, ppid: 23 })
  ]
  assert.deepEqual(plan({ processes }).candidates, [
    {
      ageSeconds: HOUR,
      family: 'npx-mcp',
      mb: 190,
      pid: 20,
      pids: [20, 21, 22, 23, 24, 25],
      strayChild: false,
      via: 'cmd.exe'
    }
  ])
})

test('a wrapper with a child outside the families is never touched', () => {
  const processes = [
    ...SESSION,
    // Its command line names an npx server; what it wraps is an app.
    proc({ command: WRAP, name: 'cmd.exe', pid: 30, ppid: 7 }),
    proc({ command: CONSOLE, name: 'conhost.exe', pid: 31, ppid: 30 }),
    proc({ command: 'node C:\\app\\server.js', pid: 32, ppid: 30 }),
    // Two reapable children are not an only child.
    proc({ command: WRAP, name: 'cmd.exe', pid: 40, ppid: 8 }),
    proc({ command: LAUNCHER, pid: 41, ppid: 40 }),
    proc({ command: LAUNCHER, pid: 42, ppid: 40 }),
    // A console with nothing in it wraps nothing.
    proc({ command: 'cmd.exe /c pause', name: 'cmd.exe', pid: 501, ppid: 9 })
  ]
  const result = plan({ processes })
  assert.deepEqual(result.candidates, [])
  assert.deepEqual(result.kept, [])
})

test("a tree that holds the reaper's own ancestry is kept", () => {
  // The session was started through an npx launcher whose own parent died.
  const processes = [
    proc({ command: LAUNCHER, pid: 10, ppid: 7 }),
    proc({ ago: HOUR / 2, command: 'node cli.js', pid: 100, ppid: 10 }),
    proc({ ago: 10, command: 'bash.exe -c reap', name: 'bash.exe', pid: 899, ppid: 100 }),
    proc({ ago: 9, command: 'node reap.mjs', pid: SELF, ppid: 899 })
  ]
  const result = plan({ processes })
  assert.deepEqual(result.candidates, [])
  assert.deepEqual(result.kept, [
    { family: 'npx-mcp', pid: 10, reason: KEPT.ANCESTRY }
  ])
})

test('a tree with a process younger than the grace period is kept', () => {
  const processes = [
    ...SESSION,
    ...npxTree({ serverAgo: 30 }),
    proc({ ago: null, command: TURBO, name: 'turbo.exe', pid: 70, ppid: 7 })
  ]
  const result = plan({ processes })
  assert.deepEqual(result.candidates, [])
  assert.deepEqual(result.kept, [
    { family: 'npx-mcp', pid: 10, reason: KEPT.YOUNG },
    { family: 'turbo', pid: 70, reason: KEPT.AGELESS }
  ])
  assert.match(KEPT.YOUNG, /grace/u)
})

test('candidates come largest first, and a pid an older process names as its parent marks a stray child', () => {
  const processes = [
    ...SESSION,
    ...npxTree(),
    proc({ command: TURBO, mb: 300, name: 'turbo.exe', pid: 80, ppid: 7 }),
    // Older than turbo, so it is no child of it: its own parent was an
    // earlier process that held pid 80.
    proc({ ago: 3 * HOUR, command: 'C:\\tool.exe', name: 'tool.exe', pid: 81, ppid: 80 })
  ]
  const result = plan({ processes })
  assert.deepEqual(
    result.candidates.map(({ mb, pid, strayChild }) => ({ mb, pid, strayChild })),
    [
      { mb: 300, pid: 80, strayChild: true },
      { mb: 175, pid: 10, strayChild: false }
    ]
  )
  assert.equal(result.totalMb, 475)
})
