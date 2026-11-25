#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-updaters — every periodic updater of .agents/contracts/updaters.json
// is declared in full, runs root scripts, and proposes a change to a rule
// file instead of making it.
//
// An updater is an entry of the registry, run by `pnpm updaters:run`
// (scripts/updaters/run.mjs), which turns an out-of-date one into a pull
// request. It fails:
//   - a registry that cannot be read, holds no `updaters` list, or holds a
//     key other than `$comment` and `updaters`;
//   - an entry that is not an object, lacks one of the eight keys (`id`,
//     `command`, `runsIn`, `network`, `secrets`, `writes`, `proposal`,
//     `verify`) or holds any other;
//   - an `id` that is not kebab-case, or that two entries share: it names the
//     branch `updates/<id>`;
//   - a `command`, or a `verify` entry, that is not `pnpm <script>` naming a
//     script the root package.json defines;
//   - a `runsIn` that is not a non-empty list of `ci` and `local`;
//   - `network`, `secrets` or `writes` that are not lists of names, a
//     `writes` path that is not repository-relative with forward slashes,
//     and a `proposal` that is not true or false;
//   - a `writes` path the write guard classifies as a rule file, by its own
//     `ruleFor` over its own policy (.agents/contracts/write-guard.json),
//     never a list kept here, or a path with a wildcard, which nothing can
//     classify, while `proposal` is not true: the LAW "A rule is not edited
//     to fit the work" lets an updater propose a rule change, and the owner
//     decide it;
//   - a write-guard policy that cannot be read, since nothing can then be
//     classified.
//
// `run` is pure: it decides on what `collectContext` gathers.
//
// Usage:
//   node scripts/verify-updaters.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import {
  assertPolicy,
  GIT_RULE,
  POLICY_FILE,
  ruleFor
} from './agent-harness/write-guard/policy.mjs'
import { defineGate, reportGate } from './gate/gate.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_FILE = 'package.json'

export const UPDATERS_FILE = '.agents/contracts/updaters.json'

// Where an updater runs: in the scheduled CI workflow, on a person's
// machine, or both.
export const PLACES = Object.freeze(['ci', 'local'])

export const UPDATER_KEYS = Object.freeze([
  'command',
  'id',
  'network',
  'proposal',
  'runsIn',
  'secrets',
  'verify',
  'writes'
])

const REGISTRY_KEYS = Object.freeze(['$comment', 'updaters'])
const NAME_KEYS = Object.freeze(['network', 'secrets'])
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const SCRIPT_COMMAND = /^pnpm (?<script>\S+)$/u
const WILDCARD = /[*?[\]{}!]/u
// Repository-relative, written with forward slashes: no leading slash or
// backslash, no drive letter, no `..` segment, no backslash anywhere.
const LEAVES_REPOSITORY = /^\/|^[a-zA-Z]:|(?:^|\/)\.\.(?:\/|$)|\\/u

const isText = (value) => typeof value === 'string' && value.trim() !== ''

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const quoted = (value) => JSON.stringify(value)

const KEY_LIST = UPDATER_KEYS.join(', ')
const KEY_SENTENCE = `${UPDATER_KEYS.slice(0, -1).join(', ')} and ${UPDATER_KEYS.at(-1)}`

// The root script a `pnpm <script>` command runs, or null for any other
// command.
export const scriptOf = ({ command }) =>
  typeof command === 'string'
    ? (SCRIPT_COMMAND.exec(command)?.groups.script ?? null)
    : null

export const isWildcard = ({ path }) => WILDCARD.test(path)

// The rule a written path falls under, as the write guard reads it, or
// undefined. A wildcard cannot be classified, so it counts as a rule path.
export const ruleOfPath = ({ path, policy }) =>
  isWildcard({ path })
    ? {
        glob: path,
        what: 'a wildcard the write guard cannot classify'
      }
    : ruleFor({ policy, relative: path })

const readJson = ({ path, root }) => {
  try {
    return JSON.parse(readFileSync(join(root, path), 'utf8'))
  } catch (error) {
    return new Error(`${path} cannot be read: ${error.message}`)
  }
}

