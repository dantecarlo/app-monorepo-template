// ---------------------------------------------------------------------------
// decide — the write guard's decision engine, written once for every
// runtime. Each runtime's adapter (claude-hook.mjs for Claude Code) reads its
// own payload, calls `decide`, and prints the verdict its runtime reads.
//
// It judges the file tools, Edit, Write and NotebookEdit:
//
//   | Actor                      | Scratch or sink | Rule file | Other path  |
//   | read-only agent            | —               | deny      | deny        |
//   | surface agent              | —               | ask       | deny unless |
//   |                            |                 |           | in surface  |
//   | writer, main, unlisted     | —               | ask       | —           |
//
//   | Agent context unreadable   | deny for every subagent, writers too;   |
//   |                            | the main session is judged as above     |
//
// "—" prints nothing. The guard never allows: it only asks or refuses, and
// otherwise leaves the call to the runtime's own permissions. A deny wins
// over an ask, and an ask over nothing. A rule file is read against every
// checkout that holds the target and against the home folder. An error,
// a path spelling paths.mjs cannot read among them, refuses a policed agent
// (read-only, surface, or one whose entry cannot be read) and asks anyone
// else. `ATL_WRITE_GUARD=off` (the policy's switchOff) silences it all.
//
// Bash and PowerShell are NOT judged here: they return nothing, and their
// tokenizer comes in a later slice. So a shell command can still write a
// rule file, for every actor.
// ---------------------------------------------------------------------------

import { classify, liveHost, TARGET_KIND } from './paths.mjs'
import {
  ACTOR_KIND,
  actorFor,
  AGENT_CONTEXT_FILE,
  assertPolicy,
  homeRuleFor,
  isSwitchedOff,
  POLICY_FILE,
  ruleFor,
  SWITCH_OFF
} from './policy.mjs'

// -- the reasons: each names the rule that fired, the file, and how to
// proceed; a rule file cites the LAW it protects. -----------------------------

const LAW =
  'The LAW "A rule is not edited to fit the work" (AGENTS.md) lets a rule ' +
  'change only when the owner asks for that change, in words, as the request.'

const SWITCH =
  `${SWITCH_OFF.variable}=${SWITCH_OFF.value} set when launching the ` +
  'session switches the guard off'

const ADVICE_REPORT = 'Report the change for the caller to make.'

const ADVICE_SCRATCH =
  'Write probes and logs under the OS temp dir instead (a folder from ' +
  'mktemp -d), or report the change for the caller to make.'

const calls = ({ text, tool }) => `${tool} \`${text}\``

const ruleClause = ({ rule }) =>
  `edits a rule file: the path matches \`${rule.glob}\` (${rule.what}) ` +
  `in ${POLICY_FILE}.`

const byWhom = ({ actor }) =>
  actor.name === null ? '' : ` by ${actor.name}`

const askForRuleFile = ({ actor, rule, text, tool }) =>
  `${calls({ text, tool })}${byWhom({ actor })} ${ruleClause({ rule })} ` +
  `${LAW} Approve only if the owner asked for this edit; otherwise stop, ` +
  'name the rule and what it costs the work, and ask the owner.'

const denyRuleFile = ({ actor, rule, text, tool }) =>
  `${actor.name} is read-only (writes: false in ${AGENT_CONTEXT_FILE}): ` +
  `${calls({ text, tool })} ${ruleClause({ rule })} ${LAW} ${ADVICE_REPORT}`

const denyReadOnly = ({ actor, kind, text, tool }) =>
  `${actor.name} is read-only (writes: false in ${AGENT_CONTEXT_FILE}): ` +
  `${calls({ text, tool })} writes ` +
  `${kind === TARGET_KIND.repo ? 'inside the repository' : 'outside the repository and the OS temp dir'}. ` +
  ADVICE_SCRATCH

const denyOutsideSurface = ({ actor, text, tool }) =>
  `${actor.name} writes only under ` +
  `${actor.surface.map((folder) => `${folder}/`).join(', ')} or the OS ` +
  `temp dir (surface in ${AGENT_CONTEXT_FILE}): ${calls({ text, tool })} ` +
  `is outside them. ${ADVICE_REPORT}`

