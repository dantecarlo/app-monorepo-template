#!/usr/bin/env node
// ---------------------------------------------------------------------------
// ci-windows — a test case that skips on POSIX because it only means
// something on Windows is a skipped check unless CI runs it on Windows (the
// LAW "A check is never forced or skipped", AGENTS.md). Every tracked test
// file whose `skip:` tests `process.platform !== 'win32'` or `!IS_WINDOWS`
// must be run by a step of the `windows-process-trees` job of
// `.github/workflows/ci.yml`: a `node --test <file>` naming it, or a
// `pnpm <script>` whose root package.json script does.
//
// Not covered: a skip spelled another way (`os.platform()`, a variable of
// another name), and whether the case asserts what its title says.
//
// Usage:
//   node --test scripts/ci-windows.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, posix, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WORKFLOW = '.github/workflows/ci.yml'
const JOB = 'windows-process-trees'
const TEST_FILE = /\.test\.[cm]?[jt]sx?$/u
const WINDOWS_SKIP =
  /skip:\s*(?:process\.platform\s*!==\s*['"]win32['"]|!IS_WINDOWS\b)/u
const NODE_TEST = /\bnode\s+--test\s+(?<files>[^&|;]+)/gu
const PNPM_SCRIPT = /^pnpm\s+(?:run\s+)?(?<script>[\w:.-]+)\s*$/u
const RUN = /^\s+run:\s*(?<command>.+)$/u
const JOB_START = /^ {2}(?<name>[\w-]+):\s*$/u
const STAR = '*'

/** The tracked test files whose cases skip everywhere but Windows. */
export const windowsOnlyTests = ({ root }) =>
  spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' })
    .stdout.split('\0')
    .filter((path) => TEST_FILE.test(path) && existsSync(join(root, path)))
    .filter((path) =>
      WINDOWS_SKIP.test(readFileSync(join(root, path), 'utf8'))
    )
    .sort()

/** The `run:` commands of one job of a workflow, in order. */
export const jobCommands = ({ job, workflow }) => {
  const commands = []
  let inJob = false
  for (const line of workflow.split(/\r?\n/u)) {
    const start = JOB_START.exec(line)
    if (start !== null) inJob = start.groups.name === job
    const run = inJob ? RUN.exec(line) : null
    if (run !== null) commands.push(run.groups.command.trim())
  }
  return commands
}

// The files one `node --test` argument names: itself, or the matches of a
// `*` in its last segment.
const expand = ({ pattern, root }) => {
  if (!pattern.includes(STAR)) return [pattern]
  const folder = posix.dirname(pattern)
  const [before, after] = posix.basename(pattern).split(STAR)
  return readdirSync(join(root, folder))
    .filter((name) => name.startsWith(before) && name.endsWith(after))
    .map((name) => posix.join(folder, name))
}

const nodeTestFiles = ({ command, root }) =>
  [...command.matchAll(NODE_TEST)].flatMap(({ groups }) =>
    groups.files
      .trim()
      .split(/\s+/u)
      .filter((word) => !word.startsWith('-'))
      .flatMap((pattern) => expand({ pattern, root }))
  )

/** The test files the `run:` commands run, through root scripts too. */
export const filesRun = ({ commands, root, scripts }) =>
  commands.flatMap((command) => {
    const script = PNPM_SCRIPT.exec(command)?.groups.script
    const resolved =
      script !== undefined && Object.hasOwn(scripts, script)
        ? scripts[script]
        : command
    return nodeTestFiles({ command: resolved, root })
  })

const readScripts = ({ root }) =>
  JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).scripts

test('the scan finds the Windows-only cases this repository holds', () => {
  const found = windowsOnlyTests({ root: ROOT })
  for (const path of [
    'packages/tooling/src/__tests__/process-tree.test.mjs',
    'scripts/agent-harness/reaper/bounded-child.test.mjs',
    'scripts/prune-worktrees.test.mjs'
  ]) {
    assert.ok(found.includes(path), `${path} is found`)
  }
  assert.ok(!found.includes('scripts/ci-windows.test.mjs'))
})

test('a pnpm script and a glob are read through to the files they run', () => {
  assert.deepEqual(
    filesRun({
      commands: ['pnpm reap:test', 'node --test a/b.test.mjs'],
      root: ROOT,
      scripts: { 'reap:test': 'node --test scripts/agent-harness/reaper/bounded-*.test.mjs' }
    }),
    ['scripts/agent-harness/reaper/bounded-child.test.mjs', 'a/b.test.mjs']
  )
  assert.deepEqual(
    jobCommands({
      job: 'b',
      workflow: 'jobs:\n  a:\n    steps:\n      - run: x\n  b:\n    steps:\n      - name: y\n        run: pnpm y\n'
    }),
    ['pnpm y']
  )
})

test(`every Windows-only case runs in CI's ${JOB} job`, () => {
  const run = new Set(
    filesRun({
      commands: jobCommands({
        job: JOB,
        workflow: readFileSync(join(ROOT, WORKFLOW), 'utf8')
      }),
      root: ROOT,
      scripts: readScripts({ root: ROOT })
    })
  )
  const missing = windowsOnlyTests({ root: ROOT }).filter(
    (path) => !run.has(path)
  )
  assert.deepEqual(
    missing,
    [],
    `${missing.join(', ')} skip on POSIX, and no ${JOB} step runs them`
  )
})
