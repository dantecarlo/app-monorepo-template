#!/usr/bin/env node
// ---------------------------------------------------------------------------
// agent-harness:projection-check — every projected agent file equals what its
// neutral source in `.agents/agents/` renders, and is committed.
//
// It fails on a missing, extra, changed or untracked output, and on a
// `.agents/projection-manifest.json` that differs from the render, then says
// to run `pnpm agent-harness:generate`. The tracked files come from
// `git ls-files`, run under `gitFreeEnv` so a git hook's GIT_DIR cannot point
// it at another repository. `--root <dir>` judges another checkout.
//
// Ported from Certifipago's scripts/agent-harness/check.mjs.
//
// Usage:
//   node scripts/agent-harness/check.mjs [--root <dir>]
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { gitFreeEnv } from '../git-free-env.mjs'
import {
  compareProjection,
  MANIFEST_PATH,
  readProjectedFile,
  renderManifest,
  untrackedOutputs
} from './projection-manifest.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const PATH_SEPARATOR = '\0'
const GIT_OUTPUT_LIMIT = 64 * 1024 * 1024

/**
 * Read-only by construction: it renders the projection in memory and compares.
 * It shares no code path with the writer, so a checker that quietly "fixes"
 * what it was asked to judge is not possible here — the failure mode that makes
 * a green gate meaningless.
 */
export const trackedFiles = ({ root }) => {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'utf8',
    env: gitFreeEnv(),
    maxBuffer: GIT_OUTPUT_LIMIT
  })
  if (result.status !== 0) {
    throw new Error(
      `agent-harness:projection-check lists the tracked files with git: ${result.stderr}`
    )
  }
  return result.stdout.split(PATH_SEPARATOR).filter((path) => path !== '')
}

// `tracked` is a parameter, never read from Git inside this function: the
// scratch roots that drive the comparison are plain directories, not
// repositories. A null `tracked` skips the untracked check entirely.
export const checkProjection = ({ root, tracked = null }) => {
  const { changed, extra, missing, rendered } = compareProjection({ root })
  const untracked =
    tracked === null ? [] : untrackedOutputs({ rendered, tracked })
  const failures = [
    ...missing.map((path) => `missing: ${path}`),
    ...extra.map((path) => `extra: ${path}`),
    ...changed.map((path) => `changed: ${path}`),
    ...untracked.map(
      (path) =>
        `untracked: ${path} — on disk but not committed, so a fresh clone has it not`
    )
  ]

  const manifestExpected = renderManifest({ rendered })
  const manifestActual = existsSync(resolve(root, MANIFEST_PATH))
    ? readProjectedFile({ path: MANIFEST_PATH, root })
    : null

  if (manifestActual === null) failures.push(`missing: ${MANIFEST_PATH}`)
  else if (manifestActual !== manifestExpected) {
    failures.push(`changed: ${MANIFEST_PATH}`)
  }

  return { failures, outputs: rendered.size }
}

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === -1
    ? resolve(HERE, '..', '..')
    : resolve(process.argv[index + 1])
}

const main = () => {
  const root = readRoot()
  const { failures, outputs } = checkProjection({
    root,
    tracked: trackedFiles({ root })
  })

  if (failures.length > 0) {
    console.error(
      `agent-harness:projection-check: ${failures.length} deviation(s) ` +
        `across ${outputs} projected output(s).`
    )
    failures.forEach((failure) => console.error(`  ${failure}`))
    console.error('Run pnpm agent-harness:generate and review the diff.')
    process.exitCode = 1
    return
  }

  console.log(
    `agent-harness:projection-check: ${outputs} projected output(s) ` +
      'match their neutral sources.'
  )
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'check.mjs')
) {
  main()
}
