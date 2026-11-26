#!/usr/bin/env node
// ---------------------------------------------------------------------------
// claude-hook — end to end: the real hook as Claude Code runs it, a
// PreToolUse payload on stdin and the committed policy and agent context of
// this checkout. The broken-guard cases run a copy of the hook from a
// scratch tree in the OS temp directory, which `withScratchTree` removes;
// the junction case builds its own scratch tree and removes it. No case
// imports the hook: each spawns it, and each checks it never prints allow
// (claude-hook.fixtures.mjs). The shell tools are claude-hook.shell.test.mjs's.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/claude-hook.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { mkdirSync, readdirSync, readFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { withScratchTree } from '../../gate/scratch.mjs'
import {
  GUARD_DIRECTORY,
  HOOK,
  LOADED_MODULES,
  payloadFor,
  rawHookOutput,
  REPO_ROOT,
  spawnHook
} from './claude-hook.fixtures.mjs'
import { AGENT_CONTEXT_FILE, POLICY_FILE, SWITCH_OFF } from './policy.mjs'

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

for (const module of [
  `${GUARD_DIRECTORY}/policy.mjs`,
  'scripts/manifest.mjs',
  'scripts/manifest-owners.mjs'
]) {
  test(`END TO END: ATL_WRITE_GUARD=off still silences a hook whose ${module} cannot load`, () => {
    withScratchTree({
      files: {
        ...brokenPolicyTree(),
        [POLICY_FILE]: readFileSync(join(REPO_ROOT, POLICY_FILE), 'utf8'),
        [module]: "throw new Error('cannot load')\n"
      },
      prefix: 'write-guard-hook-',
      use: ({ root }) => {
        const hook = join(root, GUARD_DIRECTORY, 'claude-hook.mjs')
        const input = payloadFor({
          agent: 'validator',
          cwd: root,
          filePath: join(root, 'AGENTS.md')
        })
        assert.equal(
          spawnHook({ hook, input })?.permissionDecision,
          'deny'
        )
        assert.equal(
          spawnHook({
            env: { [SWITCH_OFF.variable]: SWITCH_OFF.value },
            hook,
            input
          }),
          null
        )
      }
    })
  })
}

test('the hook reads the switch-off the policy names, before it imports it', () => {
  withScratchTree({
    files: {
      ...brokenPolicyTree(),
      [POLICY_FILE]: readFileSync(join(REPO_ROOT, POLICY_FILE), 'utf8'),
      [`${GUARD_DIRECTORY}/policy.mjs`]: "throw new Error('cannot load')\n"
    },
    prefix: 'write-guard-hook-',
    use: ({ root }) => {
      const hook = join(root, GUARD_DIRECTORY, 'claude-hook.mjs')
      const input = payloadFor({
        agent: 'validator',
        cwd: root,
        filePath: join(root, 'docs', 'a.md')
      })
      assert.equal(
        spawnHook({
          env: { [SWITCH_OFF.variable]: SWITCH_OFF.value },
          hook,
          input
        }),
        null
      )
      assert.equal(
        spawnHook({ env: { [SWITCH_OFF.variable]: 'on' }, hook, input })
          ?.permissionDecision,
        'deny'
      )
    }
  })
})

// On a Node with no import.meta.main the entry must still run: a hook that
// runs nothing lets every call through. The copy spells it as that Node
// sees it.
test('END TO END: a hook on a Node without import.meta.main still judges the call', () => {
  const entry = readFileSync(HOOK, 'utf8')
  const spellings = entry.split('import.meta.main').length - 1
  assert.equal(spellings, 1, 'the entry reads import.meta.main once')
  withScratchTree({
    files: {
      ...brokenPolicyTree(),
      [POLICY_FILE]: readFileSync(join(REPO_ROOT, POLICY_FILE), 'utf8'),
      [`${GUARD_DIRECTORY}/claude-hook.mjs`]: entry.replace(
        'import.meta.main',
        'undefined'
      )
    },
    prefix: 'write-guard-hook-',
    use: ({ root }) => {
      // The scratch tree is no checkout, so the target is this one's.
      const output = spawnHook({
        hook: join(root, GUARD_DIRECTORY, 'claude-hook.mjs'),
        input: payloadFor({ filePath: join(REPO_ROOT, 'AGENTS.md') })
      })
      assert.equal(output?.permissionDecision, 'ask')
    }
  })
})

// A junction is a link the file tools write through. Removing the scratch
// tree removes the junctions, never what they point at.
test('Given a junction to a rule folder, when the main session or a read-only agent writes through it, then the guard asks or refuses', () => {
  withScratchTree({
    files: { 'repo/.agents/contracts/write-guard.json': '{}' },
    prefix: 'write-guard-junction-',
    use: ({ root: scratch }) => {
      const repo = join(scratch, 'repo')
      mkdirSync(join(repo, '.git'))
      symlinkSync(
        join(repo, '.agents', 'contracts'),
        join(repo, 'notes'),
        'junction'
      )
      symlinkSync(
        join(repo, '.agents'),
        join(scratch, 'into-agents'),
        'junction'
      )
      assert.equal(
        spawnHook({
          input: payloadFor({
            cwd: repo,
            filePath: join(repo, 'notes', 'write-guard.json')
          })
        })?.permissionDecision,
        'ask'
      )
      assert.equal(
        spawnHook({
          input: payloadFor({
            agent: 'validator',
            cwd: repo,
            filePath: join(
              scratch,
              'into-agents',
              'contracts',
              'write-guard.json'
            )
          })
        })?.permissionDecision,
        'deny'
      )
    }
  })
})

// Every case asserts it through spawnHook too; this one runs its own calls,
// so it holds whichever cases run beside it.
test('END TO END: the hook never prints allow', () => {
  const printed = [
    payloadFor({ filePath: join(REPO_ROOT, 'AGENTS.md') }),
    payloadFor({ filePath: join(REPO_ROOT, 'docs', 'notes.md') }),
    payloadFor({
      agent: 'validator',
      filePath: join(REPO_ROOT, 'docs', 'notes.md')
    }),
    payloadFor({
      agent: 'validator',
      filePath: join(tmpdir(), 'write-guard-probe.log')
    })
  ].map((input) => rawHookOutput({ input }))
  assert.ok(
    printed.some((output) => output !== ''),
    'no verdict printed'
  )
  assert.deepEqual(
    printed.filter((output) => output.includes('"allow"')),
    []
  )
})
