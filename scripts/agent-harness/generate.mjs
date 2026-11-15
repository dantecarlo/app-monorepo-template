#!/usr/bin/env node
// ---------------------------------------------------------------------------
// agent-harness:generate — the one writer of every projected agent file and
// of `.agents/projection-manifest.json`. Edit the neutral source in
// `.agents/agents/`, run this, review the diff and commit it;
// `pnpm agent-harness:projection-check` fails on any output edited by hand.
//
// Ported from Certifipago's scripts/agent-harness/generate.mjs.
//
// Usage:
//   node scripts/agent-harness/generate.mjs
// ---------------------------------------------------------------------------

import { mkdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  compareProjection,
  MANIFEST_PATH,
  renderManifest
} from './projection-manifest.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..')
const TEMPORARY_SUFFIX = '.generating'

// Rename within the same directory, so a crash mid-write leaves the previous
// projection intact rather than a truncated agent definition the tool would
// load anyway. The temporary file is removed on any failure path.
const writeAtomically = ({ absolutePath, text }) => {
  const temporary = `${absolutePath}${TEMPORARY_SUFFIX}`
  mkdirSync(dirname(absolutePath), { recursive: true })
  try {
    writeFileSync(temporary, text, { flag: 'w' })
    renameSync(temporary, absolutePath)
  } finally {
    rmSync(temporary, { force: true })
  }
}

/**
 * Every neutral source is parsed and validated BEFORE anything is written, so a
 * source carrying an unmapped field leaves the previous projection untouched
 * instead of a half-generated tree. `compareProjection` does that parsing, and
 * it throws on the first invalid source.
 */
export const generateProjection = ({ root }) => {
  const { rendered } = compareProjection({ root })
  const written = []

  rendered.forEach((text, path) => {
    writeAtomically({ absolutePath: resolve(root, path), text })
    written.push(path)
  })
  writeAtomically({
    absolutePath: resolve(root, MANIFEST_PATH),
    text: renderManifest({ rendered })
  })

  return [...written, MANIFEST_PATH].sort()
}

const main = () => {
  const written = generateProjection({ root: REPO_ROOT })
  console.log(
    `agent-harness:generate: wrote ${written.length} file(s) from ` +
      'their neutral sources. Review the diff and commit it.'
  )
  written.forEach((path) => console.log(`  ${path}`))
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'generate.mjs')
) {
  main()
}
