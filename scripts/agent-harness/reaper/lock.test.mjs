#!/usr/bin/env node
// ---------------------------------------------------------------------------
// lock — one killing reaper at a time: two runs that find the same stale
// lock never both take it, a release removes only the lock its own run
// wrote, and a guard left by a reaper that died is cleared for the next run.
// Each race is driven, not waited: an injected fs runs the other reaper at
// the exact step where the race opens, and an injected clock ages a lock.
// One case runs two real node processes, one step after the other. Every
// lock sits in a scratch folder of its own under the OS temp directory,
// removed when the suite ends.
//
// Usage:
//   node --test scripts/agent-harness/reaper/lock.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import * as nodeFs from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { takeLock } from './lock.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const LOCK_MODULE = pathToFileURL(join(HERE, 'lock.mjs')).href
const STALE_SECONDS = 31
const STALE_MS = STALE_SECONDS * 1000
const GUARD_SUFFIX = '.guard'

const scratch = nodeFs.mkdtempSync(join(tmpdir(), 'reaper-lock-test-'))
after(() => nodeFs.rmSync(scratch, { force: true, recursive: true }))
let lockCount = 0
const freshLockPath = () => {
  lockCount += 1
  return join(scratch, `reap-${lockCount}.lock`)
}

const read = ({ path }) =>
  nodeFs.existsSync(path) ? nodeFs.readFileSync(path, 'utf8') : null

// A file written `STALE_SECONDS` ago, as a reaper that died leaves it.
const writeStale = ({ path, text }) => {
  nodeFs.writeFileSync(path, text)
  const then = Date.now() / 1000 - STALE_SECONDS
  nodeFs.utimesSync(path, then, then)
}

const tokenOf = ({ token }) => () => token

// The real fs, except that the first statSync of `path` runs `onStat` right
// after it read the file's age, before the caller acts on it.
const racingFs = ({ onStat, path }) => {
  let fired = false
  return {
    ...nodeFs,
    statSync: (target, ...rest) => {
      const stats = nodeFs.statSync(target, ...rest)
      if (target === path && !fired) {
        fired = true
        onStat()
      }
      return stats
    }
  }
}

// The real fs, numbering every call; before call N it runs `steps[N]`.
const steppedFs = ({ steps }) => {
  let call = 0
  const step = (name) => (...args) => {
    call += 1
    steps[call]?.()
    return nodeFs[name](...args)
  }
  return {
    ...nodeFs,
    readFileSync: step('readFileSync'),
    rmSync: step('rmSync'),
    statSync: step('statSync'),
    writeFileSync: step('writeFileSync')
  }
}

test('a lock released and re-created during a takeover is never held twice', () => {
  const path = freshLockPath()
  const owner = takeLock({ path, token: tokenOf({ token: 'token-a' }) })
  assert.notEqual(owner, null)
  let other = null
  // The owner releases right after this run found its lock, and another
  // run creates a fresh one three calls later.
  const fs = steppedFs({
    steps: {
      2: () => owner.release(),
      5: () => {
        other = takeLock({ path, token: tokenOf({ token: 'token-c' }) })
      }
    }
  })
  const first = takeLock({ fs, path, token: tokenOf({ token: 'token-b' }) })
  assert.ok(first === null || other === null, 'two runs hold the lock at once')
  if (first !== null) assert.match(read({ path }), /token-b/u)
  if (other !== null) assert.match(read({ path }), /token-c/u)
  const holder = first ?? other
  holder?.release()
})

test('two runs that find the same stale lock never both take it', () => {
  const path = freshLockPath()
  writeStale({ path, text: '4242\n' })
  let second = null
  // The second run takes the lock over right after the first read it as
  // stale.
  const fs = racingFs({
    onStat: () => {
      second = takeLock({ path, token: tokenOf({ token: 'token-b' }) })
    },
    path
  })
  const first = takeLock({ fs, path, token: tokenOf({ token: 'token-a' }) })
  assert.notEqual(second, null, 'the second run takes the stale lock')
  assert.equal(first, null, 'the first run takes nothing')
  assert.match(read({ path }), /token-b/u)
  assert.equal(read({ path: `${path}${GUARD_SUFFIX}` }), null, 'no guard is left behind')
  second.release()
  assert.equal(read({ path }), null)
})

