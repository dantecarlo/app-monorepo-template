// ---------------------------------------------------------------------------
// target — the finding for one written path, by actor: what the file tools
// and every shell writer share, so a path is judged the same whichever tool
// writes it.
//
//   | Target                         | Read-only | Surface agent     | Anyone else |
//   | scratch or a sink              | —         | —                 | —           |
//   | rule file                      | deny      | ask               | ask         |
//   | surface path                   | n/a       | —                 | —           |
//   | other path, contained          | deny      | deny              | —           |
//   | other path, not contained      | deny      | —                 | —           |
//   | depends on an unset variable   | deny      | deny if contained | opaque      |
//   | a SAFE segment, not a rule     | deny      | deny if contained | opaque      |
//   |                                |           | outside, else     |             |
//   |                                |           | opaque            |             |
//
// `contained` says whether the actor's containment applies to the writer:
// always for a read-only agent, and for a surface agent only for the
// commands it is held to. "opaque" is a finding the guard cannot settle:
// decide asks about it only when the command names a rule path. `holds`
// makes a folder that holds rule files count as one, for the shell
// writers. A spelling paths.mjs cannot read throws, and decide refuses a
// policed agent and asks anyone else.
// ---------------------------------------------------------------------------

import { cachedClassify, isAbsolutePath, TARGET_KIND } from './paths.mjs'
import {
  ACTOR_KIND,
  heldRuleFor,
  homeHeldRuleFor,
  homeRuleFor,
  ruleFor
} from './policy.mjs'
import { SAFE, UNKNOWN } from './scan.mjs'

export const LEVEL = Object.freeze({
  ask: 'ask',
  deny: 'deny',
  opaque: 'opaque'
})

export const FINDING_KIND = Object.freeze({
  program: 'program',
  readOnly: 'read-only',
  rule: 'rule',
  surface: 'surface',
  uncertain: 'uncertain',
  variable: 'variable'
})

// What a relative target depends on once a `cd` the guard cannot follow
// has run.
const UNKNOWN_FOLDER = 'the directory it runs in'

const firstRule = ({ read, roots }) =>
  roots.reduce(
    (found, { relative }) => found ?? read({ relative }),
    undefined
  )

/**
 * The rule the target falls under, read against every checkout that holds
 * it, so a `.git` planted inside one cannot hide a rule file below it, and
 * against the home folder for the user-level files; with `holds`, also a
 * rule whose files the target, a folder, holds.
 */
export const ruleOf = ({ holds = false, policy, where }) => {
  const roots = where.roots ?? []
  const home = where.homeRelative
  const direct =
    firstRule({
      read: ({ relative }) => ruleFor({ policy, relative }),
      roots
    }) ??
    (home === undefined
      ? undefined
      : homeRuleFor({ policy, relative: home }))
  if (direct !== undefined || !holds) return direct
  return (
    firstRule({
      read: ({ relative }) => heldRuleFor({ policy, relative }),
      roots
    }) ??
    (home === undefined
      ? undefined
      : homeHeldRuleFor({ policy, relative: home }))
  )
}

export const inSurface = ({ actor, relative }) => {
  const path = relative.toLowerCase()
  return actor.surface.some(
    (folder) => path === folder || path.startsWith(`${folder}/`)
  )
}

const finding = ({ kind, level, ...details }) => ({
  kind,
  level,
  ...details
})

/**
 * The finding for a write of `text`, resolved against `cwd` (null after a
 * `cd` the guard cannot follow): undefined, or { level, kind, rule, where,
 * names }. `unknown` names what an UNKNOWN in the text depends on.
 */
export const judgeTarget = ({
  actor,
  contained,
  cwd,
  holds = false,
  host,
  placeholders = false,
  policy,
  text,
  unknown = []
}) => {
  const readOnly = actor.kind === ACTOR_KIND.readOnly
  // Containment holds a read-only agent always and a surface agent when
  // the writer says so; nobody else, so no target refuses the main session.
  const held = readOnly || (actor.kind === ACTOR_KIND.surface && contained)
  const unresolved =
    placeholders &&
    (text.includes(UNKNOWN) ||
      (cwd === null && !isAbsolutePath({ host, text })))
  if (unresolved) {
    return finding({
      kind: FINDING_KIND.variable,
      level: held ? LEVEL.deny : LEVEL.opaque,
      names: unknown.length > 0 ? unknown : [UNKNOWN_FOLDER]
    })
  }
  const where = cachedClassify({ cwd: cwd ?? undefined, host, text })
  if (
    where.kind === TARGET_KIND.sink ||
    where.kind === TARGET_KIND.scratch
  ) {
    return undefined
  }
  const rule = ruleOf({ holds, policy, where })
  if (readOnly) {
    return rule === undefined
      ? finding({
          kind: FINDING_KIND.readOnly,
          level: LEVEL.deny,
          where: where.kind
        })
      : finding({ kind: FINDING_KIND.rule, level: LEVEL.deny, rule })
  }
  if (rule !== undefined) {
    return finding({ kind: FINDING_KIND.rule, level: LEVEL.ask, rule })
  }
  const outsideSurface =
    held &&
    !(
      where.kind === TARGET_KIND.repo &&
      inSurface({ actor, relative: where.relative })
    )
  if (outsideSurface) {
    return finding({ kind: FINDING_KIND.surface, level: LEVEL.deny })
  }
  // One segment the guard cannot spell may still be a rule file's name.
  return placeholders && text.includes(SAFE)
    ? finding({ kind: FINDING_KIND.uncertain, level: LEVEL.opaque })
    : undefined
}
