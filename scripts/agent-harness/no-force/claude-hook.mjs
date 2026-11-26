#!/usr/bin/env node
// ---------------------------------------------------------------------------
// claude-hook — the Claude Code adapter of the no-force hook, the agent
// hook of the LAW "A check is never forced or skipped" (AGENTS.md): a
// PreToolUse hook, wired by `.claude/settings.json`, which
// `pnpm agent-harness:generate` renders from `.agents/hooks.json` (matcher
// `Bash|PowerShell`).
//
// It reads the PreToolUse payload on stdin ({ tool_name, tool_input }),
// asks `decide` and prints `hookSpecificOutput.permissionDecision: deny`
// with its reason when the command forces or skips a check. It prints
// nothing for any other call, and never `allow`, so the session's own
// permissions still apply. Stdin that is not a JSON object prints nothing.
// It spawns nothing and reads no file but its own modules.
//
// It fails closed, as the write guard does: a hook that broke would let
// every force and skip through unseen. When its engine cannot load or
// throws, it denies the call with one line naming the error and the one
// recovery, Claude Code's own `"disableAllHooks": true` in the git-ignored
// `.claude/settings.local.json`.
//
// Usage (Claude Code runs it):
//   node "${CLAUDE_PROJECT_DIR}/scripts/agent-harness/no-force/claude-hook.mjs"
// ---------------------------------------------------------------------------

const EVENT = 'PreToolUse'

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

// The crash path's verdict, spelled here because the engine that would
// give it may be the module that failed to load.
const CRASH_DENY = 'deny'

const crashLine = ({ error }) =>
  renderVerdict({
    verdict: {
      decision: CRASH_DENY,
      reason:
        `The no-force hook failed (${String(error?.message ?? error)}), so ` +
        'it refuses this call. Fix scripts/agent-harness/no-force/, or set ' +
        '"disableAllHooks": true in .claude/settings.local.json.'
    }
  })

/**
 * What the hook prints for the stdin `text`: a verdict, one crash line, or
 * nothing. `load` imports the engine.
 */
export const answer = async ({ load, text }) => {
  const payload = readPayload({ text })
  if (payload === undefined) return ''
  try {
    const { decide } = await load()
    const verdict = decide({ payload })
    return verdict === undefined ? '' : renderVerdict({ verdict })
  } catch (error) {
    return crashLine({ error })
  }
}

const main = async () => {
  try {
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    const out = await answer({
      load: () => import('./decide.mjs'),
      text: Buffer.concat(chunks).toString('utf8')
    })
    if (out !== '') process.stdout.write(out)
  } catch (error) {
    process.stdout.write(crashLine({ error }))
  }
}

// A Node that sets no `main` on import.meta (before 24.2.0) still runs the
// hook; only an importer, for which it is false, skips it.
if (import.meta.main !== false) await main()
