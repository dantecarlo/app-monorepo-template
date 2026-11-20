#!/usr/bin/env node
// ---------------------------------------------------------------------------
// hooks-projection — `.agents/hooks.json`, the neutral hook source, and the
// Claude Code projection of it, `.claude/settings.json`. The checker judges
// the settings like every other projection: a hand edit, a deleted source
// and a missing output are each drift. The scratch trees sit in the OS temp
// directory (scripts/gate/scratch.mjs).
//
// Usage:
//   node --test scripts/agent-harness/hooks-projection.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { withScratchTree } from '../gate/scratch.mjs'
import { checkProjection } from './check.mjs'
import { generateProjection } from './generate.mjs'
import {
  CLAUDE_SETTINGS,
  HOOKS_SOURCE,
  readHookSource,
  renderClaudeSettings,
  renderHooksProjection
} from './hooks-projection.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..')

const REAPER = {
  event: 'SessionStart',
  name: 'process-reaper',
  script: 'scripts/agent-harness/reaper/session-start.mjs',
  timeout: 15
}

const HOOK = {
  event: 'PreToolUse',
  matcher: 'Edit|Write|NotebookEdit',
  name: 'write-guard',
  script: 'scripts/agent-harness/write-guard/claude-hook.mjs',
  timeout: 10
}

// The projector renders the agents too, so every scratch tree holds one.
const AGENT = {
  '.agents/agents/scratch-agent.agent.md': [
    '---',
    'name: scratch-agent',
    'description: A scratch agent used only by these tests.',
    'model: sonnet',
    'tools: Read',
    '---',
    '',
    '# Scratch',
    ''
  ].join('\n')
}

const sourceText = ({ hooks = [HOOK] } = {}) =>
  `${JSON.stringify({ hooks }, null, 2)}\n`

const inScratch = ({ files, use }) =>
  withScratchTree({
    files: { ...AGENT, ...files },
    prefix: 'agent-harness-hooks-',
    use
  })

test('the committed hook source renders the write guard for the Claude Code file tools', () => {
  const settings = JSON.parse(
    renderClaudeSettings({ hooks: readHookSource({ root: REPO_ROOT }) })
  )
  assert.deepEqual(settings.hooks.PreToolUse, [
      {
        hooks: [
          {
            command:
              'node "${CLAUDE_PROJECT_DIR}/scripts/agent-harness/write-guard/claude-hook.mjs"',
            timeout: 10,
            type: 'command'
          }
        ],
        matcher: 'Edit|Write|NotebookEdit'
      }
    ])
})

test('the committed hook source renders the reaper at session start, with no matcher', () => {
  const settings = JSON.parse(
    renderClaudeSettings({ hooks: readHookSource({ root: REPO_ROOT }) })
  )
  assert.deepEqual(Object.keys(settings.hooks), ['PreToolUse', 'SessionStart'])
  assert.deepEqual(settings.hooks.SessionStart, [
    {
      hooks: [
        {
          command:
            'node "${CLAUDE_PROJECT_DIR}/scripts/agent-harness/reaper/session-start.mjs"',
          timeout: 15,
          type: 'command'
        }
      ]
    }
  ])
})

test('a SessionStart hook may carry a matcher, which renders as given', () => {
  const settings = JSON.parse(
    renderClaudeSettings({ hooks: [{ ...REAPER, matcher: 'startup' }] })
  )
  assert.equal(settings.hooks.SessionStart[0].matcher, 'startup')
})

test('the committed .claude/settings.json is what its source renders', () => {
  assert.equal(
    readFileSync(join(REPO_ROOT, CLAUDE_SETTINGS), 'utf8').replaceAll(
      '\r\n',
      '\n'
    ),
    renderHooksProjection({ root: REPO_ROOT }).get(CLAUDE_SETTINGS)
  )
})

