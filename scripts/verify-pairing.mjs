#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-pairing — service ↔ adapter pairing + domain-folder contract.
//
// Check #20 of the deterministic-validation plan.
//
// Rules enforced:
//   1. Every *.service.ts inside src/services/<Domain>/ must have a sibling
//      *.adapter.ts in the same folder (and vice-versa).
//   2. Each domain folder must be PascalCase-named.
//   3. Each domain folder must contain a barrel index.ts.
//
// Scanning roots: apps/*/src/services
//
// Self-skip: ATL_TEMPLATE_SELF=1 skips nothing — this check is meaningful
// for the template itself since it ships example service/adapter pairs.
//
// Usage:
//   node scripts/verify-pairing.mjs
// ---------------------------------------------------------------------------

import { readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

const PASCAL_CASE_RE = /^[A-Z][A-Za-z0-9]*$/

const IGNORED_DIRS = new Set(['.next', '.turbo', 'node_modules', 'dist', 'coverage'])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isDir = (p) => {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

const readDir = (p) => {
  try {
    return readdirSync(p)
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Discover all src/services roots across apps/*
// ---------------------------------------------------------------------------

const appsRoot = resolve(REPO_ROOT, 'apps')
const appDirs = readDir(appsRoot)
  .map((entry) => join(appsRoot, entry))
  .filter((p) => isDir(p) && !IGNORED_DIRS.has(p.split('/').pop()))

const servicesRoots = appDirs
  .map((app) => join(app, 'src', 'services'))
  .filter((p) => isDir(p))

// ---------------------------------------------------------------------------
// Scan each services root for domain folders
// ---------------------------------------------------------------------------

const failures = []
let totalDomains = 0

for (const servicesRoot of servicesRoots) {
  const relRoot = servicesRoot.replace(`${REPO_ROOT}/`, '')
  const domainDirs = readDir(servicesRoot)
    .map((entry) => ({ entry, full: join(servicesRoot, entry) }))
    .filter(({ full }) => isDir(full))

  for (const { entry: domain, full: domainPath } of domainDirs) {
    if (IGNORED_DIRS.has(domain)) continue

    totalDomains++
    const relDomain = `${relRoot}/${domain}`

    // Rule 2: PascalCase domain folder name
    if (!PASCAL_CASE_RE.test(domain)) {
      failures.push({
        path: relDomain,
        rule: 'domain-folder-pascal-case',
        detail: `Folder "${domain}" is not PascalCase`
      })
    }

    const files = readDir(domainPath)

    // Rule 3: barrel index.ts must be present
    if (!files.includes('index.ts')) {
      failures.push({
        path: relDomain,
        rule: 'barrel-missing',
        detail: 'No index.ts barrel found in domain folder'
      })
    }

    // Rule 1: service ↔ adapter pairing
    // Collect all *.service.ts and *.adapter.ts base names (the part before .service/.adapter).
    // Comparison is case-insensitive: the template uses lowercase for services (items.service.ts)
    // and PascalCase for adapters (Items.adapter.ts) — both refer to the same domain.
    const serviceEntries = files
      .filter((f) => f.endsWith('.service.ts') && !f.endsWith('.test.ts'))
      .map((f) => ({ original: f.slice(0, -'.service.ts'.length), lower: f.slice(0, -'.service.ts'.length).toLowerCase() }))

    const adapterEntries = files
      .filter((f) => f.endsWith('.adapter.ts') && !f.endsWith('.test.ts'))
      .map((f) => ({ original: f.slice(0, -'.adapter.ts'.length), lower: f.slice(0, -'.adapter.ts'.length).toLowerCase() }))

    const adapterLowerSet = new Set(adapterEntries.map((a) => a.lower))
    const serviceLowerSet = new Set(serviceEntries.map((s) => s.lower))

    // Every service needs an adapter (case-insensitive stem match)
    for (const svc of serviceEntries) {
      if (!adapterLowerSet.has(svc.lower)) {
        failures.push({
          path: `${relDomain}/${svc.original}.service.ts`,
          rule: 'missing-adapter',
          detail: `${svc.original}.service.ts has no sibling adapter (looked for *${svc.lower}.adapter.ts)`
        })
      }
    }

    // Every adapter needs a service (case-insensitive stem match)
    for (const adp of adapterEntries) {
      if (!serviceLowerSet.has(adp.lower)) {
        failures.push({
          path: `${relDomain}/${adp.original}.adapter.ts`,
          rule: 'missing-service',
          detail: `${adp.original}.adapter.ts has no sibling service (looked for *${adp.lower}.service.ts)`
        })
      }
    }

    // A domain folder must have at least one service (otherwise it's dangling infra)
    if (serviceEntries.length === 0) {
      failures.push({
        path: relDomain,
        rule: 'no-service-in-domain',
        detail: 'Domain folder contains no *.service.ts file'
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (servicesRoots.length === 0) {
  console.log('verify-pairing: OK — no src/services roots found (nothing to check).')
  process.exit(0)
}

if (failures.length === 0) {
  console.log(
    `verify-pairing: PASS — ${totalDomains} domain folder(s) checked across ` +
      `${servicesRoots.length} services root(s). All pairing + barrel rules satisfied.`
  )
  process.exit(0)
}

console.error(
  `\nverify-pairing: FAIL — ${failures.length} violation(s) found:\n`
)
for (const { path, rule, detail } of failures) {
  console.error(`  [${rule}] ${path}`)
  console.error(`    ${detail}`)
}
console.error(
  '\nRules:\n' +
    '  • Each src/services/<Domain>/ folder must be PascalCase.\n' +
    '  • Each domain folder must contain a barrel index.ts.\n' +
    '  • Every *.service.ts needs a sibling *.adapter.ts (and vice-versa).\n'
)
process.exit(1)
