#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-specs — every living spec and every open change has the shape
// openspec/README.md states, and every test a scenario names exists.
//
// It reads `openspec/specs/**/spec.md` and every folder of `openspec/changes/`
// except `archive/`, then the test files their scenarios cite. Paths and
// `path:line` citations in the prose are left to the pull request review.
//
// Usage:
//   node scripts/verify-specs.mjs
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'
import {
  ARCHIVE_DIR,
  CHANGE_ROOT,
  collectSpecFindings,
  collectTestReferences,
  SPEC_FILE,
  SPEC_ROOT
} from './specs.detect.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')
const CHANGE_FILES = {
  proposal: 'proposal.md',
  tasks: 'tasks.md',
  verifyReport: 'verify-report.md'
}

export const gate = defineGate({
  claims:
    'every living spec declares its governed paths and an ID prefix no ' +
    'other spec uses, and every requirement has a prefixed unique ID, a ' +
    'SHALL and scenarios with GIVEN, WHEN, THEN and a test line; every ' +
    'cited test file exists and holds the quoted title; every open change ' +
    'has a proposal marked open with its four sections and a tasks list ' +
    'whose done tasks name a sha, a verify report once every task is ' +
    'done, and deltas whose modified and removed IDs exist in the living ' +
    'spec.',
  id: 'verify-specs',
  notCovered:
    'whether a requirement says what the code does, which only the ' +
    'sync mode of the sdd skill judges; whether a test asserts what its ' +
    'scenario says; whether the owner approved a change; whether a diff that ' +
    'changed a contract went through a change at all, of which ' +
    'report:spec-drift shows only the deterministic half, a spec whose ' +
    'governed code changed after its verified commit; archived changes, ' +
    'whose contents are history; and backticked paths and line citations, ' +
    'which only the pull request review reads.',
  run: ({ changes, specs, testFiles }) =>
    collectSpecFindings({ changes, specs, testFiles })
})

const toPosix = ({ path }) => path.split(sep).join('/')

const walkFiles = ({ directory }) => {
  if (!existsSync(directory)) return []
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    return statSync(path).isDirectory()
      ? walkFiles({ directory: path })
      : [path]
  })
}

const readSpecs = () =>
  walkFiles({ directory: join(REPO_ROOT, SPEC_ROOT) })
    .filter((path) => path.endsWith(`${sep}${SPEC_FILE}`))
    .map((path) => ({
      path: toPosix({ path: relative(REPO_ROOT, path) }),
      text: readFileSync(path, 'utf8')
    }))
    .sort((left, right) => left.path.localeCompare(right.path))

const readOptional = ({ path }) =>
  existsSync(path) ? readFileSync(path, 'utf8') : undefined

const readChange = ({ name }) => {
  const folder = join(REPO_ROOT, CHANGE_ROOT, name)
  const specsFolder = join(folder, 'specs')
  const deltas = walkFiles({ directory: specsFolder })
    .filter((path) => path.endsWith(`${sep}${SPEC_FILE}`))
    .map((path) => ({
      specPath: toPosix({ path: relative(specsFolder, dirname(path)) }),
      text: readFileSync(path, 'utf8')
    }))
  const files = Object.fromEntries(
    Object.entries(CHANGE_FILES).map(([key, file]) => [
      key,
      readOptional({ path: join(folder, file) })
    ])
  )
  return { files: { ...files, deltas }, name }
}

const readChanges = () => {
  const root = join(REPO_ROOT, CHANGE_ROOT)
  if (!existsSync(root)) return []
  return readdirSync(root)
    .filter((name) => name !== ARCHIVE_DIR)
    .filter((name) => statSync(join(root, name)).isDirectory())
    .sort()
    .map((name) => readChange({ name }))
}

const readTestFiles = ({ paths }) =>
  Object.fromEntries(
    paths.map((path) => {
      const absolute = join(REPO_ROOT, path)
      const exists = existsSync(absolute) && statSync(absolute).isFile()
      return [path, exists ? readFileSync(absolute, 'utf8') : null]
    })
  )

const main = () => {
  const specs = readSpecs()
  const changes = readChanges()
  const testFiles = readTestFiles({
    paths: collectTestReferences({ changes, specs })
  })

  reportGate({
    context: { changes, specs, testFiles },
    denominator:
      `${specs.length} living spec(s), ${changes.length} open change(s) ` +
      `and ${Object.keys(testFiles).length} cited test file(s)`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-specs.mjs')
) {
  main()
}
