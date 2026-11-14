import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'

import { signalProcessTree, TREE_SPAWN_OPTIONS } from './process-tree.mjs'

const IS_WINDOWS = process.platform === 'win32'
const POLL_MS = 100
const ENDED_WITHIN_MS = 10_000

// A parent that starts a long-lived child, prints the child's pid, then waits.
const PARENT_SOURCE = [
  "const { spawn } = require('node:child_process')",
  "const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' })",
  'console.log(child.pid)',
  'setInterval(() => {}, 1000)'
].join('\n')

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

const startTree = async () => {
  const parent = spawn(process.execPath, ['-e', PARENT_SOURCE], {
    ...TREE_SPAWN_OPTIONS,
    stdio: ['ignore', 'pipe', 'ignore']
  })
  const [chunk] = await once(parent.stdout, 'data')
  return { childPid: Number(String(chunk).trim()), parent }
}

test('the spawn options detach the child on POSIX only, and cannot be changed', () => {
  assert.deepEqual(TREE_SPAWN_OPTIONS, { detached: !IS_WINDOWS })
  assert.equal(Object.isFrozen(TREE_SPAWN_OPTIONS), true)
})

test('signalProcessTree ends a child and the process it started', async () => {
  const { childPid, parent } = await startTree()
  assert.equal(isRunning({ pid: childPid }), true)

  const signalled = signalProcessTree({
    child: parent,
    signal: 'SIGTERM',
    wait: true
  })

  assert.equal(signalled, true)
  assert.equal(await endedWithin({ pids: [parent.pid, childPid] }), true)
})

test('a tree that already ended counts as ended', async () => {
  const { childPid, parent } = await startTree()
  signalProcessTree({ child: parent, signal: 'SIGTERM', wait: true })
  assert.equal(await endedWithin({ pids: [parent.pid, childPid] }), true)

  assert.equal(
    signalProcessTree({ child: parent, signal: 'SIGTERM', wait: true }),
    true
  )
})

test('a child that never started has nothing to end', () => {
  assert.equal(
    signalProcessTree({
      child: { pid: undefined },
      signal: 'SIGTERM',
      wait: true
    }),
    true
  )
})
