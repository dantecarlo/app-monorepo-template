#!/usr/bin/env node
// ---------------------------------------------------------------------------
// policy — the rule files, the switch-off variable and the actor a payload
// names, read from `.agents/contracts/write-guard.json` and
// `.agents/agent-context.json`. The committed files are judged too: every
// rule glob matches a file git lists, and the agents the guard polices are
// declared as the owner decided.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/policy.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, posix, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { withScratchTree } from '../../gate/scratch.mjs'
import { gitFreeEnv } from '../../git-free-env.mjs'
import { globToRegExp } from '../../manifest.mjs'
import {
  actorFor,
  AGENT_CONTEXT_FILE,
  assertPolicy,
  GIT_RULE,
  heldFoldersOf,
  heldRuleFor,
  homeHeldRuleFor,
  homeRuleFor,
  isSwitchedOff,
  loadGuardFiles,
  POLICY_FILE,
  ruleFor,
  SWITCH_OFF
} from './policy.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..', '..')
const PATH_SEPARATOR = '\0'
const GIT_OUTPUT_LIMIT = 64 * 1024 * 1024

const committed = loadGuardFiles({ root: REPO_ROOT })
const policy = committed.policy

const listedFiles = () => {
  const result = spawnSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: gitFreeEnv(),
      maxBuffer: GIT_OUTPUT_LIMIT
    }
  )
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.split(PATH_SEPARATOR).filter(Boolean)
}

const POLICY = {
  ruleFiles: [
    { glob: 'AGENTS.md', what: 'the LAWs' },
    { glob: '**/*allowlist*.json', what: 'an allowlist' },
    { glob: '.claude/skills/**', what: 'a skill' }
  ],
  switchOff: { value: 'off', variable: 'ATL_WRITE_GUARD' }
}

test('the committed policy and agent context both read', () => {
  assert.ok(!(policy instanceof Error), String(policy))
  assert.ok(
    !(committed.agentContext instanceof Error),
    String(committed.agentContext)
  )
  assert.doesNotThrow(() => assertPolicy({ policy }))
})

// A glob that starts `~/` names a file of the user's home folder, which no
// checkout lists; the next test reads those through the home folder.
test('every checkout rule glob of the committed policy matches a file git lists', () => {
  const files = listedFiles()
  const unmatched = policy.ruleFiles
    .map(({ glob }) => glob)
    .filter((glob) => !glob.startsWith('~/'))
    .filter(
      (glob) =>
        !files.some((file) =>
          globToRegExp({ pattern: glob.toLowerCase() }).test(
            file.toLowerCase()
          )
        )
    )
  assert.deepEqual(unmatched, [], `globs matching nothing: ${unmatched}`)
})

test('the committed policy guards the user-level Claude Code settings, by their path in the home folder', () => {
  for (const relative of [
    '.claude/settings.json',
    '.claude/settings.local.json'
  ]) {
    assert.notEqual(homeRuleFor({ policy, relative }), undefined, relative)
    assert.equal(
      ruleFor({ policy, relative: `x/${relative}` })?.glob,
      undefined
    )
  }
  assert.equal(
    homeRuleFor({ policy, relative: '.claude/CLAUDE.md' }),
    undefined
  )
  assert.equal(homeRuleFor({ policy, relative: 'AGENTS.md' }), undefined)
})

test('a .git anywhere below a checkout root is a rule path, whatever the policy lists', () => {
  for (const relative of [
    '.git',
    '.git/config',
    '.agents/.git',
    'a/.GIT/HEAD'
  ]) {
    assert.equal(
      ruleFor({
        policy: { ruleFiles: [], switchOff: SWITCH_OFF },
        relative
      })?.glob,
      GIT_RULE.glob,
      relative
    )
  }
  assert.equal(
    ruleFor({ policy, relative: 'docs/.github/x.md' }),
    undefined
  )
  assert.equal(ruleFor({ policy, relative: 'docs/a.git' }), undefined)
})

for (const relative of [
  'eslint.config.mjs',
  'eslint.rules.mjs',
  'eslint-local-rules/rules/style-positions-only.mjs',
  'commitlint.config.js',
  '.prettierrc.json',
  '.prettierignore',
  'knip.json',
  'eslint-style-positioning-allowlist.json',
  'apps/web/some-allowlist.json',
  'scripts/verify-english.mjs',
  'scripts/verify-english.allow.json',
  '.agents/contracts/dependencies.json',
  '.agents/contracts/write-guard.json',
  '.claude/skills/sdd/SKILL.md',
  '.claude/skills/sdd/.hidden',
  'AGENTS.md',
  'agents.md',
  'template.manifest.json',
  '.claude/settings.json',
  '.claude/settings.local.json',
  '.agents/agent-context.json',
  '.agents/hooks.json',
  '.agents/harness.config.json',
  'scripts/agent-harness/write-guard/decide.mjs',
  'scripts/agent-harness/no-force/forms.mjs',
  'scripts/manifest.mjs',
  'scripts/manifest-owners.mjs',
  '.agents/agents/validator.agent.md',
  '.claude/agents/validator.md',
  '.husky/pre-commit',
  '.github/workflows/ci.yml'
]) {
  test(`the committed policy makes ${relative} a rule file`, () => {
    assert.notEqual(ruleFor({ policy, relative }), undefined)
  })
}

