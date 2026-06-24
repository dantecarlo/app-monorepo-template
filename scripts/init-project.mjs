#!/usr/bin/env node
// ---------------------------------------------------------------------------
// init-project — rename the template identity to a real project slug.
//
// Usage:
//   node scripts/init-project.mjs <slug> [bundle-id] [--git-origin <url>]
//
// Arguments:
//   slug        Required. Lowercase kebab-case project slug, e.g. my-app.
//               Must match /^[a-z][a-z0-9-]*$/.
//   bundle-id   Optional. Reverse-DNS bundle ID, e.g. com.acme.myapp.
//               Defaults to com.<slug-nodashes>.app.
//   --git-origin <url>  Optional. Runs `git remote set-url origin <url>`.
//
// What it rewrites:
//   1. root package.json     name field
//   2. apps/mobile/app.json  expo.slug, expo.name, expo.scheme,
//                            android.package, ios.bundleIdentifier
//   3. tsconfig.base.json    paths key '@app/*'
//   4. every package.json    name fields (@app/* -> @<slug>/*)
//   5. turbo.json            @app/* task keys
//   6. all *.ts *.tsx *.cjs *.js *.md  import specifiers '@app/'
//
// Idempotent: re-running with the same slug is a no-op.
// ---------------------------------------------------------------------------

import { execSync } from 'node:child_process'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

const rawArgs = process.argv.slice(2)
const slug = rawArgs.find((a) => !a.startsWith('--') && rawArgs.indexOf(a) < 2 && /^[a-z]/.test(a) && !/^com\./.test(a))
const bundleArg = rawArgs.find((a) => /^com\./.test(a))
const gitOriginIdx = rawArgs.indexOf('--git-origin')
const gitOrigin = gitOriginIdx !== -1 ? rawArgs[gitOriginIdx + 1] : null

if (!slug || !/^[a-z][a-z0-9-]*$/.test(slug)) {
  console.error(
    'init-project: ERROR — provide a valid slug (lowercase kebab-case, ' +
      'e.g. "my-app").\n' +
      '  Usage: node scripts/init-project.mjs <slug> [bundle-id] [--git-origin <url>]'
  )
  process.exit(1)
}

const slugNoDashes = slug.replaceAll('-', '')
const bundleId = bundleArg ?? `com.${slugNoDashes}.app`
const titleSlug = slug
  .split('-')
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join(' ')

// ---------------------------------------------------------------------------
// Tokens to replace
// ---------------------------------------------------------------------------

const TEMPLATE_SLUG = 'app-monorepo-template'
const TEMPLATE_NAMESPACE = '@app/'
const TEMPLATE_BUNDLE = 'com.app.template'

// ---------------------------------------------------------------------------
// File walker
// ---------------------------------------------------------------------------

const IGNORED_DIRS = new Set([
  '.expo',
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules'
])

const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx'
])

const collectTextFiles = ({ dir, acc }) => {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const stats = statSync(full)
    if (stats.isDirectory()) {
      collectTextFiles({ acc, dir: full })
      continue
    }
    const ext = entry.includes('.')
      ? '.' + entry.split('.').slice(1).join('.')
      : ''
    // Match single-segment extensions like .ts, .tsx, .json, etc.
    const singleExt = entry.includes('.')
      ? '.' + entry.split('.').pop()
      : ''
    if (TEXT_EXTENSIONS.has(singleExt)) acc.push(full)
  }
}

// ---------------------------------------------------------------------------
// JSON helpers — structured edits to preserve formatting intent.
// ---------------------------------------------------------------------------

const readJson = ({ path }) =>
  JSON.parse(readFileSync(resolve(REPO_ROOT, path), 'utf8'))

const writeJson = ({ data, path }) =>
  writeFileSync(
    resolve(REPO_ROOT, path),
    JSON.stringify(data, null, 2) + '\n',
    'utf8'
  )

// ---------------------------------------------------------------------------
// String replacement helpers.
// ---------------------------------------------------------------------------

const replaceAll = ({ next, prev, text }) =>
  text.split(prev).join(next)

// ---------------------------------------------------------------------------
// Idempotency check — bail early when already renamed.
// ---------------------------------------------------------------------------

const rootPkg = readJson({ path: 'package.json' })
if (rootPkg.name === slug) {
  console.log(`init-project: already renamed to "${slug}" — no-op.`)
  process.exit(0)
}

// ---------------------------------------------------------------------------
// 1. Structured JSON edits.
// ---------------------------------------------------------------------------

const touched = []

// root package.json
const rootPkgPath = 'package.json'
rootPkg.name = slug
writeJson({ data: rootPkg, path: rootPkgPath })
touched.push(rootPkgPath)

