// ---------------------------------------------------------------------------
// lock — one killing reaper at a time. Every Claude Code session runs the
// reaper at its start, and several sessions start together, so a run that
// ends processes first creates a lock file under the OS temp directory,
// exclusively, holding its pid and a token unique to that acquisition; a
// run that finds one held exits at once.
//
// A lock is taken over only once its holder has ended: no process runs with
// the pid its first line names. A holder that still runs keeps its lock
// however long its run stalls, so it never resumes into a lock another run
// took, and its release, which removes the lock only while it still holds
// its own token, never removes another run's. A lock older than an hour is
// taken over even when a process runs with its pid. A takeover runs only
// under a guard, `<lock>.guard`, created exclusively beside it, and only
// when the lock can still be taken over under that guard: two runs that both
// read it as takeable never both take it. A guard whose holder ended was
// left by a reaper that died holding it; the run that finds it removes it,
// only while it still holds what that run read, and takes nothing, so the
// next run takes the lock.
// ---------------------------------------------------------------------------

import { randomUUID } from 'node:crypto'
import { readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { removePath } from '@app/tooling/remove-path'

export const LOCK_PATH = join(tmpdir(), 'atl-process-reaper.lock')

const HELD_AT_MOST_MS = 3_600_000
const GUARD_SUFFIX = '.guard'
const ENCODING = 'utf8'
const EXISTS = 'EEXIST'
const GONE = 'ENOENT'
const NO_SUCH_PROCESS = 'ESRCH'
const LEADING_PID = /^(\d+)(?:\n|$)/u
const NODE_FS = Object.freeze({ readFileSync, rmSync, statSync, writeFileSync })

/**
 * Whether the holder the lock `text` names still runs: false only when no
 * process runs with the pid its first line holds. A lock that names no pid,
 * or a pid this process may not signal, reads as running. `kill` is
 * injected by tests.
 */
export const holderRuns = ({ kill = process.kill, text }) => {
  const pid = LEADING_PID.exec(text)?.[1]
  if (pid === undefined) return true
  try {
    kill(Number(pid), 0)
    return true
  } catch (error) {
    return error.code !== NO_SUCH_PROCESS
  }
}

// Creates `path` with `text`, exclusively: false when it already exists.
const create = ({ fs, path, text }) => {
  try {
    fs.writeFileSync(path, text, { flag: 'wx' })
    return true
  } catch (error) {
    if (error.code === EXISTS) return false
    throw error
  }
}

const readOrNull = ({ fs, path }) => {
  try {
    return fs.readFileSync(path, ENCODING)
  } catch (error) {
    if (error.code === GONE) return null
    throw error
  }
}

// Whether the file at `path`, holding `text`, may be taken over: it is gone,
// older than an hour, or its holder ended.
const isTakeable = ({ fs, holderRunning, now, path, text }) => {
  try {
    const age = now() - fs.statSync(path).mtimeMs
    return age > HELD_AT_MOST_MS || !holderRunning({ text })
  } catch (error) {
    if (error.code === GONE) return true
    throw error
  }
}

// Removes `path` only while it still holds `text`. A file another run
// removed after this read is already gone, which is what was asked.
const removeIfHolds = ({ fs, path, text }) => {
  if (readOrNull({ fs, path }) === text) removePath({ fs, path })
}

const heldAt = ({ fs, path, text }) => ({
  release: () => removeIfHolds({ fs, path, text })
})

// A guard a reaper that died left behind is removed, only while it holds
// what this run read of it; a live one is another run's takeover.
const clearDeadGuard = ({ fs, guard, holderRunning, now }) => {
  const seen = readOrNull({ fs, path: guard })
  if (
    seen === null ||
    !isTakeable({ fs, holderRunning, now, path: guard, text: seen })
  ) {
    return
  }
  removeIfHolds({ fs, path: guard, text: seen })
}

// The lock, created exclusively, or null when another run got there first.
const createHeld = ({ fs, path, text }) =>
  create({ fs, path, text }) ? heldAt({ fs, path, text }) : null

// Under the guard, a lock that is gone is created again, never taken over,
// and a takeable one is removed only while it still holds the bytes this run
// read: a lock created since then belongs to another run.
const takeOver = ({ fs, holderRunning, now, path, seen, text }) => {
  const guard = `${path}${GUARD_SUFFIX}`
  if (!create({ fs, path: guard, text })) {
    clearDeadGuard({ fs, guard, holderRunning, now })
    return null
  }
  try {
    const current = readOrNull({ fs, path })
    if (current === null) return createHeld({ fs, path, text })
    if (
      current !== seen ||
      !isTakeable({ fs, holderRunning, now, path, text: current })
    ) {
      return null
    }
    removePath({ fs, path })
    return createHeld({ fs, path, text })
  } finally {
    removeIfHolds({ fs, path: guard, text })
  }
}

/**
 * The lock at `path`, as { release }, or null when another reaper holds it
 * or is taking it over. A lock that is gone by the time it is read is
 * created again; one whose holder ended, or older than an hour, is taken
 * over under its guard; any other failure to read or write it throws. `fs`,
 * `holderRunning`, `now` and `token` are injected by tests.
 */
export const takeLock = ({
  fs = NODE_FS,
  holderRunning = holderRuns,
  now = Date.now,
  path = LOCK_PATH,
  token = randomUUID
} = {}) => {
  const text = `${process.pid}\n${token()}\n`
  if (create({ fs, path, text })) return heldAt({ fs, path, text })
  const seen = readOrNull({ fs, path })
  if (seen === null) return createHeld({ fs, path, text })
  if (!isTakeable({ fs, holderRunning, now, path, text: seen })) return null
  return takeOver({ fs, holderRunning, now, path, seen, text })
}
