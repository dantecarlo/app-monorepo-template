#!/usr/bin/env node
// ---------------------------------------------------------------------------
// check-identity — guard against shipping the template's default identity.
//
// Fails (exit 1) when any of the following template-default identity tokens
// are still present in the repo:
//
//   - root package.json name === the template's product name
//   - apps/mobile/app.json expo.slug === the template's product name
//   - android.package or ios.bundleIdentifier === 'com.app.template'
//   - any package.json name starting with the template's package scope
//   - tsconfig.base.json still has the template's '<scope>/*' path key
//
// The template's names come from scripts/template-identity.mjs. The guard
// applies to every checkout but the template itself, the one whose
// .agents/harness.config.json identity is the template's own: it carries
// these tokens by design, and the guard says so and passes. No environment
// variable decides it. A derived project fails until `pnpm run init <slug>`
// renames it, identity block included.
//
// Usage:
//   node scripts/check-identity.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  isTemplateCheckout,
  TEMPLATE_IDENTITY
} from './template-identity.mjs'
import { HARNESS_CONFIG } from './verify-harness-config.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const NOT_FOUND = -1
const TEMPLATE_NAME = TEMPLATE_IDENTITY.product
const TEMPLATE_SCOPE = `${TEMPLATE_IDENTITY.packageScope}/`
const TEMPLATE_PATH_KEY = `${TEMPLATE_SCOPE}*`
const TEMPLATE_BUNDLE = 'com.app.template'

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === NOT_FOUND
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

const REPO_ROOT = readRoot()

if (isTemplateCheckout({ root: REPO_ROOT })) {
  console.log(
    `check-identity: OK — ${HARNESS_CONFIG} names the template itself ` +
      `(${TEMPLATE_NAME}), which carries the template identity by design; ` +
      'the guard applies to every checkout whose identity names another ' +
      'project.'
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
if (rootPkg?.name === TEMPLATE_NAME) {
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
  if (appJson?.expo?.slug === TEMPLATE_NAME) {
    offenders.push({
      field: 'expo.slug',
      file: 'apps/mobile/app.json',
      found: appJson.expo.slug
    })
  }
  if (appJson?.expo?.android?.package === TEMPLATE_BUNDLE) {
    offenders.push({
      field: 'expo.android.package',
      file: 'apps/mobile/app.json',
      found: appJson.expo.android.package
    })
  }
  if (appJson?.expo?.ios?.bundleIdentifier === TEMPLATE_BUNDLE) {
    offenders.push({
      field: 'expo.ios.bundleIdentifier',
      file: 'apps/mobile/app.json',
      found: appJson.expo.ios.bundleIdentifier
    })
  }
}

// ---------------------------------------------------------------------------
// 3. tsconfig.base.json — the template's '<scope>/*' path key
// ---------------------------------------------------------------------------

const tsconfig = readJson({ path: 'tsconfig.base.json' })
if (tsconfig?.compilerOptions?.paths?.[TEMPLATE_PATH_KEY]) {
  offenders.push({
    field: `compilerOptions.paths['${TEMPLATE_PATH_KEY}']`,
    file: 'tsconfig.base.json',
    found: TEMPLATE_PATH_KEY
  })
}

// ---------------------------------------------------------------------------
// 4. All package.json files — any name starting with the template's scope.
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
  if (typeof pkg?.name === 'string' && pkg.name.startsWith(TEMPLATE_SCOPE)) {
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
    'token(s) detected. Run `pnpm run init <project-slug>` to rename the repo.\n'
)
for (const { field, file, found } of offenders) {
  console.error(`  ${file} — ${field}: "${found}"`)
}
console.error(
  '\nRun: node scripts/init-project.mjs <your-slug>'
)
process.exit(1)