for (const relative of [
  'package.json',
  'docs/harness.md',
  'apps/web/src/app/page.tsx',
  'scripts/agent-harness/adapters.mjs',
  'scripts/check-identity.mjs',
  '.codex/agents/validator.toml'
]) {
  test(`the committed policy leaves ${relative} out`, () => {
    assert.equal(ruleFor({ policy, relative }), undefined)
  })
}

// A module the hook loads can switch the guard off quietly (a top-level
// `process.exit(0)` prints nothing), so every one of them is a rule file.
const IMPORT = /(?:\bfrom\s+|\bimport\s*\(\s*)'(\.{1,2}\/[^']+)'/gu

const modulesLoadedBy = ({ entry }) => {
  const seen = new Set()
  const visit = ({ path }) => {
    if (seen.has(path)) return
    seen.add(path)
    const text = readFileSync(resolve(REPO_ROOT, path), 'utf8')
    ;[...text.matchAll(IMPORT)].forEach(([, specifier]) =>
      visit({
        path: posix.normalize(posix.join(posix.dirname(path), specifier))
      })
    )
  }
  visit({ path: entry })
  return [...seen].sort()
}

test('every module the Claude Code hook loads is a rule file', () => {
  const loaded = modulesLoadedBy({
    entry: 'scripts/agent-harness/write-guard/claude-hook.mjs'
  })
  assert.ok(loaded.includes('scripts/manifest.mjs'), loaded.join(', '))
  assert.deepEqual(
    loaded.filter(
      (relative) => ruleFor({ policy, relative }) === undefined
    ),
    []
  )
})

test('every module the no-force hook loads is a rule file', () => {
  const loaded = modulesLoadedBy({
    entry: 'scripts/agent-harness/no-force/claude-hook.mjs'
  })
  assert.ok(
    loaded.includes('scripts/agent-harness/no-force/forms.mjs'),
    loaded.join(', ')
  )
  assert.deepEqual(
    loaded.filter(
      (relative) => ruleFor({ policy, relative }) === undefined
    ),
    []
  )
})

test('a rule names the glob that matched and what it guards', () => {
  assert.deepEqual(
    ruleFor({ policy: POLICY, relative: 'docs/x-allowlist.json' }),
    { glob: '**/*allowlist*.json', what: 'an allowlist' }
  )
})

test('the switch-off the policy names is the one the engine falls back on', () => {
  assert.deepEqual(policy.switchOff, SWITCH_OFF)
  assert.deepEqual(SWITCH_OFF, {
    value: 'off',
    variable: 'ATL_WRITE_GUARD'
  })
})

for (const [value, expected] of [
  ['off', true],
  ['OFF', true],
  [' off ', true],
  ['on', false],
  [undefined, false]
]) {
  test(`ATL_WRITE_GUARD=${value} switches the guard ${expected ? 'off' : 'on'}`, () => {
    const env = value === undefined ? {} : { ATL_WRITE_GUARD: value }
    assert.equal(isSwitchedOff({ env, policy: POLICY }), expected)
  })
}

test('the switch-off still works when the policy cannot be read', () => {
  assert.equal(
    isSwitchedOff({
      env: { ATL_WRITE_GUARD: 'off' },
      policy: new Error('unreadable')
    }),
    true
  )
})

for (const [name, broken] of [
  ['a policy that is not an object', []],
  ['a policy with no ruleFiles', { switchOff: POLICY.switchOff }],
  [
    'a policy with an empty ruleFiles',
    { ruleFiles: [], switchOff: POLICY.switchOff }
  ],
  [
    'a rule with no glob',
    { ruleFiles: [{ what: 'x' }], switchOff: POLICY.switchOff }
  ],
  [
    'a rule with no what',
    { ruleFiles: [{ glob: 'x' }], switchOff: POLICY.switchOff }
  ],
  ['a policy with no switchOff', { ruleFiles: POLICY.ruleFiles }],
  ['an unreadable policy', new Error('does not parse')]
]) {
  test(`assertPolicy refuses ${name}`, () => {
    assert.throws(
      () => assertPolicy({ policy: broken }),
      /\.agents\/contracts\/write-guard\.json/
    )
  })
}

test('a missing or corrupt guard file loads as an Error naming the file', () => {
  withScratchTree({
    files: { [AGENT_CONTEXT_FILE]: '{ "agents": ' },
    prefix: 'write-guard-policy-',
    use: ({ root }) => {
      const loaded = loadGuardFiles({ root })
      assert.ok(loaded.policy instanceof Error)
      assert.match(loaded.policy.message, /write-guard\.json/)
      assert.ok(loaded.agentContext instanceof Error)
      assert.match(loaded.agentContext.message, /agent-context\.json/)
    }
  })
})

