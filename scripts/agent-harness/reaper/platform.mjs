// ---------------------------------------------------------------------------
// platform — the reaper's thin adapter: it lists the processes and ends the
// trees the core (plan.mjs) decided on. Every command runs through
// `runBounded`, its spawn injected by tests.
//
// Windows lists with `Get-CimInstance Win32_Process` through powershell, as
// JSON, and ends a tree with `taskkill /PID <pid> /T /F`. When an older
// process outside the tree names one of its pids as its parent (it was
// started by an earlier holder of that pid), the tree is ended pid by pid,
// `taskkill /F /PID <a> /PID <b>…` with no `/T`, so the platform's own tree
// walk cannot reach that stranger. POSIX lists with `ps` under the C
// locale. A process's age and its order against its parent come from its
// elapsed time, `etime`, which a clock change does not move; its absolute
// `lstart` only names it across listings, as `identityMs`, since a wall
// clock reads one hour twice when it falls back. A tree ends with SIGTERM to
// each of its pids, then, after 2 s, a second listing and SIGKILL only to
// each pid still listed with the identity the plan read, never to a pid a
// newer process took; one wait and one listing serve every tree. When that
// listing fails, returns no process or the bound has run out, it sends no
// SIGKILL and reports each tree as not ended.
// ---------------------------------------------------------------------------

import { basename } from 'node:path'

import { runBounded } from './bounded-child.mjs'

const WINDOWS = 'win32'
const MS_PER_SECOND = 1000
const BYTES_PER_KB = 1024
const KILL_WAIT_MS = 2000
const SECONDS = Object.freeze({ day: 86_400, hour: 3600, minute: 60 })
// taskkill's exit code when no process has the pid: it already ended.
const TASKKILL_NOT_FOUND = 128
const NO_SUCH_PROCESS = 'ESRCH'

const CIM_SCRIPT =
  '[Console]::OutputEncoding = [Text.Encoding]::UTF8; ' +
  'Get-CimInstance Win32_Process | Select ProcessId,ParentProcessId,Name,' +
  'CommandLine,CreationDate,WorkingSetSize | ConvertTo-Json -Compress'

// `etime` is the time since the start, `[[dd-]hh:]mm:ss`, which every
// POSIX ps prints; `lstart` is the absolute start time, which reads the same
// in every listing and, under the C locale, is always
// `Wed Nov 25 12:03:39 2026`.
const POSIX_LOCALE = 'C'
const LISTING = Object.freeze({
  posix: { args: ['-eo', 'pid=,ppid=,etime=,lstart=,rss=,args='], command: 'ps' },
  windows: {
    args: ['-NoProfile', '-NonInteractive', '-Command', CIM_SCRIPT],
    command: 'powershell'
  }
})

// PowerShell 5.1 writes a date as "/Date(<ms>)/", PowerShell 7 as ISO text.
const DOTNET_DATE = /^\/Date\((-?\d+)\)\/$/u
// pid, ppid, etime, the five words of lstart, rss, then the command line.
const PS_LINE =
  /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\S+\s+\S+\s+\d+\s+[\d:]+\s+\d+)\s+(\d+)\s+(.*)$/u
