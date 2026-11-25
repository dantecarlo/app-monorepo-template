#!/usr/bin/env node
// ---------------------------------------------------------------------------
// reap — ends the orphaned process trees a dead session leaves behind: its
// MCP servers and their npx launchers, turbo, vitest workers, esbuild, tsc,
// jest workers and git-remote-https, which on Windows outlive the parent
// that started them. What may be ended is the contract
// `.agents/contracts/process-reaper.json`; which trees, plan.mjs decides
// from the process list; how they are listed and ended, platform.mjs.
//
// The default is a dry run: one line per tree it would end (its root pid,
// family, age, process count and MB), one per tree it keeps and why, then
// the total. `--kill` ends them, `--json` prints the plan as one JSON line
// and `--quiet` only the total line. It exits 0 when it finished, with or
// without ends, and 1 on a failure: a listing that fails, a tree it could
// not end, an unknown option. It ends within the contract's bound: a run
// that reaches it ends no tree it had not already decided on, says so and
// exits 1.
//
// A run that ends processes takes the lock of lock.mjs first, and exits 0
// at once when another reaper holds it. Right before the kills it lists the
// processes again, and leaves, with its reason, every tree whose root pid
// is gone or now names a process that started at another time: a tree
// kill would follow a reused pid. Of every other tree it ends only the pids
// still listed with the start time the plan read.
//
// Usage:
//   node scripts/agent-harness/reaper/reap.mjs            (pnpm reap)
//   node scripts/agent-harness/reaper/reap.mjs --kill     (pnpm reap:kill)
//   node scripts/agent-harness/reaper/reap.mjs --json | --quiet
// ---------------------------------------------------------------------------

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadContract } from './contract.mjs'
import { LOCK_PATH, takeLock } from './lock.mjs'
import { planReap } from './plan.mjs'
import { endTrees, listProcesses } from './platform.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const OWN_ROOT = resolve(HERE, '..', '..', '..')

const LABEL = 'reap'
const OPTIONS = ['--dry-run', '--json', '--kill', '--quiet']
const USAGE = 'use --dry-run (the default), --kill, --json or --quiet'
const EXIT = Object.freeze({ FAILED: 1, OK: 0 })
const MS_PER_SECOND = 1000
const SECONDS = Object.freeze({ day: 86_400, hour: 3600, minute: 60 })
const MIN_TIMEOUT_MS = 1

const optionsFrom = ({ argv }) => {
  const unknown = argv.filter((arg) => !OPTIONS.includes(arg))
  if (unknown.length > 0) return { problem: `unknown option ${unknown.join(' ')}` }
  if (argv.includes('--kill') && argv.includes('--dry-run')) {
    return { problem: '--kill and --dry-run exclude each other' }
  }
  return {
    json: argv.includes('--json'),
    kill: argv.includes('--kill'),
    quiet: argv.includes('--quiet')
  }
}

const counted = ({ count, many, one }) =>
  `${count} ${count === 1 ? one : many}`

const treesOf = ({ count }) =>
  count === 0 ? 'no tree' : counted({ count, many: 'trees', one: 'tree' })

const pair = ({ big, small, unitBig, unitSmall }) =>
  small === 0 ? `${big} ${unitBig}` : `${big} ${unitBig} ${small} ${unitSmall}`

export const formatAge = ({ seconds }) => {
  if (seconds < SECONDS.minute) return `${seconds} s`
  if (seconds < SECONDS.hour) return `${Math.floor(seconds / SECONDS.minute)} min`
  if (seconds < SECONDS.day) {
    return pair({
      big: Math.floor(seconds / SECONDS.hour),
      small: Math.floor((seconds % SECONDS.hour) / SECONDS.minute),
      unitBig: 'h',
      unitSmall: 'min'
    })
  }
  return pair({
    big: Math.floor(seconds / SECONDS.day),
    small: Math.floor((seconds % SECONDS.day) / SECONDS.hour),
    unitBig: 'd',
    unitSmall: 'h'
  })
}

const describe = ({ candidate }) =>
  [
    `pid ${candidate.pid}`,
    `${candidate.family}${candidate.via ? ` via ${candidate.via}` : ''}`,
    `${formatAge({ seconds: candidate.ageSeconds })} old`,
    counted({ count: candidate.pids.length, many: 'processes', one: 'process' }),
    `${candidate.mb} MB`
  ].join(', ')

