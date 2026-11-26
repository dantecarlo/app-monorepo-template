// ---------------------------------------------------------------------------
// decide — the no-force hook's verdict on one PreToolUse payload
// ({ tool_name, tool_input }): a deny for a Bash or PowerShell command that
// forces or skips a check (bash.mjs, powershell.mjs), with a reason that
// names the LAW "A check is never forced or skipped" (AGENTS.md), and
// undefined for every other call, so the session's own permissions still
// apply.
//
// The one exception the LAW registers, `taskkill /F` in the process
// reaper and `packages/tooling/src/process-tree.mjs`, runs inside code a
// tool call never types, so nothing here exempts it.
// ---------------------------------------------------------------------------

import { bashForce } from './bash.mjs'
import { powershellForce } from './powershell.mjs'

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

/** The verdict on the PreToolUse `payload`, or undefined. */
export const decide = ({ payload }) => {
  const read = Object.hasOwn(READERS, payload?.tool_name ?? '')
    ? READERS[payload.tool_name]
    : undefined
  const command = payload?.tool_input?.command
  if (read === undefined || typeof command !== 'string') return undefined
  const finding = read({ command })
  return finding === undefined
    ? undefined
    : { decision: DENY, reason: reasonOf({ finding }) }
}
