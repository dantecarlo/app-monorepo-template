// ---------------------------------------------------------------------------
// paths — the write guard's reading of a target path: one spelling for every
// form a path takes, and where the target sits.
//
// A target is a SINK (`/dev/null`, `NUL`), SCRATCH (under the OS temp dir,
// $TEMP, $TMP, $TMPDIR or /tmp), REPO (inside one or more checkouts, each a
// folder above it holding `.git`, a directory in a clone and a file in a
// worktree), or OUTSIDE all of them. The walk from the target upward lists
// every checkout it passes and stops at the first scratch root, so a
// repository cloned under the temp dir is still a repository, and a home
// folder that is a checkout does not swallow the temp dir below it.
//
// On Windows a path reaches the same file in more than one spelling. Before
// it is judged:
//
//   - `\\?\` and `\\.\` are dropped, `\\?\UNC\` becomes `\\`, and a share of
//     this machine, `\\localhost\C$\...`, becomes `C:\...`;
//   - Git Bash's `/d/...` becomes `d:/...`, the dots and spaces that end a
//     segment are dropped as Win32 drops them, and `..` and `.` collapse;
//   - the deepest folder of the path that exists is canonicalised through the
//     disk (`fs.realpathSync.native`), which expands 8.3 short names, follows
//     links and junctions, and fixes the letter case; the rest is appended.
//
// A spelling the guard cannot read this way throws, and the engine then
// refuses a policed agent and asks anyone else: an NTFS stream (a `:` after
// the drive, `AGENTS.md::$DATA`), a drive-relative path (`C:AGENTS.md`), a
// device path that is no drive (`\\?\Volume{...}\`), a share of this machine
// that is no drive share, an admin drive share (`\\<host>\C$\`) of any host
// outside `localHosts`, since this machine also answers to its LAN address and
// to an IPv6 literal, and a short name (`NEWDIR~1`) that names nothing on
// disk. Any other share on another host is outside. No share is ever probed,
// so a slow network cannot run the hook past its timeout.
//
// Ported from the path half of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs, with one change: a target is
// judged against the checkouts it sits in, found from the target, so a rule
// file of a sibling worktree is a rule file too.
// ---------------------------------------------------------------------------

import { existsSync, realpathSync } from 'node:fs'
import { homedir, hostname, tmpdir } from 'node:os'
import { join, posix } from 'node:path'

export const TARGET_KIND = Object.freeze({
  outside: 'outside',
  repo: 'repo',
  scratch: 'scratch',
  sink: 'sink'
})

const SINK = /^(?:\/dev\/(?:null|stdout|stderr|tty|fd\/\d+)|nul|con)$/iu
const GIT_BASH_DRIVE = /^\/([a-zA-Z])(?=\/|$)/u
const DRIVE = /^([a-zA-Z]):/u
const DRIVE_PATH = /^[a-zA-Z]:(?:\/|$)/u
const DRIVE_ROOT = /^[a-z]:\/$/u
const DRIVE_RELATIVE = /^[a-zA-Z]:(?!\/)/u
const DEVICE_UNC = /^\/\/[?.]\/unc\//iu
const DEVICE = /^\/\/[?.]\//u
const UNC = /^\/\/([^/]+)\/([^/]+)/u
const DRIVE_SHARE = /^([a-zA-Z])\$$/u
const SHORT_NAME = /^[^.~]{1,6}~\d{1,6}(?:\.[^.]{1,3})?$/u
const ABSOLUTE = /^(?:\/|[a-zA-Z]:)/u
const SEPARATOR = '/'
const UNC_HEAD = '//'
const DEVICE_UNC_LENGTH = '//?/UNC/'.length
const DEVICE_LENGTH = '//?/'.length
const WINDOWS = process.platform === 'win32'
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1', '[::1]']

const unreadable = ({ text, why }) => {
  throw new Error(`the path ${text} ${why}, which the guard cannot read`)
}

