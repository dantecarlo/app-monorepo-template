#!/usr/bin/env node
// ---------------------------------------------------------------------------
// clock-change — the hour a clock falls back, on POSIX. In New York the
// clock reads 01:00 to 01:59 twice on 2026-11-01, so a wall-clock start
// time cannot tell which comes first: a child started in the second 01:05,
// 15 min after a parent started in the first 01:50, reads as older than it.
// The listing comes from an injected spawn that prints whatever columns
// `ps` is asked for, and the plan reads it at 07:00 UTC, 02:00 local. This
// file runs in a process of its own, so its time zone reaches no other.
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

// Each process as every column `ps -o` may print: init, then the session
// started at the first 01:50 (05:50 UTC), then its MCP server started at the
// second 01:05 (06:05 UTC), 15 min later.
const PROCESSES = [
  { args: '/sbin/init', etime: '10-00:00:00', etimes: '864000', lstart: 'Thu Oct 22 03:00:00 2026', pid: 1, ppid: 0, rss: '2048' },
  { args: 'claude', etime: '01:10:00', etimes: '4200', lstart: 'Sun Nov  1 01:50:00 2026', pid: 100, ppid: 1, rss: '4096' },
  {
    args: 'node /home/u/.npm/_npx/ab12/node_modules/foo-mcp/dist/index.js',
    etime: '55:00',
    etimes: '3300',
    lstart: 'Sun Nov  1 01:05:00 2026',
    pid: 200,
    ppid: 100,
    rss: '2048'
  }
]

// A `ps` that prints the columns its `-o` list names, in that order.
const columnSpawn = () => (command, args) => {
  const columns = args[1].split(',').map((column) => column.replace(/=$/u, ''))
  const text = PROCESSES.map((row) => columns.map((column) => row[column]).join(' ')).join('\n')
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
  const processes = await listProcesses({
    now: () => NOW,
    platform: 'linux',
    spawn: columnSpawn(),
    timeoutMs: BOUND_MS
  })
  assert.equal(processes.length, PROCESSES.length, 'the listing reads every process')
  const plan = planReap({ contract: CONTRACT, now: NOW, platform: 'linux', processes, selfPid: SELF })
  assert.deepEqual(plan.candidates, [], 'the live MCP server is no candidate')
  assert.deepEqual(plan.kept, [])
})