const guardError = ({ actor, denied, problem, tool }) =>
  `The write guard could not judge this ${tool} (${problem}), so it ` +
  `${denied ? `refuses it for ${actor.name}, which it polices` : 'asks before letting it run'}. ` +
  `Fix what it names, or, if the owner agrees, ${SWITCH}.`

// -- the decision ------------------------------------------------------------

// The key each file tool names its target with. A key another tool uses is
// never read: a stray `file_path` beside a NotebookEdit's `notebook_path`
// names nothing that tool writes.
const TARGET_KEY = Object.freeze({
  Edit: 'file_path',
  NotebookEdit: 'notebook_path',
  Write: 'file_path'
})

export const FILE_TOOLS = Object.freeze(Object.keys(TARGET_KEY).sort())

// Left to the slice that ports the donor's shell tokenizer.
export const UNJUDGED_TOOLS = Object.freeze(['Bash', 'PowerShell'])

export const VERDICT = Object.freeze({ ask: 'ask', deny: 'deny' })

const POLICED = [
  ACTOR_KIND.readOnly,
  ACTOR_KIND.surface,
  ACTOR_KIND.unknown
]

const ask = ({ reason }) => ({ decision: VERDICT.ask, reason })
const deny = ({ reason }) => ({ decision: VERDICT.deny, reason })

const targetOf = ({ payload, tool }) => {
  const target = payload.tool_input?.[TARGET_KEY[tool]]
  if (typeof target !== 'string' || target.trim() === '') {
    throw new Error('the call names no file path')
  }
  return target
}

const cwdOf = ({ payload }) => {
  const { cwd } = payload
  if (cwd !== undefined && typeof cwd !== 'string') {
    throw new Error('the payload cwd is not a string')
  }
  return cwd
}

const inSurface = ({ actor, relative }) => {
  const path = relative.toLowerCase()
  return actor.surface.some(
    (folder) => path === folder || path.startsWith(`${folder}/`)
  )
}

// The rule the target falls under, read against every checkout that holds
// it, so a `.git` planted inside one cannot hide a rule file below it, and
// against the home folder for the user-level files.
const ruleOf = ({ policy, where }) =>
  (where.roots ?? []).reduce(
    (found, { relative }) => found ?? ruleFor({ policy, relative }),
    undefined
  ) ??
  (where.homeRelative === undefined
    ? undefined
    : homeRuleFor({ policy, relative: where.homeRelative }))

const judge = ({ actor, host, payload, policy, tool }) => {
  if (actor.kind === ACTOR_KIND.unknown) throw new Error(actor.problem)
  assertPolicy({ policy })
  const text = targetOf({ payload, tool })
  const where = classify({ cwd: cwdOf({ payload }), host, text })
  if (
    where.kind === TARGET_KIND.sink ||
    where.kind === TARGET_KIND.scratch
  ) {
    return undefined
  }
  const inRepository = where.kind === TARGET_KIND.repo
  const rule = ruleOf({ policy, where })
  const call = { actor, rule, text, tool }

  if (actor.kind === ACTOR_KIND.readOnly) {
    return deny({
      reason:
        rule === undefined
          ? denyReadOnly({ ...call, kind: where.kind })
          : denyRuleFile(call)
    })
  }
  if (rule !== undefined) return ask({ reason: askForRuleFile(call) })
  if (actor.kind !== ACTOR_KIND.surface) return undefined
  return inRepository && inSurface({ actor, relative: where.relative })
    ? undefined
    : deny({ reason: denyOutsideSurface(call) })
}

/**
 * The verdict for one tool call: `{ decision: 'deny' | 'ask', reason }`, or
 * undefined when the guard has nothing to say. `host` defaults to the
 * machine the hook runs on; tests hand it a synthetic one.
 */
export const decide = ({
  agentContext,
  host = liveHost(),
  payload,
  policy
}) => {
  if (isSwitchedOff({ env: host.env, policy })) return undefined
  const tool = payload?.tool_name
  if (!FILE_TOOLS.includes(tool)) return undefined
  const actor = actorFor({ agentContext, payload })
  try {
    return judge({ actor, host, payload, policy, tool })
  } catch (error) {
    const denied = POLICED.includes(actor.kind)
    const reason = guardError({
      actor,
      denied,
      problem: String(error?.message ?? error),
      tool
    })
    return denied ? deny({ reason }) : ask({ reason })
  }
}
