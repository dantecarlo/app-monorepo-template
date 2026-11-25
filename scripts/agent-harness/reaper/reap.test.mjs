#!/usr/bin/env node
// ---------------------------------------------------------------------------
// reap — the command behind `pnpm reap` and `pnpm reap:kill`, run through
// `runReaper` with an injected spawn that answers a synthetic Windows
// listing and records every taskkill: nothing here lists or ends a real
// process. The clock is injected too, so the bound is driven, not waited,
// and each run takes its lock in a scratch folder of its own under the OS
// temp directory, removed when the suite ends.
//
// Usage:
//   node --test scripts/agent-harness/reaper/reap.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { existsSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { PassThrough } from 'node:stream'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { loadContract } from './contract.mjs'
import { runReaper } from './reap.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTRACT = loadContract({ root: resolve(HERE, '..', '..', '..') })

const NOW = Date.UTC(2026, 10, 20, 12, 0, 0)
const HOUR_MS = 3_600_000
const BYTES_PER_MB = 1_048_576
const SELF = 900
const EXIT_OK = 0
const EXIT_FAILED = 1
const STALE_SECONDS = 31

const scratch = mkdtempSync(join(tmpdir(), 'reap-test-'))
after(() => rmSync(scratch, { force: true, recursive: true }))
let lockCount = 0
const freshLockPath = () => {
  lockCount += 1
  return join(scratch, `reap-${lockCount}.lock`)
}

const cim = ({ ago = HOUR_MS, command, mb = 10, name = 'node.exe', pid, ppid }) => ({
  CommandLine: command,
  CreationDate: `/Date(${NOW - ago})/`,
  Name: name,
  ParentProcessId: ppid,
  ProcessId: pid,
  WorkingSetSize: mb * BYTES_PER_MB
})

const LAUNCHER = '"node.exe" "C:\\npm\\bin\\npx-cli.js" "-y" "next-devtools-mcp"'
const TURBO = '"C:\\r\\node_modules\\turbo-windows-64\\bin\\turbo.exe" --skip-infer run lint'

const LISTING = [
  cim({ ago: 9 * HOUR_MS, command: 'explorer.exe', name: 'explorer.exe', pid: 50, ppid: 4 }),
  cim({ ago: 2 * HOUR_MS, command: 'claude.exe', name: 'claude.exe', pid: 100, ppid: 50 }),
  cim({ ago: 1000, command: 'node reap.mjs', pid: SELF, ppid: 100 }),
  cim({ command: LAUNCHER, mb: 90, pid: 10, ppid: 7 }),
  cim({ command: 'cmd.exe /d /s /c next-devtools-mcp', mb: 5, name: 'cmd.exe', pid: 11, ppid: 10 }),
  cim({ command: '"node" "C:\\npm-cache\\_npx\\1a\\node_modules\\next-devtools-mcp\\dist\\index.js"', mb: 80, pid: 12, ppid: 11 }),
  cim({ command: TURBO, mb: 300, name: 'turbo.exe', pid: 80, ppid: 7 }),
  cim({ ago: 30_000, command: TURBO, name: 'turbo.exe', pid: 70, ppid: 8 })
]

// A spawn whose powershell answers `listing` (or never answers, or fails),
// then `relisting` when the kill reads the processes again, and whose
// taskkill answers `taskkill`, after `onTaskkill` runs.
const harness = ({
  contract = CONTRACT,
  listing = LISTING,
  lockPath = freshLockPath(),
  onTaskkill = () => {},
  powershell = { stdout: JSON.stringify(listing) },
  relisting,
  taskkill = {}
} = {}) => {
  const calls = []
  const out = []
  const err = []
  const clock = { now: NOW }
  const spawn = (command, args) => {
    calls.push({ args, command })
    const child = Object.assign(new EventEmitter(), {
      pid: undefined,
      stderr: new PassThrough(),
      stdout: new PassThrough(),
      unref: () => {}
    })
    const listings = calls.filter((call) => call.command === 'powershell').length
    const answer =
      command === 'taskkill'
        ? taskkill
        : listings > 1 && relisting
          ? { stdout: JSON.stringify(relisting) }
          : powershell
    if (command === 'taskkill') onTaskkill({ args, clock })
    if (answer.hang) return child
    setImmediate(() => {
      child.stdout.end(answer.stdout ?? '')
      child.stderr.end(answer.stderr ?? '')
      child.emit('close', answer.code ?? 0, null)
    })
    return child
  }
  const run = ({ argv }) =>
    runReaper({
      argv,
      clock: () => clock.now,
      contract,
      lockPath,
      platform: 'win32',
      selfPid: SELF,
      spawn,
      stderr: (line) => err.push(line),
      stdout: (line) => out.push(line)
    })
  return {
    calls,
    err,
    kills: () => calls.filter(({ command }) => command === 'taskkill'),
    lockPath,
    out,
    run
  }
}