// Backslashes become slashes, Git Bash's `/d/...` becomes `d:/...` on
// Windows, and the drive letter is lower-cased; the rest keeps its case, so
// the path still names the file on a case-sensitive disk.
const slashed = ({ text, windows }) => {
  const forward = text.replaceAll('\\', SEPARATOR)
  const bash = windows ? GIT_BASH_DRIVE.exec(forward) : null
  const drived = bash
    ? `${bash[1]}:${forward.slice(2) || SEPARATOR}`
    : forward
  return drived.replace(DRIVE, (drive) => drive.toLowerCase())
}

// The Windows prefixes that name a drive path another way, read as it.
const unprefixed = ({ host, text, windows }) => {
  if (!windows) return text
  if (DEVICE_UNC.test(text)) {
    return unprefixed({
      host,
      text: `${UNC_HEAD}${text.slice(DEVICE_UNC_LENGTH)}`,
      windows
    })
  }
  if (DEVICE.test(text)) {
    const rest = text.slice(DEVICE_LENGTH)
    if (SINK.test(rest) || DRIVE_PATH.test(rest)) return rest
    return unreadable({
      text,
      why: 'is a device path that names no drive'
    })
  }
  const share = UNC.exec(text)
  if (share === null) return text
  const localHosts = host.localHosts ?? LOCAL_HOSTS
  const isLocal = localHosts.includes(share[1].toLowerCase())
  const drive = DRIVE_SHARE.exec(share[2])
  // An admin drive share (`C$`) of a host outside `localHosts` may still be
  // this machine, named by its LAN address or an IPv6 literal, and telling
  // would need the network; so it is not read.
  if (drive !== null && !isLocal) {
    return unreadable({
      text,
      why: 'is an admin share of a host the guard cannot tell from this machine'
    })
  }
  if (!isLocal) return text
  if (drive === null) {
    return unreadable({
      text,
      why: 'is a share of this machine that is no drive share'
    })
  }
  return `${drive[1]}:${text.slice(share[0].length) || SEPARATOR}`
}

// A drive-relative path names the current folder of a drive, which the
// hook cannot see; a `:` past the drive names an NTFS stream.
const assertReadable = ({ text, windows }) => {
  if (!windows) return
  if (DRIVE_RELATIVE.test(text)) {
    unreadable({ text, why: 'is drive-relative' })
  }
  const afterDrive = DRIVE_PATH.test(text) ? text.slice(2) : text
  if (afterDrive.includes(':')) {
    unreadable({
      text,
      why: 'names an NTFS stream (a ":" after the drive)'
    })
  }
}

// Win32 drops the dots and spaces that end a segment (`AGENTS.md.` opens
// `AGENTS.md`), so they are dropped here too; `.` and `..` are kept.
const TRAILING_DOTS_AND_SPACES = /[. ]+$/u
const DOT_SEGMENTS = ['.', '..']

const win32Segments = ({ path, windows }) =>
  windows
    ? path
        .split(SEPARATOR)
        .map((segment) =>
          DOT_SEGMENTS.includes(segment)
            ? segment
            : segment.replace(TRAILING_DOTS_AND_SPACES, '')
        )
        .join(SEPARATOR)
    : path

const read = ({ host, text }) => {
  const forward = slashed({ text, windows: host.windows })
  const path = unprefixed({ host, text: forward, windows: host.windows })
  assertReadable({ text: path, windows: host.windows })
  return win32Segments({ path, windows: host.windows })
}

export const normalizePath = ({ path, windows = WINDOWS }) => {
  const normal = posix.normalize(slashed({ text: path, windows }))
  const rooted = /^[a-z]:$/u.test(normal)
    ? `${normal}${SEPARATOR}`
    : normal
  return rooted.length > 1 &&
    rooted.endsWith(SEPARATOR) &&
    !DRIVE_ROOT.test(rooted)
    ? rooted.slice(0, -1)
    : rooted
}

// Paths are compared without regard to case: Windows and macOS disks ignore
// it, and a false match on a case-sensitive disk only makes the guard ask.
const comparable = ({ path }) => path.toLowerCase()

