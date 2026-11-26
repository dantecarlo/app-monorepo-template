// ---------------------------------------------------------------------------
// hooks-projection — reads `.agents/hooks.json`, the neutral source of the
// runtime hooks, and renders each runtime's wiring of them. Today that is
// Claude Code only: `.claude/settings.json`, whose PreToolUse hooks run the
// write guard (scripts/agent-harness/write-guard/claude-hook.mjs) and the
// no-force hook (scripts/agent-harness/no-force/claude-hook.mjs) and whose
// SessionStart hooks run the process reaper
// (scripts/agent-harness/reaper/session-start.mjs). A PreToolUse hook names
// the tools it runs on in its matcher; a SessionStart hook may leave the
// matcher out, and then runs on every start, resume, clear and compaction.
// Codex and OpenCode get their adapters in later slices, each after a live
// test.
//
// `.claude/settings.json` is a projection like the agent files: the
// generator writes it and `pnpm agent-harness:projection-check` fails a hand
// edit. A project's own permissions go in the git-ignored
// `.claude/settings.local.json`.
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const HOOKS_SOURCE = '.agents/hooks.json'
export const CLAUDE_SETTINGS = '.claude/settings.json'

const SETTINGS_SCHEMA =
  'https://json.schemastore.org/claude-code-settings.json'
const JSON_INDENT = 2

// The schema is CLOSED, as the agent sources' is: exactly these keys, each
// required, but the events of MATCHER_OPTIONAL may leave the matcher out.
const HOOK_KEYS = ['event', 'matcher', 'name', 'script', 'timeout']
const EVENTS = ['PreToolUse', 'SessionStart']
const MATCHER_OPTIONAL = ['SessionStart']
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
// A repository-relative script under scripts/, with nothing a quoted shell
// argument would end on and no `..` segment.
const SCRIPT = /^scripts\/(?:[\w.-]+\/)*[\w.-]+\.mjs$/u
const PARENT_SEGMENT = /(?:^|\/)\.\.(?:\/|$)/u

const problemOf = ({ hook }) => {
  if (hook === null || typeof hook !== 'object' || Array.isArray(hook)) {
    return 'a hook must be an object'
  }
  const keys = Object.keys(hook).sort()
  const unknown = keys.filter((key) => !HOOK_KEYS.includes(key))
  if (unknown.length > 0) return `unknown key ${unknown.join(', ')}`
  const matcherOptional = MATCHER_OPTIONAL.includes(hook.event)
  const missing = HOOK_KEYS.filter(
    (key) =>
      hook[key] === undefined && !(key === 'matcher' && matcherOptional)
  )
  if (missing.length > 0) return `missing ${missing.join(', ')}`
  if (!NAME.test(hook.name)) return `name ${hook.name} is not kebab-case`
  if (!EVENTS.includes(hook.event)) {
    return `event ${hook.event} is not one of ${EVENTS.join(', ')}`
  }
  if (
    hook.matcher !== undefined &&
    (typeof hook.matcher !== 'string' || hook.matcher.trim() === '')
  ) {
    return matcherOptional
      ? 'a matcher, when given, must not be blank'
      : 'matcher must name the tools it runs on'
  }
  if (
    typeof hook.script !== 'string' ||
    !SCRIPT.test(hook.script) ||
    PARENT_SEGMENT.test(hook.script)
  ) {
    return `script ${hook.script} must be a .mjs file under scripts/`
  }
  return Number.isInteger(hook.timeout) && hook.timeout > 0
    ? null
    : `timeout ${hook.timeout} must be a positive whole number of seconds`
}

/**
 * The hooks of `.agents/hooks.json`, or null when the checkout has none.
 * A source that does not parse, or a hook outside the closed schema, throws
 * naming the file, so the generator writes nothing from it.
 */
export const readHookSource = ({ root }) => {
  const path = join(root, HOOKS_SOURCE)
  if (!existsSync(path)) return null
  let parsed
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    throw new Error(`${HOOKS_SOURCE} does not parse: ${error.message}`)
  }
  const hooks = parsed?.hooks
  if (!Array.isArray(hooks) || hooks.length === 0) {
    throw new Error(`${HOOKS_SOURCE} holds no non-empty "hooks" list`)
  }
  hooks.forEach((hook, index) => {
    const problem = problemOf({ hook })
    if (problem !== null) {
      throw new Error(`${HOOKS_SOURCE} hooks[${index}]: ${problem}`)
    }
  })
  return hooks
}

// `${CLAUDE_PROJECT_DIR}` is Claude Code's own variable for the checkout the
// session started in, so the hook runs from the main checkout whatever the
// working directory of the call; the quotes hold a path with spaces.
const commandOf = ({ script }) => `node "\${CLAUDE_PROJECT_DIR}/${script}"`

export const renderClaudeSettings = ({ hooks }) => {
  const byEvent = {}
  hooks.forEach(({ event, matcher, script, timeout }) => {
    byEvent[event] ??= []
    const hooks = [{ type: 'command', command: commandOf({ script }), timeout }]
    byEvent[event].push(matcher === undefined ? { hooks } : { matcher, hooks })
  })
  return `${JSON.stringify(
    { $schema: SETTINGS_SCHEMA, hooks: byEvent },
    null,
    JSON_INDENT
  )}\n`
}

export const renderHooksProjection = ({ root }) => {
  const hooks = readHookSource({ root })
  return hooks === null
    ? new Map()
    : new Map([[CLAUDE_SETTINGS, renderClaudeSettings({ hooks })]])
}
