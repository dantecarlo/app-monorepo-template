// ---------------------------------------------------------------------------
// claude-hook.fixtures — what the end-to-end suites of the Claude Code hook
// share: where the hook and this checkout are, an environment without a
// switch-off a developer may have exported, the spawn that runs the real
// hook and checks it exits 0, writes nothing on stderr and never prints
// allow, and the PreToolUse payloads of a file tool and of a shell tool.
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SWITCH_OFF } from './policy.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
export const HOOK = join(HERE, 'claude-hook.mjs')
export const REPO_ROOT = resolve(HERE, '..', '..', '..')
export const GUARD_DIRECTORY = 'scripts/agent-harness/write-guard'
// The modules outside the guard's folder that it loads: its glob reader.
export const LOADED_MODULES = [
  'scripts/manifest.mjs',
  'scripts/manifest-owners.mjs'
]

// The environment the hook starts in, without a switch-off a developer may
// have exported.
const CLEAN_ENV = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => key !== SWITCH_OFF.variable
  )
)

// What the hook prints, after it exits 0 with nothing on stderr.
export const rawHookOutput = ({ env = {}, hook = HOOK, input }) => {
  const result = spawnSync(process.execPath, [hook], {
    encoding: 'utf8',
    env: { ...CLEAN_ENV, ...env },
    input
  })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
  return result.stdout
}

export const spawnHook = (call) => {
  const stdout = rawHookOutput(call)
  assert.ok(!stdout.includes('"allow"'), stdout)
  return stdout === '' ? null : JSON.parse(stdout).hookSpecificOutput
}

export const payloadFor = ({
  agent,
  cwd = REPO_ROOT,
  filePath,
  tool = 'Write'
}) =>
  JSON.stringify({
    ...(agent === undefined ? {} : { agent_type: agent }),
    cwd,
    hook_event_name: 'PreToolUse',
    session_id: 'write-guard-test',
    tool_input:
      tool === 'NotebookEdit'
        ? { new_source: 'x', notebook_path: filePath }
        : { content: 'x', file_path: filePath },
    tool_name: tool
  })

export const shellPayload = ({ agent, command, tool = 'Bash' }) =>
  JSON.stringify({
    ...(agent === undefined ? {} : { agent_type: agent }),
    cwd: REPO_ROOT,
    hook_event_name: 'PreToolUse',
    session_id: 'write-guard-test',
    tool_input: { command },
    tool_name: tool
  })
