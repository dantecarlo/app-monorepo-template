#!/usr/bin/env node
// ---------------------------------------------------------------------------
// claude-hook — the Claude Code adapter of the write guard: a PreToolUse
// hook, wired by `.claude/settings.json`, which `pnpm agent-harness:generate`
// renders from `.agents/hooks.json` (matcher
// `Bash|PowerShell|Edit|Write|NotebookEdit`).
//
// It reads the PreToolUse payload on stdin ({ agent_type, cwd, tool_name,
// tool_input }), the policy and the agent context of the checkout it runs
// from (`${CLAUDE_PROJECT_DIR}`, the main checkout), asks `decide`, and
// prints `hookSpecificOutput.permissionDecision` with its reason. It prints
// nothing when the guard has nothing to say, and never `allow`, so the
// session's own permissions still apply. Stdin that is not a JSON object
// prints nothing. It spawns nothing and reads no network.
//
// No environment variable switches it off. The engine is imported inside a
// `try`: a hook that crashes, or whose module fails to load, lets the call
// run, so a failure here still refuses a subagent and asks the main
// session. The one way out is Claude Code's own: `"disableAllHooks": true`
// in the git-ignored `.claude/settings.local.json`, which the crash reason
// names.
//
// Usage (Claude Code runs it):
//   node "${CLAUDE_PROJECT_DIR}/scripts/agent-harness/write-guard/claude-hook.mjs"
// ---------------------------------------------------------------------------

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const OWN_ROOT = resolve(HERE, '..', '..', '..')
const EVENT = 'PreToolUse'

// The verdicts of the crash path, spelled here because the engine that
// exports them may be the module that failed to load. This file imports no
// module of the guard at its top, so nothing can fail to load before the
// `try` that catches it.
const CRASH_DENY = 'deny'
const CRASH_ASK = 'ask'

const readPayload = ({ text }) => {
  try {
    const payload = JSON.parse(text)
    return payload !== null &&
      typeof payload === 'object' &&
      !Array.isArray(payload)
      ? payload
      : undefined
  } catch {
    return undefined
  }
}

const renderVerdict = ({ verdict }) =>
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: EVENT,
      permissionDecision: verdict.decision,
      permissionDecisionReason: verdict.reason
    }
  })

const engineVerdict = async ({ payload }) => {
  const { decide } = await import('./decide.mjs')
  const { liveHost } = await import('./paths.mjs')
  const { loadGuardFiles } = await import('./policy.mjs')
  return decide({
    ...loadGuardFiles({ root: OWN_ROOT }),
    host: liveHost({ ownRoot: OWN_ROOT }),
    payload
  })
}

const crashVerdict = ({ error, payload }) => ({
  decision:
    typeof payload.agent_type === 'string' ? CRASH_DENY : CRASH_ASK,
  reason:
    `The write guard crashed (${String(error?.message ?? error)}), so it ` +
    `does not let this ${String(payload.tool_name)} run unasked. Fix ` +
    'scripts/agent-harness/write-guard/, or, if the owner agrees, set ' +
    '"disableAllHooks": true in the git-ignored .claude/settings.local.json, ' +
    'which switches every Claude Code hook off.'
})

const main = async () => {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  const payload = readPayload({
    text: Buffer.concat(chunks).toString('utf8')
  })
  if (payload === undefined) return
  let verdict
  try {
    verdict = await engineVerdict({ payload })
  } catch (error) {
    verdict = crashVerdict({ error, payload })
  }
  if (verdict !== undefined) {
    process.stdout.write(renderVerdict({ verdict }))
  }
}

// A Node that sets no `main` on import.meta (before 24.2.0) still runs the
// hook: skipping it would let every call through. Only an importer, for
// which it is false, skips it; the tests spawn the hook and never import it.
if (import.meta.main !== false) await main()
