// ---------------------------------------------------------------------------
// shell.findings — what every part of the Bash judgement shares: the order
// findings are kept in, who the actor is, the finding for one written path
// through a shell writer, and the folder a `cd` or `git -C` moves to.
//
// The strongest finding wins: a deny over an ask, an ask over an opaque
// one, and the first of its level. `strongestOf` stops at the first deny,
// so a long command costs no more than the donor's first-refusal walk.
//
// A target that is a glob is what it matches on the disk, each match judged
// as a path; when the guard cannot expand it (globs.mjs), it is judged as a
// pattern: refused to a read-only agent unless its folder is scratch, asked
// of anyone else when it could name a rule file, and held to a surface
// agent's surface by its literal folder.
// ---------------------------------------------------------------------------

import {
  expandGlob,
  GLOB_MODE,
  literalHead,
  patternRule
} from './globs.mjs'
import {
  absolutePath,
  cachedClassify,
  isAbsolutePath,
  TARGET_KIND
} from './paths.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { UNKNOWN } from './scan.mjs'
import { FINDING_KIND, inSurface, judgeTarget, LEVEL } from './target.mjs'

const RANK = { [LEVEL.ask]: 2, [LEVEL.deny]: 3, [LEVEL.opaque]: 1 }

/**
 * The strongest finding `judge` returns over `items`: the first deny, at
 * once, else the first ask, else the first opaque one.
 */
export const strongestOf = ({ items, judge }) => {
  let best
  for (const item of items) {
    const found = judge(item)
    if (found === undefined || found === null || found === false) continue
    if (found.level === LEVEL.deny) return found
    if (best === undefined || RANK[found.level] > RANK[best.level]) {
      best = found
    }
  }
  return best
}

export const firstOfChecks = ({ checks }) =>
  strongestOf({ items: checks, judge: (check) => check() })

export const isReadOnly = ({ state }) =>
  state.actor.kind === ACTOR_KIND.readOnly

export const isSurface = ({ state }) =>
  state.actor.kind === ACTOR_KIND.surface

export const isPoliced = ({ state }) =>
  isReadOnly({ state }) || isSurface({ state })

// A program whose writes the guard does not read: refused to a read-only
// agent, opaque for anyone else.
export const opaqueLevel = ({ state }) =>
  isReadOnly({ state }) ? LEVEL.deny : LEVEL.opaque

const literalFinding = ({ contained, state, target, via }) => {
  const found = judgeTarget({
    actor: state.actor,
    contained,
    cwd: state.cwd,
    holds: true,
    host: state.host,
    placeholders: true,
    policy: state.policy,
    text: target.text,
    unknown: target.unknown
  })
  return found === undefined
    ? undefined
    : { ...found, shape: `${via} ${target.raw}`.trim() }
}

const SEPARATOR = '/'
const PARENT = '..'
const SCRATCH_KINDS = [TARGET_KIND.scratch, TARGET_KIND.sink]

// A glob the guard cannot expand, judged by its literal folder and by the
// rule it could name.
const patternFinding = ({
  contained,
  mode,
  pattern,
  state,
  target,
  via
}) => {
  const { cwd, host, policy } = state
  const { dir, rest } = literalHead({ pattern })
  const climbs = rest.split(SEPARATOR).includes(PARENT)
  const where = cachedClassify({
    cwd: cwd ?? undefined,
    host,
    text: dir === '' ? '.' : dir
  })
  if (SCRATCH_KINDS.includes(where.kind) && !climbs) return undefined
  const shape = `${via} ${target.raw}`.trim()
  const rule = patternRule({
    cwd: cwd ?? undefined,
    host,
    mode,
    pattern,
    policy
  })
  if (isReadOnly({ state })) {
    return rule === undefined
      ? {
          kind: FINDING_KIND.readOnly,
          level: LEVEL.deny,
          shape,
          where:
            where.kind === TARGET_KIND.repo
              ? TARGET_KIND.repo
              : TARGET_KIND.outside
        }
      : { kind: FINDING_KIND.rule, level: LEVEL.deny, rule, shape }
  }
  if (rule !== undefined) {
    return { kind: FINDING_KIND.rule, level: LEVEL.ask, rule, shape }
  }
  if (!isSurface({ state }) || !contained) return undefined
  const inside =
    where.kind === TARGET_KIND.repo &&
    !climbs &&
    inSurface({ actor: state.actor, relative: where.relative })
  return inside
    ? undefined
    : { kind: FINDING_KIND.surface, level: LEVEL.deny, shape }
}

/**
 * The finding for a write of `target`, an expanded word, through `via`.
 * A glob is judged by what it matches, or as a pattern.
 */
export const targetFinding = ({ contained, state, target, via }) => {
  const { glob } = target
  const relativeAfterLostCd =
    glob !== undefined &&
    state.cwd === null &&
    !isAbsolutePath({ host: state.host, text: glob.pattern })
  if (glob === undefined || relativeAfterLostCd) {
    return literalFinding({ contained, state, target, via })
  }
  const { disk = true, mode = GLOB_MODE.bash, pattern } = glob
  const matches = disk
    ? expandGlob({ cwd: state.cwd, host: state.host, pattern })
    : undefined
  if (matches === undefined) {
    return patternFinding({ contained, mode, pattern, state, target, via })
  }
  return matches.length === 0
    ? literalFinding({ contained, state, target, via })
    : strongestOf({
        items: matches,
        judge: (match) =>
          literalFinding({
            contained,
            state,
            target: { raw: target.raw, text: match, unknown: [] },
            via
          })
      })
}

/**
 * The folder `cd` or `git -C` moves to, or null when the guard cannot tell:
 * a target built from an unset variable, a relative one after an earlier
 * move it could not follow, or a spelling it cannot read.
 */
export const changedDirectory = ({ cwd, host, text }) => {
  if (text.includes(UNKNOWN)) return null
  if (cwd === null && !isAbsolutePath({ host, text })) return null
  try {
    return absolutePath({ cwd: cwd ?? undefined, host, text })
  } catch {
    return null
  }
}