test('a dry run prints each candidate with its family, age and MB, then the total, and ends nothing', async () => {
  const { err, kills, out, run } = harness()
  assert.equal(await run({ argv: [] }), EXIT_OK)
  assert.deepEqual(out, [
    'reap: would end pid 80, turbo, 1 h old, 1 process, 300 MB',
    'reap: would end pid 10, npx-mcp via npx-cli.js, 1 h old, 3 processes, 175 MB',
    'reap: kept pid 70, turbo: a process in it is younger than the grace period',
    'reap: dry run: 2 trees to end, 475 MB; pnpm reap:kill ends them'
  ])
  assert.deepEqual(err, [])
  assert.deepEqual(kills(), [])
  // --dry-run says the same thing out loud.
  const again = harness()
  assert.equal(await again.run({ argv: ['--dry-run'] }), EXIT_OK)
  assert.deepEqual(again.out, out)
})

test('--kill ends every candidate tree and prints what it ended', async () => {
  const { err, kills, out, run } = harness()
  assert.equal(await run({ argv: ['--kill'] }), EXIT_OK)
  assert.deepEqual(kills(), [
    { args: ['/PID', '80', '/T', '/F'], command: 'taskkill' },
    { args: ['/PID', '10', '/T', '/F'], command: 'taskkill' }
  ])
  assert.deepEqual(out, [
    'reap: ended pid 80, turbo, 1 h old, 1 process, 300 MB',
    'reap: ended pid 10, npx-mcp via npx-cli.js, 1 h old, 3 processes, 175 MB',
    'reap: kept pid 70, turbo: a process in it is younger than the grace period',
    'reap: ended 2 trees, 475 MB'
  ])
  assert.deepEqual(err, [])
})

test('--quiet prints only the total and --json the plan', async () => {
  const quiet = harness()
  assert.equal(await quiet.run({ argv: ['--kill', '--quiet'] }), EXIT_OK)
  assert.deepEqual(quiet.out, ['reap: ended 2 trees, 475 MB'])
  assert.equal(quiet.kills().length, 2)

  const json = harness()
  assert.equal(await json.run({ argv: ['--json'] }), EXIT_OK)
  assert.equal(json.out.length, 1)
  const plan = JSON.parse(json.out[0])
  assert.equal(plan.mode, 'dry-run')
  assert.equal(plan.boundSeconds, 8)
  assert.equal(plan.graceSeconds, 60)
  assert.equal(plan.totalMb, 475)
  assert.deepEqual(
    plan.candidates.map(({ family, mb, pid, pids }) => ({ family, mb, pid, pids })),
    [
      { family: 'turbo', mb: 300, pid: 80, pids: [80] },
      { family: 'npx-mcp', mb: 175, pid: 10, pids: [10, 11, 12] }
    ]
  )
  assert.deepEqual(plan.kept, [
    { family: 'turbo', pid: 70, reason: 'a process in it is younger than the grace period' }
  ])
  assert.deepEqual(json.kills(), [])

  const killed = harness()
  assert.equal(await killed.run({ argv: ['--kill', '--json'] }), EXIT_OK)
  const outcome = JSON.parse(killed.out[0])
  assert.equal(outcome.mode, 'kill')
  assert.deepEqual(outcome.ended, [80, 10])
  assert.deepEqual(outcome.failed, [])
  assert.deepEqual(outcome.left, [])
  assert.deepEqual(outcome.changed, [])
})

test('a second reaper finds the lock and exits 0 at once, ending nothing', async () => {
  const first = harness()
  writeFileSync(first.lockPath, '4242')
  assert.equal(await first.run({ argv: ['--kill', '--quiet'] }), EXIT_OK)
  assert.deepEqual(first.calls, [])
  assert.deepEqual(first.out, [
    `reap: another reaper holds ${first.lockPath}, so this run ends nothing`
  ])
  assert.ok(existsSync(first.lockPath), 'the other reaper keeps its lock')
})

test('a lock older than 30 s is a reaper that died, and is taken over', async () => {
  const stale = harness()
  writeFileSync(stale.lockPath, '4242')
  const then = Date.now() / 1000 - STALE_SECONDS
  utimesSync(stale.lockPath, then, then)
  assert.equal(await stale.run({ argv: ['--kill', '--quiet'] }), EXIT_OK)
  assert.equal(stale.kills().length, 2)
  assert.deepEqual(stale.out, ['reap: ended 2 trees, 475 MB'])
  assert.ok(!existsSync(stale.lockPath), 'the run releases the lock it took')
})

test('a dry run takes no lock', async () => {
  const dry = harness()
  writeFileSync(dry.lockPath, '4242')
  assert.equal(await dry.run({ argv: ['--quiet'] }), EXIT_OK)
  assert.deepEqual(dry.out, ['reap: dry run: 2 trees to end, 475 MB; pnpm reap:kill ends them'])
})

