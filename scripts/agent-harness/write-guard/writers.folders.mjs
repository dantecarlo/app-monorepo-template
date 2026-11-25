// ---------------------------------------------------------------------------
// writers.folders — what a command writes into a folder, judged by the name
// each file gets there: cp, mv, install and ln into a folder (`-t`, several
// sources, or a destination the disk or its spelling says is a folder),
// rsync and scp likewise. A destination given with `-T` is written itself,
// and so is the folder a source ending in `/`, `.` or `..` pours its
// contents into: the names written are the source's, which the guard cannot
// see. A glob source is what it matches on the disk, or, when the guard
// cannot expand it, a pattern of the folder and the glob's last segment.
// ---------------------------------------------------------------------------

import { posix } from 'node:path'

import { literal, parseOptions } from './expansion.mjs'
import { expandGlob, GLOB_MODE } from './globs.mjs'
import { absolutePath } from './paths.mjs'
import { SAFE, UNKNOWN } from './scan.mjs'

// The folder a command writes into when it names none.
export const CWD = literal({ text: '.' })

const TRAILING_SEPARATORS = /[\\/]+$/u
const LAST_SEGMENT = /^.*[\\/]/su
const BACKSLASHES = /\\/gu
const WILDCARDS = /[*?[]/gu
const FOLDER_NAMES = new Set(['.', '..'])
// What makes a source pour its contents into the folder: a last segment of
// `.` or `..` for cp, mv and install, and also a final separator for rsync.
export const POURS = Object.freeze({
  dots: /(?:^|[\\/])\.{1,2}[\\/]*$/u,
  dotsOrSeparator: /(?:^|[\\/])\.{1,2}[\\/]*$|[\\/]$/u,
  never: /(?!)/u
})
const NO_TARGET_DIRECTORY = {
  long: ['--no-target-directory'],
  short: ['T']
}

// `host:path` and `user@host:path` name another machine; `C:\` is a drive.
const REMOTE = /^[^/\\]+:/u
const DRIVE = /^[a-zA-Z]:[\\/]/u
export const isRemote = ({ target }) =>
  REMOTE.test(target.text) && !DRIVE.test(target.text)

/** The last segment of a path, after its own `..` and `.` are folded. */
export const lastSegmentOf = ({ text }) =>
  posix
    .normalize(text.replaceAll('\\', '/'))
    .replace(TRAILING_SEPARATORS, '')
    .replace(LAST_SEGMENT, '')

/**
 * The name a path gets when it is copied or moved into a folder: its last
 * segment, or SAFE when it is built from what the guard cannot see, since a
 * name holds no separator.
 */
export const nameOf = ({ path }) =>
  path.text.includes(UNKNOWN) ? SAFE : lastSegmentOf({ text: path.text })

/** The word for `name`, a relative path, below the folder `dir`. */
export const under = ({ dir, name }) => {
  const base = dir.text.replace(TRAILING_SEPARATORS, '')
  return {
    raw: `${dir.raw.replace(TRAILING_SEPARATORS, '')}/${name}`,
    text: `${base}/${name}`,
    unknown: dir.unknown
  }
}

// Whether a destination is a folder: `.`, `..`, one that ends in a
// separator, or one the disk says is a folder.
const isFolder = ({ state, target }) => {
  if (
    FOLDER_NAMES.has(target.text) ||
    TRAILING_SEPARATORS.test(target.text)
  ) {
    return true
  }
  try {
    return (
      state.host?.isDirectory?.({
        path: absolutePath({
          cwd: state.cwd ?? undefined,
          host: state.host,
          text: target.text
        })
      }) === true
    )
  } catch {
    return false
  }
}

// A glob source: each match by its name in the folder, or a pattern of the
// folder and the glob's last segment when the guard cannot expand it.
const globEntries = ({ dir, source, state }) => {
  const matches = expandGlob({
    cwd: state.cwd,
    host: state.host,
    pattern: source.glob.pattern
  })
  if (matches !== undefined && matches.length > 0) {
    return matches.map((match) =>
      under({ dir, name: lastSegmentOf({ text: match }) })
    )
  }
  const segment = source.glob.pattern.split('/').at(-1)
  const folder = dir.text
    .replace(BACKSLASHES, '/')
    .replace(WILDCARDS, '\\$&')
    .replace(TRAILING_SEPARATORS, '')
  return [
    {
      ...under({ dir, name: segment }),
      glob: {
        disk: false,
        mode: GLOB_MODE.bash,
        pattern: `${folder}/${segment}`
      }
    }
  ]
}

/**
 * What one source writes into the folder `dir`: its contents, the folder
 * itself, when `pours` (one of POURS) reads it so, each match of a glob, or
 * the entry of its own name.
 */
export const intoFolder = ({ dir, pours, source, state }) => {
  if (pours.test(source.text)) return [dir]
  if (source.glob !== undefined) return globEntries({ dir, source, state })
  return [under({ dir, name: nameOf({ path: source }) })]
}

/**
 * cp, mv, install and ln: into a folder, each source by its name there;
 * with `-T` the destination itself. mv also writes, by removing it, every
 * source. `single` is what ln makes of one operand: a link of its name in
 * the folder it runs in.
 */
export const copyTargets = ({
  args,
  move,
  short,
  single = false,
  state
}) => {
  const parsed = parseOptions({
    args,
    long: ['--suffix', '--target-directory'],
    short
  })
  const dir = parsed.value({ long: '--target-directory', short: 't' })
  const { operands } = parsed
  if (single && !dir && operands.length === 1) {
    return intoFolder({
      dir: CWD,
      pours: POURS.never,
      source: operands[0],
      state
    })
  }
  const sources = dir ? operands : operands.slice(0, -1)
  const dest = dir ?? operands.at(-1)
  if (dest === undefined || (!dir && operands.length < 2)) return []
  const asItself = !dir && parsed.has(NO_TARGET_DIRECTORY)
  const intoIt =
    !asItself &&
    (dir !== undefined ||
      sources.length > 1 ||
      isFolder({ state, target: dest }))
  const written = intoIt
    ? sources.flatMap((source) =>
        intoFolder({
          dir: dest,
          pours: single ? POURS.never : POURS.dots,
          source,
          state
        })
      )
    : [dest]
  return move ? [...sources, ...written] : written
}

/**
 * rsync and scp: the last operand on this machine, into which each source
 * goes by its name, or its contents when it ends in `/`.
 */
export const transferTargets = ({ operands, state }) => {
  const dest = operands.at(-1)
  if (operands.length < 2 || isRemote({ target: dest })) return []
  const sources = operands.slice(0, -1)
  return sources.length > 1 || isFolder({ state, target: dest })
    ? sources.flatMap((source) =>
        intoFolder({
          dir: dest,
          pours: POURS.dotsOrSeparator,
          source,
          state
        })
      )
    : [dest]
}
