#!/usr/bin/env node
// ---------------------------------------------------------------------------
// lock — one killing reaper at a time: a lock is taken over only once its
// holder has ended or after an hour, two runs that find the same lock never
// both take it, a release removes only the lock its own run wrote, and a
// guard left by a reaper that died is cleared for the next run. Each race is
// driven, not waited: an injected fs runs the other reaper at the exact step
// where the race opens, an injected clock ages a lock and an injected
// reading says whether a holder runs. One case runs two real node processes,
// one step after the other. Every lock sits in a scratch folder of its own
// under the OS temp directory, removed when the suite ends.
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

import { holderRuns, takeLock } from './lock.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const LOCK_MODULE = pathToFileURL(join(HERE, 'lock.mjs')).href
const MS_PER_SECOND = 1000
const STALLED_SECONDS = 31
const PAST_AN_HOUR_SECONDS = 3660
const PAST_AN_HOUR_MS = PAST_AN_HOUR_SECONDS * MS_PER_SECOND
const GUARD_SUFFIX = '.guard'
const ESRCH = 'ESRCH'
const EPERM = 'EPERM'
const RUNS = () => true
const ENDED = () => false

const scratch = nodeFs.mkdtempSync(join(tmpdir(), 'reaper-lock-test-'))
after(() => nodeFs.rmSync(scratch, { recursive: true }))
let lockCount = 0
const freshLockPath = () => {
  lockCount += 1
  return join(scratch, `reap-${lockCount}.lock`)
}

const read = ({ path }) =>
  nodeFs.existsSync(path) ? nodeFs.readFileSync(path, 'utf8') : null

// A file written `seconds` ago.
const writeAged = ({ path, seconds = STALLED_SECONDS, text }) => {
  nodeFs.writeFileSync(path, text)
  const then = Date.now() / MS_PER_SECOND - seconds
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

test("two runs that find the same lock's holder ended never both take it", () => {
  const path = freshLockPath()
  writeAged({ path, text: '4242\n' })
  let second = null
  // The second run takes the lock over right after the first read its
  // holder as ended.
  const fs = racingFs({
    onStat: () => {
      second = takeLock({
        holderRunning: ENDED,
        path,
        token: tokenOf({ token: 'token-b' })
      })
    },
    path
  })
  const first = takeLock({
    fs,
    holderRunning: ENDED,
    path,
    token: tokenOf({ token: 'token-a' })
  })
  assert.notEqual(second, null, 'the second run takes the lock')
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
  // An hour later the first run's lock is old enough to be taken over,
  // although its pid still runs.
  const later = takeLock({
    now: () => Date.now() + PAST_AN_HOUR_MS,
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
  writeAged({ path, text: '4242\n' })
  writeAged({ path: guard, text: '4343\ndead-guard\n' })
  assert.equal(
    takeLock({ holderRunning: ENDED, path, token: tokenOf({ token: 'token-a' }) }),
    null
  )
  assert.equal(read({ path: guard }), null, 'the dead guard is gone')
  assert.equal(read({ path }), '4242\n', 'that run took nothing')
  const next = takeLock({
    holderRunning: ENDED,
    path,
    token: tokenOf({ token: 'token-b' })
  })
  assert.notEqual(next, null, 'the next run takes the lock')
  assert.match(read({ path }), /token-b/u)
  assert.equal(read({ path: guard }), null)
  next.release()
})

test('a guard whose holder ended is removed only while it holds what the run read', () => {
  const path = freshLockPath()
  const guard = `${path}${GUARD_SUFFIX}`
  writeAged({ path, text: '4242\n' })
  writeAged({ path: guard, text: '4343\ndead-guard\n' })
  // Right after this run read the guard's age, another run cleared it and
  // wrote its own.
  const fs = racingFs({
    onStat: () => nodeFs.writeFileSync(guard, '4444\nguard-c\n'),
    path: guard
  })
  assert.equal(
    takeLock({ fs, holderRunning: ENDED, path, token: tokenOf({ token: 'token-a' }) }),
    null
  )
  assert.equal(read({ path: guard }), '4444\nguard-c\n', "the other run's guard stays")
  assert.equal(read({ path }), '4242\n', 'this run took nothing')
})

test('a lock whose holder still runs is not taken over before an hour, however long its run stalls', () => {
  const path = freshLockPath()
  writeAged({ path, text: 'other\nreaper\n' })
  assert.equal(
    takeLock({ holderRunning: RUNS, path, token: tokenOf({ token: 'token-b' }) }),
    null
  )
  assert.equal(read({ path }), 'other\nreaper\n')
})

test('a lock held for over an hour is taken over even when a process holds its pid', () => {
  const path = freshLockPath()
  writeAged({ path, seconds: PAST_AN_HOUR_SECONDS, text: 'other\nreaper\n' })
  const lock = takeLock({
    holderRunning: RUNS,
    path,
    token: tokenOf({ token: 'token-a' })
  })
  assert.notEqual(lock, null)
  assert.match(read({ path }), /token-a/u)
  lock.release()
})

test('a run that finds a takeover under way by a holder that runs takes nothing and leaves the lock', () => {
  const path = freshLockPath()
  const guard = `${path}${GUARD_SUFFIX}`
  nodeFs.writeFileSync(path, '4242\nreaper\n')
  nodeFs.writeFileSync(guard, '4343\nguard\n')
  const onlyTheLockEnded = ({ text }) => text !== '4343\nguard\n'
  assert.equal(
    takeLock({
      holderRunning: onlyTheLockEnded,
      path,
      token: tokenOf({ token: 'token-b' })
    }),
    null
  )
  assert.equal(read({ path }), '4242\nreaper\n')
  assert.equal(read({ path: guard }), '4343\nguard\n')
})

test('a holder is read as running from the pid its lock names, and a lock without one as running', () => {
  const ended = spawnSync(process.execPath, ['-e', '']).pid
  const refused = () => {
    throw Object.assign(new Error('not allowed'), { code: EPERM })
  }
  const gone = () => {
    throw Object.assign(new Error('no such process'), { code: ESRCH })
  }
  assert.equal(holderRuns({ text: `${process.pid}\nx\n` }), true)
  assert.equal(holderRuns({ text: `${ended}\nx\n` }), false)
  assert.equal(holderRuns({ kill: gone, text: '4242\nx\n' }), false)
  assert.equal(holderRuns({ kill: refused, text: '4242\nx\n' }), true)
  assert.equal(holderRuns({ text: 'no-pid\n' }), true)
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
  // The first process still runs, but its lock is over an hour old; a
  // second one takes over.
  const then = Date.now() / MS_PER_SECOND - PAST_AN_HOUR_SECONDS
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