const isUnder = ({ root, target }) => {
  const base = comparable({ path: root })
  const path = comparable({ path: target })
  return (
    path === base ||
    path.startsWith(
      base.endsWith(SEPARATOR) ? base : `${base}${SEPARATOR}`
    )
  )
}

export const relativeTo = ({ root, target }) =>
  target.slice(root.length).replace(/^\/+/u, '')

// The folder above `path`, or null at a root (`/` or `c:/`).
const parentOf = ({ path }) => {
  const at = path.lastIndexOf(SEPARATOR)
  if (at < 0) return null
  const head = path.slice(0, at + 1)
  const parent =
    at === 0 || DRIVE_ROOT.test(head) ? head : path.slice(0, at)
  return parent === path ? null : parent
}

const joined = ({ base, name }) =>
  base.endsWith(SEPARATOR)
    ? `${base}${name}`
    : `${base}${SEPARATOR}${name}`

// The root of `path` (`c:/`, `/` or `//host/share`) and its segments.
const split = ({ path }) => {
  const unc = UNC.exec(path)
  const head = unc
    ? unc[0]
    : DRIVE_ROOT.test(path.slice(0, 3))
      ? path.slice(0, 3)
      : SEPARATOR
  return {
    head,
    segments: path.slice(head.length).split(SEPARATOR).filter(Boolean)
  }
}

/**
 * The path with its deepest existing folder canonicalised by the disk, the
 * segments past it that do not exist yet, and `from`, the folder the walk
 * for checkouts starts at: no folder below the deepest existing one can hold
 * a `.git`. One probe for an existing
 * path, two for a new file in an existing folder, and otherwise one per
 * existing folder from the root down, so a path thousands of folders deep
 * that mostly does not exist costs a handful of probes.
 */
const canonical = ({ host, path }) => {
  if (typeof host.realpath !== 'function') {
    return { from: parentOf({ path }), path, rest: [] }
  }
  const real = ({ of }) => {
    const found = host.realpath({ path: of })
    return found === null
      ? null
      : normalizePath({ path: found, windows: host.windows })
  }
  const whole = real({ of: path })
  if (whole !== null) {
    return { from: parentOf({ path: whole }), path: whole, rest: [] }
  }
  const parent = parentOf({ path })
  const parentReal = parent === null ? null : real({ of: parent })
  if (parentReal !== null) {
    const name = path.slice(parent.length).replace(/^\/+/u, '')
    return {
      from: parentReal,
      path: joined({ base: parentReal, name }),
      rest: [name]
    }
  }
  const { head, segments } = split({ path })
  let existing = real({ of: head })
  let prefix = head
  let depth = 0
  while (existing !== null && depth < segments.length) {
    const next = joined({ base: prefix, name: segments[depth] })
    const found = real({ of: next })
    if (found === null) break
    existing = found
    prefix = next
    depth += 1
  }
  const rest = segments.slice(depth)
  return existing === null
    ? { from: null, path, rest: segments }
    : {
        from: existing,
        path: [existing, ...rest].reduce((base, name) =>
          joined({ base, name })
        ),
        rest
      }
}

// The absolute path `text` names, and whether it is a share on another host,
// which is judged before `posix.normalize` would fold its leading `//`.
const resolveTarget = ({ cwd, host, text }) => {
  const forward = read({ host, text })
  const base = cwd ?? host.ownRoot
  if (!ABSOLUTE.test(forward) && typeof base !== 'string') {
    throw new Error(
      `the relative path ${text} has no cwd to resolve against`
    )
  }
  const absolute = ABSOLUTE.test(forward)
    ? forward
    : `${read({ host, text: base })}/${forward}`
  return host.windows && UNC.test(absolute)
    ? { path: absolute, remote: true }
    : {
        path: normalizePath({ path: absolute, windows: host.windows }),
        remote: false
      }
}

/**
 * The absolute path `text` names, resolved against `cwd` and spelled as
 * `classify` reads it, without touching the disk: the folder a shell
 * command moves to. A spelling the guard cannot read throws.
 */
