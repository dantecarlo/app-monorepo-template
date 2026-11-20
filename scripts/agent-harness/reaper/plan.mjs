// ---------------------------------------------------------------------------
// plan — the pure core of the reaper. It takes the process list as data and
// decides which trees to end; it spawns, reads and signals nothing.
//
// A process is { bytes, command, name, pid, ppid, startMs }, `startMs` null
// when the listing reads no start time. A parent HOLDS a child when the
// child's parent pid names it and it started no later than the child; a
// newer process under that pid holds a reused pid, not the child. An ORPHAN
// is a process no parent holds; on POSIX also one under pid 1 or the
// user's subreaper, which adopt what a dead parent leaves. A start time the
// listing cannot read, the parent's or the child's, holds the child.
//
// A process is matched by its ENTRY, never by text anywhere in its command
// line: its own executable, and for an interpreter (node, python) the
// script it runs, its first argument that is not a flag (`-m <module>` for
// python), with the arguments after it. A candidate is an orphan whose
// entry matches a family of the contract, with its whole descendant tree. A
// wrapper family (a console, a POSIX shell, the npx launcher) makes an
// orphan a candidate only when, its childless wrappers aside, it has one
// child and that child is reapable. A candidate tree that holds the reaper
// or one of its ancestors, a process the contract spares, or a process
// younger than the grace period or of an unreadable age, is kept with its
// reason.
// ---------------------------------------------------------------------------

import { posix } from 'node:path'

const WINDOWS = 'win32'
const INIT_PID = 1
// The processes POSIX reparents an orphan to besides pid 1: a user's
// systemd and the init of a WSL session.
const SUBREAPERS = [/^(?:\S*\/)?systemd\s+--user\b/u, /^\/init\b/u]
const MS_PER_SECOND = 1000
const BYTES_PER_MB = 1_048_576

// The interpreters whose script is part of the entry, and their flags that
// take the next argument as their value, run inline code, or name a module.
const INTERPRETER = /(?:^|\/)(?:node(?:js)?|python[\d.]*w?)(?:\.exe)?$/iu
const VALUE_FLAGS = new Set([
  '-C',
  '-W',
  '-X',
  '-r',
  '--conditions',
  '--experimental-loader',
  '--import',
  '--loader',
  '--require'
])
const INLINE_FLAGS = new Set(['-c', '-e', '-p', '--eval', '--print'])
const MODULE_FLAG = '-m'
// One argument of a command line: a double-quoted run, or a run of
// anything but whitespace.
const ARGUMENT = /"([^"]*)"|(\S+)/gu

export const KEPT = Object.freeze({
  AGELESS: 'a process in it has a start time the listing cannot read',
  ANCESTRY: 'it holds the reaper or one of its ancestors',
  SPARED: 'it holds a process the contract spares',
  YOUNG: 'a process in it is younger than the grace period'
})

const normalized = ({ path }) => posix.normalize(path.replaceAll('\\', '/'))

const argumentsOf = ({ text }) =>
  [...text.matchAll(ARGUMENT)].map(([, quoted, bare]) => quoted ?? bare)

// Where an interpreter's script is among `rest`, and where its own
// arguments start: inline code is no script.
const scriptOf = ({ rest }) => {
  let at = 0
  while (at < rest.length) {
    const token = rest[at]
    if (INLINE_FLAGS.has(token)) return { next: at + 2, script: null }
    if (token === MODULE_FLAG) {
      return { next: at + 2, script: rest[at + 1] ?? null }
    }
    if (VALUE_FLAGS.has(token)) at += 2
    else if (token.startsWith('-')) at += 1
    else return { next: at + 1, script: normalized({ path: token }) }
  }
  return { next: rest.length, script: null }
}

/**
 * The entry a family is matched by: `exe`, the executable path with forward
 * slashes; `script`, the script an interpreter runs, or null; `args`, the
 * arguments after the script (after the executable for anything else); and
 * `label`, the name a report gives it. A process whose listing reads no
 * command line is its name.
 */
export const entryOf = ({ process }) => {
  const text = process.command.trim()
  const parts = text === '' ? [] : argumentsOf({ text })
  const exe = normalized({ path: parts[0] ?? process.name })
  const rest = parts.slice(1)
  if (!INTERPRETER.test(exe)) {
    return { args: rest.join(' '), exe, label: posix.basename(exe), script: null }
  }
  const { next, script } = scriptOf({ rest })
  return {
    args: rest.slice(next).join(' '),
    exe,
    label: posix.basename(script ?? exe),
    script
  }
}

const matchesOne = ({ entry, rule }) =>
  rule.exe.test(entry.exe) &&
  (rule.script === undefined ||
    (entry.script !== null && rule.script.test(entry.script))) &&
  (rule.args === undefined || rule.args.test(entry.args))

const matchesAny = ({ entry, family }) =>
  family.match.some((rule) => matchesOne({ entry, rule }))

/** The first family, a wrapper included, whose match the process's entry meets. */
export const familyOf = ({ contract, entry, process }) => {
  const read = entry ?? entryOf({ process })
  return contract.families.find((family) => matchesAny({ entry: read, family }))
}

/** The spare entry the process's entry meets, or undefined. */
export const spareOf = ({ contract, entry, process }) => {
  const read = entry ?? entryOf({ process })
  return (contract.spare ?? []).find((family) =>
    matchesAny({ entry: read, family })
  )
}

const holds = ({ child, parent }) =>
  parent !== undefined &&
  parent.pid !== child.pid &&
  (parent.startMs === null ||
    child.startMs === null ||
    parent.startMs <= child.startMs)

const toMb = ({ bytes }) => Math.round(bytes / BYTES_PER_MB)

