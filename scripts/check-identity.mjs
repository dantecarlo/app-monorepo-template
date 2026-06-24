#!/usr/bin/env node
// ---------------------------------------------------------------------------
// check-identity — guard against shipping the template's default identity.
//
// Fails (exit 1) when any of the following template-default identity tokens
// are still present in the repo:
//
//   - root package.json name === 'app-monorepo-template'
//   - apps/mobile/app.json expo.slug === 'app-monorepo-template'
//   - android.package or ios.bundleIdentifier === 'com.app.template'
//   - any package.json name starting with '@app/'
//   - tsconfig.base.json still has '@app/*' path key
//
// Self-skip: if ATL_TEMPLATE_SELF=1 is set, the check is skipped and exits 0.
// This lets the canonical template repo keep its own `pnpm validate` green
// while the gate is a hard failure for every derived project.
//
// Usage:
//   node scripts/check-identity.mjs
//   ATL_TEMPLATE_SELF=1 node scripts/check-identity.mjs   # self-skip
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

// Self-skip for the canonical template repo's own CI.
if (process.env.ATL_TEMPLATE_SELF === '1') {
  console.log(
    'check-identity: ATL_TEMPLATE_SELF=1 — self-skip active. ' +
      'This is the canonical template; identity guard bypassed.'
  )
  process.exit(0)
}

const readJson = ({ path }) => {
  try {
    return JSON.parse(
      readFileSync(resolve(REPO_ROOT, path), 'utf8')
    )
  } catch {
    return null
  }
}

const exists = ({ path }) => {
  try {
    statSync(resolve(REPO_ROOT, path))
    return true
  } catch {
    return false
  }
}

const offenders = []

// ---------------------------------------------------------------------------
// 1. root package.json name
// ---------------------------------------------------------------------------

const rootPkg = readJson({ path: 'package.json' })
if (rootPkg?.name === 'app-monorepo-template') {
  offenders.push({
    field: 'name',
    file: 'package.json',
    found: rootPkg.name
  })
}

// ---------------------------------------------------------------------------
// 2. apps/mobile/app.json — expo identity
// ---------------------------------------------------------------------------

if (exists({ path: 'apps/mobile/app.json' })) {
  const appJson = readJson({ path: 'apps/mobile/app.json' })
  if (appJson?.expo?.slug === 'app-monorepo-template') {
    offenders.push({
      field: 'expo.slug',
      file: 'apps/mobile/app.json',
      found: appJson.expo.slug
    })
  }
  if (appJson?.expo?.android?.package === 'com.app.template') {
    offenders.push({
      field: 'expo.android.package',
      file: 'apps/mobile/app.json',
      found: appJson.expo.android.package
    })
  }
  if (appJson?.expo?.ios?.bundleIdentifier === 'com.app.template') {
    offenders.push({
      field: 'expo.ios.bundleIdentifier',
      file: 'apps/mobile/app.json',
      found: appJson.expo.ios.bundleIdentifier
    })
  }
}

// ---------------------------------------------------------------------------
// 3. tsconfig.base.json — '@app/*' path key
// ---------------------------------------------------------------------------

const tsconfig = readJson({ path: 'tsconfig.base.json' })
if (tsconfig?.compilerOptions?.paths?.['@app/*']) {
  offenders.push({
    field: "compilerOptions.paths['@app/*']",
    file: 'tsconfig.base.json',
    found: '@app/*'
  })
}

// ---------------------------------------------------------------------------
// 4. All package.json files — any name starting with '@app/'
//    Walk packages/* and apps/* dynamically instead of a hardcoded list so
//    newly added packages (e.g. packages/analytics) are always covered.
// ---------------------------------------------------------------------------

const collectPackageJsonPaths = ({ roots }) => {
  const paths = []
  for (const root of roots) {
    const rootAbs = resolve(REPO_ROOT, root)
    let entries
    try {
      entries = readdirSync(rootAbs)
    } catch {
      continue
    }
    for (const entry of entries) {
      const pkgFile = join(rootAbs, entry, 'package.json')
      try {
        statSync(pkgFile)
        paths.push(join(root, entry, 'package.json'))
      } catch {
        // no package.json in this subdirectory — skip
      }
    }
  }
  return paths
}

const discoveredPackagePaths = collectPackageJsonPaths({ roots: ['packages', 'apps'] })

for (const pkgPath of discoveredPackagePaths) {
  const pkg = readJson({ path: pkgPath })
  if (typeof pkg?.name === 'string' && pkg.name.startsWith('@app/')) {
    offenders.push({
      field: 'name',
      file: pkgPath,
      found: pkg.name
    })
  }
}

// ---------------------------------------------------------------------------
// Report.
// ---------------------------------------------------------------------------

if (offenders.length === 0) {
  console.log('check-identity: OK — no template-default identity tokens found.')
  process.exit(0)
}

console.error(
  `check-identity: FAIL — ${offenders.length} template-default identity ` +
    'token(s) detected. Run `pnpm init <project-slug>` to rename the repo.\n'
)
for (const { field, file, found } of offenders) {
  console.error(`  ${file} — ${field}: "${found}"`)
}
console.error(
  '\nRun: node scripts/init-project.mjs <your-slug>'
)
process.exit(1)
