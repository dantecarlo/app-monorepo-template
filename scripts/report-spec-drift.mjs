#!/usr/bin/env node
// ---------------------------------------------------------------------------
// report-spec-drift — the living specs whose code changed after they were
// last verified.
//
// Each spec under openspec/specs/ names the paths it governs and the commit
// it was verified at ("Verified against the code: <date> at `<sha>`"). A
// file under those paths that differs from that commit, committed or not,
// makes the spec stale: its words may no longer say what the code does.
// The report prints one WARN line per stale or unmeasurable spec and exits 1
// when it prints any, so `pnpm validate` fails until each is re-verified (a
// report that never failed skipped the check it is); re-verifying a listed
// spec is the `sync <spec>` mode of the sdd skill, which rewrites the spec
// from the code and moves its commit forward.
//
// A project made from the template is measured from its birth. Its
// .agents/harness.config.json names an identity that is not the template's
// (scripts/template-identity.mjs), and its history starts at the commit
// where that identity first appears, the one that commits what
// `pnpm run init` did: a project made with fresh history holds none of the
// template's commits, and one that kept them changed every governed file
// init renamed. So each of its specs is measured from that birth commit,
// or from its own verified commit when that one descends from the birth (a
// spec the project synced). Until the birth is committed nothing is
// measured, since no commit holds the renamed tree yet; a shallow clone,
// which cannot show where the project was born, fails. The template, and a
// checkout that names no identity, are measured from each spec's own
// commit, and one it does not hold fails.
//
// It does not judge whether a spec is wrong — a stale spec may still be true,
// and a fresh one may have been wrong from the start. That semantic check
// belongs to the sync mode, run on request (openspec/README.md § 4).
//
// Usage:
//   node scripts/report-spec-drift.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { gitFreeEnv } from './git-free-env.mjs'
import {
  identityOf,
  isTemplateIdentity
} from './template-identity.mjs'
import { HARNESS_CONFIG } from './verify-harness-config.mjs'
import {
  collectDrift,
  DRIFT_KIND,
  readSpecAnchor
} from './spec-drift.detect.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SPEC_ROOT = join('openspec', 'specs')
const SPEC_FILE = 'spec.md'
const SAMPLE_SIZE = 5
const SHORT_SHA = 7
const ROOT_FLAG = '--root'
const TRUE = 'true'

// Where a checkout's history starts, as measureDrift reads it.
export const BIRTH = Object.freeze({
  born: 'born',
  lost: 'lost',
  none: 'none',
  unborn: 'unborn'
})

const toPosix = ({ path }) => path.split(sep).join('/')

const walkSpecs = ({ directory }) => {
  if (!existsSync(directory)) return []
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) return walkSpecs({ directory: path })
    return entry === SPEC_FILE ? [path] : []
  })
}

const git = ({ args, root }) => {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: gitFreeEnv()
  })
  return { ok: result.status === 0, stdout: result.stdout ?? '' }
}

const lines = ({ text }) =>
  text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line !== '')

// The product the identity block of `HEAD`'s harness config names, or
// undefined when there is no HEAD or no block.
const committedProduct = ({ root }) => {
  const shown = git({ args: ['show', `HEAD:${HARNESS_CONFIG}`], root })
  if (!shown.ok) return undefined
  try {
    return JSON.parse(shown.stdout)?.identity?.product
  } catch {
    return undefined
  }
}

/**
 * Where the history of the checkout at `root` starts: `none` for the
 * template and a checkout that names no identity; for a derived one,
 * `unborn` until a commit holds its identity, `born` with the oldest
 * commit that brought its product in, or `lost` when a shallow clone
 * cannot show it.
 */
export const birthOf = ({ root }) => {
  const identity = identityOf({ root })
  if (identity === null || isTemplateIdentity({ identity })) {
    return { kind: BIRTH.none }
  }
  if (committedProduct({ root }) !== identity.product) {
    return { kind: BIRTH.unborn }
  }
  const shallow = git({
    args: ['rev-parse', '--is-shallow-repository'],
    root
  }).stdout.trim()
  const introduced = lines({
    text: git({
      args: [
        'log',
        '--format=%H',
        '-S',
        `"product": ${JSON.stringify(identity.product)}`,
        '--',
        HARNESS_CONFIG
      ],
      root
    }).stdout
  }).at(-1)
  return shallow === TRUE || introduced === undefined
    ? { kind: BIRTH.lost }
    : { kind: BIRTH.born, sha: introduced }
}