// What the gate and the runner read: the registry, the root scripts and the
// write guard's policy. A file that cannot be read loads as an Error.
export const collectContext = ({ root }) => {
  const manifest = readJson({ path: PACKAGE_FILE, root })
  return {
    policy: readJson({ path: POLICY_FILE, root }),
    registry: readJson({ path: UPDATERS_FILE, root }),
    scripts:
      manifest instanceof Error ? manifest : (manifest.scripts ?? {})
  }
}

// The problem that stops the policy from classifying anything, or null.
export const policyProblemOf = ({ policy }) => {
  if (policy instanceof Error) return policy.message
  try {
    assertPolicy({ policy })
    return null
  } catch (error) {
    return error.message
  }
}

const commandProblems = ({ field, scripts, value }) => {
  const script = scriptOf({ command: value })
  if (script === null) {
    return [
      `${field} ${quoted(value)} is not pnpm <script>, one root script and no argument`
    ]
  }
  if (scripts instanceof Error || Object.hasOwn(scripts, script)) return []
  return [
    `${field} ${quoted(value)} runs the script ${script}, which the root ${PACKAGE_FILE} does not define`
  ]
}

const runsInProblems = ({ value }) => {
  if (!Array.isArray(value) || value.length === 0) {
    return [`runsIn must be a non-empty list of ${PLACES.join(', ')}`]
  }
  return value
    .filter((place) => !PLACES.includes(place))
    .map(
      (place) =>
        `runsIn ${quoted(place)} is not one of ${PLACES.join(', ')}`
    )
}

const ruleSource = ({ rule }) =>
  rule.glob === GIT_RULE.glob
    ? 'set in the write guard itself'
    : `${rule.glob} in ${POLICY_FILE}`

const writesProblems = ({ entry, policyReadable, policy }) => {
  const { proposal, writes } = entry
  if (!Array.isArray(writes) || !writes.every(isText)) {
    return ['writes must be a list of repository-relative paths']
  }
  return writes.flatMap((path) => {
    if (LEAVES_REPOSITORY.test(path)) {
      return [
        `writes ${path}, which is not a repository-relative path written with /`
      ]
    }
    if (proposal === true) return []
    if (isWildcard({ path })) {
      return [
        `writes ${path}, a wildcard the write guard cannot classify, so it counts as a rule path: name each file, or set proposal: true`
      ]
    }
    if (!policyReadable) return []
    const rule = ruleFor({ policy, relative: path })
    return rule === undefined
      ? []
      : [
          `writes ${path}, ${rule.what} (${ruleSource({ rule })}), so its pull request proposes a rule change: set proposal: true`
        ]
  })
}

// The problems of one entry, judged alone, without the name it is reported
// under.
const entryProblems = ({ entry, policy, policyReadable, scripts }) => {
  const has = (key) => Object.hasOwn(entry, key)
  return [
    ...Object.keys(entry)
      .filter((key) => !UPDATER_KEYS.includes(key))
      .map(
        (key) =>
          `key ${quoted(key)} is not one an updater knows (${KEY_LIST})`
      ),
    ...UPDATER_KEYS.filter((key) => !has(key)).map(
      (key) => `has no ${key}; every updater declares ${KEY_SENTENCE}`
    ),
    ...(has('id') && !(isText(entry.id) && KEBAB.test(entry.id))
      ? [
          'id must be kebab-case (lower-case words joined by -), since it names the branch updates/<id>'
        ]
      : []),
    ...(has('command')
      ? commandProblems({ field: 'command', scripts, value: entry.command })
      : []),
    ...(has('verify')
      ? Array.isArray(entry.verify)
        ? entry.verify.flatMap((value) =>
            commandProblems({ field: 'verify', scripts, value })
          )
        : ['verify must be a list of pnpm <script> commands']
      : []),
    ...(has('runsIn') ? runsInProblems({ value: entry.runsIn }) : []),
    ...NAME_KEYS.filter(
      (key) =>
        has(key) &&
        !(Array.isArray(entry[key]) && entry[key].every(isText))
    ).map((key) => `${key} must be a list of non-empty names`),
    ...(has('writes')
      ? writesProblems({ entry, policy, policyReadable })
      : []),
    ...(has('proposal') && typeof entry.proposal !== 'boolean'
      ? ['proposal must be true or false']
      : [])
  ]
}

