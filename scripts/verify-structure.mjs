#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-structure — fractal folder-member contract.
//
// Check #21 (screen block) and #22 (component block) of the
// deterministic-validation plan.
//
// Rules enforced:
//
//  SCREEN BLOCKS  (src/screens/<Name>/)
//    - Folder name must be PascalCase.
//    - Must contain a barrel index.ts.
//    - Must contain <Name>.screen.tsx (the screen entry point).
//
//  COMPONENT BLOCKS  (src/components/<Name>/  and  src/components/ui/<Name>/)
//    - Folder name must be PascalCase.
//    - Must contain a barrel index.ts.
//    - Must contain <Name>.component.tsx (the component entry point).
//
// Scanning roots: apps/*/src/screens, apps/*/src/components
// The check is intentionally liberal about *optional* members (.styles.ts,
// .constant.ts, hooks/, models/) — those are allowed but not required.
//
// Usage:
//   node scripts/verify-structure.mjs
// ---------------------------------------------------------------------------

import { readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')

const PASCAL_CASE_RE = /^[A-Z][A-Za-z0-9]*$/

const IGNORED_DIRS = new Set(['.next', '.turbo', 'node_modules', 'dist', 'coverage', '__mocks__'])

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

const failures = []
let totalChecked = 0

// ---------------------------------------------------------------------------
// Check a single screen folder.
// ---------------------------------------------------------------------------

const checkScreenFolder = ({ folderPath, folderName, relPath }) => {
  totalChecked++
  const files = readDir(folderPath)

  if (!PASCAL_CASE_RE.test(folderName)) {
    failures.push({
      path: relPath,
      rule: 'screen-folder-pascal-case',
      detail: `Screen folder "${folderName}" is not PascalCase`
    })
  }

  if (!files.includes('index.ts')) {
    failures.push({
      path: relPath,
      rule: 'screen-barrel-missing',
      detail: 'No index.ts barrel found'
    })
  }

  const screenFile = `${folderName}.screen.tsx`
  if (!files.includes(screenFile)) {
    failures.push({
      path: relPath,
      rule: 'screen-entry-missing',
      detail: `Expected entry point "${screenFile}" not found`
    })
  }
}

// ---------------------------------------------------------------------------
// Check a single component folder.
// ---------------------------------------------------------------------------

const checkComponentFolder = ({ folderPath, folderName, relPath }) => {
  totalChecked++
  const files = readDir(folderPath)

  if (!PASCAL_CASE_RE.test(folderName)) {
    failures.push({
      path: relPath,
      rule: 'component-folder-pascal-case',
      detail: `Component folder "${folderName}" is not PascalCase`
    })
  }

  if (!files.includes('index.ts')) {
    failures.push({
      path: relPath,
      rule: 'component-barrel-missing',
      detail: 'No index.ts barrel found'
    })
  }

  const componentFile = `${folderName}.component.tsx`
  if (!files.includes(componentFile)) {
    failures.push({
      path: relPath,
      rule: 'component-entry-missing',
      detail: `Expected entry point "${componentFile}" not found`
    })
  }
}

// ---------------------------------------------------------------------------
// Discover all apps/* roots
// ---------------------------------------------------------------------------

const appsRoot = resolve(REPO_ROOT, 'apps')
const appDirs = readDir(appsRoot)
  .map((entry) => join(appsRoot, entry))
  .filter((p) => isDir(p) && !IGNORED_DIRS.has(p.split('/').pop()))

// ---------------------------------------------------------------------------
// Scan screen folders
// ---------------------------------------------------------------------------

for (const appDir of appDirs) {
  const screensRoot = join(appDir, 'src', 'screens')
  if (!isDir(screensRoot)) continue

  for (const entry of readDir(screensRoot)) {
    const folderPath = join(screensRoot, entry)
    if (!isDir(folderPath) || IGNORED_DIRS.has(entry)) continue

    checkScreenFolder({
      folderName: entry,
      folderPath,
      relPath: folderPath.replace(`${REPO_ROOT}/`, '')
    })
  }
}

// ---------------------------------------------------------------------------
// Scan component folders — direct children of src/components AND src/components/ui
// ---------------------------------------------------------------------------

const scanComponentRoot = (componentsRoot) => {
  if (!isDir(componentsRoot)) return

  for (const entry of readDir(componentsRoot)) {
    if (IGNORED_DIRS.has(entry)) continue
    const folderPath = join(componentsRoot, entry)
    if (!isDir(folderPath)) continue

    // If this is the `ui` sub-folder, recurse one level deeper
    if (entry === 'ui') {
      scanComponentRoot(folderPath)
      continue
    }

    // Only check PascalCase-named sub-folders (skip camelCase/kebab-case utility dirs)
    if (!PASCAL_CASE_RE.test(entry)) continue

    checkComponentFolder({
      folderName: entry,
      folderPath,
      relPath: folderPath.replace(`${REPO_ROOT}/`, '')
    })
  }
}

for (const appDir of appDirs) {
  const componentsRoot = join(appDir, 'src', 'components')
  scanComponentRoot(componentsRoot)
}

// Also check nested screen components (src/screens/<Screen>/components/<Comp>/)
for (const appDir of appDirs) {
  const screensRoot = join(appDir, 'src', 'screens')
  if (!isDir(screensRoot)) continue

  for (const screenEntry of readDir(screensRoot)) {
    const screenPath = join(screensRoot, screenEntry)
    if (!isDir(screenPath) || IGNORED_DIRS.has(screenEntry)) continue

    const screenComponentsRoot = join(screenPath, 'components')
    if (!isDir(screenComponentsRoot)) continue

    for (const compEntry of readDir(screenComponentsRoot)) {
      if (IGNORED_DIRS.has(compEntry)) continue
      const compPath = join(screenComponentsRoot, compEntry)
      if (!isDir(compPath)) continue
      if (!PASCAL_CASE_RE.test(compEntry)) continue

      checkComponentFolder({
        folderName: compEntry,
        folderPath: compPath,
        relPath: compPath.replace(`${REPO_ROOT}/`, '')
      })
    }
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

if (totalChecked === 0) {
  console.log('verify-structure: OK — no screen or component blocks found (nothing to check).')
  process.exit(0)
}

if (failures.length === 0) {
  console.log(
    `verify-structure: PASS — ${totalChecked} block(s) checked. ` +
      'All screen and component folder contracts satisfied.'
  )
  process.exit(0)
}

console.error(
  `\nverify-structure: FAIL — ${failures.length} violation(s) found:\n`
)
for (const { path, rule, detail } of failures) {
  console.error(`  [${rule}] ${path}`)
  console.error(`    ${detail}`)
}
console.error(
  '\nRules:\n' +
    '  • Screen folders (src/screens/<Name>/): must be PascalCase, have index.ts + <Name>.screen.tsx.\n' +
    '  • Component folders (src/components[/ui]/<Name>/): must be PascalCase, have index.ts + <Name>.component.tsx.\n' +
    '  • Screen-scoped component folders (src/screens/<S>/components/<Name>/): same component rules.\n'
)
process.exit(1)
