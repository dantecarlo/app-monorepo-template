#!/usr/bin/env node
// ---------------------------------------------------------------------------
// decide, the path cases — a surface, every spelling of a rule file Windows
// reads as the same file (8.3 short names, device and share prefixes,
// streams, drive-relative paths), a .git below a checkout root, a clone under
// the temp dir, and two timing cases that walk the real repository, so the
// walk stays linear in the depth of the path.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/decide.paths.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  AGENT_CONTEXT,
  decisionOf,
  HOST,
  POLICY,
  REPO,
  SCRATCH,
  verdict
} from './decide.fixtures.mjs'
import { decide } from './decide.mjs'
import { liveHost } from './paths.mjs'

const REPO_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
)

// -- the surface, ported from Certifipago's guard ------------------------------
for (const filePath of [
  'apps/mobile/.maestro/flows/login.yaml',
  'docs/qa/traceability.md',
  `${REPO}\\apps\\mobile\\.maestro\\a.yaml`,
  `${SCRATCH}\\shot.png`
]) {
  test(`e2e-author may write ${filePath}`, () => {
    assert.equal(verdict({ agent: 'e2e-author', filePath }), undefined)
  })
}

for (const filePath of [
  'apps/web/src/a.ts',
  'apps/mobile/.maestro/../src/a.ts',
  'docs/qa-other/a.md'
]) {
  test(`e2e-author may not write ${filePath}`, () => {
    const found = verdict({ agent: 'e2e-author', filePath })
    assert.equal(found?.decision, 'deny')
    assert.match(found.reason, /e2e-author/)
    assert.match(found.reason, /apps\/mobile\/\.maestro\//)
    assert.match(found.reason, /docs\/qa\//)
  })
}

// -- path spellings --------------------------------------------------------------
for (const filePath of [
  'C:\\work\\repo\\AGENTS.md',
  'c:/work/repo/AGENTS.md',
  '/c/work/repo/AGENTS.md',
  'C:\\WORK\\Repo\\agents.md',
  'docs/../AGENTS.md',
  'C:\\work\\repo\\docs\\..\\AGENTS.md'
]) {
  test(`the main session is asked before any spelling of a rule file: ${filePath}`, () => {
    assert.equal(decisionOf({ filePath }), 'ask')
  })
}

test('a scratch path that walks back out is refused for a read-only agent', () => {
  assert.equal(
    decisionOf({
      agent: 'validator',
      filePath: `${SCRATCH}\\..\\..\\a.ts`
    }),
    'deny'
  )
})

test('a write into a repository that lives under a scratch root is refused', () => {
  assert.equal(
    decisionOf({
      agent: 'validator',
      cwd: `${SCRATCH}\\clone`,
      filePath: 'apps/web/src/probe.txt'
    }),
    'deny'
  )
})

test('a rule file of a repository under a scratch root still asks the main session', () => {
  assert.equal(
    decisionOf({ cwd: `${SCRATCH}\\clone`, filePath: 'AGENTS.md' }),
    'ask'
  )
})

test('a stream of a file no rule names still asks: the guard cannot read it', () => {
  assert.match(
    verdict({ filePath: 'C:\\work\\repo\\docs\\a.md:x' }).reason,
    /stream/
  )
})

// The disk under `HOST`: `realpath` canonicalises a path that exists, an 8.3
// short name included, and returns null for one that does not.
const DISK = {
  'c:/': 'C:\\',
  'c:/work': 'C:\\work',
  'c:/work/repo': 'C:\\work\\repo',
  'c:/work/repo/agents~1': 'C:\\work\\repo\\.agents',
  'c:/work/repo/agents~1/contracts': 'C:\\work\\repo\\.agents\\contracts',
  'c:/work/repo/claude~1': 'C:\\work\\repo\\.claude',
  'c:/work/repo/claude~1/settin~1.jso':
    'C:\\work\\repo\\.claude\\settings.json',
  'c:/work/repo/templa~1.jso': 'C:\\work\\repo\\template.manifest.json'
}
const ON_DISK = {
  ...HOST,
  realpath: ({ path }) => DISK[path.toLowerCase()] ?? null
}

for (const filePath of [
  'C:\\work\\repo\\AGENTS~1\\contracts\\write-guard.json',
  'C:\\work\\repo\\TEMPLA~1.JSO',
  'C:\\work\\repo\\CLAUDE~1\\SETTIN~1.JSO'
]) {
  test(`an 8.3 short name of a rule file asks the main session: ${filePath}`, () => {
    assert.equal(decisionOf({ filePath, host: ON_DISK }), 'ask')
  })
}

// Win32 drops the dots and spaces that end a path segment, so these name the
// rule file to any writer that goes through it; one that writes the literal
// name makes a new file, and the ask costs it nothing.
for (const filePath of [
  'C:\\work\\repo\\AGENTS.md.',
  'C:\\work\\repo\\AGENTS.md ',
  'C:\\work\\repo\\AGENTS.md. .',
  'C:\\work\\repo\\.agents.\\contracts\\write-guard.json'
]) {
  test(`a segment ending in dots or spaces is read as Win32 reads it: ${JSON.stringify(filePath)}`, () => {
    assert.equal(decisionOf({ filePath }), 'ask')
  })
}

test('a short name that resolves to nothing asks a writer and refuses a read-only agent', () => {
  const filePath = 'C:\\work\\repo\\NEWDIR~1\\a.md'
  assert.equal(decisionOf({ filePath, host: ON_DISK }), 'ask')
  assert.equal(
    decisionOf({ agent: 'validator', filePath, host: ON_DISK }),
    'deny'
  )
})

for (const filePath of [
  'C:\\work\\repo\\.agents\\.git',
  'C:\\work\\repo\\.agents\\.git\\HEAD',
  'C:\\work\\repo\\.git\\config'
]) {
  test(`a .git file or folder below a checkout root is a rule path: ${filePath}`, () => {
    assert.equal(decisionOf({ filePath }), 'ask')
    assert.equal(decisionOf({ agent: 'sdd-steward', filePath }), 'ask')
    assert.match(
      verdict({ agent: 'validator', filePath }).reason,
      /\.git.*rule file|rule file.*\.git/
    )
  })
}

// -- the walk is linear in the depth of the path ------------------------------
const DEADLINE_MS = 1000
const DEPTH = 10_000

for (const [label, agent, segment, expected] of [
  ['10,000 folders deep', 'validator', 'a\\', 'deny'],
  ['10,000 a\\..\\ pairs long', undefined, 'a\\..\\', 'ask']
]) {
  test(`a path ${label} is judged on the real disk in well under a second`, () => {
    const start = performance.now()
    const found = decide({
      agentContext: AGENT_CONTEXT,
      host: liveHost({ environment: {}, ownRoot: REPO_ROOT }),
      payload: {
        ...(agent === undefined ? {} : { agent_type: agent }),
        cwd: REPO_ROOT,
        tool_input: {
          file_path: `${REPO_ROOT}\\${segment.repeat(DEPTH)}AGENTS.md`
        },
        tool_name: 'Write'
      },
      policy: POLICY
    })
    const elapsed = performance.now() - start
    assert.equal(found?.decision, expected)
    assert.ok(elapsed < DEADLINE_MS, `${Math.round(elapsed)} ms`)
  })
}

// -- the user-level settings, by their path in the home folder ------------------
const AT_HOME = { ...HOST, homeDir: 'C:\\Users\\me' }

test('the user-level settings ask the main session and refuse a read-only agent', () => {
  const filePath = 'C:\\Users\\me\\.claude\\settings.json'
  assert.equal(decisionOf({ filePath, host: AT_HOME }), 'ask')
  assert.equal(
    decisionOf({ agent: 'sdd-steward', filePath, host: AT_HOME }),
    'ask'
  )
  assert.match(
    verdict({ agent: 'validator', filePath, host: AT_HOME }).reason,
    /~\/\.claude\/settings\.json/
  )
})

test('another file of the home folder is left to the session', () => {
  for (const filePath of [
    'C:\\Users\\me\\.claude\\CLAUDE.md',
    'C:\\Users\\other\\.claude\\settings.json'
  ]) {
    assert.equal(decisionOf({ filePath, host: AT_HOME }), '—', filePath)
  }
})
