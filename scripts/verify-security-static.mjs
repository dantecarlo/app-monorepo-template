#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-security-static — deterministic static-analysis security gate.
//
// Checks #39, #40, #41, partial #42, partial #46 of the
// deterministic-validation plan.
//
// CHECK 39 — No secret-shaped keys under NEXT_PUBLIC_ / EXPO_PUBLIC_ in
//   any .env.example file found in the repo. Secret-shaped = name contains
//   _SECRET (e.g. CF_ORIGIN_SECRET, TURNSTILE_SECRET_KEY) or _PASSWORD.
//   Anon keys, DSNs, URLs, site keys, and app env tags are intentionally
//   public and are not flagged.
//
// CHECK 40 — apps/web/src/middleware.ts calls originGuard.assertTrustedOrigin.
//   This asserts the origin-lock seam is wired (checking header vs CF_ORIGIN_SECRET).
//
// CHECK 41 — apps/web/next.config.ts declares the minimum required security
//   headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
//   Permissions-Policy.
//
// CHECK 42 (partial) — sentry.client.config.ts AND sentry.server.config.ts
//   wire scrubPII at the beforeSend hook.
//
// CHECK 46 (partial) — every src/app/api/**/route.ts either exports
//   `dynamic = 'force-dynamic'` or sets a `Cache-Control` / `no-store`
//   response header, ensuring API routes opt out of caching.
//
// Usage:
//   node scripts/verify-security-static.mjs
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const readText = (filePath) => {
  try {
    return readFileSync(resolve(REPO_ROOT, filePath), 'utf8')
  } catch {
    return null
  }
}

const exists = (filePath) => {
  try {
    statSync(resolve(REPO_ROOT, filePath))
    return true
  } catch {
    return false
  }
}

const walkFiles = (dir, predicate, results = []) => {
  let entries
  try {
    entries = readdirSync(resolve(REPO_ROOT, dir))
  } catch {
    return results
  }
  for (const entry of entries) {
    const rel = `${dir}/${entry}`
    const abs = resolve(REPO_ROOT, rel)
    let stat
    try {
      stat = statSync(abs)
    } catch {
      continue
    }
    if (stat.isDirectory()) {
      const skip = ['node_modules', '.next', '.turbo', 'dist', 'coverage']
      if (skip.includes(entry)) continue
      walkFiles(rel, predicate, results)
    } else if (predicate(entry, rel)) {
      results.push(rel)
    }
  }
  return results
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const failures = []
const passes = []

const fail = (check, file, detail) =>
  failures.push({ check, detail, file })

const pass = (check, detail) =>
  passes.push({ check, detail })

// ---------------------------------------------------------------------------
// CHECK 39 — secret-shaped keys in NEXT_PUBLIC_ / EXPO_PUBLIC_
// ---------------------------------------------------------------------------

// A var is "secret-shaped" if its name (after the prefix) contains one of
// these patterns. This deliberately excludes _ANON_KEY, _URL, _DSN,
// _SITE_KEY, _APP_ENV — those are intentionally browser-accessible.
const isSecretShaped = (varName) => {
  const upper = varName.toUpperCase()
  return (
    upper.includes('_SECRET') ||
    upper.includes('_PASSWORD') ||
    upper.includes('SECRET_KEY')
  )
}

const envExampleFiles = walkFiles('.', (name) => name === '.env.example')

let check39Pass = true
for (const envFile of envExampleFiles) {
  const text = readText(envFile)
  if (!text) continue
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const varName = trimmed.split('=')[0].trim()
    if (!varName.startsWith('NEXT_PUBLIC_') && !varName.startsWith('EXPO_PUBLIC_')) continue
    if (isSecretShaped(varName)) {
      fail('39', envFile, `Secret-shaped key in public namespace: ${varName}`)
      check39Pass = false
    }
  }
}
if (check39Pass) {
  if (envExampleFiles.length === 0) {
    pass('39', 'No .env.example files found — nothing to check')
  } else {
    pass(
      '39',
      `No secret-shaped NEXT_PUBLIC_*/EXPO_PUBLIC_* keys found in ${envExampleFiles.length} .env.example file(s)`
    )
  }
}

// ---------------------------------------------------------------------------
// CHECK 40 — middleware wires originGuard.assertTrustedOrigin
// ---------------------------------------------------------------------------