export const absolutePath = ({ cwd, host, text }) =>
  resolveTarget({ cwd, host, text }).path

// Whether `text` names a path from a root, a drive or a share rather than
// from the folder a command runs in. Nothing is read from the disk.
export const isAbsolutePath = ({ host, text }) =>
  ABSOLUTE.test(slashed({ text, windows: host.windows }))

const canonicalRoots = ({ host, roots }) =>
  roots
    .filter((root) => typeof root === 'string' && root !== '')
    .map(
      (root) =>
        canonical({
          host,
          path: normalizePath({ path: root, windows: host.windows })
        }).path
    )

const homeOf = ({ host, path }) => {
  if (typeof host.homeDir !== 'string' || host.homeDir === '') return {}
  const [home] = canonicalRoots({ host, roots: [host.homeDir] })
  return isUnder({ root: home, target: path })
    ? { homeRelative: relativeTo({ root: home, target: path }) }
    : {}
}

/**
 * Where `text` sits, resolved against `cwd`: `{ kind, path }`, plus, inside
 * checkouts, `roots` (every checkout that holds it, nearest first, each with
 * the target's path relative to it), and `root` and `relative` for the
 * nearest, and `homeRelative` for a target under the home folder. A spelling
 * it cannot read throws.
 */
export const classify = ({ cwd, host, text }) => {
  if (SINK.test(text)) return { kind: TARGET_KIND.sink, path: text }
  const lexical = resolveTarget({ cwd, host, text })
  if (lexical.remote) {
    return { kind: TARGET_KIND.outside, path: lexical.path }
  }
  if (SINK.test(lexical.path)) {
    return { kind: TARGET_KIND.sink, path: lexical.path }
  }
  const { from, path, rest } = canonical({ host, path: lexical.path })
  if (host.windows) {
    const short = rest.find((name) => SHORT_NAME.test(name))
    if (short !== undefined) {
      unreadable({
        text,
        why: `holds the short name ${short}, which names nothing on disk`
      })
    }
  }
  const scratchRoots = canonicalRoots({ host, roots: host.scratchRoots })
  const isScratchRoot = ({ dir }) =>
    scratchRoots.some(
      (root) => comparable({ path: root }) === comparable({ path: dir })
    )
  const home = homeOf({ host, path })
  const roots = []
  let dir = from
  while (dir !== null && !isScratchRoot({ dir })) {
    if (host.isCheckout({ dir })) roots.push(dir)
    dir = parentOf({ path: dir })
  }
  if (dir !== null && host.isCheckout({ dir })) roots.push(dir)
  if (roots.length === 0) {
    return {
      ...home,
      kind: dir === null ? TARGET_KIND.outside : TARGET_KIND.scratch,
      path
    }
  }
  const listed = roots.map((root) => ({
    relative: relativeTo({ root, target: path }),
    root
  }))
  return {
    ...home,
    kind: TARGET_KIND.repo,
    path,
    relative: listed[0].relative,
    root: listed[0].root,
    roots: listed
  }
}

const SCRATCH_VARIABLES = ['TEMP', 'TMP', 'TMPDIR']
const POSIX_SCRATCH = '/tmp'

const realpathOrNull = ({ path }) => {
  try {
    return realpathSync.native(path)
  } catch {
    return null
  }
}

// The host the hook really runs on: the disk, the OS temp dir, the home
// folder and the environment. Tests hand `decide` a synthetic one instead.
export const liveHost = ({ environment = process.env, ownRoot } = {}) => ({
  env: environment,
  homeDir: homedir(),
  isCheckout: ({ dir }) => existsSync(join(dir, '.git')),
  localHosts: [...LOCAL_HOSTS, hostname().toLowerCase()],
  ownRoot,
  realpath: realpathOrNull,
  scratchRoots: [
    tmpdir(),
    ...SCRATCH_VARIABLES.map((name) => environment[name]),
    POSIX_SCRATCH
  ].filter((root) => typeof root === 'string' && root !== ''),
  windows: WINDOWS
})