test('a release leaves a lock a later run took over', () => {
  const path = freshLockPath()
  const first = takeLock({ path, token: tokenOf({ token: 'token-a' }) })
  assert.notEqual(first, null)
  // 31 s later the first run looks dead, and a later run takes over.
  const later = takeLock({
    now: () => Date.now() + STALE_MS,
    path,
    token: tokenOf({ token: 'token-b' })
  })
  assert.notEqual(later, null)
  first.release()
  assert.match(read({ path }), /token-b/u, "the later run's lock stays")
  later.release()
  assert.equal(read({ path }), null, 'its own release removes it')
})

test('a guard left by a reaper that died is removed, and the next run takes the lock', () => {
  const path = freshLockPath()
  const guard = `${path}${GUARD_SUFFIX}`
  writeStale({ path, text: '4242\n' })
  writeStale({ path: guard, text: '4343\ndead-guard\n' })
  assert.equal(takeLock({ path, token: tokenOf({ token: 'token-a' }) }), null)
  assert.equal(read({ path: guard }), null, 'the stale guard is gone')
  assert.equal(read({ path }), '4242\n', 'that run took nothing')
  const next = takeLock({ path, token: tokenOf({ token: 'token-b' }) })
  assert.notEqual(next, null, 'the next run takes the lock')
  assert.match(read({ path }), /token-b/u)
  assert.equal(read({ path: guard }), null)
  next.release()
})

test('a stale guard is removed only while it holds what the run read', () => {
  const path = freshLockPath()
  const guard = `${path}${GUARD_SUFFIX}`
  writeStale({ path, text: '4242\n' })
  writeStale({ path: guard, text: '4343\ndead-guard\n' })
  // Right after this run read the guard's age, another run cleared it and
  // wrote its own.
  const fs = racingFs({
    onStat: () => nodeFs.writeFileSync(guard, '4444\nguard-c\n'),
    path: guard
  })
  assert.equal(takeLock({ fs, path, token: tokenOf({ token: 'token-a' }) }), null)
  assert.equal(read({ path: guard }), '4444\nguard-c\n', "the other run's guard stays")
  assert.equal(read({ path }), '4242\n', 'this run took nothing')
})

// A node process that takes the lock with `token`, prints `held` or
// `locked`, then releases when its stdin gets a line, and prints `released`.
const HOLDER = `
const [url, path, token] = process.argv.slice(1)
const { takeLock } = await import(url)
const lock = takeLock({ path, token: () => token })
console.log(lock === null ? 'locked' : 'held')
if (process.argv.includes('--release-on-input')) {
  process.stdin.once('data', () => {
    lock?.release()
    console.log('released')
    process.exit(0)
  })
}
`
const holderArgs = ({ path, token }) => [
  '--input-type=module',
  '-e',
  HOLDER,
  LOCK_MODULE,
  path,
  token
]

const firstLine = ({ child }) =>
  new Promise((resolve, reject) => {
    child.stdout.setEncoding('utf8')
    child.stdout.once('data', (chunk) => resolve(chunk.trim()))
    child.once('error', reject)
  })

test('a reaper process that releases late leaves the lock another process took over', async () => {
  const path = freshLockPath()
  const first = spawn(
    process.execPath,
    [...holderArgs({ path, token: 'token-a' }), '--release-on-input'],
    { stdio: ['pipe', 'pipe', 'inherit'] }
  )
  assert.equal(await firstLine({ child: first }), 'held')
  // The first process outlives the stale age; a second one takes over.
  const then = Date.now() / 1000 - STALE_SECONDS
  nodeFs.utimesSync(path, then, then)
  const second = spawnSync(process.execPath, holderArgs({ path, token: 'token-b' }), {
    encoding: 'utf8'
  })
  assert.equal(second.stdout.trim(), 'held', second.stderr)
  const exited = new Promise((resolve) => first.once('exit', resolve))
  first.stdin.end('release\n')
  assert.equal(await exited, 0)
  assert.match(read({ path }), /token-b/u, "the second process's lock stays")
})
