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
  '"node" "C:\\u\\npm-cache\\_npx\\1a2b\\node_modules\\.bin\\\\..\\next-devtools-mcp\\dist\\index.js"'
const WRAP =
  'C:\\WINDOWS\\system32\\cmd.exe /d /s /c "npx ^"-y^" ^"next-devtools-mcp^""'
const CONSOLE = '\\??\\C:\\WINDOWS\\system32\\conhost.exe 0x4'
const TURBO =
  '"C:\\r\\node_modules\\turbo-windows-64\\bin\\turbo.exe" --skip-infer run lint'
const PROXY =
  '"C:\\u\\.local\\bin\\mcp-proxy.exe" --port 3710 --named-server context7 "node C:/u/node_modules/@upstash/context7-mcp/dist/index.js"'

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

const rootsOf = ({ platform, processes }) =>
  plan({ platform, processes }).candidates.map(({ family, pid }) => ({ family, pid }))

test('an orphan of a family is a candidate with its whole tree', () => {
  const result = plan({ processes: [...SESSION, ...npxTree()] })
  assert.deepEqual(result.candidates, [
    {
      ageSeconds: HOUR,
      family: 'npx-mcp',
      mb: 175,
      pid: 10,
      pids: [10, 11, 12],
      startMs: NOW - HOUR * MS_PER_SECOND,
      strayChild: false,
      via: 'npx-cli.js'
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
    proc({ ago: 2 * HOUR, command: '-bash', name: '-bash', pid: 3000, ppid: 1000 }),
    proc({ command: 'node /r/node_modules/turbo/bin/turbo run lint', name: 'node', pid: 2000, ppid: 1 }),
    proc({ command: 'node /r/node_modules/vitest/vitest.mjs run', name: 'node', pid: 2001, ppid: 1000 }),
    proc({ command: 'node /r/node_modules/typescript/bin/tsc --noEmit', name: 'node', pid: 2002, ppid: 3000 }),
    proc({ ago: 9, command: 'node reap.mjs', name: 'node', pid: SELF, ppid: 3000 })
  ]
  assert.deepEqual(rootsOf({ platform: LINUX, processes }), [
    { family: 'turbo', pid: 2000 },
    { family: 'vitest', pid: 2001 }
  ])
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

// B1: a live shell whose text names a family. Git for Windows shells report
// a parent already gone, by design, while they work.
test('a live MSYS shell that runs pnpm turbo run dev is never a candidate, whatever its text', () => {
  assert.deepEqual(
    planReap({
      contract: CONTRACT,
      now: NOW,
      platform: WINDOWS,
      processes: [
        proc({ ago: 900, command: '"C:\\Git\\usr\\bin\\sh.exe" /c/u/pnpm turbo run dev', name: 'sh.exe', pid: 70, ppid: 69 }),
        proc({ ago: 900, command: 'node "C:\\r\\node_modules\\next\\dist\\bin\\next" dev', pid: 71, ppid: 70 })
      ],
      selfPid: SELF
    }).candidates,
    []
  )
})

for (const [name, processes] of [
  [
    'bash.exe running npx turbo run dev',
    [
      proc({ command: 'bash.exe "/c/Program Files/nodejs/npx" turbo run dev', name: 'bash.exe', pid: 71, ppid: 69 }),
      proc({ command: '"node" "C:\\nodejs\\node_modules\\npm\\bin\\npx-cli.js" turbo run dev', pid: 72, ppid: 71 }),
      proc({ command: 'node "C:\\r\\node_modules\\turbo\\bin\\turbo" run dev', pid: 73, ppid: 72 })
    ]
  ],
  [
    "the Claude Code Bash tool's shell, idle and running vitest",
    [
      proc({
        command:
          '"C:\\Program Files\\Git\\usr\\bin\\bash.exe" -c "source /c/u/.claude/shell-snapshots/s.sh && eval \'node node_modules/vitest/vitest.mjs run\' < /dev/null"',
        name: 'bash.exe',
        pid: 74,
        ppid: 69
      }),
      proc({ command: 'node node_modules/vitest/vitest.mjs run', pid: 75, ppid: 74 }),
      proc({ command: '"C:\\Program Files\\Git\\usr\\bin\\bash.exe" -c "eval \'node node_modules/vitest/vitest.mjs run\'"', name: 'bash.exe', pid: 76, ppid: 68 })
    ]
  ],
  [
    'timeout.exe 900s npx turbo run test',
    [
      proc({ command: 'timeout.exe 900s npx turbo run test', name: 'timeout.exe', pid: 77, ppid: 69 }),
      proc({ command: 'node "C:\\nodejs\\node_modules\\npm\\bin\\npx-cli.js" turbo run test', pid: 78, ppid: 77 }),
      proc({ command: 'node "C:\\r\\node_modules\\turbo\\bin\\turbo" run test', pid: 79, ppid: 78 })
    ]
  ]
]) {
  test(`on Windows ${name} is never a candidate`, () => {
    const result = plan({ processes: [...SESSION, ...processes] })
    assert.deepEqual(result.candidates, [])
  })
}

for (const [name, processes] of [
  [
    'a tmux server running pnpm turbo run dev',
    [
      proc({ command: 'tmux new-session -d -s dev', name: 'tmux', pid: 4000, ppid: 1 }),
      proc({ command: '-bash', name: '-bash', pid: 4001, ppid: 4000 }),
      proc({ command: 'node /r/node_modules/pnpm/bin/pnpm.cjs turbo run dev', name: 'node', pid: 4002, ppid: 4001 })
    ]
  ],
  [
    'a tmux pane running a vitest run',
    [
      proc({ command: 'tmux new-session -d -s test', name: 'tmux', pid: 4010, ppid: 1 }),
      proc({ command: 'bash', name: 'bash', pid: 4011, ppid: 4010 }),
      proc({ command: 'node node_modules/vitest/vitest.mjs run', name: 'node', pid: 4012, ppid: 4011 })
    ]
  ],
  [
    "a reparented sh -c 'sleep 200; : turbo run dev marker'",
    [
      proc({ command: "sh -c sleep 200; : turbo run dev marker", name: 'sh', pid: 4020, ppid: 1 }),
      proc({ command: 'sleep 200', name: 'sleep', pid: 4021, ppid: 4020 })
    ]
  ]
]) {
  test(`on POSIX ${name} is never a candidate`, () => {
    const processes2 = [
      proc({ ago: 9 * HOUR, command: '/sbin/init', name: 'init', pid: 1, ppid: 0 }),
      ...processes
    ]
    assert.deepEqual(rootsOf({ platform: LINUX, processes: processes2 }), [])
  })
}

test('on POSIX a reparented shell that wraps one reapable run goes with it', () => {
  const processes = [
    proc({ ago: 9 * HOUR, command: '/sbin/init', name: 'init', pid: 1, ppid: 0 }),
    proc({ command: '/bin/sh -c vitest run', name: 'sh', pid: 4030, ppid: 1 }),
    proc({ command: 'node /r/node_modules/vitest/vitest.mjs run', name: 'node', pid: 4031, ppid: 4030 })
  ]
  assert.deepEqual(
    plan({ platform: LINUX, processes }).candidates.map(({ family, pid, pids, via }) => ({ family, pid, pids, via })),
    [{ family: 'vitest', pid: 4030, pids: [4030, 4031], via: 'sh' }]
  )
})

test('a family is matched by the executable and its script, never by text in the arguments', () => {
  const processes = [
    ...SESSION,
    proc({ command: '"C:\\VSCode\\Code.exe" D:\\repos\\vitest\\src', name: 'Code.exe', pid: 81, ppid: 7 }),
    proc({ command: '"node" "C:\\nodejs\\node_modules\\npm\\bin\\npx-cli.js" tsx watch src/mcp/server.ts', pid: 82, ppid: 7 }),
    proc({ command: 'node "C:\\u\\_npx\\9f\\node_modules\\tsx\\dist\\cli.mjs" watch src/mcp/server.ts', pid: 83, ppid: 82 }),
    proc({ command: 'node D:\\Dev\\context7-mcp-fork\\server.js', pid: 84, ppid: 7 }),
    proc({ command: 'node scripts/build.mjs --label turbo-run-lint esbuild --service', pid: 85, ppid: 7 })
  ]
  assert.deepEqual(plan({ processes }).candidates, [])
})

test('persistent and watch work is never a candidate, one-shot runs are', () => {
  const persistent = [
    '"C:\\r\\node_modules\\turbo-windows-64\\bin\\turbo.exe" --skip-infer run dev',
    '"C:\\r\\node_modules\\turbo-windows-64\\bin\\turbo.exe" run start --filter web',
    '"C:\\r\\node_modules\\turbo-windows-64\\bin\\turbo.exe" --skip-infer daemon',
    'node C:\\r\\node_modules\\vitest\\vitest.mjs --watch',
    'node C:\\r\\node_modules\\vitest\\vitest.mjs',
    'node C:\\r\\node_modules\\typescript\\bin\\tsc --watch',
    'node C:\\r\\node_modules\\typescript\\bin\\tsc -w -p .',
    'node C:\\r\\node_modules\\typescript\\lib\\tsserver.js --useInferredProjectPerProjectRoot',
    'node C:\\r\\node_modules\\next\\dist\\bin\\next dev',
    'node C:\\r\\node_modules\\expo\\bin\\cli start',
    'node C:\\r\\node_modules\\metro\\src\\cli.js serve',
    'C:\\r\\node_modules\\@esbuild\\win32-x64\\esbuild.exe --watch --serve',
    // node's own watch mode, its flags before the script.
    'node --watch C:\\r\\node_modules\\typescript\\bin\\tsc --noEmit',
    'node --watch=true C:\\r\\node_modules\\typescript\\bin\\tsc --noEmit',
    'node --watch-path=src C:\\r\\node_modules\\typescript\\bin\\tsc --noEmit',
    'node --watch-path src C:\\r\\node_modules\\typescript\\bin\\tsc --noEmit',
    'node --watch-preserve-output C:\\r\\node_modules\\vitest\\vitest.mjs run'
  ]
  const oneShot = [
    ['turbo', TURBO],
    ['vitest', 'node C:\\r\\node_modules\\vitest\\vitest.mjs run --reporter dot'],
    ['vitest', 'node C:\\r\\node_modules\\tinypool\\dist\\entry\\process.js'],
    ['tsc', 'node C:\\r\\node_modules\\typescript\\bin\\tsc --noEmit -p .'],
    ['esbuild', 'C:\\r\\node_modules\\@esbuild\\win32-x64\\esbuild.exe --service=0.25.0 --ping'],
    ['jest', 'node C:\\r\\node_modules\\jest-worker\\build\\workers\\processChild.js'],
    ['git-remote-https', 'git remote-https origin https://example.com/a.git'],
    ['mcp-server', '"C:\\u\\venv\\Scripts\\scrapling-mcp.exe"']
  ]
  const processes = [
    ...SESSION,
    ...persistent.map((command, at) => proc({ command, pid: 1000 + at, ppid: 7 })),
    ...oneShot.map(([, command], at) => proc({ command, pid: 2000 + at, ppid: 7 }))
  ]
  assert.deepEqual(
    rootsOf({ processes }).sort((a, b) => a.pid - b.pid),
    oneShot.map(([family], at) => ({ family, pid: 2000 + at }))
  )
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
      startMs: NOW - HOUR * MS_PER_SECOND,
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
    proc({ command: TURBO, name: 'turbo.exe', pid: 41, ppid: 40 }),
    proc({ command: TURBO, name: 'turbo.exe', pid: 42, ppid: 40 }),
    // A console with nothing in it wraps nothing.
    proc({ command: 'cmd.exe /c pause', name: 'cmd.exe', pid: 501, ppid: 9 })
  ]
  const result = plan({ processes })
  assert.deepEqual(result.candidates, [])
  assert.deepEqual(result.kept, [])
})

test("a tree that holds the reaper's own ancestry is kept", () => {
  // The session was started under a turbo run whose own parent died.
  const processes = [
    proc({ command: TURBO, name: 'turbo.exe', pid: 10, ppid: 7 }),
    proc({ ago: HOUR / 2, command: 'node cli.js', pid: 100, ppid: 10 }),
    proc({ ago: 10, command: 'bash.exe -c reap', name: 'bash.exe', pid: 899, ppid: 100 }),
    proc({ ago: 9, command: 'node reap.mjs', pid: SELF, ppid: 899 })
  ]
  const result = plan({ processes })
  assert.deepEqual(result.candidates, [])
  assert.deepEqual(result.kept, [
    { family: 'turbo', pid: 10, reason: KEPT.ANCESTRY }
  ])
})

test('a tree that holds a process the contract spares is kept', () => {
  // A shared MCP proxy runs detached by design; a Git for Windows shell
  // reports a parent already gone. Neither is ever a root, and a family
  // orphan whose tree holds one is kept.
  const processes = [
    ...SESSION,
    proc({ command: PROXY, name: 'mcp-proxy.exe', pid: 90, ppid: 7 }),
    proc({ command: `"C:\\uv\\python.exe" ${PROXY}`, name: 'python.exe', pid: 91, ppid: 90 }),
    proc({ command: '"node" "C:/u/node_modules/@upstash/context7-mcp/dist/index.js"', pid: 92, ppid: 91 }),
    proc({ command: TURBO, name: 'turbo.exe', pid: 95, ppid: 8 }),
    proc({ command: 'python -m mcp_proxy --port 3711', name: 'python.exe', pid: 96, ppid: 95 }),
    proc({ command: TURBO, name: 'turbo.exe', pid: 97, ppid: 9 }),
    proc({ command: '"C:\\Git\\usr\\bin\\sh.exe" -c "pnpm lint"', name: 'sh.exe', pid: 98, ppid: 97 })
  ]
  const result = plan({ processes })
  assert.deepEqual(result.candidates, [])
  assert.deepEqual(result.kept, [
    { family: 'turbo', pid: 95, reason: `${KEPT.SPARED} (mcp-proxy)` },
    { family: 'turbo', pid: 97, reason: `${KEPT.SPARED} (msys-runtime)` }
  ])
})

test('a tree that holds a node process in watch mode is kept, with its reason', () => {
  const processes = [
    ...SESSION,
    proc({ command: TURBO, name: 'turbo.exe', pid: 80, ppid: 7 }),
    proc({ command: 'node --watch-path src C:\\r\\apps\\api\\server.js', pid: 81, ppid: 80 }),
    proc({ command: 'cmd.exe /d /s /c tsc', name: 'cmd.exe', pid: 90, ppid: 7 }),
    proc({ command: 'node --watch C:\\r\\node_modules\\typescript\\bin\\tsc', pid: 91, ppid: 90 })
  ]
  const result = plan({ processes })
  assert.deepEqual(result.candidates, [])
  assert.deepEqual(result.kept, [{ family: 'turbo', pid: 80, reason: KEPT.WATCH }])
  assert.match(KEPT.WATCH, /watch mode/u)
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