test('the settings render with the hook keys in the order Claude Code documents', () => {
  const text = renderClaudeSettings({ hooks: [HOOK] })
  assert.ok(text.indexOf('"matcher"') < text.indexOf('"hooks": ['), text)
  assert.ok(text.indexOf('"type"') < text.indexOf('"command"'), text)
  assert.ok(text.endsWith('}\n'))
})

test('hooks of one event share its list, in source order', () => {
  const settings = JSON.parse(
    renderClaudeSettings({
      hooks: [HOOK, { ...HOOK, matcher: 'Read', name: 'second' }]
    })
  )
  assert.deepEqual(
    settings.hooks.PreToolUse.map(({ matcher }) => matcher),
    ['Edit|Write|NotebookEdit', 'Read']
  )
})

test('a checkout with no hook source renders no settings', () => {
  inScratch({
    files: {},
    use: ({ root }) => {
      assert.equal(readHookSource({ root }), null)
      assert.equal(renderHooksProjection({ root }).size, 0)
    }
  })
})

for (const [name, hooks] of [
  ['an unknown key', [{ ...HOOK, runtime: 'claude' }]],
  ['a missing script', [{ ...HOOK, script: undefined }]],
  ['a script outside scripts/', [{ ...HOOK, script: '../x.mjs' }]],
  ['a script with a quote', [{ ...HOOK, script: 'scripts/a".mjs' }]],
  [
    'an event Claude Code has no slot for here',
    [{ ...HOOK, event: 'Stop' }]
  ],
  ['a blank matcher', [{ ...HOOK, matcher: ' ' }]],
  ['a PreToolUse hook with no matcher', [{ ...HOOK, matcher: undefined }]],
  ['a SessionStart hook with a blank matcher', [{ ...REAPER, matcher: '' }]],
  [
    'a timeout that is not a positive whole number',
    [{ ...HOOK, timeout: 0 }]
  ],
  ['an empty list', []]
]) {
  test(`a hook source with ${name} is refused, naming the file`, () => {
    inScratch({
      files: { [HOOKS_SOURCE]: sourceText({ hooks }) },
      use: ({ root }) => {
        assert.throws(
          () => readHookSource({ root }),
          /\.agents\/hooks\.json/
        )
      }
    })
  })
}

test('a hook source that does not parse is refused, naming the file', () => {
  inScratch({
    files: { [HOOKS_SOURCE]: '{ "hooks": ' },
    use: ({ root }) => {
      assert.throws(
        () => readHookSource({ root }),
        /\.agents\/hooks\.json/
      )
    }
  })
})

test('the generator writes .claude/settings.json and the checker passes it', () => {
  inScratch({
    files: { [HOOKS_SOURCE]: sourceText() },
    use: ({ root }) => {
      assert.ok(generateProjection({ root }).includes(CLAUDE_SETTINGS))
      assert.deepEqual(checkProjection({ root }).failures, [])
    }
  })
})

test('a hand-edited .claude/settings.json is drift', () => {
  inScratch({
    files: { [HOOKS_SOURCE]: sourceText() },
    use: ({ root }) => {
      generateProjection({ root })
      writeFileSync(join(root, CLAUDE_SETTINGS), '{ "hooks": {} }\n')
      assert.deepEqual(checkProjection({ root }).failures, [
        `changed: ${CLAUDE_SETTINGS}`
      ])
    }
  })
})

test('settings whose hook source is gone are drift', () => {
  inScratch({
    files: { [HOOKS_SOURCE]: sourceText() },
    use: ({ root }) => {
      generateProjection({ root })
      rmSync(join(root, HOOKS_SOURCE))
      assert.ok(
        checkProjection({ root }).failures.includes(
          `extra: ${CLAUDE_SETTINGS}`
        )
      )
    }
  })
})

test('deleted settings with their source in place are drift', () => {
  inScratch({
    files: { [HOOKS_SOURCE]: sourceText() },
    use: ({ root }) => {
      generateProjection({ root })
      rmSync(join(root, CLAUDE_SETTINGS))
      assert.deepEqual(checkProjection({ root }).failures, [
        `missing: ${CLAUDE_SETTINGS}`
      ])
    }
  })
})
