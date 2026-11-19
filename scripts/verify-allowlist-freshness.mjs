#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-allowlist-freshness — every styling exemption still describes a
// violation, and every violation is either fixed or exempted.
//
// eslint-style-positioning-allowlist.json lets local/style-positions-only and
// local/style-token-values skip a file while its look moves into a component
// block. ESLint reads the list to SKIP those files, and nothing else checks
// that they still break the rule: an entry left behind after its file was
// fixed silently re-exempts the file the next time a violation lands in it.
//
// The gate re-derives every violation from the source with the detection the
// rules run (eslint-local-rules/style-positioning.detect.mjs), and fails:
//   - a stale entry: its file no longer breaks its rule (or is gone, or is out
//     of the rule's scope), so the entry is removed and the list shrinks;
//   - an unlisted violation, which lint reports too, named here with the count;
//   - a malformed entry: an entry carries its path, its rule and the reason
//     the value cannot move.
//
// Usage:
//   node scripts/verify-allowlist-freshness.mjs [--root <dir>]
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import tseslint from 'typescript-eslint'

import {
  collectPositioningViolations,
  collectTokenValueViolations,
  positionsOnlyScope,
  STYLE_ALLOWLIST_FILE,
  STYLE_RULE,
  tokenValuesScope
} from '../eslint-local-rules/style-positioning.detect.mjs'
import { listApps } from './eslint-config.detect.mjs'
import { defineGate, reportGate } from './gate/gate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

const SOURCE_FOLDER = 'src'
const SKIPPED_DIRS = new Set(['node_modules', '.expo', '.next'])

export const RULES = Object.freeze({
  [STYLE_RULE.POSITIONS_ONLY]: {
    collect: collectPositioningViolations,
    scopeOf: positionsOnlyScope
  },
  [STYLE_RULE.TOKEN_VALUES]: {
    collect: collectTokenValueViolations,
    scopeOf: tokenValuesScope
  }
})

export const FINDING_KIND = Object.freeze({
  duplicate: 'duplicate',
  malformed: 'malformed',
  stale: 'stale',
  unlisted: 'unlisted'
})

// The app sources both rules read: the TypeScript files under the src/ of
// every app the ESLint config reads (scripts/eslint-config.detect.mjs).
const listSources = ({ root }) =>
  listApps({ root })
    .flatMap((app) => {
      const dir = join(root, app, SOURCE_FOLDER)
      try {
        return readdirSync(dir, { recursive: true, withFileTypes: true })
          .filter((entry) => entry.isFile())
          .map((entry) =>
            relative(root, join(entry.parentPath, entry.name)).replaceAll(
              '\\',
              '/'
            )
          )
          .filter(
            (path) =>
              /\.tsx?$/.test(path) &&
              !path.split('/').some((part) => SKIPPED_DIRS.has(part))
          )
      } catch {
        return []
      }
    })
    .sort()

const parse = ({ path, root }) =>
  tseslint.parser.parseForESLint(readFileSync(join(root, path), 'utf8'), {
    ecmaVersion: 'latest',
    filePath: path,
    loc: true,
    range: true,
    sourceType: 'module'
  }).ast

// One row per file and rule that breaks it: `{ count, path, rule }`.
const collectViolations = ({ paths, root }) =>
  paths.flatMap((path) => {
    const rules = Object.entries(RULES).filter(([, { scopeOf }]) =>
      scopeOf(path)
    )
    if (rules.length === 0) return []
    const program = parse({ path, root })
    return rules.flatMap(([rule, { collect, scopeOf }]) => {
      const count = collect({ kind: scopeOf(path).kind, program }).length
      return count > 0 ? [{ count, path, rule }] : []
    })
  })

const readEntries = ({ root }) => {
  try {
    return JSON.parse(
      readFileSync(join(root, STYLE_ALLOWLIST_FILE), 'utf8')
    )
  } catch (error) {
    return { unreadable: error.message }
  }
}

export const collectContext = ({ root }) => {
  const paths = listSources({ root })
  return {
    entries: readEntries({ root }),
    files: paths.length,
    violations: collectViolations({ paths, root })
  }
}

