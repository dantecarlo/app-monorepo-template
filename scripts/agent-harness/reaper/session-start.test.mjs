#!/usr/bin/env node
// ---------------------------------------------------------------------------
// session-start — the SessionStart hook that runs the reaper in kill mode,
// quiet. It is driven through `sessionStart` with the reaper's effects
// injected: the real core and adapter run over a synthetic Windows listing,
// and every taskkill is recorded, never run, since the hook's kill mode is
// the one this suite must not aim at the machine.
//
// Usage:
//   node --test scripts/agent-harness/reaper/session-start.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { PassThrough } from 'node:stream'
import { after, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { loadContract } from './contract.mjs'
import { runReaper } from './reap.mjs'
import { loadReaper, SESSION_ARGV, sessionStart } from './session-start.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTRACT = loadContract({ root: resolve(HERE, '..', '..', '..') })

const NOW = Date.UTC(2026, 10, 20, 12, 0, 0)
const HOUR_MS = 3_600_000
const BYTES_PER_MB = 1_048_576
const EXIT_OK = 0
const SHORT_BOUND_MS = 50
const HUNG_BOUND_MS = 200
const PROCESS_GUARD_MS = 10_000

const scratch = mkdtempSync(join(tmpdir(), 'reap-session-test-'))
after(() => rmSync(scratch, { force: true, recursive: true }))

const cim = ({ command, mb, name = 'node.exe', pid, ppid }) => ({
  CommandLine: command,
  CreationDate: `/Date(${NOW - HOUR_MS})/`,
  Name: name,
  ParentProcessId: ppid,
  ProcessId: pid,
  WorkingSetSize: mb * BYTES_PER_MB
})

const LISTING = [
  cim({ command: 'claude.exe', mb: 1, name: 'claude.exe', pid: 100, ppid: 4 }),
  cim({ command: '"node.exe" "C:\\npm\\bin\\npx-cli.js" "-y" "metro-mcp"', mb: 90, pid: 10, ppid: 7 }),
  cim({ command: '"node" "C:\\npm-cache\\_npx\\1a\\node_modules\\metro-mcp\\dist\\bin\\metro-mcp.js"', mb: 85, pid: 12, ppid: 10 })
]

const recordingSpawn = () => {
  const calls = []
  const spawn = (command, args) => {
    calls.push({ args, command })
    const child = Object.assign(new EventEmitter(), {
      pid: undefined,
      stderr: new PassThrough(),
      stdout: new PassThrough()
    })
    setImmediate(() => {
      child.stdout.end(command === 'powershell' ? JSON.stringify(LISTING) : '')
      child.stderr.end('')
      child.emit('close', 0, null)
    })
    return child
  }
  return { calls, spawn }
}

const lines = () => {
  const out = []
  const err = []
  return { err, out, stderr: (line) => err.push(line), stdout: (line) => out.push(line) }
}

test('the session hook runs the reaper in kill mode, quiet, against the real core', async () => {
  assert.deepEqual(SESSION_ARGV, ['--kill', '--quiet'])
  const { calls, spawn } = recordingSpawn()
  const { err, out, stderr, stdout } = lines()
  const code = await sessionStart({
    options: {
      clock: () => NOW,
      lockPath: join(scratch, 'session.lock'),
      platform: 'win32',
      selfPid: 100,
      spawn
    },
    stderr,
    stdout
  })
  assert.equal(code, EXIT_OK)
  assert.deepEqual(calls.map(({ command }) => command), ['powershell', 'powershell', 'taskkill'])
  assert.deepEqual(calls[2].args, ['/PID', '10', '/T', '/F'])
  assert.deepEqual(out, ['reap: ended 1 tree, 175 MB'])
  assert.deepEqual(err, [])
})

test('a reaper that throws, fails or hangs prints one line to stderr and the hook exits 0', async () => {
  const throws = lines()
  assert.equal(
    await sessionStart({
      load: async () => ({
        contract: CONTRACT,
        runReaper: async () => {
          throw new Error('listing exploded')
        }
      }),
      stderr: throws.stderr,
      stdout: throws.stdout
    }),
    EXIT_OK
  )
  assert.deepEqual(throws.err, [
    'reap: the session-start reaper failed (listing exploded); the session goes on'
  ])

  const fails = lines()
  assert.equal(
    await sessionStart({
      load: async () => ({
        contract: CONTRACT,
        runReaper: async ({ stderr }) => {
          stderr('reap: could not end pid 10: denied')
          stderr('reap: could not end pid 12: denied')
          return 1
        }
      }),
      stderr: fails.stderr,
      stdout: fails.stdout
    }),
    EXIT_OK
  )
  assert.deepEqual(fails.err, ['reap: could not end pid 10: denied (and 1 more)'])

  const hangs = lines()
  assert.equal(
    await sessionStart({
      boundMs: SHORT_BOUND_MS,
      load: async () => ({
        contract: CONTRACT,
        runReaper: () => new Promise(() => {})
      }),
      stderr: hangs.stderr,
      stdout: hangs.stdout
    }),
    EXIT_OK
  )
  assert.deepEqual(hangs.err, [
    'reap: the session-start reaper outlasted its bound; the session goes on'
  ])

  const unloadable = lines()
  assert.equal(
    await sessionStart({
      load: async () => {
        throw new Error('Cannot find module plan.mjs')
      },
      stderr: unloadable.stderr,
      stdout: unloadable.stdout
    }),
    EXIT_OK
  )
  assert.equal(unloadable.err.length, 1)
  assert.match(unloadable.err[0], /Cannot find module plan\.mjs/u)
})

test("the session hook's default loader reads this checkout's contract and the real reaper", async () => {
  const loaded = await loadReaper()
  assert.equal(loaded.runReaper, runReaper)
  assert.deepEqual(
    loaded.contract.families.map(({ id }) => id),
    CONTRACT.families.map(({ id }) => id)
  )
  assert.equal(loaded.contract.boundSeconds, CONTRACT.boundSeconds)
})

test("the session hook prints the MCP check's line first, and a check that throws costs one stderr line", async () => {
  const quietReaper = async () => ({
    contract: CONTRACT,
    runReaper: async ({ stdout }) => {
      stdout('reap: ended 0 trees')
      return EXIT_OK
    }
  })
  const MCP_LINE = 'mcp-check: 1 MCP server(s) cannot start'

  const missing = lines()
  assert.equal(
    await sessionStart({
      checkMcp: async () => MCP_LINE,
      load: quietReaper,
      stderr: missing.stderr,
      stdout: missing.stdout
    }),
    EXIT_OK
  )
  assert.deepEqual(missing.out, [MCP_LINE, 'reap: ended 0 trees'])
  assert.deepEqual(missing.err, [])

  const nothing = lines()
  assert.equal(
    await sessionStart({
      checkMcp: async () => null,
      load: quietReaper,
      stderr: nothing.stderr,
      stdout: nothing.stdout
    }),
    EXIT_OK
  )
  assert.deepEqual(nothing.out, ['reap: ended 0 trees'])
  assert.deepEqual(nothing.err, [])

  const throws = lines()
  assert.equal(
    await sessionStart({
      checkMcp: async () => {
        throw new Error('catalog exploded')
      },
      load: quietReaper,
      stderr: throws.stderr,
      stdout: throws.stdout
    }),
    EXIT_OK
  )
  assert.deepEqual(throws.out, ['reap: ended 0 trees'])
  assert.deepEqual(throws.err, [
    'mcp-check: the session-start MCP check failed (catalog exploded); the session goes on'
  ])
})

const HUNG_CHECK_LINE =
  "mcp-check: the session-start MCP check outlasted the hook's budget, so " +
  'the reaper did not run; the session goes on'

test(
  "a hung MCP check ends within the hook's budget, and the hook exits 0",
  { timeout: PROCESS_GUARD_MS },
  async () => {
    let reaped = false
    const hung = lines()
    assert.equal(
      await sessionStart({
        boundMs: SHORT_BOUND_MS,
        checkMcp: () => new Promise(() => {}),
        load: async () => ({
          contract: CONTRACT,
          runReaper: async () => {
            reaped = true
            return EXIT_OK
          }
        }),
        stderr: hung.stderr,
        stdout: hung.stdout
      }),
      EXIT_OK
    )
    assert.deepEqual(hung.err, [HUNG_CHECK_LINE])
    assert.deepEqual(hung.out, [])
    assert.equal(reaped, false, 'the reaper ran past the budget')
  }
)

test('a hung MCP check still lets the hook process exit 0 with its one line', () => {
  const source = [
    `import { sessionStart } from ${JSON.stringify(pathToFileURL(join(HERE, 'session-start.mjs')).href)}`,
    'process.exitCode = await sessionStart({',
    `  boundMs: ${HUNG_BOUND_MS},`,
    '  checkMcp: () => new Promise(() => {}),',
    '  load: async () => ({ contract: { boundSeconds: 1 }, runReaper: async () => 0 }),',
    "  stderr: (line) => process.stderr.write(line + '\\n'),",
    '  stdout: () => {}',
    '})'
  ].join('\n')
  const run = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', source],
    {
      encoding: 'utf8',
      timeout: PROCESS_GUARD_MS
    }
  )
  assert.equal(run.status, EXIT_OK, `exit ${run.status}: ${run.stderr}`)
  assert.equal(run.stderr.trim(), HUNG_CHECK_LINE)
})

test('a hung reaper still lets the hook process exit 0 with its one line', () => {
  const source = [
    `import { sessionStart } from ${JSON.stringify(pathToFileURL(join(HERE, 'session-start.mjs')).href)}`,
    'process.exitCode = await sessionStart({',
    `  boundMs: ${HUNG_BOUND_MS},`,
    '  load: async () => ({ contract: { boundSeconds: 1 }, runReaper: () => new Promise(() => {}) }),',
    "  stderr: (line) => process.stderr.write(line + '\\n'),",
    '  stdout: () => {}',
    '})'
  ].join('\n')
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    encoding: 'utf8',
    timeout: PROCESS_GUARD_MS
  })
  assert.equal(run.status, EXIT_OK, `exit ${run.status}: ${run.stderr}`)
  assert.equal(
    run.stderr.trim(),
    'reap: the session-start reaper outlasted its bound; the session goes on'
  )
})
