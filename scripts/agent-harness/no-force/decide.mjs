// ---------------------------------------------------------------------------
// decide — the no-force hook's verdict on one PreToolUse payload
// ({ tool_name, tool_input }): a deny for a Bash or PowerShell command that
// forces or skips a check (command.mjs), with a reason that names the LAW
// "A check is never forced or skipped" (AGENTS.md), and undefined for every
// other call, so the session's own permissions still apply.
//
// It fails closed: a Bash or PowerShell call it cannot read, because it
// names no command or nests past what the reader reads, is denied too,
// with a reason that names the one recovery, Claude Code's own
// `"disableAllHooks": true`. A tool it does not judge gets no verdict:
// the hook's matcher already keeps it to Bash and PowerShell.
//
// The one exception the LAW registers, `taskkill /F` in the process
// reaper and `packages/tooling/src/process-tree.mjs`, runs inside code a
// tool call never types, so nothing here exempts it.
// ---------------------------------------------------------------------------

import { bashForce, powershellForce } from './command.mjs'

export const LAW = 'A check is never forced or skipped'
const DENY = 'deny'
const READERS = Object.freeze({
  Bash: bashForce,
  PowerShell: powershellForce
})

const reasonOf = ({ finding }) =>
  `\`${finding.program}\` passes \`${finding.option}\`, which forces or ` +
  `skips a check, and the LAW "${LAW}" (AGENTS.md) refuses it. A force ` +
  'overrides the refusal a tool raised to protect something, and a skip ' +
  'jumps the check that would have raised it; that refusal or check is ' +
  'the finding: read why and fix its cause. If it looks wrong, say so ' +
  'and stop: the owner decides.'

/** The reason of a deny for a call the hook cannot read. */
export const unreadableReason = ({ problem }) =>
  `The no-force hook cannot read this call (${problem}), so it refuses ` +
  `it rather than let a force or skip through unseen, which the LAW ` +
  `"${LAW}" (AGENTS.md) forbids. Write the command so it reads: ` +
  'flatter, with fewer wrappers. If the owner agrees, set ' +
  '"disableAllHooks": true in the git-ignored .claude/settings.local.json, ' +
  'which switches every Claude Code hook off.'

const NO_COMMAND = 'the call names no command'

/** The verdict on the PreToolUse `payload`, or undefined. */
export const decide = ({ payload }) => {
  const tool = payload?.tool_name
  const read =
    typeof tool === 'string' && Object.hasOwn(READERS, tool)
      ? READERS[tool]
      : undefined
  if (read === undefined) return undefined
  const command = payload.tool_input?.command
  const finding =
    typeof command === 'string'
      ? read({ command })
      : { unreadable: NO_COMMAND }
  if (finding === undefined) return undefined
  return {
    decision: DENY,
    reason:
      finding.unreadable === undefined
        ? reasonOf({ finding })
        : unreadableReason({ problem: finding.unreadable })
  }
}