test('the committed agent context makes validator read-only and sdd-steward a writer', () => {
  const { agents } = committed.agentContext
  assert.equal(agents.validator.writes, false)
  assert.equal(agents['sdd-steward'].writes, true)
})

const CONTEXT = {
  agents: {
    'e2e-author': {
      surface: ['apps/mobile/.maestro/', 'docs/qa'],
      writes: true
    },
    'sdd-steward': { writes: true },
    validator: { writes: false }
  }
}

for (const [label, payload, context, expected] of [
  [
    'a payload with no agent_type is the main session',
    {},
    CONTEXT,
    'main'
  ],
  [
    'an agent the context does not list is a writer',
    { agent_type: 'general-purpose' },
    CONTEXT,
    'writer'
  ],
  [
    'writes: true is a writer',
    { agent_type: 'sdd-steward' },
    CONTEXT,
    'writer'
  ],
  [
    'writes: false is read-only',
    { agent_type: 'validator' },
    CONTEXT,
    'read-only'
  ],
  [
    'a surface holds a writer',
    { agent_type: 'e2e-author' },
    CONTEXT,
    'surface'
  ],
  [
    'a subagent under an unreadable context is unknown',
    { agent_type: 'general-purpose' },
    new Error('does not parse'),
    'unknown'
  ],
  [
    'an entry whose writes is not a boolean is unknown',
    { agent_type: 'validator' },
    { agents: { validator: { writes: 'no' } } },
    'unknown'
  ],
  [
    'an entry whose surface is not a list of folders is unknown',
    { agent_type: 'e2e-author' },
    { agents: { 'e2e-author': { surface: 'docs/qa', writes: true } } },
    'unknown'
  ],
  [
    'the main session needs no agent context',
    {},
    new Error('does not parse'),
    'main'
  ]
]) {
  test(`actorFor: ${label}`, () => {
    assert.equal(
      actorFor({ agentContext: context, payload }).kind,
      expected
    )
  })
}

test('a surface actor carries its folders, normalised', () => {
  assert.deepEqual(
    actorFor({
      agentContext: CONTEXT,
      payload: { agent_type: 'e2e-author' }
    }).surface,
    ['apps/mobile/.maestro', 'docs/qa']
  )
})

test('the policy file the hook reads is the contract under .agents/contracts', () => {
  assert.equal(POLICY_FILE, '.agents/contracts/write-guard.json')
  assert.equal(AGENT_CONTEXT_FILE, '.agents/agent-context.json')
})

// -- a folder that holds rule files --------------------------------------------
const HELD_POLICY = {
  ruleFiles: [
    { glob: 'AGENTS.md', what: 'the LAWs' },
    { glob: '.claude/skills/**', what: 'a skill' },
    { glob: 'scripts/verify-*', what: 'a gate' },
    { glob: '**/*allowlist*.json', what: 'an allowlist' },
    { glob: '~/.claude/settings.json', what: 'the user-level settings' }
  ],
  switchOff: SWITCH_OFF
}

for (const [relative, glob] of [
  ['.claude', '.claude/skills/**'],
  ['.Claude/', '.claude/skills/**'],
  ['.claude/skills', '.claude/skills/**'],
  ['scripts', 'scripts/verify-*']
]) {
  test(`a folder holds the rule files a glob reads below it: ${relative}`, () => {
    const rule = heldRuleFor({ policy: HELD_POLICY, relative })
    assert.equal(rule?.glob, glob)
    assert.equal(rule.held, true)
  })
}

for (const relative of [
  '',
  'apps',
  'apps/web/.next',
  'scripts/gate',
  '.claude/agents'
]) {
  test(`a folder that holds no rule file, or the root, holds none: "${relative}"`, () => {
    assert.equal(heldRuleFor({ policy: HELD_POLICY, relative }), undefined)
  })
}

test('a folder of the home folder holds the user-level settings', () => {
  assert.equal(
    homeHeldRuleFor({ policy: HELD_POLICY, relative: '.claude' })?.glob,
    '~/.claude/settings.json'
  )
  assert.equal(
    homeHeldRuleFor({ policy: HELD_POLICY, relative: '' }),
    undefined
  )
  assert.equal(
    heldRuleFor({ policy: HELD_POLICY, relative: '~' }),
    undefined
  )
})

test('heldFoldersOf lists every folder below which a glob matches', () => {
  assert.deepEqual(heldFoldersOf({ glob: '.claude/skills/**' }), [
    '.claude/skills',
    '.claude'
  ])
  assert.deepEqual(heldFoldersOf({ glob: 'scripts/verify-*' }), [
    'scripts'
  ])
  assert.deepEqual(heldFoldersOf({ glob: 'AGENTS.md' }), [])
  assert.deepEqual(heldFoldersOf({ glob: '**/*allowlist*.json' }), [])
})
