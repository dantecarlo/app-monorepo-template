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
// A candidate is an orphan that matches a family of the contract, with its
// whole descendant tree. A wrapper family (cmd.exe, conhost.exe) is read by
// the name alone and makes an orphan a candidate only when, its childless
// wrappers aside, it has one child and that child is reapable. A candidate
// tree that holds the reaper or one of its ancestors, or a process younger
// than the grace period or of an unreadable age, is kept with its reason.
// ---------------------------------------------------------------------------

const WINDOWS = 'win32'
const INIT_PID = 1
// The processes POSIX reparents an orphan to besides pid 1: a user's
// systemd and the init of a WSL session.
const SUBREAPERS = [/^(?:\S*\/)?systemd\s+--user\b/u, /^\/init\b/u]
const MS_PER_SECOND = 1000
const BYTES_PER_MB = 1_048_576

export const KEPT = Object.freeze({
  AGELESS: 'a process in it has a start time the listing cannot read',
  ANCESTRY: 'it holds the reaper or one of its ancestors',
  YOUNG: 'a process in it is younger than the grace period'
})

const holds = ({ child, parent }) =>
  parent !== undefined &&
  parent.pid !== child.pid &&
  (parent.startMs === null ||
    child.startMs === null ||
    parent.startMs <= child.startMs)

const textOf = ({ process }) =>
  process.command.trim() === '' ? process.name : process.command

const toMb = ({ bytes }) => Math.round(bytes / BYTES_PER_MB)

// The listing indexed: each process by pid, the parent that holds it, and
// the children each one holds, in listing order.
const indexOf = ({ processes }) => {
  const byPid = new Map(processes.map((process) => [process.pid, process]))
  const parentOf = new Map()
  const childrenOf = new Map(processes.map(({ pid }) => [pid, []]))
  processes.forEach((process) => {
    const parent = byPid.get(process.ppid)
    if (holds({ child: process, parent })) {
      parentOf.set(process.pid, parent)
      childrenOf.get(parent.pid).push(process)
    }
  })
  return { byPid, childrenOf, parentOf }
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

const isWrapper = ({ families, process }) =>
  families.some(({ regex, wrapper }) => wrapper && regex.test(process.name))

const familyByText = ({ families, process }) =>
  families.find(
    ({ regex, wrapper }) => !wrapper && regex.test(textOf({ process }))
  )

// The family a process is reapable under, or undefined: a wrapper by what
// it wraps, anything else by its command line.
const reapableFamily = ({ families, index, process, seen = new Set() }) => {
  if (!isWrapper({ families, process })) {
    return familyByText({ families, process })
  }
  if (seen.has(process.pid)) return undefined
  seen.add(process.pid)
  const wrapped = index.childrenOf
    .get(process.pid)
    .filter(
      (child) =>
        !isWrapper({ families, process: child }) ||
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

const keptReason = ({ ancestry, graceMs, now, tree }) => {
  if (tree.some(({ pid }) => ancestry.has(pid))) return KEPT.ANCESTRY
  if (tree.some(({ startMs }) => startMs === null)) return KEPT.AGELESS
  return tree.some(({ startMs }) => now - startMs < graceMs)
    ? KEPT.YOUNG
    : null
}

/**
 * The trees to end and the trees kept, from `processes` listed at `now`.
 * Each candidate names its root pid, its family, the wrapper it came
 * through (`via`, or null), its age in seconds, every pid of its tree, its
 * memory in MB, and `strayChild`: whether a process outside the tree names
 * one of its pids as its parent, an older process left by an earlier holder
 * of that pid, which a platform tree kill could reach. Candidates come
 * largest first; `totalMb` is their sum.
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
      graceMs: graceSeconds * MS_PER_SECOND,
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
      strayChild: processes.some(
        ({ pid, ppid }) => !inTree.has(pid) && inTree.has(ppid)
      ),
      via: isWrapper({ families, process: root }) ? root.name : null
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
