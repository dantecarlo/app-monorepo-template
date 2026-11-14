#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Tests for report-spec-drift. The detector is driven from synthetic specs
// and measurements; measureDrift runs against a throwaway git repository in
// the OS temp directory, so a committed change, an uncommitted one, an
// untracked file and an unknown commit are each seen through real git. The
// report itself then runs over that repository: it lists the stale specs
// and exits 0.
//
// Usage:
//   node --test scripts/report-spec-drift.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { gitFreeEnv } from './git-free-env.mjs'
import { measureDrift } from './report-spec-drift.mjs'
import {
  collectDrift,
  DRIFT_KIND,
  readSpecAnchor
} from './spec-drift.detect.mjs'

const UNKNOWN_SHA = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
const REPORT = join(
  dirname(fileURLToPath(import.meta.url)),
  'report-spec-drift.mjs'
)

const specText = ({ governs = '`src/`', sha }) =>
  [
    '# unit — living spec',
    '',
    `> **Governs:** ${governs}`,
    '> **ID prefix:** `UNIT`',
    `> **Verified against the code:** 2026-11-11 at \`${sha}\``,
    ''
  ].join('\n')

const measurement = (overrides = {}) => ({
  changed: [],
  commitKnown: true,
  governed: ['src/'],
  missing: [],
  path: 'openspec/specs/unit/spec.md',
  sha: 'abc1234',
  ...overrides
})

test('the anchor reads every governed path and the verified commit', () => {
  const anchor = readSpecAnchor({
    text: specText({ governs: '`src/a/`, `src/b.ts`', sha: 'abc1234' })
  })
  assert.deepEqual(anchor, {
    governed: ['src/a/', 'src/b.ts'],
    sha: 'abc1234'
  })
})

test('a spec with no verified commit reads a null sha', () => {
  const anchor = readSpecAnchor({ text: '> **Governs:** `src/`\n' })
  assert.equal(anchor.sha, null)
})

test('a spec whose governed files match its commit is not reported', () => {
  assert.deepEqual(collectDrift({ measured: [measurement()] }), [])
})

test('a spec with a file changed since its commit is stale', () => {
  const [finding] = collectDrift({
    measured: [measurement({ changed: ['src/a.ts'] })]
  })
  assert.equal(finding.kind, DRIFT_KIND.stale)
  assert.deepEqual(finding.changed, ['src/a.ts'])
})

test('a spec verified at a commit the repository lacks is reported', () => {
  const [finding] = collectDrift({
    measured: [measurement({ commitKnown: false })]
  })
  assert.equal(finding.kind, DRIFT_KIND.unknownCommit)
})

test('a spec with no commit or no governed path cannot be measured', () => {
  const kinds = collectDrift({
    measured: [measurement({ sha: null }), measurement({ governed: [] })]
  }).map(({ kind }) => kind)
  assert.deepEqual(kinds, [DRIFT_KIND.noAnchor, DRIFT_KIND.noAnchor])
})

test('a governed path that does not exist is reported beside the drift', () => {
  const kinds = collectDrift({
    measured: [measurement({ changed: ['src/a.ts'], missing: ['lib/'] })]
  }).map(({ kind }) => kind)
  assert.deepEqual(kinds, [DRIFT_KIND.missingPath, DRIFT_KIND.stale])
})

const scratch = mkdtempSync(join(tmpdir(), 'report-spec-drift-'))
after(() => rmSync(scratch, { force: true, recursive: true }))

const git = ({ args }) =>
  execFileSync(
    'git',
    [
      '-c',
      'user.email=test@example.invalid',
      '-c',
      'user.name=test',
      ...args
    ],
    { cwd: scratch, encoding: 'utf8', env: gitFreeEnv() }
  ).trim()

const writeSpec = ({ name, sha }) => {
  mkdirSync(join(scratch, 'openspec', 'specs', name), { recursive: true })
  writeFileSync(
    join(scratch, 'openspec', 'specs', name, 'spec.md'),
    specText({ governs: `\`${name}/\``, sha })
  )
}

const measuredFor = ({ name }) =>
  measureDrift({ root: scratch }).find(
    ({ path }) => path === `openspec/specs/${name}/spec.md`
  )

test('measureDrift sees committed, uncommitted and untracked change through git', () => {
  git({ args: ['init', '-q'] })
  for (const name of ['fresh', 'committed', 'edited', 'untracked']) {
    mkdirSync(join(scratch, name), { recursive: true })
    writeFileSync(join(scratch, name, 'a.ts'), 'export const a = 1\n')
  }
  git({ args: ['add', '-A'] })
  git({ args: ['commit', '-q', '-m', 'base'] })
  const base = git({ args: ['rev-parse', 'HEAD'] })
  for (const name of ['fresh', 'committed', 'edited', 'untracked']) {
    writeSpec({ name, sha: base })
  }
  writeSpec({ name: 'unknown', sha: UNKNOWN_SHA })
  mkdirSync(join(scratch, 'unknown'), { recursive: true })
  writeFileSync(join(scratch, 'committed', 'a.ts'), 'export const a = 2\n')
  git({ args: ['add', '-A'] })
  git({ args: ['commit', '-q', '-m', 'change committed/a.ts'] })
  writeFileSync(join(scratch, 'edited', 'a.ts'), 'export const a = 3\n')
  writeFileSync(join(scratch, 'untracked', 'b.ts'), 'export const b = 1\n')

  assert.deepEqual(measuredFor({ name: 'fresh' }).changed, [])
  assert.deepEqual(measuredFor({ name: 'committed' }).changed, [
    'committed/a.ts'
  ])
  assert.deepEqual(measuredFor({ name: 'edited' }).changed, [
    'edited/a.ts'
  ])
  assert.deepEqual(measuredFor({ name: 'untracked' }).changed, [
    'untracked/b.ts'
  ])
  assert.equal(measuredFor({ name: 'unknown' }).commitKnown, false)
  assert.equal(measuredFor({ name: 'fresh' }).commitKnown, true)

  const stale = collectDrift({ measured: measureDrift({ root: scratch }) })
    .filter(({ kind }) => kind === DRIFT_KIND.stale)
    .map(({ path }) => path)
  assert.deepEqual(stale, [
    'openspec/specs/committed/spec.md',
    'openspec/specs/edited/spec.md',
    'openspec/specs/untracked/spec.md'
  ])
})

test('the report lists each stale spec and still exits 0', () => {
  const result = spawnSync(process.execPath, [REPORT, '--root', scratch], {
    encoding: 'utf8',
    env: gitFreeEnv()
  })
  assert.equal(result.status, 0)
  const warned = result.stdout
    .split(/\r?\n/u)
    .filter((line) => line.includes('WARN'))
  const stale = ['committed', 'edited', 'untracked']
  stale.forEach((name) =>
    assert.ok(
      warned.some((line) =>
        line.includes(`openspec/specs/${name}/spec.md: 1 file(s)`)
      ),
      `no WARN line for the stale spec ${name}`
    )
  )
  assert.ok(
    !warned.some((line) => line.includes('openspec/specs/fresh/spec.md')),
    'the fresh spec is reported'
  )
  assert.match(result.stdout, /3 of 5 living spec\(s\) behind their code/u)
})
