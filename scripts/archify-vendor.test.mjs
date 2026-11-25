#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Pins the vendored archify skill (.claude/skills/archify) to what
// .claude/skills-lock.json records about it:
//
//   - the semantic-sigil-label-reserve patch, through its text-fit helpers
//     and through `validate` on an architecture spec whose short box puts the
//     label on the sigil's rail;
//   - every file the lock hashes, read from disk with CRLF normalized to LF,
//     since the hashes are of the LF git blobs and a Windows checkout may
//     hold CRLF.
//
// The spec is derived from the skill's own web-app example and written to a
// scratch directory in the OS temp directory, removed after each check.
// `validate` runs with ARCHIFY_UPDATE_CHECK_DISABLED=1, as the docs pipeline
// does, so no check here starts the skill's update child.
//
// Usage:
//   node --test scripts/archify-vendor.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SKILL_DIR = join(REPO_ROOT, '.claude/skills/archify')
const ARCHIFY = join(SKILL_DIR, 'bin/archify.mjs')
const LOCK = join(REPO_ROOT, '.claude/skills-lock.json')
const EXAMPLE = join(SKILL_DIR, 'examples/web-app.architecture.json')
const TEXT_FIT = join(SKILL_DIR, 'renderers/shared/text-fit.mjs')

const PASSED = 0
const FAILED = 1
const SIGIL_RAIL = 42
const BRAND_RAIL = 48
const LEGIBLE_MINIMUM_PX = 8
const SHORT_BOX = [130, 40]
const FITTING_LABEL = 'Payments Gateway X'
const TIGHT_LABEL = 'Payments Gateway XY'
const TIGHT_LABEL_BOX_WIDTH = 134
const COMPONENT_ID = 'api'
const SIGIL_RAIL_CODE = 'architecture/component-label-sigil-rail'
const CRLF = /\r\n/g

const { nodeLabelRailReserve, requiredNodeLabelBoxWidth } = await import(
  pathToFileURL(TEXT_FIT).href
)

// The web-app example with one component in a short box: no sublabel, so
// its centered label sits on the same rail as the sigil.
const shortBoxSpec = ({ label }) => {
  const spec = JSON.parse(readFileSync(EXAMPLE, 'utf8'))
  const component = spec.components.find(({ id }) => id === COMPONENT_ID)
  component.size = [...SHORT_BOX]
  component.label = label
  delete component.sublabel
  return spec
}

const validate = ({ spec }) => {
  const scratch = mkdtempSync(join(tmpdir(), 'archify-vendor-'))
  try {
    const specPath = join(scratch, 'candidate.json')
    writeFileSync(specPath, JSON.stringify(spec, null, 2))
    const run = spawnSync(
      process.execPath,
      [ARCHIFY, 'validate', 'architecture', specPath, '--json'],
      {
        cwd: scratch,
        encoding: 'utf8',
        env: { ...process.env, ARCHIFY_UPDATE_CHECK_DISABLED: '1' }
      }
    )
    const codes = (JSON.parse(run.stdout).diagnostics ?? [])
      .filter(({ severity }) => severity === 'error')
      .map(({ code }) => code)
    return { codes, status: run.status }
  } finally {
    rmSync(scratch, { force: true, recursive: true })
  }
}

// Bytes are read as latin1, one character per byte, so normalizing CRLF never
// re-encodes a byte of a UTF-8 or binary file.
const BYTE_ENCODING = 'latin1'

const lfSha256 = ({ path }) =>
  createHash('sha256')
    .update(
      readFileSync(path).toString(BYTE_ENCODING).replace(CRLF, '\n'),
      BYTE_ENCODING
    )
    .digest('hex')

test('the label rail reserves the sigil, or the brand mark when stricter', () => {
  assert.equal(nodeLabelRailReserve(), SIGIL_RAIL)
  assert.equal(nodeLabelRailReserve(true), BRAND_RAIL)
  assert.equal(
    requiredNodeLabelBoxWidth(TIGHT_LABEL, LEGIBLE_MINIMUM_PX),
    TIGHT_LABEL_BOX_WIDTH
  )
})

test('Given a short box, when its label clears the sigil rail at 8px, then validate passes', () => {
  const { codes, status } = validate({
    spec: shortBoxSpec({ label: FITTING_LABEL })
  })
  assert.equal(status, PASSED)
  assert.deepEqual(codes, [])
})

test('Given a short box, when its label cannot clear the sigil rail at 8px, then validate names the rail', () => {
  const { codes, status } = validate({
    spec: shortBoxSpec({ label: TIGHT_LABEL })
  })
  assert.equal(status, FAILED)
  assert.deepEqual(codes, [SIGIL_RAIL_CODE])
})

test('every file the lock hashes matches its recorded sha256', () => {
  const { fileHashes } = JSON.parse(readFileSync(LOCK, 'utf8')).skills
    .archify
  const drifted = Object.entries(fileHashes)
    .filter(
      ([path, hash]) => lfSha256({ path: join(SKILL_DIR, path) }) !== hash
    )
    .map(([path]) => path)
  assert.ok(Object.keys(fileHashes).length > 0)
  assert.deepEqual(drifted, [])
})
