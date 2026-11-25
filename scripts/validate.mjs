#!/usr/bin/env node
// ---------------------------------------------------------------------------
// validate — runs the gate registry, .agents/contracts/gates.json.
//
// Every step the profile runs runs in registry order, through the shell,
// from the repository root: `pnpm <id>`, or the step's own command. The
// first step that fails stops the run, and the runner exits with that
// step's exit code, as the `&&` chain it replaces did. A registry its gate
// refuses, or a registry, root package.json or template.manifest.json it
// cannot read, runs no step and exits 1.
//
// Usage (`pnpm validate` passes its arguments on):
//   node scripts/validate.mjs [--list] [--profile standard|strict]
//                             [--root <directory>]
//
//   --list     prints each step the profile runs, with its stage,
//              capability, profile, cost and command, and runs none
//   --profile  the quality profile to run: standard (the default) runs the
//              standard steps, strict every step
//   --root     the repository to read and run in (the tests use it)
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { fileURLToPath } from 'node:url'

import { defineGate } from './gate/gate.mjs'
import {
  analyzeRegistry,
  planRun,
  PROFILES,
  REGISTRY_FILE
} from './gate/registry.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')
const PACKAGE_FILE = 'package.json'
const MANIFEST_FILE = 'template.manifest.json'
const [DEFAULT_PROFILE] = PROFILES
const REFUSED = 1
const MILLISECONDS_PER_SECOND = 1000
const SECONDS_DIGITS = 1
const LIST_COLUMNS = [
  'stage',
  'id',
  'capability',
  'profile',
  'cost',
  'command'
]

export const gate = defineGate({
  claims:
    `every step of ${REGISTRY_FILE} is an object with a unique id, a ` +
    'capability that is core or one template.manifest.json declares, a ' +
    `stage, profile and cost of the known values, no key the registry does ` +
    'not know, a non-empty command or else a root package.json script of ' +
    'its id, and a stage never earlier than the one above it; the registry ' +
    'lists at least one step; and every root script named verify:* or ' +
    '*:test is a step or an outside entry, which names a script package.json ' +
    'defines and no step runs, a known owner and its reason.',
  id: 'validate',
  notCovered:
    'whether a step checks what it should, which its own companion proves; ' +
    'whether the declared cost matches the time a run takes, which the run ' +
    'prints beside it; whether a step of an absent capability was left ' +
    'behind while its script stayed; a gate script named otherwise ' +
    '(check:*, report:*, *:check); and the smokes and end-to-end tests, ' +
    'which run outside the gate (docs/harness.md 3d).',
  run: analyzeRegistry
})

class RefusalError extends Error {}

const readJson = ({ file, root }) => {
  try {
    return JSON.parse(readFileSync(join(root, file), 'utf8'))
  } catch (error) {
    throw new RefusalError(
      `validate: cannot read ${file}: ${error.message}`
    )
  }
}

const seconds = ({ since }) =>
  ((Date.now() - since) / MILLISECONDS_PER_SECOND).toFixed(SECONDS_DIGITS)

const readOptions = () => {
  try {
    return parseArgs({
      options: {
        list: { type: 'boolean' },
        profile: { default: DEFAULT_PROFILE, type: 'string' },
        root: { type: 'string' }
      },
      strict: true
    }).values
  } catch (error) {
    throw new RefusalError(`validate: ${error.message}`)
  }
}

const printPlan = ({ steps }) => {
  const widths = LIST_COLUMNS.map((column) =>
    Math.max(...steps.map((entry) => entry[column].length))
  )
  steps.forEach((entry) =>
    console.log(
      LIST_COLUMNS.map((column, index) =>
        index === LIST_COLUMNS.length - 1
          ? entry[column]
          : entry[column].padEnd(widths[index])
      ).join('  ')
    )
  )
}

// Runs the steps in order and returns the exit code of the run.
const runSteps = ({ profile, root, steps }) => {
  const started = Date.now()
  for (const [index, entry] of steps.entries()) {
    const since = Date.now()
    const result = spawnSync(entry.command, {
      cwd: root,
      shell: true,
      stdio: 'inherit'
    })
    const position = `step ${index + 1} of ${steps.length}`
    const left = steps.length - index - 1

    if (result.error || result.status !== 0) {
      const why = result.error
        ? `could not start: ${result.error.message}`
        : result.status === null
          ? `was stopped by ${result.signal}`
          : `failed with exit code ${result.status}`
      console.error(
        `validate: ${entry.id} ${why} (${position}); ${left} step(s) not run.`
      )
      return result.status || REFUSED
    }
    console.log(
      `validate: [${index + 1}/${steps.length}] ${entry.id} passed in ` +
        `${seconds({ since })} s (declared ${entry.cost}).`
    )
  }
  console.log(
    `validate: PASS — ${steps.length} step(s) of ${REGISTRY_FILE}, profile ` +
      `${profile}, in ${seconds({ since: started })} s. NOT covered: ` +
      gate.notCovered
  )
  return 0
}

const main = () => {
  const { list, profile, root: rootFlag } = readOptions()
  const root = resolve(rootFlag ?? REPO_ROOT)

  if (!PROFILES.includes(profile)) {
    throw new RefusalError(
      `validate: profile "${profile}" is not one of ${PROFILES.join(', ')}`
    )
  }

  const registry = readJson({ file: REGISTRY_FILE, root })
  const { scripts = {} } = readJson({ file: PACKAGE_FILE, root })
  const manifest = readJson({ file: MANIFEST_FILE, root })
  const capabilities = (manifest.capabilities ?? []).map(({ id }) => id)

  const findings = gate.run({ capabilities, registry, scripts })
  if (findings.length > 0) {
    throw new RefusalError(
      [
        `validate: ${REGISTRY_FILE} has ${findings.length} problem(s), so no step ran.`,
        ...findings.map(({ detail }) => `  ${detail}`)
      ].join('\n')
    )
  }

  const steps = planRun({ profile, registry })
  if (list) {
    printPlan({ steps })
    return 0
  }
  return runSteps({ profile, root, steps })
}

if (import.meta.main) {
  try {
    process.exitCode = main()
  } catch (error) {
    if (!(error instanceof RefusalError)) throw error
    console.error(error.message)
    process.exitCode = REFUSED
  }
}
