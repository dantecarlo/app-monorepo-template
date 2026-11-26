#!/usr/bin/env node
// ---------------------------------------------------------------------------
// template-identity — the template is the checkout whose identity block
// names the template itself, and every other checkout is derived. The
// derived identity is synthetic; the template's own comes from the module,
// so no value here is one `pnpm run init` rewrites. The checkouts are
// scratch trees in the OS temp directory, which `withScratchTree` removes.
// No case sets or reads an environment variable: none decides it.
//
// Usage:
//   node --test scripts/template-identity.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'node:test'

import { withScratchTree } from './gate/scratch.mjs'
import {
  identityOf,
  isTemplateCheckout,
  isTemplateIdentity,
  TEMPLATE_IDENTITY
} from './template-identity.mjs'
import { HARNESS_CONFIG } from './verify-harness-config.mjs'

const REPO_ROOT = resolve(import.meta.dirname, '..')
const DERIVED = Object.freeze({
  packageScope: '@acme-ledger',
  product: 'acme-ledger',
  repository: 'acme/acme-ledger'
})

const configText = ({ identity }) =>
  JSON.stringify({ identity, workflow: { mode: 'sdd' } }, null, 2)

const inScratch = ({ files, read }) =>
  withScratchTree({
    files,
    prefix: 'template-identity-',
    use: ({ root }) => read({ root })
  })

const readsAsTemplate = ({ files }) =>
  inScratch({ files, read: isTemplateCheckout })

test("the template's own identity is the template", () => {
  assert.equal(
    isTemplateIdentity({ identity: { ...TEMPLATE_IDENTITY } }),
    true
  )
})

test('an identity that names another project is derived', () => {
  assert.equal(isTemplateIdentity({ identity: DERIVED }), false)
})

for (const key of Object.keys(TEMPLATE_IDENTITY)) {
  test(`an identity that differs from the template's in ${key} alone is derived`, () => {
    assert.equal(
      isTemplateIdentity({
        identity: { ...TEMPLATE_IDENTITY, [key]: DERIVED[key] }
      }),
      false
    )
  })

  test(`an identity with no ${key} is derived`, () => {
    const identity = { ...TEMPLATE_IDENTITY }
    delete identity[key]
    assert.equal(isTemplateIdentity({ identity }), false)
  })
}

for (const [name, identity] of [
  ['no identity', undefined],
  ['a null identity', null],
  ['an identity that is a list', Object.values(TEMPLATE_IDENTITY)],
  ['an identity that is a text', TEMPLATE_IDENTITY.product]
]) {
  test(`${name} is derived`, () => {
    assert.equal(isTemplateIdentity({ identity }), false)
  })
}

test('a checkout whose harness config names the template reads as the template', () => {
  assert.equal(
    readsAsTemplate({
      files: { [HARNESS_CONFIG]: configText({ identity: TEMPLATE_IDENTITY }) }
    }),
    true
  )
})

test('a checkout whose harness config names another project reads as derived', () => {
  assert.equal(
    readsAsTemplate({
      files: { [HARNESS_CONFIG]: configText({ identity: DERIVED }) }
    }),
    false
  )
})

for (const [name, files] of [
  ['no harness config', { 'package.json': '{}\n' }],
  ['a harness config that does not parse', { [HARNESS_CONFIG]: '{ "identity": ' }],
  ['a harness config that is null', { [HARNESS_CONFIG]: 'null\n' }],
  [
    'a harness config with no identity block',
    { [HARNESS_CONFIG]: JSON.stringify({ workflow: { mode: 'sdd' } }) }
  ]
]) {
  test(`a checkout with ${name} reads as derived`, () => {
    assert.equal(readsAsTemplate({ files }), false)
    assert.equal(inScratch({ files, read: identityOf }), null)
  })
}

test('identityOf reads the identity block as the harness config holds it', () => {
  const identity = { $comment: 'The names.', ...DERIVED }
  assert.deepEqual(
    inScratch({
      files: { [HARNESS_CONFIG]: configText({ identity }) },
      read: identityOf
    }),
    identity
  )
})

// The root package.json name is a second witness, which `pnpm run init`
// rewrites with the identity block: the two agree in the template and in
// every renamed project.
test("the repository reads as the template exactly when its root package.json carries the template's name", () => {
  const { name } = JSON.parse(
    readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')
  )
  assert.equal(
    isTemplateCheckout({ root: REPO_ROOT }),
    name === TEMPLATE_IDENTITY.product
  )
})