const isText = (value) => typeof value === 'string' && value.trim() !== ''

const entryProblem = (entry) => {
  if (entry === null || typeof entry !== 'object')
    return 'is not an object'
  if (!isText(entry.path)) return 'has no path'
  if (!Object.hasOwn(RULES, entry.rule)) {
    return `names the rule ${JSON.stringify(entry.rule)}, which is neither ${Object.keys(RULES).join(' nor ')}`
  }
  if (!isText(entry.reason)) {
    return 'has no reason: an entry says why its value cannot move'
  }
  return null
}

const keyOf = ({ path, rule }) => `${rule} ${path}`

const findingsOfList = ({ entries }) => {
  if (!Array.isArray(entries)) {
    return [
      {
        detail: `${STYLE_ALLOWLIST_FILE} is not a JSON array${entries?.unreadable ? `: ${entries.unreadable}` : ''}`,
        kind: FINDING_KIND.malformed
      }
    ]
  }
  const seen = new Set()
  return entries.flatMap((entry, index) => {
    const problem = entryProblem(entry)
    if (problem) {
      return [
        {
          detail: `${STYLE_ALLOWLIST_FILE} entry ${index} ${problem}`,
          kind: FINDING_KIND.malformed
        }
      ]
    }
    if (seen.has(keyOf(entry))) {
      return [
        {
          detail: `${STYLE_ALLOWLIST_FILE}: ${entry.path} is listed twice under ${entry.rule}`,
          kind: FINDING_KIND.duplicate,
          path: entry.path
        }
      ]
    }
    seen.add(keyOf(entry))
    return []
  })
}

export const gate = defineGate({
  claims:
    'every entry of eslint-style-positioning-allowlist.json names a file ' +
    'that still breaks its rule and says why, and every file that breaks ' +
    'local/style-positions-only or local/style-token-values is listed.',
  id: 'verify-allowlist-freshness',
  notCovered:
    'whether an exemption SHOULD exist: an entry typed into the list by ' +
    'hand for a file that does break the rule passes, and its reason is ' +
    'read by review; and every value the two rules do not see (a class ' +
    'string in a *.constant.ts, a number in a React Native style).',
  run: ({ entries, violations }) => {
    const listProblems = findingsOfList({ entries })
    if (!Array.isArray(entries)) return listProblems
    const valid = entries.filter((entry) => entryProblem(entry) === null)
    const listed = new Set(valid.map(keyOf))
    const violating = new Set(violations.map(keyOf))
    return [
      ...listProblems,
      ...valid
        .filter((entry) => !violating.has(keyOf(entry)))
        .filter(
          (entry, index, all) =>
            all.findIndex((other) => keyOf(other) === keyOf(entry)) ===
            index
        )
        .map(({ path, rule }) => ({
          detail:
            `${STYLE_ALLOWLIST_FILE}: ${path} no longer breaks ${rule} ` +
            'but is still exempt — remove the entry, the list only shrinks',
          kind: FINDING_KIND.stale,
          path
        })),
      ...violations
        .filter((violation) => !listed.has(keyOf(violation)))
        .map(({ count, path, rule }) => ({
          detail:
            `${path} breaks ${rule} ${count} time(s) and is not listed — ` +
            'move the look into its component block and the values into ' +
            'tokens; an exemption is a hand edit with its reason, in the diff',
          kind: FINDING_KIND.unlisted,
          path
        }))
    ]
  }
})

const main = () => {
  const { values } = parseArgs({
    options: { root: { default: REPO_ROOT, type: 'string' } }
  })
  const context = collectContext({ root: resolve(values.root) })
  const listed = Array.isArray(context.entries)
    ? context.entries.length
    : 0
  reportGate({
    context,
    denominator:
      `${listed} allowlist entr${listed === 1 ? 'y' : 'ies'} against ` +
      `${context.files} app source file(s), ${context.violations.length} ` +
      'file-rule pair(s) breaking a styling rule',
    gate
  })
}

if (import.meta.main) main()
