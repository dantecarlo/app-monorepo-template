// ---------------------------------------------------------------------------
// decide — the write guard's decision engine, written once for every
// runtime. Each runtime's adapter (claude-hook.mjs for Claude Code) reads its
// own payload, calls `decide`, and prints the verdict its runtime reads.
//
// It judges the file tools (Edit, Write, NotebookEdit), Bash and PowerShell:
//
//   | Target or input             | Read-only | Surface agent | Writer, main, |
//   |                             |           |               | unlisted      |
//   | scratch or a sink           | —         | —             | —             |
//   | rule file                   | deny      | ask           | ask           |
//   | surface path, no rule       | n/a       | —             | —             |
//   | other path                  | deny      | deny          | —             |
//   | Bash it cannot read         | deny      | deny          | ask if it     |
//   |                             |           |               | names a rule  |
//   | PowerShell                  | deny      | deny          | ask on a      |
//   |                             |           |               | write cmdlet  |
//   |                             |           |               | naming a rule |
//   | guard error                 | deny      | deny          | ask           |
//
//   | Agent context unreadable    | deny for every subagent, writers too;   |
//   |                             | the main session is judged as above     |
//
// "—" prints nothing. The guard never allows: it only asks or refuses, and
// otherwise leaves the call to the runtime's own permissions. A deny wins
// over an ask, and an ask over nothing; the main session is never refused.
// A path is read the same whichever tool writes it (target.mjs): against
// every checkout that holds it and the home folder, with every Windows
// spelling paths.mjs reads. A Bash command is read by shell.mjs, which finds
// the paths it writes and the programs whose writes it cannot read; those
// are refused to a read-only agent and, for anyone else, asked about only
// when the command names a rule path (mentions.mjs). PowerShell is not
// parsed (powershell.mjs). An error, a path spelling paths.mjs cannot read
// among them, refuses a policed agent (read-only, surface, or one whose
// entry cannot be read) and asks anyone else. `ATL_WRITE_GUARD=off` (the
// policy's switchOff) silences it all.
// ---------------------------------------------------------------------------

import { namedRule } from './mentions.mjs'
import { liveHost } from './paths.mjs'
import {
  ACTOR_KIND,
  actorFor,
  assertPolicy,
  isSwitchedOff
} from './policy.mjs'
import { judgePowerShell } from './powershell.mjs'
import { askReason, denyReason, guardError } from './reasons.mjs'
import { judgeBash } from './shell.mjs'
import { judgeTarget, LEVEL } from './target.mjs'

// The key each file tool names its target with. A key another tool uses is
// never read: a stray `file_path` beside a NotebookEdit's `notebook_path`
// names nothing that tool writes.
const TARGET_KEY = Object.freeze({
  Edit: 'file_path',
  NotebookEdit: 'notebook_path',
  Write: 'file_path'
})

export const FILE_TOOLS = Object.freeze(Object.keys(TARGET_KEY).sort())

export const SHELL_TOOLS = Object.freeze(['Bash', 'PowerShell'])

const BASH = 'Bash'

export const VERDICT = Object.freeze({ ask: 'ask', deny: 'deny' })

// Well inside the hook's 10 s timeout: a hook that times out lets the call
// through, so a call past this deadline is judged an error instead.
const DEADLINE_MS = 5000

// The host of one call: its cache of classified targets, and the deadline
// paths.cachedClassify holds it to, read by its clock (`now`, Date.now on
// the live host).
const forOneCall = ({ host }) => {
  const now = host.now ?? Date.now
  return { ...host, cache: new Map(), deadline: now() + DEADLINE_MS, now }
}

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

const commandOf = ({ payload }) => {
  const command = payload.tool_input?.command
  if (typeof command !== 'string') {
    throw new Error('the call names no command')
  }
  return command
}

const cwdOf = ({ payload }) => {
  const { cwd } = payload
  if (cwd !== undefined && typeof cwd !== 'string') {
    throw new Error('the payload cwd is not a string')
  }
  return cwd
}

// The finding for one call, and the text a reason quotes from it.
const findingOf = ({ actor, cwd, host, payload, policy, tool }) => {
  if (FILE_TOOLS.includes(tool)) {
    const text = targetOf({ payload, tool })
    const found = judgeTarget({
      actor,
      contained: true,
      cwd,
      host,
      policy,
      text
    })
    return { finding: found && { ...found, shape: text } }
  }
  const command = commandOf({ payload })
  const judge = tool === BASH ? judgeBash : judgePowerShell
  return {
    command,
    finding: judge({
      actor,
      command,
      cwd: cwd ?? host.ownRoot,
      host,
      policy
    })
  }
}

// The first opaque finding `finding` stands for whose words name a rule
// path, with the rule they name: an unknown program is read by its own
// words, anything else by the whole command. Each text is read once.
const namedOpaque = ({ command, cwd, finding, host, policy }) => {
  const read = new Set()
  for (const one of finding.opaques ?? [finding]) {
    const text = one.words?.join(' ') ?? command
    if (read.has(text)) continue
    read.add(text)
    const named = namedRule({ cwd, host, policy, text })
    if (named !== undefined) return { finding: one, named }
  }
  return undefined
}

const judge = ({ actor, host, payload, policy, tool }) => {
  if (actor.kind === ACTOR_KIND.unknown) throw new Error(actor.problem)
  assertPolicy({ policy })
  const cwd = cwdOf({ payload })
  const { command, finding } = findingOf({
    actor,
    cwd,
    host,
    payload,
    policy,
    tool
  })
  if (finding === undefined) return undefined
  // A read-only agent is refused whatever the guard cannot settle.
  if (
    finding.level === LEVEL.deny ||
    (finding.level === LEVEL.opaque && actor.kind === ACTOR_KIND.readOnly)
  ) {
    return deny({ reason: denyReason({ actor, finding, tool }) })
  }
  const asked =
    finding.level === LEVEL.ask
      ? { finding, named: finding.named }
      : namedOpaque({
          command,
          cwd: cwd ?? host.ownRoot,
          finding,
          host,
          policy
        })
  if (asked === undefined) return undefined
  return ask({
    reason: askReason({
      actor,
      command,
      finding: asked.finding,
      named: asked.named,
      tool
    })
  })
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
  if (!FILE_TOOLS.includes(tool) && !SHELL_TOOLS.includes(tool)) {
    return undefined
  }
  const actor = actorFor({ agentContext, payload })
  try {
    return judge({
      actor,
      host: forOneCall({ host }),
      payload,
      policy,
      tool
    })
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