// Whether `sha` is a commit of the history that starts at `birth`.
const descends = ({ birth, root, sha }) =>
  git({ args: ['merge-base', '--is-ancestor', birth, sha], root }).ok

// The commit a spec verified at `sha` is measured from in a checkout whose
// history starts as `birth` says.
const anchorOf = ({ birth, root, sha }) => {
  if (birth.kind !== BIRTH.born) return sha
  const known = git({ args: ['cat-file', '-e', `${sha}^{commit}`], root })
  return known.ok && descends({ birth: birth.sha, root, sha })
    ? sha
    : birth.sha
}

// Reads every living spec under `root` and measures it against git: whether
// its commit exists, which governed paths are absent, and which files under
// them differ from that commit in the working tree, untracked ones included.
// A derived checkout's specs are measured from its birth (birthOf).
export const measureDrift = ({ root }) => {
  const birth = birthOf({ root })
  return walkSpecs({ directory: join(root, SPEC_ROOT) })
    .sort()
    .map((absolute) => {
      const path = toPosix({ path: relative(root, absolute) })
      const { governed, sha } = readSpecAnchor({
        text: readFileSync(absolute, 'utf8')
      })
      const base = { changed: [], commitKnown: false, governed, path, sha }
      if (sha === null || governed.length === 0)
        return { ...base, missing: [] }
      const missing = governed.filter(
        (governedPath) => !existsSync(join(root, governedPath))
      )
      if (birth.kind === BIRTH.unborn) {
        return { ...base, commitKnown: true, missing }
      }
      const anchor = anchorOf({ birth, root, sha })
      const commitKnown = git({
        args: ['cat-file', '-e', `${anchor}^{commit}`],
        root
      }).ok
      if (!commitKnown) return { ...base, missing, sha: anchor }
      const changed = [
        ...lines({
          text: git({
            args: ['diff', '--name-only', anchor, '--', ...governed],
            root
          }).stdout
        }),
        ...lines({
          text: git({
            args: [
              'ls-files',
              '--others',
              '--exclude-standard',
              '--',
              ...governed
            ],
            root
          }).stdout
        })
      ]
      return {
        ...base,
        changed: [...new Set(changed)].sort(),
        commitKnown,
        missing,
        sha: anchor
      }
    })
}

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === -1
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

// The line that says where a derived checkout is measured from.
const birthLine = ({ birth }) =>
  ({
    [BIRTH.born]:
      `this project was born at ${birth.sha?.slice(0, SHORT_SHA)}, the ` +
      'commit that brought its identity in: its specs are measured from ' +
      'there, or from a later commit a spec was synced at',
    [BIRTH.lost]:
      'this project was made from the template, and this clone cannot show ' +
      'the commit it was born at: a shallow clone holds too little history, ' +
      'so fetch the whole history (fetch-depth: 0)',
    [BIRTH.none]: undefined,
    [BIRTH.unborn]:
      'this project was made from the template and its birth is not ' +
      'committed yet: no commit holds its renamed tree, so drift is measured ' +
      'from the commit that commits it'
  })[birth.kind]

const main = () => {
  const root = readRoot()
  const birth = birthOf({ root })
  const measured = measureDrift({ root })
  const findings = collectDrift({ measured })
  const stale = new Set(
    findings
      .filter(({ kind }) => kind === DRIFT_KIND.stale)
      .map(({ path }) => path)
  )
  findings.forEach(({ changed, detail, kind, path }) => {
    const spec = path
      .replace(/^openspec\/specs\//u, '')
      .replace(/\/spec\.md$/u, '')
    const sample =
      kind === DRIFT_KIND.stale
        ? `, e.g. ${changed.slice(0, SAMPLE_SIZE).join(', ')}` +
          ` — re-verify with the sdd skill: sync ${spec}`
        : ''
    console.log(`  WARN ${detail}${sample}`)
  })
  console.log(
    `report-spec-drift: ${stale.size} of ${measured.length} living spec(s) ` +
      `behind their code, ${findings.length - stale.size} unmeasurable ` +
      'finding(s). Not covered: whether a spec says what the code does, ' +
      'which only the sync mode of the sdd skill judges; a stale spec may ' +
      'still be true.'
  )
  const said = birthLine({ birth })
  if (said !== undefined) console.log(`  ${said}.`)
  if (findings.length > 0 || birth.kind === BIRTH.lost) process.exitCode = 1
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'report-spec-drift.mjs')
) {
  main()
}
