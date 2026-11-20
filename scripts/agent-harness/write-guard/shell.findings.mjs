// ---------------------------------------------------------------------------
// shell.findings — what every part of the Bash judgement shares: the order
// findings are kept in, who the actor is, the finding for one written path
// through a shell writer, and the folder a `cd` or `git -C` moves to.
//
// The strongest finding wins: a deny over an ask, an ask over an opaque
// one, and the first of its level. `strongestOf` stops at the first deny,
// so a long command costs no more than the donor's first-refusal walk.
// ---------------------------------------------------------------------------

import { absolutePath, isAbsolutePath } from './paths.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { UNKNOWN } from './scan.mjs'
import { judgeTarget, LEVEL } from './target.mjs'

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

/** The finding for a write of `target`, an expanded word, through `via`. */
export const targetFinding = ({ contained, state, target, via }) => {
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
