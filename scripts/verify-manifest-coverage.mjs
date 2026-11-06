#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-manifest-coverage — gate #2 of the deterministic init contract.
//
// Gate #1 proves the manifest is well formed. This one proves it is TRUE of
// this repo, by walking every git-tracked file and checking three things:
//
//   unclaimed    a tracked file no owner claims
//                → the manifest has a hole. `pnpm init` would leave this file
//                  behind no matter what the user answers.
//
//   conflicts    a tracked file two owners claim
//                → pruning is ambiguous. Two capabilities disagree about who
//                  deletes it, so the outcome depends on evaluation order.
//                  Ownership must be single, or it is not deterministic.
//
//   staleClaims  a claim that matches no tracked file
//                → the manifest has drifted. It describes a repo that no
//                  longer exists.
//
// Together those close the door in both directions: the manifest cannot omit
// reality, and it cannot invent it.
//
// Scope note
// ----------
// Ownership answers "who deletes this file by default". Cross-cutting removal
// — dropping apps/web/src/lib/supabase/** when the supabase capability is
// deselected — is a declared `remove` action, not a claim. Those secondary
// effects are proven by the preset CI matrix (clean clone → init → validate),
// not by this gate.
//
// Usage:
//   node scripts/verify-manifest-coverage.mjs
// ---------------------------------------------------------------------------

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { analyzeCoverage } from './manifest.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')
const MANIFEST_PATH = resolve(REPO_ROOT, 'template.manifest.json')

const fail = ({ message }) => {
  console.error(`\nverify-manifest-coverage: FAIL — ${message}\n`)
  process.exit(1)
}

const readManifest = () => {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
  } catch (error) {
    fail({
      message: `cannot read template.manifest.json\n  ${error.message}`
    })
  }
}

// git ls-files is the deterministic file source: it already excludes
// node_modules, build output, and anything else .gitignore covers, so the
// gate never depends on the state of the working tree.
const trackedFiles = () => {
  try {
    return execFileSync('git', ['ls-files'], {
      cwd: REPO_ROOT,
      encoding: 'utf8'
    })
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  } catch (error) {
    fail({
      message: `cannot list tracked files via git\n  ${error.message}`
    })
  }
}

const manifest = readManifest()
const files = trackedFiles()
const { conflicts, staleClaims, unclaimed } = analyzeCoverage({
  files,
  manifest
})

const total = unclaimed.length + conflicts.length + staleClaims.length

if (total === 0) {
  console.log(
    `verify-manifest-coverage: PASS — all ${files.length} tracked file(s) owned exactly once, no stale claims.`
  )
  process.exit(0)
}

console.error(
  `\nverify-manifest-coverage: FAIL — ${total} problem(s) found:\n`
)

if (unclaimed.length > 0) {
  console.error(
    `  UNCLAIMED (${unclaimed.length}) — no owner, so init can never prune them:`
  )
  for (const path of unclaimed) {
    console.error(`    ${path}`)
  }
  console.error('')
}

if (conflicts.length > 0) {
  console.error(
    `  CONFLICTS (${conflicts.length}) — more than one owner, so pruning is ambiguous:`
  )
  for (const { owners, path } of conflicts) {
    console.error(`    ${path}  →  claimed by ${owners.join(', ')}`)
  }
  console.error('')
}

if (staleClaims.length > 0) {
  console.error(
    `  STALE CLAIMS (${staleClaims.length}) — claimed but matching nothing on disk:`
  )
  for (const { claim, owner } of staleClaims) {
    console.error(`    ${owner}  →  "${claim}"`)
  }
  console.error('')
}

console.error(
  'Fix by editing template.manifest.json:\n' +
    '  • unclaimed   → decide the owner. A new file belongs to a capability, or to core.\n' +
    '  • conflicts   → narrow one of the claims. Ownership is single by design.\n' +
    '  • stale claim → drop it, or restore the path it was describing.\n'
)
process.exit(1)
