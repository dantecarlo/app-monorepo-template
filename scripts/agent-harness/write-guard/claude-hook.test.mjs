#!/usr/bin/env node
// ---------------------------------------------------------------------------
// claude-hook — end to end: the real hook as Claude Code runs it, a
// PreToolUse payload on stdin and the committed policy and agent context of
// this checkout. The broken-policy case runs a copy of the hook from a
// scratch tree in the OS temp directory, which `withScratchTree` removes.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/claude-hook.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { withScratchTree } from '../../gate/scratch.mjs'
import { AGENT_CONTEXT_FILE, POLICY_FILE, SWITCH_OFF } from './policy.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const HOOK = join(HERE, 'claude-hook.mjs')
const REPO_ROOT = resolve(HERE, '..', '..', '..')
const GUARD_DIRECTORY = 'scripts/agent-harness/write-guard'
// The modules outside the guard's folder that it loads: its glob reader.
const LOADED_MODULES = [
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

const outputs = []

const spawnHook = ({ env = {}, hook = HOOK, input }) => {
  const result = spawnSync(process.execPath, [hook], {
    encoding: 'utf8',
    env: { ...CLEAN_ENV, ...env },
    input
  })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stderr, '')
  outputs.push(result.stdout)
  return result.stdout === ''
    ? null
    : JSON.parse(result.stdout).hookSpecificOutput
}