const keptLines = ({ plan }) =>
  plan.kept.map(
    ({ family, pid, reason }) => `${LABEL}: kept pid ${pid}, ${family}: ${reason}`
  )

const planJson = ({ contract, mode, plan }) => ({
  boundSeconds: contract.boundSeconds,
  candidates: plan.candidates,
  graceSeconds: contract.graceSeconds,
  kept: plan.kept,
  mode,
  totalMb: plan.totalMb
})

const reportDryRun = ({ contract, options, plan, stdout }) => {
  if (options.json) {
    stdout(JSON.stringify(planJson({ contract, mode: 'dry-run', plan })))
    return
  }
  if (!options.quiet) {
    plan.candidates.forEach((candidate) =>
      stdout(`${LABEL}: would end ${describe({ candidate })}`)
    )
    keptLines({ plan }).forEach((line) => stdout(line))
  }
  stdout(
    `${LABEL}: dry run: ${treesOf({ count: plan.candidates.length })} to end, ` +
      `${plan.totalMb} MB; pnpm reap:kill ends them`
  )
}

const CHANGED = 'its pid no longer names the process it planned to end'

const reportKill = ({
  changed,
  contract,
  options,
  plan,
  results,
  stderr,
  stdout
}) => {
  const byPid = new Map(results.map((result) => [result.pid, result]))
  const moved = new Set(changed.map(({ pid }) => pid))
  const meant = plan.candidates.filter(({ pid }) => !moved.has(pid))
  const ended = meant.filter(({ pid }) => byPid.get(pid)?.ended)
  const failed = results.filter(({ ended: done }) => !done)
  const left = meant.filter(({ pid }) => !byPid.has(pid))
  const endedMb = ended.reduce((sum, { mb }) => sum + mb, 0)
  failed.forEach(({ detail, pid }) =>
    stderr(`${LABEL}: could not end pid ${pid}: ${detail}`)
  )
  if (options.json) {
    stdout(
      JSON.stringify({
        ...planJson({ contract, mode: 'kill', plan }),
        changed: changed.map(({ pid }) => pid),
        ended: ended.map(({ pid }) => pid),
        failed,
        left: left.map(({ pid }) => pid)
      })
    )
  } else {
    if (!options.quiet) {
      ended.forEach((candidate) =>
        stdout(`${LABEL}: ended ${describe({ candidate })}`)
      )
      changed.forEach(({ family, pid }) =>
        stdout(`${LABEL}: left pid ${pid}, ${family}: ${CHANGED}`)
      )
      keptLines({ plan }).forEach((line) => stdout(line))
    }
    stdout(`${LABEL}: ended ${treesOf({ count: ended.length })}, ${endedMb} MB`)
  }
  if (left.length > 0) {
    stderr(
      `${LABEL}: reached its ${contract.boundSeconds} s bound after ending ` +
        `${ended.length} of ${meant.length} trees; it left ` +
        left.map(({ pid }) => `pid ${pid}`).join(', ')
    )
  }
  return failed.length > 0 || left.length > 0 ? EXIT.FAILED : EXIT.OK
}

const listingFailure = ({ contract, error, when }) =>
  error.timedOut
    ? `${LABEL}: the process listing${when} did not finish within its ` +
      `${contract.boundSeconds} s bound, so nothing was ended`
    : `${LABEL}: ${error.message}; nothing was ended`

// From a listing read again right before the kills: the candidates whose
// root pid still names the process the plan read, each cut to the pids
// still listed with the identity the plan read (`identityMs`, the start
// time that names a process across listings) and carrying those identities
// as `starts`, and the ones whose root pid is gone or names a process that
// started at another time. An identity the listing cannot read never holds.
const sortByIdentity = ({ before, candidates, processes }) => {
  const planned = new Map(before.map(({ identityMs, pid }) => [pid, identityMs]))
  const now = new Map(processes.map(({ identityMs, pid }) => [pid, identityMs]))
  const held = ({ pid }) =>
    typeof planned.get(pid) === 'number' && now.get(pid) === planned.get(pid)
  return {
    changed: candidates.filter((candidate) => !held(candidate)),
    unchanged: candidates.filter(held).map((candidate) => {
      const pids = candidate.pids.filter((pid) => held({ pid }))
      return {
        ...candidate,
        pids,
        starts: new Map(pids.map((pid) => [pid, planned.get(pid)]))
      }
    })
  }
}

