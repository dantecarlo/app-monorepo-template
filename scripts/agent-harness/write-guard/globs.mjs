// ---------------------------------------------------------------------------
// globs — the wildcards of a word, the way Bash, find and the policy read
// them, and whether a glob could name a rule file.
//
// A target whose word holds an unquoted `*`, `?` or `[…]` is what Bash
// expands it to: the guard asks the disk (host.glob) and judges each match.
// When it cannot, because the host has no disk, the glob holds `**` or more
// wildcard folders than the live host walks, or it matches more than
// MAX_GLOB_MATCHES paths, it judges the pattern itself: `patternRule` says
// whether it could name a rule file, a folder that holds one, or a `.git`,
// by the intersection of the two globs, which needs no disk at all.
//
// Modes: `bash` (`*` stays in a folder, `\` escapes), `findName` (a `**`
// the guard writes crosses folders), `findPath` (find's `-path`, where `*`
// crosses folders) and `manifest` (the policy's globs: `**` crosses
// folders, `?` and `[` are literal, scripts/manifest.mjs).
// ---------------------------------------------------------------------------

import { cachedClassify } from './paths.mjs'
import { GIT_RULE, heldFoldersOf, HOME_PREFIX } from './policy.mjs'

export const MAX_GLOB_MATCHES = 64

export const GLOB_MODE = Object.freeze({
  bash: 'bash',
  findName: 'find-name',
  findPath: 'find-path',
  manifest: 'manifest'
})

const ANY = { any: true }
const STAR = { star: true }
const GLOBSTAR = { globstar: true }
// A wildcard that starts a segment never matches a leading dot in Bash.
const ANY_NO_DOT = { any: true, noDot: true }
const STAR_NO_DOT = { noDot: true, star: true }
// `**/`: either nothing, or any folders and their `/`; the walk may jump
// over the three tokens it is read as.
const SKIP_FOLDERS = { skip: 3 }
const DOT = '.'
const SEPARATOR = '/'
const ESCAPE = '\\'
// A pattern names a .git only when its own last segment could be one: a
// recursive pattern meets `**/.git/**` through any `.git` folder below it.
const GIT_GLOBS = ['**/.git']

const lit = ({ char }) => ({ char: char.toLowerCase() })

/** Whether `pattern` holds an unescaped `*`, `?` or closed `[…]`. */
export const hasGlob = ({ pattern }) => {
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i]
    if (c === ESCAPE) i += 1
    else if (c === '*' || c === '?') return true
    else if (c === '[' && pattern.indexOf(']', i + 2) > 0) return true
  }
  return false
}

const isStar = ({ token }) => token?.star === true

/** The tokens of `glob` read in `mode` (GLOB_MODE). */
export const tokensOf = ({ glob, mode }) => {
  const tokens = []
  const manifest = mode === GLOB_MODE.manifest
  const crossing = mode === GLOB_MODE.manifest || mode === GLOB_MODE.findName
  const dotless = mode === GLOB_MODE.bash || mode === GLOB_MODE.findName
  const starts = () => {
    const last = tokens.at(-1)
    return last === undefined || last.char === SEPARATOR
  }
  const pushWild = ({ any }) => {
    const last = tokens.at(-1)
    if (!any && (isStar({ token: last }) || last === GLOBSTAR)) return
    const noDot = dotless && starts()
    if (any) tokens.push(noDot ? ANY_NO_DOT : ANY)
    else tokens.push(noDot ? STAR_NO_DOT : STAR)
  }
  for (let i = 0; i < glob.length; i += 1) {
    const c = glob[i]
    if (!manifest && c === ESCAPE && i + 1 < glob.length) {
      i += 1
      tokens.push(lit({ char: glob[i] }))
    } else if (c === '*' && crossing && glob[i + 1] === '*') {
      // `**/` matches no folder or many; `/**` anything below the folder,
      // and the folder itself is a held folder (policy.heldFoldersOf).
      if (glob[i + 2] === SEPARATOR) {
        tokens.push(SKIP_FOLDERS, GLOBSTAR, lit({ char: SEPARATOR }))
        i += 2
      } else {
        tokens.push(GLOBSTAR)
        i += 1
      }
    } else if (c === '*' && mode === GLOB_MODE.findPath) {
      tokens.push(GLOBSTAR)
    } else if (c === '*') pushWild({ any: false })
    else if (!manifest && c === '?') pushWild({ any: true })
    else if (!manifest && c === '[' && glob.indexOf(']', i + 2) > 0) {
      pushWild({ any: true })
      i = glob.indexOf(']', i + 2)
    } else tokens.push(lit({ char: c }))
  }
  return tokens
}

const isWild = ({ token }) => isStar({ token }) || token === GLOBSTAR

// Whether one character can be read by both tokens; `fresh` says the
// token has read nothing yet, so a no-dot one cannot read a dot.
const share = ({ a, b, freshA, freshB }) => {
  if (a.char !== undefined && b.char !== undefined) return a.char === b.char
  const char = a.char ?? b.char
  if (char === undefined) return true
  const [other, fresh] = a.char === undefined ? [a, freshA] : [b, freshB]
  if (other === GLOBSTAR) return true
  if (char === SEPARATOR) return false
  return !(char === DOT && other.noDot && fresh)
}

