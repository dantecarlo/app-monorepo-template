// ---------------------------------------------------------------------------
// template-identity — whether a checkout is the template itself, read from
// the identity block of its .agents/harness.config.json, and from nothing
// else: no environment variable decides it.
//
// The template is the one checkout whose identity is the template's own:
// its product, repository and packageScope all equal TEMPLATE_IDENTITY.
// Every other checkout is derived, and so is one whose config is absent,
// does not parse or holds no identity block: a checkout that cannot show it
// is the template gets every check a derived project gets. `pnpm run init
// <slug>` rewrites the block, so a renamed checkout is derived from then on.
//
// Read by the gates that hold the template and a derived project to
// different rules: scripts/check-identity.mjs and
// scripts/verify-skill-neutrality.mjs. It holds the template's identity on
// purpose, so `pnpm run init` must leave it as it is.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { HARNESS_CONFIG } from './verify-harness-config.mjs'

// The identity block of the template itself, as .agents/harness.config.json
// holds it before `pnpm run init` names a project.
export const TEMPLATE_IDENTITY = Object.freeze({
  packageScope: '@app',
  product: 'app-monorepo-template',
  repository: 'dantecarlo/app-monorepo-template'
})

const isRecord = ({ value }) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

// True only when every name of the block is the template's own.
export const isTemplateIdentity = ({ identity }) =>
  isRecord({ value: identity }) &&
  Object.entries(TEMPLATE_IDENTITY).every(
    ([key, value]) => identity[key] === value
  )

// The identity block of the checkout at `root`, or null when its harness
// config is absent, does not parse or holds no block.
export const identityOf = ({ root }) => {
  try {
    const config = JSON.parse(
      readFileSync(join(root, HARNESS_CONFIG), 'utf8')
    )
    return isRecord({ value: config?.identity }) ? config.identity : null
  } catch {
    return null
  }
}

export const isTemplateCheckout = ({ root }) =>
  isTemplateIdentity({ identity: identityOf({ root }) })
