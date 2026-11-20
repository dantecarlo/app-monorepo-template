#!/usr/bin/env node
// ---------------------------------------------------------------------------
// bounded-child — `runBounded` runs a command with a time bound and, at the
// bound, ends the child's whole tree. The bound itself is driven by an
// injected child; the real tree runs on Windows only, where a killed parent
// leaves its children running.
//
// Usage:
//   node --test scripts/agent-harness/reaper/bounded-child.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'

import { runBounded } from './bounded-child.mjs'

const IS_WINDOWS = process.platform === 'win32'
const POLL_MS = 100
const ENDED_WITHIN_MS = 10_000
const SHORT_BOUND_MS = 50
const TREE_BOUND_MS = 3000

const isRunning = ({ pid }) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code === 'EPERM'
  }
}

const endedWithin = async ({ pids }) => {
  for (let waited = 0; waited < ENDED_WITHIN_MS; waited += POLL_MS) {
    if (pids.every((pid) => !isRunning({ pid }))) return true
    await sleep(POLL_MS)
  }
  return false
}

// A child that never ends on its own.
const hangingChild = () =>
  Object.assign(new EventEmitter(), {
    pid: 4242,
    stderr: new PassThrough(),
    stdout: new PassThrough(),
    unref: () => {}
  })

test('a child that finishes inside its bound returns its output and exit code', async () => {
  const result = await runBounded({
    args: [
      '-e',
      "process.stdout.write('out'); process.stderr.write('err'); process.exitCode = 3"
    ],
    command: process.execPath,
    timeoutMs: ENDED_WITHIN_MS
  })
  const { code, pid, stderr, stdout, timedOut } = result
  assert.deepEqual(
    { code, stderr, stdout, timedOut },
    { code: 3, stderr: 'err', stdout: 'out', timedOut: false }
  )
  assert.ok(Number.isInteger(pid))
})

test('a child that outlasts its bound has its tree ended and reads as timed out', async () => {
  const child = hangingChild()
  const ended = []
  const spawned = []
  const result = await runBounded({
    args: ['fetch'],
    command: 'git',
    cwd: '/repo',
    endTree: (call) => {
      ended.push(call)
      return true
    },
    env: { A: '1' },
    spawn: (command, args, options) => {
      spawned.push({ args, command, options })
      child.stdout.write('partial')
      return child
    },
    timeoutMs: SHORT_BOUND_MS
  })
  assert.equal(result.timedOut, true)
  assert.equal(result.code, null)
  assert.deepEqual(ended, [{ child, signal: 'SIGTERM', wait: true }])
  assert.ok(child.stdout.destroyed && child.stderr.destroyed)
  assert.equal(spawned.length, 1)
  assert.equal(spawned[0].command, 'git')
  assert.deepEqual(spawned[0].args, ['fetch'])
  assert.equal(spawned[0].options.cwd, '/repo')
  assert.deepEqual(spawned[0].options.env, { A: '1' })
  assert.deepEqual(spawned[0].options.stdio, ['ignore', 'pipe', 'pipe'])
  assert.equal(spawned[0].options.windowsHide, true)
})

test('a command that cannot start resolves with its error', async () => {
  const result = await runBounded({
    args: [],
    command: 'reaper-test-no-such-command',
    timeoutMs: ENDED_WITHIN_MS
  })
  assert.equal(result.timedOut, false)
  assert.equal(result.code, null)
  assert.equal(result.error?.code, 'ENOENT')
})

// A parent that starts a long-lived child, prints the child's pid, waits.
const PARENT_SOURCE = [
  "const { spawn } = require('node:child_process')",
  "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })",
  'console.log(child.pid)',
  'setInterval(() => {}, 1000)'
].join('\n')

test(
  'on Windows a child stopped at its bound takes the process it started with it',
  { skip: !IS_WINDOWS && 'a POSIX child keeps its signal alone, as before' },
  async () => {
    let pids = []
    try {
      const result = await runBounded({
        args: ['-e', PARENT_SOURCE],
        command: process.execPath,
        timeoutMs: TREE_BOUND_MS
      })
      const grandchild = Number(result.stdout.trim())
      assert.ok(Number.isInteger(grandchild) && grandchild > 0, result.stdout)
      pids = [result.pid, grandchild]
      assert.equal(result.timedOut, true)
      assert.equal(await endedWithin({ pids }), true)
    } finally {
      pids.filter((pid) => isRunning({ pid })).forEach((pid) => process.kill(pid))
    }
  }
)
