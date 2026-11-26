// ---------------------------------------------------------------------------
// template-identity — whether a checkout is the template itself, read from
// the identity block of its .agents/harness.config.json and its origin
// remote, and from nothing else: no environment variable decides it.
//
// The template is the one checkout whose identity is the template's own:
// its product, repository and packageScope all equal TEMPLATE_IDENTITY.
// Every other checkout is derived, and so is one whose config is absent,
// does not parse or holds no identity block: a checkout that cannot show it
// is the template gets every check a derived project gets. A copy keeps the
// block until `pnpm run init <slug>` rewrites it, so only an origin remote
// on the template's repository makes a checkout the template.
//
// Read by the gates that hold the template and a derived project to
// different rules: scripts/check-identity.mjs and
// scripts/verify-skill-neutrality.mjs. It holds the template's identity on
// purpose, so `pnpm run init` must leave it as it is.
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import { gitFreeEnv } from './git-free-env.mjs'
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

// `owner/name` at the end of a GitHub remote URL, in each of its spellings:
// https://github.com/o/n(.git), git@github.com:o/n(.git),
// ssh://git@github.com/o/n(.git).
const GITHUB_REPOSITORY =
  /github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?\/?$/iu
const ORIGIN_URL = ['config', '--get', 'remote.origin.url']

// The `owner/name`, in lower case, that the origin remote of the checkout at
// `root` points at on GitHub; null when it has none, points elsewhere or
// `root` is no git checkout. Git reads `root` alone: no hook variable
// redirects it, and it looks for no repository above `root`.
const originRepositoryOf = ({ root }) => {
  const result = spawnSync('git', ['-C', root, ...ORIGIN_URL], {
    encoding: 'utf8',
    env: {
      ...gitFreeEnv(),
      GIT_CEILING_DIRECTORIES: dirname(resolve(root))
    }
  })
  const repository =
    result.status === 0
      ? GITHUB_REPOSITORY.exec(result.stdout.trim())?.[1]
      : undefined
  return repository === undefined ? null : repository.toLowerCase()
}

export const isTemplateCheckout = ({ root }) =>
  isTemplateIdentity({ identity: identityOf({ root }) }) &&
  originRepositoryOf({ root }) ===
    TEMPLATE_IDENTITY.repository.toLowerCase()