const payloadFor = ({
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

test('END TO END: the main session is asked before it writes AGENTS.md', () => {
  const output = spawnHook({
    input: payloadFor({ filePath: join(REPO_ROOT, 'AGENTS.md') })
  })
  assert.equal(output?.hookEventName, 'PreToolUse')
  assert.equal(output.permissionDecision, 'ask')
  assert.match(output.permissionDecisionReason, /AGENTS\.md/)
  assert.match(
    output.permissionDecisionReason,
    /"A rule is not edited to fit the work"/
  )
})

for (const tool of ['Edit', 'NotebookEdit']) {
  test(`END TO END: ${tool} of a rule file asks the main session too`, () => {
    const output = spawnHook({
      input: payloadFor({
        filePath: join(REPO_ROOT, '.claude', 'skills', 'sdd', 'SKILL.md'),
        tool
      })
    })
    assert.equal(output?.permissionDecision, 'ask')
  })
}

test('END TO END: the main session writes a file no rule names, and the hook prints nothing', () => {
  assert.equal(
    spawnHook({
      input: payloadFor({ filePath: join(REPO_ROOT, 'docs', 'notes.md') })
    }),
    null
  )
})

test('END TO END: a validator write into the repository is denied', () => {
  const output = spawnHook({
    input: payloadFor({
      agent: 'validator',
      filePath: join(REPO_ROOT, 'docs', 'notes.md')
    })
  })
  assert.equal(output?.permissionDecision, 'deny')
  assert.match(output.permissionDecisionReason, /validator is read-only/)
})

test('END TO END: a validator write under the OS temp dir prints nothing', () => {
  assert.equal(
    spawnHook({
      input: payloadFor({
        agent: 'validator',
        filePath: join(tmpdir(), 'write-guard-probe.log')
      })
    }),
    null
  )
})

test('END TO END: sdd-steward is asked before a rule file and left alone elsewhere', () => {
  assert.equal(
    spawnHook({
      input: payloadFor({
        agent: 'sdd-steward',
        filePath: join(REPO_ROOT, 'AGENTS.md')
      })
    })?.permissionDecision,
    'ask'
  )
  assert.equal(
    spawnHook({
      input: payloadFor({
        agent: 'sdd-steward',
        filePath: join(REPO_ROOT, 'openspec', 'changes', 'x', 'tasks.md')
      })
    }),
    null
  )
})

for (const input of ['refs/heads/x 2a35076', '', '42', 'null']) {
  test(`END TO END: stdin that is not a JSON payload prints nothing: ${JSON.stringify(input)}`, () => {
    assert.equal(spawnHook({ input }), null)
  })
}

test('END TO END: ATL_WRITE_GUARD=off prints nothing', () => {
  assert.equal(
    spawnHook({
      env: { [SWITCH_OFF.variable]: SWITCH_OFF.value },
      input: payloadFor({
        agent: 'validator',
        filePath: join(REPO_ROOT, 'AGENTS.md')
      })
    }),
    null
  )
})

test('END TO END: a Bash command prints nothing in this slice', () => {
  assert.equal(
    spawnHook({
      input: JSON.stringify({
        agent_type: 'validator',
        cwd: REPO_ROOT,
        tool_input: { command: 'echo x > AGENTS.md' },
        tool_name: 'Bash'
      })
    }),
    null
  )
})

// The hook and every module it loads, copied at their own paths, with
// the committed agent context and a policy that does not parse.
const brokenPolicyTree = () => ({
  ...Object.fromEntries(
    readdirSync(join(REPO_ROOT, GUARD_DIRECTORY))
      .filter(
        (entry) => entry.endsWith('.mjs') && !entry.includes('.test.')
      )
      .map((entry) => [
        `${GUARD_DIRECTORY}/${entry}`,
        readFileSync(join(REPO_ROOT, GUARD_DIRECTORY, entry), 'utf8')
      ])
  ),
  ...Object.fromEntries(
    LOADED_MODULES.map((path) => [
      path,
      readFileSync(join(REPO_ROOT, path), 'utf8')
    ])
  ),
  [AGENT_CONTEXT_FILE]: readFileSync(
    join(REPO_ROOT, AGENT_CONTEXT_FILE),
    'utf8'
  ),
  [POLICY_FILE]: '{ "ruleFiles": '
})

test('END TO END: a policy that does not parse asks the main session and refuses the validator', () => {
  withScratchTree({
    files: brokenPolicyTree(),
    prefix: 'write-guard-hook-',
    use: ({ root }) => {
      const hook = join(root, GUARD_DIRECTORY, 'claude-hook.mjs')
      const main = spawnHook({
        hook,
        input: payloadFor({
          cwd: root,
          filePath: join(root, 'docs', 'a.md')
        })
      })
      assert.equal(main?.permissionDecision, 'ask')
      assert.match(main.permissionDecisionReason, /could not judge/)
      assert.match(main.permissionDecisionReason, /write-guard\.json/)
      const validator = spawnHook({
        hook,
        input: payloadFor({
          agent: 'validator',
          cwd: root,
          filePath: join(root, 'docs', 'a.md')
        })
      })
      assert.equal(validator?.permissionDecision, 'deny')
    }
  })
})

test('END TO END: an engine that fails to load asks the main session and refuses the validator', () => {
  withScratchTree({
    files: {
      ...brokenPolicyTree(),
      [POLICY_FILE]: readFileSync(join(REPO_ROOT, POLICY_FILE), 'utf8'),
      [`${GUARD_DIRECTORY}/decide.mjs`]: 'export const decide = ('
    },
    prefix: 'write-guard-hook-',
    use: ({ root }) => {
      const hook = join(root, GUARD_DIRECTORY, 'claude-hook.mjs')
      const input = ({ agent }) =>
        payloadFor({
          agent,
          cwd: root,
          filePath: join(root, 'docs', 'a.md')
        })
      const main = spawnHook({ hook, input: input({}) })
      assert.equal(main?.permissionDecision, 'ask')
      assert.match(main.permissionDecisionReason, /crashed/)
      assert.equal(
        spawnHook({ hook, input: input({ agent: 'validator' }) })
          ?.permissionDecision,
        'deny'
      )
      assert.equal(
        spawnHook({
          env: { [SWITCH_OFF.variable]: SWITCH_OFF.value },
          hook,
          input: input({ agent: 'validator' })
        }),
        null
      )
    }
  })
})

test('END TO END: the hook never prints allow', () => {
  assert.ok(outputs.length > 0, 'no case ran the hook')
  assert.deepEqual(
    outputs.filter((output) => output.includes('"allow"')),
    []
  )
})