// The listing indexed: each process by pid with its entry, the parent that
// holds it, and the children each one holds, in listing order.
const indexOf = ({ processes }) => {
  const byPid = new Map(processes.map((process) => [process.pid, process]))
  const entries = new Map(
    processes.map((process) => [process.pid, entryOf({ process })])
  )
  const parentOf = new Map()
  const childrenOf = new Map(processes.map(({ pid }) => [pid, []]))
  processes.forEach((process) => {
    const parent = byPid.get(process.ppid)
    if (holds({ child: process, parent })) {
      parentOf.set(process.pid, parent)
      childrenOf.get(parent.pid).push(process)
    }
  })
  return { byPid, childrenOf, entries, parentOf }
}

const isOrphan = ({ index, platform, process }) => {
  const parent = index.parentOf.get(process.pid)
  if (parent === undefined) return true
  if (platform === WINDOWS) return false
  return (
    parent.pid === INIT_PID ||
    SUBREAPERS.some((pattern) => pattern.test(parent.command))
  )
}

const isWrapper = ({ families, index, process }) =>
  families.some(
    (family) =>
      family.wrapper &&
      matchesAny({ entry: index.entries.get(process.pid), family })
  )

const familyByEntry = ({ families, index, process }) =>
  families.find(
    (family) =>
      !family.wrapper &&
      matchesAny({ entry: index.entries.get(process.pid), family })
  )

// The family a process is reapable under, or undefined: a wrapper by what
// it wraps, anything else by its entry.
const reapableFamily = ({ families, index, process, seen = new Set() }) => {
  if (!isWrapper({ families, index, process })) {
    return familyByEntry({ families, index, process })
  }
  if (seen.has(process.pid)) return undefined
  seen.add(process.pid)
  const wrapped = index.childrenOf
    .get(process.pid)
    .filter(
      (child) =>
        !isWrapper({ families, index, process: child }) ||
        index.childrenOf.get(child.pid).length > 0
    )
  return wrapped.length === 1
    ? reapableFamily({ families, index, process: wrapped[0], seen })
    : undefined
}

const treeOf = ({ index, root }) => {
  const tree = []
  const queue = [root]
  while (queue.length > 0) {
    const process = queue.shift()
    if (tree.includes(process)) continue
    tree.push(process)
    queue.push(...index.childrenOf.get(process.pid))
  }
  return tree
}

// The reaper and every ancestor that holds it.
const ancestryOf = ({ index, selfPid }) => {
  const pids = new Set()
  let process = index.byPid.get(selfPid)
  while (process !== undefined && !pids.has(process.pid)) {
    pids.add(process.pid)
    process = index.parentOf.get(process.pid)
  }
  pids.add(selfPid)
  return pids
}

const keptReason = ({ ancestry, contract, graceMs, index, now, tree }) => {
  if (tree.some(({ pid }) => ancestry.has(pid))) return KEPT.ANCESTRY
  const spared = tree
    .map(({ pid }) => spareOf({ contract, entry: index.entries.get(pid) }))
    .find(Boolean)
  if (spared) return `${KEPT.SPARED} (${spared.id})`
  if (tree.some(({ startMs }) => startMs === null)) return KEPT.AGELESS
  return tree.some(({ startMs }) => now - startMs < graceMs)
    ? KEPT.YOUNG
    : null
}

/**
 * The trees to end and the trees kept, from `processes` listed at `now`.
 * Each candidate names its root pid and start time, its family, the wrapper
 * it came through (`via`, or null), its age in seconds, every pid of its
 * tree, its memory in MB, and `strayChild`: whether a process outside the
 * tree names one of its pids as its parent, an older process left by an
 * earlier holder of that pid, which a platform tree kill could reach.
 * Candidates come largest first; `totalMb` is their sum.
 */
export const planReap = ({ contract, now, platform, processes, selfPid }) => {
  const { families, graceSeconds } = contract
  const index = indexOf({ processes })
  const ancestry = ancestryOf({ index, selfPid })
  const candidates = []
  const kept = []
  processes.forEach((root) => {
    if (!isOrphan({ index, platform, process: root })) return
    const family = reapableFamily({ families, index, process: root })
    if (family === undefined) return
    const tree = treeOf({ index, root })
    const reason = keptReason({
      ancestry,
      contract,
      graceMs: graceSeconds * MS_PER_SECOND,
      index,
      now,
      tree
    })
    if (reason !== null) {
      kept.push({ family: family.id, pid: root.pid, reason })
      return
    }
    const pids = tree.map(({ pid }) => pid)
    const inTree = new Set(pids)
    candidates.push({
      ageSeconds: Math.floor((now - root.startMs) / MS_PER_SECOND),
      bytes: tree.reduce((sum, { bytes }) => sum + (bytes ?? 0), 0),
      family: family.id,
      pid: root.pid,
      pids: pids.sort((a, b) => a - b),
      startMs: root.startMs,
      strayChild: processes.some(
        ({ pid, ppid }) => !inTree.has(pid) && inTree.has(ppid)
      ),
      via: isWrapper({ families, index, process: root })
        ? index.entries.get(root.pid).label
        : null
    })
  })
  candidates.sort((a, b) => b.bytes - a.bytes || a.pid - b.pid)
  kept.sort((a, b) => a.pid - b.pid)
  const totalBytes = candidates.reduce((sum, { bytes }) => sum + bytes, 0)
  return {
    candidates: candidates.map(({ bytes, ...rest }) => ({
      ...rest,
      mb: toMb({ bytes })
    })),
    kept,
    totalMb: toMb({ bytes: totalBytes })
  }
}