const middlewarePath = 'apps/web/src/middleware.ts'
if (!exists(middlewarePath)) {
  fail('40', middlewarePath, 'File not found — origin-lock middleware is missing')
} else {
  const text = readText(middlewarePath)
  const hasOriginGuardImport = /originGuard/.test(text)
  const hasAssertCall = /assertTrustedOrigin/.test(text)
  const has403Response = /403/.test(text)
  if (hasOriginGuardImport && hasAssertCall && has403Response) {
    pass('40', 'middleware.ts wires originGuard.assertTrustedOrigin and returns 403 on failure')
  } else {
    if (!hasOriginGuardImport) {
      fail('40', middlewarePath, 'Does not import originGuard')
    }
    if (!hasAssertCall) {
      fail('40', middlewarePath, 'Does not call assertTrustedOrigin')
    }
    if (!has403Response) {
      fail('40', middlewarePath, 'Does not return 403 for untrusted requests')
    }
  }
}

// ---------------------------------------------------------------------------
// CHECK 41 — required security headers in next.config.ts
// ---------------------------------------------------------------------------

const nextConfigPath = 'apps/web/next.config.ts'
if (!exists(nextConfigPath)) {
  fail('41', nextConfigPath, 'File not found — next.config.ts is missing')
} else {
  const text = readText(nextConfigPath)
  const REQUIRED_HEADERS = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Permissions-Policy'
  ]
  let allPresent = true
  for (const header of REQUIRED_HEADERS) {
    if (!text.includes(header)) {
      fail('41', nextConfigPath, `Required security header missing: ${header}`)
      allPresent = false
    }
  }
  if (allPresent) {
    pass('41', `All ${REQUIRED_HEADERS.length} required security headers present in next.config.ts`)
  }
}

// ---------------------------------------------------------------------------
// CHECK 42 (partial) — scrubPII at Sentry beforeSend
// ---------------------------------------------------------------------------

const sentryFiles = [
  'apps/web/sentry.client.config.ts',
  'apps/web/sentry.server.config.ts'
]

for (const sentryFile of sentryFiles) {
  if (!exists(sentryFile)) {
    fail('42', sentryFile, 'Sentry config file not found')
    continue
  }
  const text = readText(sentryFile)
  const hasScrubPIIImport = /scrubPII/.test(text)
  const hasBeforeSend = /beforeSend/.test(text)
  const hasBeforeSendWithScrub = /beforeSend[^}]*scrubPII/.test(text.replace(/\n/g, ' '))
  if (hasScrubPIIImport && hasBeforeSend && hasBeforeSendWithScrub) {
    pass('42', `${sentryFile}: scrubPII is wired at beforeSend`)
  } else {
    if (!hasScrubPIIImport) {
      fail('42', sentryFile, 'scrubPII is not imported')
    }
    if (!hasBeforeSend) {
      fail('42', sentryFile, 'beforeSend hook is missing from Sentry.init()')
    }
    if (hasScrubPIIImport && hasBeforeSend && !hasBeforeSendWithScrub) {
      fail('42', sentryFile, 'beforeSend does not call scrubPII')
    }
  }
}

// ---------------------------------------------------------------------------
// CHECK 46 (partial) — API routes opt out of caching
//
// Acceptable patterns (any one satisfies the check):
//   1. `export const dynamic = 'force-dynamic'`   (Next.js App Router)
//   2. Response headers include 'no-store'
// ---------------------------------------------------------------------------

const apiRouteFiles = walkFiles('apps/web/src/app/api', (name) => name === 'route.ts')

if (apiRouteFiles.length === 0) {
  pass('46', 'No API route files found — nothing to check')
} else {
  let allRoutesClear = true
  for (const routeFile of apiRouteFiles) {
    const text = readText(routeFile)
    if (!text) continue
    const hasForceDynamic = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/.test(text)
    const hasNoStore = /no-store/.test(text)
    if (hasForceDynamic || hasNoStore) {
      pass('46', `${routeFile}: opts out of caching`)
    } else {
      fail(
        '46',
        routeFile,
        'API route does not opt out of caching. ' +
          "Add `export const dynamic = 'force-dynamic'` or set Cache-Control: no-store."
      )
      allRoutesClear = false
    }
  }
  if (allRoutesClear) {
    pass('46', `All ${apiRouteFiles.length} API route(s) correctly opt out of caching`)
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const checkIds = ['39', '40', '41', '42', '46']
const failedChecks = [...new Set(failures.map((f) => f.check))]
const passedChecks = checkIds.filter((id) => !failedChecks.includes(id))

console.log('\nverify-security-static results:')
console.log('─'.repeat(50))

for (const { check, detail } of passes) {
  console.log(`  PASS [#${check}] ${detail}`)
}

if (failures.length > 0) {
  console.error('')
  for (const { check, file, detail } of failures) {
    console.error(`  FAIL [#${check}] ${file}`)
    console.error(`    ${detail}`)
  }
}

console.log('')
console.log(
  `verify-security-static: ${passedChecks.length}/${checkIds.length} checks passed, ` +
    `${failures.length} violation(s) found.`
)

if (failures.length > 0) {
  process.exit(1)
}
process.exit(0)