/**
 * Whether some path is named by both token lists: a walk over their pairs
 * of positions, linear in the product of their lengths. A state also says
 * whether each side's wildcard has read a character yet.
 */
export const globsIntersect = ({ a, b }) => {
  const seen = new Set()
  const queue = [[0, 0, true, true]]
  while (queue.length > 0) {
    const [i, j, freshA, freshB] = queue.pop()
    const key = `${i},${j},${freshA},${freshB}`
    if (seen.has(key)) continue
    seen.add(key)
    if (i === a.length && j === b.length) return true
    const x = a[i]
    const y = b[j]
    if (x === SKIP_FOLDERS || y === SKIP_FOLDERS) {
      if (x === SKIP_FOLDERS) {
        queue.push([i + 1, j, true, freshB], [i + x.skip, j, true, freshB])
      } else {
        queue.push([i, j + 1, freshA, true], [i, j + y.skip, freshA, true])
      }
      continue
    }
    if (x !== undefined && isWild({ token: x })) {
      queue.push([i + 1, j, true, freshB])
    }
    if (y !== undefined && isWild({ token: y })) {
      queue.push([i, j + 1, freshA, true])
    }
    if (
      x !== undefined &&
      y !== undefined &&
      share({ a: x, b: y, freshA, freshB })
    ) {
      const stayA = isWild({ token: x })
      const stayB = isWild({ token: y })
      queue.push([
        stayA ? i : i + 1,
        stayB ? j : j + 1,
        !stayA,
        !stayB
      ])
    }
  }
  return false
}

const unescaped = ({ text }) => text.replace(/\\(.)/gsu, '$1')

/**
 * The folder of `pattern` before its first wildcard segment, unescaped, and
 * the rest of it, as written.
 */
export const literalHead = ({ pattern }) => {
  const segments = pattern.split(SEPARATOR)
  const at = segments.findIndex((segment) => hasGlob({ pattern: segment }))
  const head = at < 0 ? segments.slice(0, -1) : segments.slice(0, at)
  return {
    dir: unescaped({ text: head.join(SEPARATOR) }),
    rest: segments.slice(at < 0 ? -1 : at).join(SEPARATOR)
  }
}

const ruleMet = ({ home, mode, policy, relative }) => {
  const tokens = tokensOf({ glob: relative, mode })
  const meets = ({ glob }) =>
    globsIntersect({
      a: tokens,
      b: tokensOf({ glob: glob.toLowerCase(), mode: GLOB_MODE.manifest })
    })
  const rules = policy.ruleFiles
    .filter(({ glob }) => glob.startsWith(HOME_PREFIX) === home)
    .map((rule) => ({
      glob: home ? rule.glob.slice(HOME_PREFIX.length) : rule.glob,
      rule
    }))
  const direct = rules.find(({ glob }) => meets({ glob }))
  if (direct !== undefined) {
    return { glob: direct.rule.glob, what: direct.rule.what }
  }
  const held = rules.find(({ glob }) =>
    heldFoldersOf({ glob }).some((folder) => meets({ glob: folder }))
  )
  if (held !== undefined) {
    return { glob: held.rule.glob, held: true, what: held.rule.what }
  }
  return !home && GIT_GLOBS.some((glob) => meets({ glob }))
    ? { ...GIT_RULE }
    : undefined
}

/**
 * The rule a glob the guard cannot expand could name, read against every
 * checkout that holds its literal folder and against the home folder, or
 * undefined.
 */
export const patternRule = ({ cwd, host, mode, pattern, policy }) => {
  const { dir, rest } = literalHead({ pattern })
  const where = cachedClassify({ cwd, host, text: dir === '' ? '.' : dir })
  const joined = ({ base }) => (base === '' ? rest : `${base}${SEPARATOR}${rest}`)
  const inRoots = (where.roots ?? []).reduce(
    (found, { relative }) =>
      found ??
      ruleMet({
        home: false,
        mode,
        policy,
        relative: joined({ base: relative.toLowerCase() })
      }),
    undefined
  )
  if (inRoots !== undefined || where.homeRelative === undefined) {
    return inRoots
  }
  return ruleMet({
    home: true,
    mode,
    policy,
    relative: joined({ base: where.homeRelative.toLowerCase() })
  })
}

/**
 * What `pattern` matches on the disk, as absolute paths; undefined when the
 * host cannot expand it or it matches more than MAX_GLOB_MATCHES paths.
 */
export const expandGlob = ({ cwd, host, pattern }) => {
  if (typeof host.glob !== 'function' || pattern.includes(ESCAPE)) {
    return undefined
  }
  const found = host.glob({ cwd, pattern })
  return Array.isArray(found) && found.length <= MAX_GLOB_MATCHES
    ? found
    : undefined
}
