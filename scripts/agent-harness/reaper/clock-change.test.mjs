#!/usr/bin/env node
// ---------------------------------------------------------------------------
// clock-change — the hour a clock falls back, on POSIX. In New York the
// clock reads 01:00 to 01:59 twice on 2026-11-01, so a wall-clock start
// time cannot tell which comes first: a child started at 06:10 UTC, the
// second 01:10, would read as older than a parent started at 05:50 UTC, the
// first 01:50. The listing comes from an injected spawn that acts like `ps`:
// it prints the columns it is asked for, each lstart in UTC when its env
// sets TZ=UTC and as the New York wall clock otherwise. The plan reads it at
// 07:00 UTC. This file runs in a process of its own, so its time zone
// reaches no other.
//
// Usage:
//   node --test scripts/agent-harness/reaper/clock-change.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { dirname, resolve } from 'node:path'
import { PassThrough } from 'node:stream'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { loadContract } from './contract.mjs'
import { planReap } from './plan.mjs'
import { listProcesses } from './platform.mjs'

process.env.TZ = 'America/New_York'

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTRACT = loadContract({ root: resolve(HERE, '..', '..', '..') })
const NOW = Date.UTC(2026, 10, 1, 7, 0, 0)
const BOUND_MS = 5000
const SELF = 999
const SESSION_PID = 100
const SERVER_PID = 200
const SESSION_START = Date.UTC(2026, 10, 1, 5, 50, 0)
const SERVER_START = Date.UTC(2026, 10, 1, 6, 10, 0)
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const SECONDS = { day: 86_400, hour: 3600, minute: 60 }

// init, the session and the MCP server the session started 20 min later.
const PROCESSES = [
  { args: '/sbin/init', pid: 1, ppid: 0, rss: '2048', startMs: Date.UTC(2026, 9, 22, 7, 0, 0) },
  { args: 'claude', pid: SESSION_PID, ppid: 1, rss: '4096', startMs: SESSION_START },
  {
    args: 'node /home/u/.npm/_npx/ab12/node_modules/foo-mcp/dist/index.js',
    pid: SERVER_PID,
    ppid: SESSION_PID,
    rss: '2048',
    startMs: SERVER_START
  }
]

const two = ({ value }) => String(value).padStart(2, '0')

// `Sun Nov  1 05:50:00 2026`, in UTC or in the zone of this process.
const lstartOf = ({ startMs, utc }) => {
  const at = new Date(startMs)
  const part = (name) => at[`get${utc ? 'UTC' : ''}${name}`]()
  return [
    DAYS[part('Day')],
    MONTHS[part('Month')],
    String(part('Date')).padStart(2, ' '),
    `${two({ value: part('Hours') })}:${two({ value: part('Minutes') })}:${two({ value: part('Seconds') })}`,
    part('FullYear')
  ].join(' ')
}

// `[[dd-]hh:]mm:ss` since the start, at NOW.
const etimeOf = ({ startMs }) => {
  const seconds = Math.floor((NOW - startMs) / 1000)
  const days = Math.floor(seconds / SECONDS.day)
  const hours = Math.floor((seconds % SECONDS.day) / SECONDS.hour)
  const minutes = Math.floor((seconds % SECONDS.hour) / SECONDS.minute)
  const clock = `${two({ value: minutes })}:${two({ value: seconds % SECONDS.minute })}`
  if (days > 0) return `${days}-${two({ value: hours })}:${clock}`
  return hours > 0 ? `${two({ value: hours })}:${clock}` : clock
}

// A `ps` that prints the columns its `-o` list names, in that order.
const psSpawn = () => (command, args, options) => {
  const utc = options?.env?.TZ === 'UTC'
  const columns = args[1].split(',').map((column) => column.replace(/=$/u, ''))
  const cell = ({ column, row }) => {
    if (column === 'lstart') return lstartOf({ startMs: row.startMs, utc })
    if (column === 'etime') return etimeOf({ startMs: row.startMs })
    return row[column]
  }
  const text = PROCESSES.map((row) => columns.map((column) => cell({ column, row })).join(' ')).join('\n')
  const child = Object.assign(new EventEmitter(), {
    stderr: new PassThrough(),
    stdout: new PassThrough()
  })
  setImmediate(() => {
    child.stdout.end(`${text}\n`)
    child.stderr.end('')
    child.emit('close', 0, null)
  })
  return child
}

test('in the hour the clock falls back, a live child never reads as older than its parent', async () => {
  // The New York wall clock reads the server's start before the session's.
  assert.equal(lstartOf({ startMs: SESSION_START, utc: false }), 'Sun Nov  1 01:50:00 2026')
  assert.equal(lstartOf({ startMs: SERVER_START, utc: false }), 'Sun Nov  1 01:10:00 2026')
  const processes = await listProcesses({ platform: 'linux', spawn: psSpawn(), timeoutMs: BOUND_MS })
  assert.equal(processes.length, PROCESSES.length, 'the listing reads every process')
  const startOf = ({ pid }) => processes.find((process) => process.pid === pid).startMs
  assert.equal(startOf({ pid: SESSION_PID }), SESSION_START, 'the session reads at 05:50 UTC')
  assert.equal(startOf({ pid: SERVER_PID }), SERVER_START, 'the server reads at 06:10 UTC')
  const plan = planReap({ contract: CONTRACT, now: NOW, platform: 'linux', processes, selfPid: SELF })
  assert.deepEqual(plan.candidates, [], 'the live MCP server is no candidate')
  assert.deepEqual(plan.kept, [])
})