// apps/mobile/app.json
const appJsonPath = 'apps/mobile/app.json'
try {
  const appJson = readJson({ path: appJsonPath })
  appJson.expo.name = titleSlug
  appJson.expo.scheme = slug
  appJson.expo.slug = slug
  appJson.expo.android = appJson.expo.android ?? {}
  appJson.expo.android.package = bundleId
  appJson.expo.ios = appJson.expo.ios ?? {}
  appJson.expo.ios.bundleIdentifier = bundleId
  writeJson({ data: appJson, path: appJsonPath })
  touched.push(appJsonPath)
} catch {
  console.warn('init-project: WARN — apps/mobile/app.json not found; skipped.')
}

// tsconfig.base.json — rename '@app/*' path key
const tsconfigPath = 'tsconfig.base.json'
try {
  const tsconfig = readJson({ path: tsconfigPath })
  if (tsconfig.compilerOptions?.paths?.['@app/*']) {
    tsconfig.compilerOptions.paths[`@${slug}/*`] =
      tsconfig.compilerOptions.paths['@app/*']
    delete tsconfig.compilerOptions.paths['@app/*']
    writeJson({ data: tsconfig, path: tsconfigPath })
    touched.push(tsconfigPath)
  }
} catch {
  console.warn('init-project: WARN — tsconfig.base.json not found; skipped.')
}

// turbo.json — rename @app/ task keys
const turboPath = 'turbo.json'
try {
  const turbo = readJson({ path: turboPath })
  const tasks = turbo.tasks ?? {}
  const renamedTasks = {}
  for (const [key, val] of Object.entries(tasks)) {
    const newKey = key.includes('@app/')
      ? key.replaceAll('@app/', `@${slug}/`)
      : key
    renamedTasks[newKey] = val
  }
  turbo.tasks = renamedTasks
  writeJson({ data: turbo, path: turboPath })
  touched.push(turboPath)
} catch {
  console.warn('init-project: WARN — turbo.json not found; skipped.')
}

// ---------------------------------------------------------------------------
// 2. Walk all package.json files and rename @app/* names.
// ---------------------------------------------------------------------------

const allFiles = []
collectTextFiles({ acc: allFiles, dir: REPO_ROOT })

for (const file of allFiles) {
  const rel = file.replace(REPO_ROOT + '/', '')
  if (!rel.endsWith('package.json')) continue
  // Skip root package.json — already handled above.
  if (rel === 'package.json') continue
  const raw = readFileSync(file, 'utf8')
  if (!raw.includes(TEMPLATE_NAMESPACE) && !raw.includes(TEMPLATE_SLUG)) continue
  const data = JSON.parse(raw)
  let dirty = false
  if (typeof data.name === 'string' && data.name.startsWith('@app/')) {
    data.name = data.name.replace('@app/', `@${slug}/`)
    dirty = true
  }
  if (dirty) {
    writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
    touched.push(rel)
  }
}

// ---------------------------------------------------------------------------
// 3. Text replacement — '@app/' -> '@<slug>/' and 'app-monorepo-template'
//    -> slug across all text files. Skip pnpm-lock.yaml (binary-safe but
//    content must be regenerated via pnpm install, not patched).
// ---------------------------------------------------------------------------

for (const file of allFiles) {
  const rel = file.replace(REPO_ROOT + '/', '')
  // Lockfile: do not string-patch (hashes would corrupt).
  if (rel === 'pnpm-lock.yaml') continue
  // Skip already-handled structured JSON files.
  if (
    rel === 'package.json' ||
    rel === 'apps/mobile/app.json' ||
    rel === 'tsconfig.base.json' ||
    rel === 'turbo.json'
  ) continue

  const raw = readFileSync(file, 'utf8')
  if (
    !raw.includes(TEMPLATE_NAMESPACE) &&
    !raw.includes(TEMPLATE_SLUG) &&
    !raw.includes(TEMPLATE_BUNDLE)
  ) continue

  let updated = raw
  updated = replaceAll({ next: `@${slug}/`, prev: TEMPLATE_NAMESPACE, text: updated })
  updated = replaceAll({ next: slug, prev: TEMPLATE_SLUG, text: updated })
  updated = replaceAll({ next: bundleId, prev: TEMPLATE_BUNDLE, text: updated })

  if (updated !== raw) {
    writeFileSync(file, updated, 'utf8')
    touched.push(rel)
  }
}

// ---------------------------------------------------------------------------
// 4. Optional git remote.
// ---------------------------------------------------------------------------

if (gitOrigin) {
  try {
    execSync(`git remote set-url origin ${gitOrigin}`, { cwd: REPO_ROOT, stdio: 'inherit' })
    console.log(`init-project: git remote set to ${gitOrigin}`)
  } catch {
    console.warn('init-project: WARN — git remote set-url failed; set it manually.')
  }
}

// ---------------------------------------------------------------------------
// Summary.
// ---------------------------------------------------------------------------

console.log(`\ninit-project: renamed to "${slug}" (bundle: ${bundleId}).`)
console.log(`  Files touched: ${touched.length}`)
for (const f of touched) console.log(`    - ${f}`)
console.log(
  '\nNext: run `pnpm install` to refresh the lockfile after the rename.'
)
