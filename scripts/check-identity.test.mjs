#!/usr/bin/env node
// ---------------------------------------------------------------------------
// check-identity — the guard against shipping the template's identity, run
// as a process over scratch trees in the OS temp directory, which
// `withScratchTree` removes. Whether a tree is the template comes from its
// .agents/harness.config.json alone (template-identity.mjs): every run
// hands the guard an empty environment, so no variable can decide it. The
// template's tokens come from template-identity.mjs, so no value here is
// one `pnpm run init` rewrites.
//
// Usage:
//   node --test scripts/check-identity.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { withScratchTree } from './gate/scratch.mjs'
import { gitFreeEnv } from './git-free-env.mjs'
import { TEMPLATE_IDENTITY } from './template-identity.mjs'
import { HARNESS_CONFIG } from './verify-harness-config.mjs'

const GUARD = join(
  dirname(fileURLToPath(import.meta.url)),
  'check-identity.mjs'
)
const FAILED = 1
const PASSED = 0
const ROOT_PACKAGE = 'package.json'
const CORE_PACKAGE = 'packages/core/package.json'
const DERIVED = Object.freeze({
  packageScope: '@acme-ledger',
  product: 'acme-ledger',
  repository: 'acme/acme-ledger'
})

const configText = ({ identity }) => JSON.stringify({ identity }, null, 2)

const packageText = ({ name }) => JSON.stringify({ name }, null, 2)

// A tree that names `identity` in its harness config and carries the
// package names of `names`.
const treeOf = ({ identity, names }) => ({
  ...(identity === undefined
    ? {}
    : { [HARNESS_CONFIG]: configText({ identity }) }),
  [ROOT_PACKAGE]: packageText({ name: names.product }),
  [CORE_PACKAGE]: packageText({ name: `${names.packageScope}/core` })
})

const TEMPLATE_ORIGIN = `https://github.com/${TEMPLATE_IDENTITY.repository}.git`

// The guard run over `files`, a checkout cloned from `origin` when one is
// given; no variable of the environment decides it.
const runGuard = ({ files, origin }) =>
  withScratchTree({
    files,
    origin,
    prefix: 'check-identity-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GUARD, '--root', root], {
        encoding: 'utf8',
        env: gitFreeEnv()
      })
  })

test("a tree whose identity is the template's passes with its template tokens, and says why", () => {
  const result = runGuard({
    files: treeOf({ identity: TEMPLATE_IDENTITY, names: TEMPLATE_IDENTITY }),
    origin: TEMPLATE_ORIGIN
  })
  assert.equal(result.status, PASSED, result.stderr)
  assert.match(result.stdout, /names the template itself/u)
  assert.match(
    result.stdout,
    new RegExp(RegExp.escape(TEMPLATE_IDENTITY.product), 'u')
  )
})

test('a tree whose identity names another project is checked, and fails on each template token it still carries', () => {
  const result = runGuard({
    files: treeOf({ identity: DERIVED, names: TEMPLATE_IDENTITY })
  })
  assert.equal(result.status, FAILED, result.stdout)
  assert.match(result.stderr, /FAIL — 2 template-default identity token/u)
  assert.match(
    result.stderr,
    new RegExp(
      `${RegExp.escape(ROOT_PACKAGE)} — name: "${RegExp.escape(TEMPLATE_IDENTITY.product)}"`,
      'u'
    )
  )
  assert.match(
    result.stderr,
    new RegExp(
      `packages[\\\\/]core[\\\\/]package\\.json — name: ` +
        `"${RegExp.escape(TEMPLATE_IDENTITY.packageScope)}/core"`,
      'u'
    )
  )
})

test('a renamed tree whose identity names another project passes', () => {
  const result = runGuard({
    files: treeOf({ identity: DERIVED, names: DERIVED })
  })
  assert.equal(result.status, PASSED, result.stderr)
  assert.match(
    result.stdout,
    /OK — no template-default identity tokens found/u
  )
})

// A copy of the template keeps its identity block byte for byte until
// `pnpm run init` rewrites it: the repository it was cloned from tells it
// apart, so it cannot pass validate until renamed.
for (const [name, origin] of [
  ['cloned from another repository', 'https://github.com/acme/acme-ledger.git'],
  ['with no git checkout', undefined]
]) {
  test(`a tree whose identity is the template's, ${name}, fails until pnpm run init renames it`, () => {
    const result = runGuard({
      files: treeOf({ identity: TEMPLATE_IDENTITY, names: TEMPLATE_IDENTITY }),
      origin
    })
    assert.equal(result.status, FAILED, result.stdout)
    assert.match(result.stderr, /FAIL — 2 template-default identity token/u)
    assert.match(result.stderr, /pnpm run init/u)
  })
}

test('a tree with no harness config is checked as a derived project', () => {
  const result = runGuard({
    files: treeOf({ identity: undefined, names: TEMPLATE_IDENTITY })
  })
  assert.equal(result.status, FAILED, result.stdout)
  assert.match(result.stderr, /FAIL — 2 template-default identity token/u)
})
