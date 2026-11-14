#!/usr/bin/env node
// ---------------------------------------------------------------------------
// report-spec-drift — the living specs whose code changed after they were
// last verified.
//
// Each spec under openspec/specs/ names the paths it governs and the commit
// it was verified at ("Verified against the code: <date> at `<sha>`"). A
// file under those paths that differs from that commit, committed or not,
// makes the spec stale: its words may no longer say what the code does.
// The report prints one WARN line per stale or unmeasurable spec and always
// exits 0; re-verifying a listed spec is the `sync <spec>` mode of the sdd
// skill, which rewrites the spec from the code and moves its commit forward.
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
  collectDrift,
  DRIFT_KIND,
  readSpecAnchor
} from './spec-drift.detect.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const SPEC_ROOT = join('openspec', 'specs')
const SPEC_FILE = 'spec.md'
const SAMPLE_SIZE = 5
const ROOT_FLAG = '--root'

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

// Reads every living spec under `root` and measures it against git: whether
// its commit exists, which governed paths are absent, and which files under
// them differ from that commit in the working tree, untracked ones included.
export const measureDrift = ({ root }) =>
  walkSpecs({ directory: join(root, SPEC_ROOT) })
    .sort()
    .map((absolute) => {
      const path = toPosix({ path: relative(root, absolute) })
      const { governed, sha } = readSpecAnchor({
        text: readFileSync(absolute, 'utf8')
      })
      const base = { changed: [], commitKnown: false, governed, path, sha }
      if (sha === null || governed.length === 0)
        return { ...base, missing: [] }
      const commitKnown = git({
        args: ['cat-file', '-e', `${sha}^{commit}`],
        root
      }).ok
      const missing = governed.filter(
        (governedPath) => !existsSync(join(root, governedPath))
      )
      if (!commitKnown) return { ...base, missing }
      const changed = [
        ...lines({
          text: git({
            args: ['diff', '--name-only', sha, '--', ...governed],
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
        missing
      }
    })

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === -1
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

const main = () => {
  const measured = measureDrift({ root: readRoot() })
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
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'report-spec-drift.mjs')
) {
  main()
}
