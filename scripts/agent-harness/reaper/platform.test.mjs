#!/usr/bin/env node
// ---------------------------------------------------------------------------
// platform — the reaper's adapter: how it lists processes and ends a tree on
// each platform. Every command goes through an injected spawn, so nothing
// here lists or signals a real process; the fake answers each command with
// a synthetic listing and records what it was asked to run.
//
// Usage:
//   node --test scripts/agent-harness/reaper/platform.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { test } from 'node:test'

import { endTrees, listProcesses } from './platform.mjs'

const NOW = Date.UTC(2026, 10, 20, 12, 0, 0)
const BOUND_MS = 5000
const HOUR_MS = 3_600_000
const KILL_WAIT_MS = 2000
const BYTES_PER_KB = 1024
const NOT_FOUND = 128

// A spawn that answers each command from `answers` (by command name) with
// { code, stdout, stderr }, and records every call.
const fakeSpawn = ({ answers }) => {
  const calls = []
  const spawn = (command, args) => {
    calls.push({ args, command })
    const child = Object.assign(new EventEmitter(), {
      pid: undefined,
      stderr: new PassThrough(),
      stdout: new PassThrough()
    })
    const { code = 0, stderr = '', stdout = '' } = answers[command] ?? {}
    setImmediate(() => {
      child.stdout.end(stdout)
      child.stderr.end(stderr)
      child.emit('close', code, null)
    })
    return child
  }
  return { calls, spawn }
}

const cim = ({ pid, ppid, name, command, startMs, bytes }) => ({
  CommandLine: command,
  CreationDate: `/Date(${startMs})/`,
  Name: name,
  ParentProcessId: ppid,
  ProcessId: pid,
  WorkingSetSize: bytes
})

const CANDIDATE = { pid: 10, pids: [10, 11, 12], strayChild: false }

test('on Windows the listing is read from Get-CimInstance and a tree ends with taskkill /T /F', async () => {
  const listing = [
    cim({ bytes: 2048, command: 'npx-cli.js -y next-devtools-mcp', name: 'node.exe', pid: 10, ppid: 7, startMs: NOW - HOUR_MS }),
    { ...cim({ bytes: 0, command: null, name: 'System', pid: 4, ppid: 0, startMs: 0 }), CreationDate: null }
  ]
  const { calls, spawn } = fakeSpawn({
    answers: { powershell: { stdout: JSON.stringify(listing) }, taskkill: {} }
  })
  const processes = await listProcesses({ platform: 'win32', spawn, timeoutMs: BOUND_MS })
  assert.deepEqual(processes, [
    { bytes: 2048, command: 'npx-cli.js -y next-devtools-mcp', name: 'node.exe', pid: 10, ppid: 7, startMs: NOW - HOUR_MS },
    { bytes: 0, command: '', name: 'System', pid: 4, ppid: 0, startMs: null }
  ])
  assert.equal(calls[0].command, 'powershell')
  assert.ok(calls[0].args.includes('-NoProfile'))
  assert.match(
    calls[0].args.at(-1),
    /Get-CimInstance Win32_Process \| Select ProcessId,ParentProcessId,Name,CommandLine,CreationDate,WorkingSetSize \| ConvertTo-Json/u
  )

  const results = await endTrees({
    candidates: [CANDIDATE],
    remainingMs: () => BOUND_MS,
    platform: 'win32',
    spawn
  })
  assert.deepEqual(calls.at(-1), { args: ['/PID', '10', '/T', '/F'], command: 'taskkill' })
  assert.deepEqual(results, [{ ended: true, pid: 10 }])
})

test('on Windows a tree whose pid an older process names as its parent is ended pid by pid', async () => {
  const { calls, spawn } = fakeSpawn({ answers: { taskkill: {} } })
  const results = await endTrees({
    candidates: [{ ...CANDIDATE, strayChild: true }],
    remainingMs: () => BOUND_MS,
    platform: 'win32',
    spawn
  })
  assert.deepEqual(calls, [
    { args: ['/F', '/PID', '10', '/PID', '11', '/PID', '12'], command: 'taskkill' }
  ])
  assert.deepEqual(results, [{ ended: true, pid: 10 }])
})

