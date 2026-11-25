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
// { code, stdout, stderr }, and records every call and the LC_ALL it ran
// under.
const fakeSpawn = ({ answers }) => {
  const calls = []
  const locales = []
  const spawn = (command, args, options) => {
    calls.push({ args, command })
    locales.push(options?.env?.LC_ALL)
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
  return { calls, locales, spawn }
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
    { bytes: 2048, command: 'npx-cli.js -y next-devtools-mcp', identityMs: NOW - HOUR_MS, name: 'node.exe', pid: 10, ppid: 7, startMs: NOW - HOUR_MS },
    { bytes: 0, command: '', identityMs: null, name: 'System', pid: 4, ppid: 0, startMs: null }
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

test('on POSIX the listing is read from ps under LC_ALL=C, the age from etime and the identity from lstart', async () => {
  // Fixed lines: a day of the month padded by a space, one lstart that names
  // no month and one etime that is no time.
  const ps = [
    '    1     0 9-01:02:03 Mon Nov 16 11:58:03 2026  2048 /sbin/init',
    '   10     1   01:00:00 Wed Nov 25 11:03:39 2026  4096 npm exec -y metro-mcp',
    '   11    10      02:05 Thu Nov  5 09:00:00 2026   100 sh -c metro-mcp',
    '   12    11      00:59 Wed Xyz 25 12:00:00 2026     1 node /u/.npm/_npx/1a2b/node_modules/.bin/metro-mcp',
    '   13    11      xx:59 Wed Nov 25 12:00:00 2026     1 node /u/x.js'
  ].join('\n')
  const { calls, locales, spawn } = fakeSpawn({ answers: { ps: { stdout: `${ps}\n` } } })
  const first = await listProcesses({ now: () => NOW, platform: 'linux', spawn, timeoutMs: BOUND_MS })
  const LATER_MS = 5000
  const second = await listProcesses({ now: () => NOW + LATER_MS, platform: 'darwin', spawn, timeoutMs: BOUND_MS })
  assert.deepEqual(calls, [
    { args: ['-eo', 'pid=,ppid=,etime=,lstart=,rss=,args='], command: 'ps' },
    { args: ['-eo', 'pid=,ppid=,etime=,lstart=,rss=,args='], command: 'ps' }
  ])
  assert.deepEqual(locales, ['C', 'C'])
  // lstart is the local time of the machine that lists; etime is the time
  // since the start, read against the clock of the listing.
  const local = ({ day, hour, minute, second: at }) =>
    new Date(2026, 10, day, hour, minute, at).getTime()
  const ago = ({ seconds }) => NOW - seconds * 1000
  assert.deepEqual(first, [
    { bytes: 2048 * BYTES_PER_KB, command: '/sbin/init', identityMs: local({ day: 16, hour: 11, minute: 58, second: 3 }), name: 'init', pid: 1, ppid: 0, startMs: ago({ seconds: 9 * 86_400 + 3723 }) },
    { bytes: 4096 * BYTES_PER_KB, command: 'npm exec -y metro-mcp', identityMs: local({ day: 25, hour: 11, minute: 3, second: 39 }), name: 'npm', pid: 10, ppid: 1, startMs: ago({ seconds: 3600 }) },
    { bytes: 100 * BYTES_PER_KB, command: 'sh -c metro-mcp', identityMs: local({ day: 5, hour: 9, minute: 0, second: 0 }), name: 'sh', pid: 11, ppid: 10, startMs: ago({ seconds: 125 }) },
    { bytes: BYTES_PER_KB, command: 'node /u/.npm/_npx/1a2b/node_modules/.bin/metro-mcp', identityMs: null, name: 'node', pid: 12, ppid: 11, startMs: null },
    { bytes: BYTES_PER_KB, command: 'node /u/x.js', identityMs: local({ day: 25, hour: 12, minute: 0, second: 0 }), name: 'node', pid: 13, ppid: 11, startMs: null }
  ])
  // A later listing moves the age with its clock, never the identity.
  assert.deepEqual(
    second.map(({ identityMs }) => identityMs),
    first.map(({ identityMs }) => identityMs)
  )
  assert.deepEqual(
    second.map(({ startMs }) => startMs),
    first.map(({ startMs }) => (startMs === null ? null : startMs + LATER_MS))
  )
})

// A POSIX tree of three pids, each with the start time the plan read.
const TREE_STARTS = new Map([
  [10, new Date(2026, 10, 25, 10, 0, 0).getTime()],
  [11, new Date(2026, 10, 25, 10, 0, 1).getTime()],
  [12, new Date(2026, 10, 25, 10, 0, 2).getTime()]
])
const POSIX_CANDIDATE = { ...CANDIDATE, starts: TREE_STARTS }

// A signal that records every call, ends each pid of `dies` at its SIGTERM
// and any pid at its SIGKILL, and refuses a pid that is gone.
const fakeSignal = ({ alive, dies, events }) => (pid, name) => {
  events.push([pid, name])
  if (!alive.has(pid)) throw Object.assign(new Error('no such process'), { code: 'ESRCH' })
  if (name === 'SIGKILL' || (name === 'SIGTERM' && dies.includes(pid))) alive.delete(pid)
}

test('on POSIX a tree gets SIGTERM, then after 2 s SIGKILL only to each pid still listed with its start time', async () => {
  // Pid 10 ends at its SIGTERM; pid 11 survives it; pid 12 ends and a newer
  // process takes the pid before the check, so a probe would find it alive.
  const ps = [
    '   11     1   01:59:59 Wed Nov 25 10:00:01 2026   100 node /r/node_modules/typescript/bin/tsc',
    '   12     1      00:02 Wed Nov 25 11:59:58 2026   100 /usr/bin/vim notes.md'
  ].join('\n')
  const events = []
  const { calls, spawn: answer } = fakeSpawn({ answers: { ps: { stdout: `${ps}\n` } } })
  const spawn = (...args) => {
    events.push(['spawn', args[0]])
    return answer(...args)
  }
  const results = await endTrees({
    candidates: [POSIX_CANDIDATE],
    remainingMs: () => BOUND_MS,
    platform: 'linux',
    signal: fakeSignal({ alive: new Set([11, 12]), dies: [10], events }),
    sleep: async (ms) => events.push(['sleep', ms]),
    spawn
  })
  assert.deepEqual(events, [
    [10, 'SIGTERM'],
    [11, 'SIGTERM'],
    [12, 'SIGTERM'],
    ['sleep', KILL_WAIT_MS],
    ['spawn', 'ps'],
    [11, 'SIGKILL']
  ])
  assert.deepEqual(calls, [{ args: ['-eo', 'pid=,ppid=,etime=,lstart=,rss=,args='], command: 'ps' }])
  assert.deepEqual(results, [{ ended: true, pid: 10 }])
})

test('on POSIX a listing before SIGKILL that returns no process reports the tree as not ended', async () => {
  // A listing that parses to nothing would read every pid as gone.
  const empty = fakeSpawn({ answers: { ps: { stdout: 'ps: no process matched\n' } } })
  const events = []
  assert.deepEqual(
    await endTrees({
      candidates: [POSIX_CANDIDATE],
      remainingMs: () => BOUND_MS,
      platform: 'linux',
      signal: fakeSignal({ alive: new Set([10, 11, 12]), dies: [], events }),
      sleep: async () => {},
      spawn: empty.spawn
    }),
    [
      {
        detail:
          'sent SIGTERM, but the second listing returned no process, so it sent no SIGKILL',
        ended: false,
        pid: 10
      }
    ]
  )
  assert.deepEqual(events, [[10, 'SIGTERM'], [11, 'SIGTERM'], [12, 'SIGTERM']])
})

test('on POSIX no SIGKILL is sent when the listing before it fails or the bound has run out', async () => {
  const failing = fakeSpawn({ answers: { ps: { code: 1, stderr: 'ps: cannot read /proc' } } })
  const failed = []
  assert.deepEqual(
    await endTrees({
      candidates: [POSIX_CANDIDATE],
      remainingMs: () => BOUND_MS,
      platform: 'linux',
      signal: fakeSignal({ alive: new Set([10, 11, 12]), dies: [], events: failed }),
      sleep: async () => {},
      spawn: failing.spawn
    }),
    [
      {
        detail:
          'sent SIGTERM, but listing the processes again failed: ps exited 1: ' +
          'ps: cannot read /proc, so it sent no SIGKILL',
        ended: false,
        pid: 10
      }
    ]
  )
  assert.deepEqual(failed, [[10, 'SIGTERM'], [11, 'SIGTERM'], [12, 'SIGTERM']])

  // The 2 s wait spends what was left of the bound.
  const clock = { left: BOUND_MS }
  const late = fakeSpawn({ answers: { ps: { stdout: '' } } })
  const spent = []
  assert.deepEqual(
    await endTrees({
      candidates: [POSIX_CANDIDATE],
      remainingMs: () => clock.left,
      platform: 'linux',
      signal: fakeSignal({ alive: new Set([10, 11, 12]), dies: [], events: spent }),
      sleep: async () => {
        clock.left = 0
      },
      spawn: late.spawn
    }),
    [
      {
        detail:
          'sent SIGTERM, but the bound ran out before it could list the processes ' +
          'again, so it sent no SIGKILL',
        ended: false,
        pid: 10
      }
    ]
  )
  assert.deepEqual(late.calls, [])
  assert.deepEqual(spent, [[10, 'SIGTERM'], [11, 'SIGTERM'], [12, 'SIGTERM']])
})

test('a listing that exits non-zero throws, naming the command and what it printed', async () => {
  const { spawn } = fakeSpawn({ answers: { ps: { code: 1, stderr: 'ps: bad option' } } })
  await assert.rejects(
    listProcesses({ platform: 'darwin', spawn, timeoutMs: BOUND_MS }),
    /ps exited 1: ps: bad option/u
  )
})