const finding = ({ detail, id }) => ({ detail, id })

const registryProblems = ({ registry }) => {
  if (registry instanceof Error) return [registry.message]
  if (!isObject(registry)) return [`${UPDATERS_FILE} holds no object`]
  return [
    ...Object.keys(registry)
      .filter((key) => !REGISTRY_KEYS.includes(key))
      .map(
        (key) =>
          `${UPDATERS_FILE}: key ${quoted(key)} is not one the registry knows (${REGISTRY_KEYS.join(', ')})`
      ),
    ...(Array.isArray(registry.updaters)
      ? []
      : [`${UPDATERS_FILE} holds no "updaters" list`])
  ]
}

const duplicateProblems = ({ updaters }) => {
  const seen = new Set()
  return updaters
    .filter((entry) => isObject(entry) && isText(entry.id))
    .flatMap(({ id }) => {
      if (!seen.has(id)) {
        seen.add(id)
        return []
      }
      return [
        finding({
          detail: `${UPDATERS_FILE}: ${id}: two updaters share this id`,
          id
        })
      ]
    })
}

export const analyzeUpdaters = ({ policy, registry, scripts }) => {
  const policyProblem = policyProblemOf({ policy })
  const general = [
    ...registryProblems({ registry }),
    ...(scripts instanceof Error ? [scripts.message] : []),
    ...(policyProblem === null
      ? []
      : [`${policyProblem}, so no written path can be classified`])
  ].map((detail) => finding({ detail, id: UPDATERS_FILE }))
  const updaters =
    isObject(registry) && Array.isArray(registry.updaters)
      ? registry.updaters
      : []
  const single = updaters.flatMap((entry, index) => {
    const name =
      isObject(entry) && isText(entry.id) ? entry.id : `updater ${index + 1}`
    if (!isObject(entry)) {
      return [
        finding({
          detail: `${UPDATERS_FILE}: ${name} is not an object`,
          id: name
        })
      ]
    }
    return entryProblems({
      entry,
      policy,
      policyReadable: policyProblem === null,
      scripts
    }).map((problem) =>
      finding({ detail: `${UPDATERS_FILE}: ${name}: ${problem}`, id: name })
    )
  })
  return [...general, ...single, ...duplicateProblems({ updaters })]
}

export const gate = defineGate({
  claims:
    `every entry of ${UPDATERS_FILE} declares exactly id, command, runsIn, ` +
    'network, secrets, writes, proposal and verify; its id is kebab-case and ' +
    'unique; its command and verify commands are pnpm <script> of a root ' +
    'script; it runs in ci, local or both; and an entry whose writes holds a ' +
    `path the write guard's ruleFor classifies as a rule file under ${POLICY_FILE}, ` +
    'or a wildcard, is a proposal.',
  id: 'verify-updaters',
  notCovered:
    'whether an updater writes only what its writes declares, which the ' +
    'runner reads from the diff it got and review reads in the pull ' +
    'request; whether its command keeps the contract (--check writes ' +
    'nothing, exit 0 current, 1 failed, 2 out of date), which its own suite ' +
    'proves; whether network and secrets name every host and variable it ' +
    'reaches; and whether the hosts and secrets are the right ones, which ' +
    'review judges.',
  run: analyzeUpdaters
})

const main = () => {
  const { values } = parseArgs({
    options: { root: { default: REPO_ROOT, type: 'string' } }
  })
  const context = collectContext({ root: resolve(values.root) })
  const { policy, registry } = context
  const updaters =
    isObject(registry) && Array.isArray(registry.updaters)
      ? registry.updaters
      : []
  const written = updaters
    .filter(isObject)
    .flatMap(({ writes }) => (Array.isArray(writes) ? writes : [])).length
  const globs =
    policyProblemOf({ policy }) === null ? policy.ruleFiles.length : 0
  reportGate({
    context,
    denominator:
      `${updaters.length} updater(s) of ${UPDATERS_FILE}, ${written} written ` +
      `path(s) classified by the write guard's ${globs} rule glob(s)`,
    gate
  })
}

if (import.meta.main) main()
