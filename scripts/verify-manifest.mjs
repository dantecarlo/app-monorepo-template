#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-manifest — gate #1 of the deterministic init contract.
//
// Proves that template.manifest.json is structurally sound BEFORE anything
// tries to execute it:
//
//   - version is supported
//   - capability ids are unique and kebab-case
//   - every capability claims at least one path (an unclaiming capability
//     could never be pruned)
//   - claims are repo-relative (no absolute paths, no ".." escapes)
//   - every action uses a verb from the closed vocabulary, with its required
//     fields present
//   - requires / conflictsWith resolve to declared capabilities and do not
//     contradict each other
//   - every preset is internally satisfiable
//
// This gate is offline and pure: it never touches the working tree. The
// companion gate verify-manifest-coverage answers the other question — does
// the manifest actually describe THIS repo.
//
// Usage:
//   node scripts/verify-manifest.mjs
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ACTION_VERBS, validateManifest } from './manifest.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')
const MANIFEST_PATH = resolve(REPO_ROOT, 'template.manifest.json')

const readManifest = () => {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
  } catch (error) {
    console.error(
      `\nverify-manifest: FAIL — cannot read template.manifest.json\n  ${error.message}\n`
    )
    process.exit(1)
  }
}

const manifest = readManifest()
const violations = validateManifest({ manifest })

if (violations.length === 0) {
  const capabilities = manifest.capabilities?.length ?? 0
  const presets = manifest.presets?.length ?? 0

  console.log(
    `verify-manifest: PASS — ${capabilities} capability(ies) and ${presets} preset(s) are well formed.`
  )
  process.exit(0)
}

console.error(
  `\nverify-manifest: FAIL — ${violations.length} violation(s) found:\n`
)

for (const { detail, owner, rule } of violations) {
  console.error(`  [${rule}] ${owner}`)
  console.error(`    ${detail}`)
}

console.error(
  '\nThe manifest is the deterministic contract behind `pnpm init`. A malformed\n' +
    'manifest means the init command would guess — which is exactly what it exists\n' +
    'to prevent.\n\n' +
    `Allowed action verbs: ${Object.keys(ACTION_VERBS).sort().join(', ')}\n`
)
process.exit(1)