const ETIME = /^(?:(?:(\d+)-)?(\d+):)?(\d+):(\d+)$/u
const LSTART =
  /^(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat)\s+([A-Z][a-z]{2})\s+(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\s+(\d{4})$/u
const MONTHS = Object.freeze([
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
])

// A Windows start time is absolute and in UTC: it is both the age and the
// identity.
const identified = ({ startMs }) => ({ identityMs: startMs, startMs })

const startOf = ({ value }) => {
  if (typeof value !== 'string') return null
  const dotnet = DOTNET_DATE.exec(value)
  if (dotnet) return Number(dotnet[1])
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

const parseWindows = ({ text }) => {
  if (text.trim() === '') return []
  const parsed = JSON.parse(text)
  return (Array.isArray(parsed) ? parsed : [parsed]).map((row) => ({
    bytes: Number(row.WorkingSetSize) || 0,
    command: typeof row.CommandLine === 'string' ? row.CommandLine : '',
    name: String(row.Name ?? ''),
    pid: Number(row.ProcessId),
    ppid: Number(row.ParentProcessId),
    ...identified({ startMs: startOf({ value: row.CreationDate }) })
  }))
}

// The epoch milliseconds of an lstart, read as the local time `ps` printed
// it in, or null when it is not one.
const lstartMs = ({ lstart }) => {
  const match = LSTART.exec(lstart)
  if (!match) return null
  const [, month, day, hours, minutes, seconds, year] = match
  const monthIndex = MONTHS.indexOf(month)
  if (monthIndex < 0) return null
  return new Date(
    Number(year),
    monthIndex,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds)
  ).getTime()
}

const elapsedSecondsOf = ({ etime }) => {
  const match = ETIME.exec(etime)
  if (!match) return null
  const [, days = '0', hours = '0', minutes, seconds] = match
  return (
    Number(days) * SECONDS.day +
    Number(hours) * SECONDS.hour +
    Number(minutes) * SECONDS.minute +
    Number(seconds)
  )
}

// The start time, read against `now` from the elapsed time, and the
// identity from lstart; a process either one cannot be read for has a start
// time the listing cannot read.
const parsePosix = ({ now, text }) =>
  text
    .split('\n')
    .map((line) => PS_LINE.exec(line))
    .filter(Boolean)
    .map(([, pid, ppid, etime, lstart, rss, args]) => {
      const elapsed = elapsedSecondsOf({ etime })
      const identityMs = lstartMs({ lstart })
      return {
        bytes: Number(rss) * BYTES_PER_KB,
        command: args.trim(),
        identityMs,
        name: basename(args.trim().split(/\s+/u)[0] ?? ''),
        pid: Number(pid),
        ppid: Number(ppid),
        startMs:
          elapsed === null || identityMs === null
            ? null
            : now - elapsed * MS_PER_SECOND
      }
    })

const failureOf = ({ command, run }) =>
  `${command} exited ${run.code}: ${run.stderr.trim() || 'no output'}`

/**
 * Every process of the machine, as plan.mjs reads them, each with the
 * `identityMs` that names it across listings. `now` is the clock a POSIX
 * elapsed time is read against. A listing that outlasts `timeoutMs` throws
 * with `timedOut`; one that fails or prints what it cannot read throws,
 * naming the command.
 */
export const listProcesses = async ({
  now = Date.now,
  platform,
  spawn,
  timeoutMs
}) => {
  const windows = platform === WINDOWS
  const { args, command } = windows ? LISTING.windows : LISTING.posix
  const env = windows ? undefined : { ...process.env, LC_ALL: POSIX_LOCALE }
  const run = await runBounded({ args, command, env, spawn, timeoutMs })
  if (run.timedOut) {
    throw Object.assign(new Error(`${command} outlasted its bound`), {
      timedOut: true
    })
  }
  if (run.error) throw new Error(`${command} did not start: ${run.error.message}`)
  if (run.code !== 0) throw new Error(failureOf({ command, run }))
  try {
    return windows
      ? parseWindows({ text: run.stdout })
      : parsePosix({ now: now(), text: run.stdout })
  } catch (error) {
    throw new Error(`${command} printed a listing that does not parse: ${error.message}`)
  }
}

const taskkillArgs = ({ candidate }) =>
  candidate.strayChild
    ? ['/F', ...candidate.pids.flatMap((pid) => ['/PID', String(pid)])]
    : ['/PID', String(candidate.pid), '/T', '/F']

const endOnWindows = async ({ candidates, remainingMs, spawn }) => {
  const results = []
  for (const candidate of candidates) {
    const timeoutMs = remainingMs()
    if (timeoutMs <= 0) break
    const run = await runBounded({
      args: taskkillArgs({ candidate }),
      command: 'taskkill',
      spawn,
      timeoutMs
    })
    const ended =
      !run.timedOut &&
      !run.error &&
      (run.code === 0 || run.code === TASKKILL_NOT_FOUND)
    results.push(
      ended
        ? { ended: true, pid: candidate.pid }
        : {
            detail: run.timedOut
              ? 'taskkill outlasted the bound'
              : run.error?.message ?? failureOf({ command: 'taskkill', run }),
            ended: false,
            pid: candidate.pid
          }
    )
  }
  return results
}

// Sends `name` to `pid`: true when it was delivered, false when the
// process is gone; any other refusal throws.
const send = ({ name, pid, signal }) => {
  try {
    signal(pid, name)
    return true
  } catch (error) {
    if (error.code === NO_SUCH_PROCESS) return false
    throw error
  }
}

// The identity of every pid listed again before the SIGKILL, or the
// problem that kept the listing from being read: one that parses to no
// process would read every pid as gone.
const relisted = async ({ platform, remainingMs, spawn }) => {
  const timeoutMs = remainingMs()
  if (timeoutMs <= 0) {
    return { problem: 'the bound ran out before it could list the processes again' }
  }
  try {
    const processes = await listProcesses({ platform, spawn, timeoutMs })
    if (processes.length === 0) {
      return { problem: 'the second listing returned no process' }
    }
    return {
      starts: new Map(processes.map(({ identityMs, pid }) => [pid, identityMs]))
    }
  } catch (error) {
    return { problem: `listing the processes again failed: ${error.message}` }
  }
}

// Whether `pid` is still listed with the identity the plan read: a pid a
// newer process took is not.
const stillHeld = ({ candidate, listed, pid }) => {
  const planned = candidate.starts?.get(pid)
  return (
    typeof planned === 'number' && listed.has(pid) && listed.get(pid) === planned
  )
}

const endOnPosix = async ({
  candidates,
  platform,
  remainingMs,
  signal,
  sleep,
  spawn
}) => {
  const failures = new Map()
  const attempt = ({ candidate, name, pid }) => {
    try {
      return send({ name, pid, signal })
    } catch (error) {
      failures.set(candidate.pid, `${name} to pid ${pid}: ${error.message}`)
      return false
    }
  }
  candidates.forEach((candidate) =>
    candidate.pids.forEach((pid) =>
      attempt({ candidate, name: 'SIGTERM', pid })
    )
  )
  await sleep(Math.max(0, Math.min(KILL_WAIT_MS, remainingMs())))
  const check = await relisted({ platform, remainingMs, spawn })
  candidates.forEach((candidate) => {
    if (check.problem) {
      if (!failures.has(candidate.pid)) {
        failures.set(
          candidate.pid,
          `sent SIGTERM, but ${check.problem}, so it sent no SIGKILL`
        )
      }
      return
    }
    candidate.pids
      .filter((pid) => stillHeld({ candidate, listed: check.starts, pid }))
      .forEach((pid) => attempt({ candidate, name: 'SIGKILL', pid }))
  })
  return candidates.map(({ pid }) =>
    failures.has(pid)
      ? { detail: failures.get(pid), ended: false, pid }
      : { ended: true, pid }
  )
}

const defaultSleep = (ms) => new Promise((done) => setTimeout(done, ms))

/**
 * Ends each candidate tree, in order, while `remainingMs()` is positive;
 * a tree the bound did not reach is left out of the results. A candidate
 * names its `pids` and, in `starts`, the `identityMs` the plan read for
 * each; on POSIX only a pid still listed with that identity gets the
 * SIGKILL.
 * Each result is { ended, pid } with the reason in `detail` when it was not
 * ended.
 */
export const endTrees = ({
  candidates,
  platform,
  remainingMs,
  signal = process.kill.bind(process),
  sleep = defaultSleep,
  spawn
}) =>
  platform === WINDOWS
    ? endOnWindows({ candidates, remainingMs, spawn })
    : endOnPosix({ candidates, platform, remainingMs, signal, sleep, spawn })