// The kill phase, under the lock: the second listing, then the kills of the
// trees whose identity held, `processes` being the listing the plan read.
const killPlanned = async ({
  contract,
  options,
  plan,
  processes,
  run,
  stderr,
  stdout
}) => {
  const report = ({ changed = [], results = [] } = {}) =>
    reportKill({ changed, contract, options, plan, results, stderr, stdout })
  if (plan.candidates.length === 0 || run.remainingMs() <= 0) return report()
  let again
  try {
    again = await listProcesses({
      now: run.now,
      platform: run.platform,
      spawn: run.spawn,
      timeoutMs: Math.max(MIN_TIMEOUT_MS, run.remainingMs())
    })
  } catch (error) {
    stderr(listingFailure({ contract, error, when: ' before the kills' }))
    return EXIT.FAILED
  }
  const { changed, unchanged } = sortByIdentity({
    before: processes,
    candidates: plan.candidates,
    processes: again
  })
  const results =
    unchanged.length === 0 || run.remainingMs() <= 0
      ? []
      : await endTrees({ ...run, candidates: unchanged })
  return report({ changed, results })
}

const lockedOut = ({ lockPath, options, stdout }) => {
  stdout(
    options.json
      ? JSON.stringify({ locked: lockPath, mode: 'kill' })
      : `${LABEL}: another reaper holds ${lockPath}, so this run ends nothing`
  )
  return EXIT.OK
}

/**
 * One run of the reaper over the machine's processes, its options in
 * `argv`. Every effect is injected: `clock`, `lockPath`, `platform`,
 * `selfPid`, `spawn`, `signal` and `sleep` default to the live ones, and
 * `stdout` and `stderr` take one line each. Resolves the exit code.
 */
export const runReaper = async ({
  argv,
  clock = Date.now,
  contract,
  lockPath = LOCK_PATH,
  platform = process.platform,
  selfPid = process.pid,
  signal,
  sleep,
  spawn,
  stderr,
  stdout
}) => {
  const options = optionsFrom({ argv })
  if (options.problem) {
    stderr(`${LABEL}: ${options.problem}; ${USAGE}`)
    return EXIT.FAILED
  }
  let lock = null
  if (options.kill) {
    try {
      lock = takeLock({ path: lockPath })
    } catch (error) {
      stderr(`${LABEL}: cannot take the lock ${lockPath}: ${error.message}`)
      return EXIT.FAILED
    }
    if (lock === null) return lockedOut({ lockPath, options, stdout })
  }
  try {
    const deadline = clock() + contract.boundSeconds * MS_PER_SECOND
    const run = {
      now: clock,
      platform,
      remainingMs: () => deadline - clock(),
      signal,
      sleep,
      spawn
    }
    let processes
    try {
      processes = await listProcesses({
        now: clock,
        platform,
        spawn,
        timeoutMs: Math.max(MIN_TIMEOUT_MS, run.remainingMs())
      })
    } catch (error) {
      stderr(listingFailure({ contract, error, when: '' }))
      return EXIT.FAILED
    }
    const plan = planReap({ contract, now: clock(), platform, processes, selfPid })
    if (!options.kill) {
      reportDryRun({ contract, options, plan, stdout })
      return EXIT.OK
    }
    return await killPlanned({
      contract,
      options,
      plan,
      processes,
      run,
      stderr,
      stdout
    })
  } finally {
    lock?.release()
  }
}

const main = async () => {
  let contract
  try {
    contract = loadContract({ root: OWN_ROOT })
  } catch (error) {
    console.error(`${LABEL}: ${error.message}`)
    process.exitCode = EXIT.FAILED
    return
  }
  // The last word on the bound: whatever still runs then, the process ends.
  setTimeout(() => {
    console.error(
      `${LABEL}: reached its ${contract.boundSeconds} s bound; ` +
        'it ended nothing it had not decided on'
    )
    process.exit(EXIT.FAILED)
  }, contract.boundSeconds * MS_PER_SECOND).unref()
  process.exitCode = await runReaper({
    argv: process.argv.slice(2),
    contract,
    stderr: (line) => console.error(line),
    stdout: (line) => console.log(line)
  })
}

if (import.meta.main) await main()