test('on Windows a taskkill that finds no process counts the tree as ended, and any other failure does not', async () => {
  const gone = fakeSpawn({ answers: { taskkill: { code: NOT_FOUND } } })
  assert.deepEqual(
    await endTrees({ candidates: [CANDIDATE], remainingMs: () => BOUND_MS, platform: 'win32', spawn: gone.spawn }),
    [{ ended: true, pid: 10 }]
  )
  const denied = fakeSpawn({ answers: { taskkill: { code: 1, stderr: 'ERROR: Access is denied.' } } })
  assert.deepEqual(
    await endTrees({ candidates: [CANDIDATE], remainingMs: () => BOUND_MS, platform: 'win32', spawn: denied.spawn }),
    [{ detail: 'taskkill exited 1: ERROR: Access is denied.', ended: false, pid: 10 }]
  )
})

test('a single process, and a start time PowerShell 7 writes as a date, are read too', async () => {
  const one = {
    ...cim({ bytes: 1, command: 'x', name: 'x.exe', pid: 3, ppid: 1, startMs: 0 }),
    CreationDate: '2026-11-20T11:00:00+00:00'
  }
  const { spawn } = fakeSpawn({ answers: { powershell: { stdout: JSON.stringify(one) } } })
  const [process] = await listProcesses({ platform: 'win32', spawn, timeoutMs: BOUND_MS })
  assert.equal(process.startMs, NOW - HOUR_MS)
})

test('on POSIX the listing is read from ps and a tree gets SIGTERM, then SIGKILL after 2 s', async () => {
  const ps = [
    '    1     0 9-01:02:03  2048 /sbin/init',
    '   10     1    01:00:00  4096 npm exec -y metro-mcp',
    '   11    10       02:05   100 sh -c metro-mcp',
    '   12    11       00:59     1 node /u/.npm/_npx/1a2b/node_modules/.bin/metro-mcp'
  ].join('\n')
  const { calls, spawn } = fakeSpawn({ answers: { ps: { stdout: `${ps}\n` } } })
  const before = Date.now()
  const processes = await listProcesses({ platform: 'linux', spawn, timeoutMs: BOUND_MS })
  assert.deepEqual(calls[0], { args: ['-eo', 'pid=,ppid=,etime=,rss=,args='], command: 'ps' })
  assert.deepEqual(
    processes.map(({ bytes, command, name, pid, ppid }) => ({ bytes, command, name, pid, ppid })),
    [
      { bytes: 2048 * BYTES_PER_KB, command: '/sbin/init', name: 'init', pid: 1, ppid: 0 },
      { bytes: 4096 * BYTES_PER_KB, command: 'npm exec -y metro-mcp', name: 'npm', pid: 10, ppid: 1 },
      { bytes: 100 * BYTES_PER_KB, command: 'sh -c metro-mcp', name: 'sh', pid: 11, ppid: 10 },
      { bytes: BYTES_PER_KB, command: 'node /u/.npm/_npx/1a2b/node_modules/.bin/metro-mcp', name: 'node', pid: 12, ppid: 11 }
    ]
  )
  // 9-01:02:03 and 01:00:00 elapsed, read against the clock of the call.
  const age = ({ pid }) => before - processes.find((one) => one.pid === pid).startMs
  assert.ok(Math.abs(age({ pid: 1 }) - (9 * 86_400 + 3723) * 1000) < BOUND_MS)
  assert.ok(Math.abs(age({ pid: 10 }) - HOUR_MS) < BOUND_MS)

  // Pid 12 survives its SIGTERM.
  const signals = []
  const alive = new Set([10, 11, 12])
  const signal = (pid, name) => {
    signals.push([pid, name])
    if (!alive.has(pid)) throw Object.assign(new Error('no such process'), { code: 'ESRCH' })
    if (name === 'SIGTERM' && pid !== 12) alive.delete(pid)
    if (name === 'SIGKILL') alive.delete(pid)
  }
  const waits = []
  const results = await endTrees({
    candidates: [CANDIDATE],
    remainingMs: () => BOUND_MS,
    platform: 'linux',
    signal,
    sleep: async (ms) => waits.push(ms),
    spawn
  })
  assert.deepEqual(signals, [
    [10, 'SIGTERM'],
    [11, 'SIGTERM'],
    [12, 'SIGTERM'],
    [10, 0],
    [11, 0],
    [12, 0],
    [12, 'SIGKILL']
  ])
  assert.deepEqual(waits, [KILL_WAIT_MS])
  assert.deepEqual(results, [{ ended: true, pid: 10 }])
})

test('a listing that exits non-zero throws, naming the command and what it printed', async () => {
  const { spawn } = fakeSpawn({ answers: { ps: { code: 1, stderr: 'ps: bad option' } } })
  await assert.rejects(
    listProcesses({ platform: 'darwin', spawn, timeoutMs: BOUND_MS }),
    /ps exited 1: ps: bad option/u
  )
})