test('a candidate whose pid names another process by its kill is left, and the rest are ended', async () => {
  // Between the plan and the kill, pid 80 ended and a new process took it.
  const relisting = LISTING.map((row) =>
    row.ProcessId === 80 ? { ...row, CreationDate: `/Date(${NOW - 5000})/` } : row
  )
  const { err, kills, out, run } = harness({ relisting })
  assert.equal(await run({ argv: ['--kill'] }), EXIT_OK)
  assert.deepEqual(kills(), [{ args: ['/PID', '10', '/T', '/F'], command: 'taskkill' }])
  assert.deepEqual(out, [
    'reap: ended pid 10, npx-mcp via npx-cli.js, 1 h old, 3 processes, 175 MB',
    'reap: left pid 80, turbo: its pid no longer names the process it planned to end',
    'reap: kept pid 70, turbo: a process in it is younger than the grace period',
    'reap: ended 1 tree, 175 MB'
  ])
  assert.deepEqual(err, [])
})

test('a tree ended pid by pid leaves a pid that names another process by its kill', async () => {
  // Pid 13, older than 11, names it as its parent, so tree 10 is ended pid
  // by pid; between the plan and the kill, pid 12 ended and a new process
  // took it.
  const listing = [
    ...LISTING,
    cim({ ago: 3 * HOUR_MS, command: 'C:\\tool.exe', name: 'tool.exe', pid: 13, ppid: 11 })
  ]
  const relisting = listing.map((row) =>
    row.ProcessId === 12 ? { ...row, CreationDate: `/Date(${NOW - 5000})/` } : row
  )
  const { err, kills, out, run } = harness({ listing, relisting })
  assert.equal(await run({ argv: ['--kill'] }), EXIT_OK)
  assert.deepEqual(kills(), [
    { args: ['/PID', '80', '/T', '/F'], command: 'taskkill' },
    { args: ['/F', '/PID', '10', '/PID', '11'], command: 'taskkill' }
  ])
  assert.deepEqual(out, [
    'reap: ended pid 80, turbo, 1 h old, 1 process, 300 MB',
    'reap: ended pid 10, npx-mcp via npx-cli.js, 1 h old, 3 processes, 175 MB',
    'reap: kept pid 70, turbo: a process in it is younger than the grace period',
    'reap: ended 2 trees, 475 MB'
  ])
  assert.deepEqual(err, [])
})

test('a run with nothing to end says so and exits 0', async () => {
  const { out, run } = harness({ listing: LISTING.slice(0, 3) })
  assert.equal(await run({ argv: ['--kill', '--quiet'] }), EXIT_OK)
  assert.deepEqual(out, ['reap: ended no tree, 0 MB'])
})

test('a listing that outlasts the bound ends nothing and exits 1', async () => {
  const { err, kills, out, run } = harness({
    contract: { ...CONTRACT, boundSeconds: 1 },
    powershell: { hang: true }
  })
  assert.equal(await run({ argv: ['--kill'] }), EXIT_FAILED)
  assert.deepEqual(kills(), [])
  assert.deepEqual(out, [])
  assert.deepEqual(err, [
    'reap: the process listing did not finish within its 1 s bound, so nothing was ended'
  ])
})

test('the bound running out between two trees leaves the rest and exits 1', async () => {
  const { err, kills, out, run } = harness({
    onTaskkill: ({ clock }) => {
      clock.now += 9000
    }
  })
  assert.equal(await run({ argv: ['--kill'] }), EXIT_FAILED)
  assert.deepEqual(kills(), [{ args: ['/PID', '80', '/T', '/F'], command: 'taskkill' }])
  assert.deepEqual(out, [
    'reap: ended pid 80, turbo, 1 h old, 1 process, 300 MB',
    'reap: kept pid 70, turbo: a process in it is younger than the grace period',
    'reap: ended 1 tree, 300 MB'
  ])
  assert.deepEqual(err, [
    'reap: reached its 8 s bound after ending 1 of 2 trees; it left pid 10'
  ])
})

test('a tree that cannot be ended is reported, and the run exits 1', async () => {
  const { err, out, run } = harness({
    taskkill: { code: 1, stderr: 'ERROR: Access is denied.' }
  })
  assert.equal(await run({ argv: ['--kill', '--quiet'] }), EXIT_FAILED)
  assert.deepEqual(out, ['reap: ended no tree, 0 MB'])
  assert.deepEqual(err, [
    'reap: could not end pid 80: taskkill exited 1: ERROR: Access is denied.',
    'reap: could not end pid 10: taskkill exited 1: ERROR: Access is denied.'
  ])
})

test('a listing that fails exits 1, naming the command', async () => {
  const { err, kills, out, run } = harness({
    powershell: { code: 1, stderr: 'Get-CimInstance : Access denied' }
  })
  assert.equal(await run({ argv: [] }), EXIT_FAILED)
  assert.deepEqual(out, [])
  assert.deepEqual(err, [
    'reap: powershell exited 1: Get-CimInstance : Access denied; nothing was ended'
  ])
  assert.deepEqual(kills(), [])
})

for (const argv of [['--force'], ['--kill', '--dry-run']]) {
  test(`the options ${argv.join(' ')} are refused with the usage, and nothing runs`, async () => {
    const { calls, err, run } = harness()
    assert.equal(await run({ argv }), EXIT_FAILED)
    assert.equal(err.length, 1)
    assert.match(err[0], /--dry-run \(the default\), --kill, --json or --quiet/u)
    assert.deepEqual(calls, [])
  })
}
