#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-tests — every unit has a test, and every test sits in the
// `__tests__/` of its own unit's folder, named after that unit.
//
// The rule (owner decision 57, 2026-11-15): `X/Y.<ext>` is tested by
// `X/__tests__/Y.test.<ext>`, the test carrying the unit's stem, whether `X`
// is a block folder, a hook's own folder, a folder of plain units or a
// workspace folder outside `src/` (`apps/<app>/next.config.ts` by
// `apps/<app>/__tests__/next.config.test.ts`). An index file is a unit like any
// other. A folder is a unit too, tested as a whole by a test named after it in
// its own `__tests__/`: `supabase/tests/` by
// `supabase/tests/__tests__/tests.test.ts`. In an Expo Router tree (the
// `src/app/` of a workspace that depends on `expo-router`) a test is named
// after its route file as `<route>.route`:
// `_layout.tsx` by `layout.route.test.tsx`, `index.tsx` by
// `index.route.test.tsx`.
//
// Findings, one per problem:
//   - beside / outside: a test that is not in a `__tests__/` folder;
//   - higher: a test in a `__tests__/` above the folder that holds its unit;
//   - no-unit: a test whose stem names neither a unit of the folder that holds
//     its `__tests__/` nor that folder (in a route tree, no route file under
//     its `.route` name);
//   - nested: a `__tests__/` inside another `__tests__/`;
//   - missing: an app unit with a tracked suffix that has no test.
//
// No test is exempt from the location rule: a test that cannot sit where it
// belongs is moved, or the rule learns the unit it tests, as it learned
// folders.
//
// Shared test infrastructure (`src/test/**`) and `__mocks__/` are not judged.
// A finding that knows where its test belongs carries that path as `target`,
// which scripts/move-tests-into-blocks.mjs moves it to.
//
// Usage:
//   node scripts/verify-tests.mjs [--root <dir>]
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, posix, resolve } from 'node:path'
import { parseArgs } from 'node:util'

import {
  readFrameworks,
  WORKSPACE_GROUPS
} from './eslint-config.detect.mjs'
import { defineGate, reportGate } from './gate/gate.mjs'

// Repo-relative paths are POSIX on every platform.
const { basename, dirname } = posix

const REPO_ROOT = resolve(import.meta.dirname, '..')

export const TESTS_FOLDER = '__tests__'
export const ROUTE_MARK = '.route'

const MOCKS_FOLDER = '__mocks__'
const SHARED_TEST_FOLDER = 'src/test'
const SOURCE_FOLDER = 'src'
const ROUTE_FOLDER = 'app'
const ROUTER_PACKAGE = 'expo-router'
const ROUTE_PRIVATE_PREFIX = '_'
// The presence check judges the apps' `src/`; packages hold no tracked units
// it requires a test for.
const PRESENCE_GROUP = 'apps'
const MANIFEST = 'package.json'

const TEST_FILE = /^(?<stem>.+)\.test\.(?<ext>[cm]?[jt]sx?)$/u

// Folders never walked: dependencies, caches and build output.
const IGNORED_DIRS = new Set([
  '.expo',
  '.next',
  '.turbo',
  '.vercel',
  'android',
  'build',
  'coverage',
  'dist',
  'dist-web',
  'ios',
  'node_modules',
  'out'
])

// Suffixes of the app units that MUST have a test. Longest first, so
// `.component.tsx` is not read as a generic `.tsx`.
const TRACKED_SUFFIXES = [
  '.component.tsx',
  '.adapter.ts',
  '.helper.ts',
  '.service.ts',
  '.hook.ts'
]

// Documented exemptions from the presence check. Keep this list SMALL and
// justified — every entry is a gap. The `.component.tsx` and `.hook.ts`
// units of an app that declares expo, as scripts/eslint-config.detect.mjs
// reads it, are exempt: their render tests are written where the React
// Native mocks under src/test/ cover them, and nothing yet requires one per
// unit. Its `.service`, `.adapter` and `.helper` units, and every unit of
// any other app, are required.
const EXEMPT_SUFFIXES = ['.component.tsx', '.hook.ts']

const isExempt = ({ expoApps, path }) =>
  expoApps.some((app) => path.startsWith(`${app}/`)) &&
  EXEMPT_SUFFIXES.some((suffix) => path.endsWith(suffix))

export const FINDING_KIND = Object.freeze({
  beside: 'beside',
  higher: 'higher',
  missing: 'missing',
  nested: 'nested',
  noUnit: 'no-unit',
  outside: 'outside'
})

const toPosix = (path) => path.split('\\').join('/')

const joinPath = (folder, name) =>
  folder === '' ? name : `${folder}/${name}`

export const isTestFile = (name) => TEST_FILE.test(name)

const testParts = (name) => TEST_FILE.exec(name).groups

const stemOf = (name) => {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(0, dot) : name
}

const segmentsOf = (path) => path.split('/')

const workspaceOf = (path) => segmentsOf(path).slice(0, 2).join('/')

const isSharedInfrastructure = (path) =>
  segmentsOf(path).includes(MOCKS_FOLDER) ||
  path.startsWith(`${workspaceOf(path)}/${SHARED_TEST_FOLDER}/`)

const testsFolderCount = (path) =>
  segmentsOf(dirname(path)).filter((segment) => segment === TESTS_FOLDER)
    .length

const isInRouteTree = ({ folder, routeTrees }) =>
  routeTrees.some(
    (tree) => folder === tree || folder.startsWith(`${tree}/`)
  )

// A route file's name as a route test carries it: one leading `_` dropped.
const routeNameOf = (stem) =>
  stem.startsWith(ROUTE_PRIVATE_PREFIX) ? stem.slice(1) : stem

// Every non-test file, indexed by the folder that holds it.
const indexUnits = ({ files }) => {
  const stemsByFolder = new Map()
  files
    .filter((path) => !isTestFile(basename(path)))
    .forEach((path) => {
      const folder = dirname(path)
      const stems = stemsByFolder.get(folder) ?? new Set()
      stems.add(stemOf(basename(path)))
      stemsByFolder.set(folder, stems)
    })
  return stemsByFolder
}

const hasUnit = ({ folder, stem, units }) =>
  units.get(folder)?.has(stem) ?? false

// A test whose stem is the name of the folder that holds its `__tests__/`
// tests that folder as a whole.
const namesItsFolder = ({ stem, unitFolder }) =>
  stem === basename(unitFolder)

// The name a test of `unitStem` in `folder` carries, the `.route` form in a
// route tree.
const testNameFor = ({ ext, folder, routeTrees, unitStem }) =>
  isInRouteTree({ folder, routeTrees })
    ? `${routeNameOf(unitStem)}${ROUTE_MARK}.test.${ext}`
    : `${unitStem}.test.${ext}`

// The unit stem a test names in `folder`, or null when it names none.
const unitStemNamed = ({ folder, routeTrees, stem, units }) => {
  if (!isInRouteTree({ folder, routeTrees })) {
    return hasUnit({ folder, stem, units }) ? stem : null
  }
  if (!stem.endsWith(ROUTE_MARK)) return null
  const route = stem.slice(0, -ROUTE_MARK.length)
  return (
    [route, `${ROUTE_PRIVATE_PREFIX}${route}`].find((unitStem) =>
      hasUnit({ folder, stem: unitStem, units })
    ) ?? null
  )
}

// The unit a test names by its file name rather than its `.route` name: in a
// route tree `_layout` and `layout` both name `_layout.tsx`.
const literalUnitStem = ({ folder, routeTrees, stem, units }) => {
  const candidates = isInRouteTree({ folder, routeTrees })
    ? [stem, `${ROUTE_PRIVATE_PREFIX}${stem}`]
    : [stem]
  return (
    candidates.find((candidate) =>
      hasUnit({ folder, stem: candidate, units })
    ) ?? null
  )
}

// Folders under `folder` (itself excluded) that hold a unit named `stem`.
const deeperFoldersWith = ({ folder, stem, units }) =>
  [...units.entries()]
    .filter(
      ([candidate, stems]) =>
        candidate.startsWith(`${folder}/`) &&
        !segmentsOf(candidate).includes(TESTS_FOLDER) &&
        !isSharedInfrastructure(`${candidate}/x`) &&
        stems.has(stem)
    )
    .map(([candidate]) => candidate)
    .sort()

const besideFinding = ({ ext, folder, name, path, routeTrees, units }) => {
  const { stem } = testParts(name)
  const unitStem =
    unitStemNamed({ folder, routeTrees, stem, units }) ??
    literalUnitStem({ folder, routeTrees, stem, units })
  if (unitStem === null) {
    return {
      detail:
        `${path} is not in a ${TESTS_FOLDER}/ folder, and ${folder} holds ` +
        `no unit named ${stem} — move it into the ${TESTS_FOLDER}/ of its ` +
        "unit's own folder, named after that unit.",
      kind: FINDING_KIND.outside,
      path,
      target: null
    }
  }
  const target = joinPath(
    `${folder}/${TESTS_FOLDER}`,
    testNameFor({ ext, folder, routeTrees, unitStem })
  )
  return {
    detail: `${path} sits beside its unit — move it to ${target}.`,
    kind: FINDING_KIND.beside,
    path,
    target
  }
}

const testsFolderFinding = ({ ext, name, path, routeTrees, units }) => {
  const unitFolder = dirname(dirname(path))
  const { stem } = testParts(name)
  if (
    unitStemNamed({ folder: unitFolder, routeTrees, stem, units }) ||
    namesItsFolder({ stem, unitFolder })
  ) {
    return null
  }
  if (isInRouteTree({ folder: unitFolder, routeTrees })) {
    const unitStem = literalUnitStem({
      folder: unitFolder,
      routeTrees,
      stem,
      units
    })
    const target =
      unitStem === null
        ? null
        : joinPath(
            dirname(path),
            testNameFor({ ext, folder: unitFolder, routeTrees, unitStem })
          )
    return {
      detail:
        `${path} names no route file of ${unitFolder}: a route test is ` +
        `named <route>${ROUTE_MARK}.test.${ext} after its route file` +
        (target === null ? '.' : ` — rename it to ${target}.`),
      kind: FINDING_KIND.noUnit,
      path,
      target
    }
  }
  const deeper = deeperFoldersWith({ folder: unitFolder, stem, units })
  if (deeper.length > 0) {
    return {
      detail:
        `${path} sits in a higher ${TESTS_FOLDER}/ — its unit lives in ` +
        `${deeper.join(', ')}; move it into that folder's ${TESTS_FOLDER}/.`,
      kind: FINDING_KIND.higher,
      path,
      target:
        deeper.length === 1
          ? joinPath(`${deeper[0]}/${TESTS_FOLDER}`, name)
          : null
    }
  }
  return {
    detail:
      `${path} names no unit: ${unitFolder} holds no file named ` +
      `${stem}.<ext> and is not named ${stem} — move the test into the ` +
      `${TESTS_FOLDER}/ of the folder that holds its unit, or name it after ` +
      'that unit.',
    kind: FINDING_KIND.noUnit,
    path,
    target: null
  }
}

// Pure and filesystem-free, so every branch is drivable from synthetic input.
// `files` are every repo-relative path under the workspaces, tests included.
export const classifyTests = ({ files, routeTrees }) => {
  const units = indexUnits({ files })
  const tests = files
    .filter((path) => isTestFile(basename(path)))
    .filter((path) => !isSharedInfrastructure(path))
  const nestedFolders = [
    ...new Set(
      files
        .filter((path) => testsFolderCount(path) > 1)
        .map((path) => dirname(path))
    )
  ].sort()
  const findings = tests
    .filter((path) => testsFolderCount(path) < 2)
    .map((path) => {
      const name = basename(path)
      const folder = dirname(path)
      const { ext } = testParts(name)
      return basename(folder) === TESTS_FOLDER &&
        testsFolderCount(path) === 1
        ? testsFolderFinding({ ext, name, path, routeTrees, units })
        : besideFinding({ ext, folder, name, path, routeTrees, units })
    })
    .filter((finding) => finding !== null)
  return {
    misplaced: [
      ...nestedFolders.map((folder) => ({
        detail:
          `${folder} is a ${TESTS_FOLDER}/ inside another ${TESTS_FOLDER}/ ` +
          `— a test sits directly in the ${TESTS_FOLDER}/ of its unit's folder.`,
        kind: FINDING_KIND.nested,
        path: folder,
        target: null
      })),
      ...findings
    ],
    tests
  }
}

const isPresenceUnit = ({ expoApps, path }) =>
  path.startsWith(`${PRESENCE_GROUP}/`) &&
  segmentsOf(path)[2] === SOURCE_FOLDER &&
  TRACKED_SUFFIXES.some((suffix) => path.endsWith(suffix)) &&
  !isTestFile(basename(path)) &&
  !segmentsOf(path).includes(TESTS_FOLDER) &&
  !isSharedInfrastructure(path) &&
  !segmentsOf(path).includes('test') &&
  !isExempt({ expoApps, path })

// A unit is satisfied by a test of its stem in its own `__tests__/`, or by one
// beside it, which the location check reports instead.
const missingTests = ({ expoApps = [], files }) => {
  const present = new Set(files)
  const testNames = new Map()
  files
    .filter((path) => isTestFile(basename(path)))
    .forEach((path) => {
      const folder = dirname(path)
      const names = testNames.get(folder) ?? []
      names.push(basename(path))
      testNames.set(folder, names)
    })
  const hasTestIn = ({ folder, stem }) =>
    (testNames.get(folder) ?? []).some(
      (name) => testParts(name).stem === stem
    )
  const units = files.filter((path) => isPresenceUnit({ expoApps, path }))
  return {
    findings: units
      .filter((path) => present.has(path))
      .filter((path) => {
        const folder = dirname(path)
        const stem = stemOf(basename(path))
        return (
          !hasTestIn({ folder: `${folder}/${TESTS_FOLDER}`, stem }) &&
          !hasTestIn({ folder, stem })
        )
      })
      .map((path) => ({
        detail:
          `${path} has no test — add ${dirname(path)}/${TESTS_FOLDER}/` +
          `${stemOf(basename(path))}.test.*.`,
        kind: FINDING_KIND.missing,
        path,
        target: null
      })),
    units: units.length
  }
}

export const gate = defineGate({
  claims:
    "every test file under apps/* and packages/* sits directly in the __tests__/ of its own unit's " +
    "folder and carries that unit's stem (in an Expo Router tree, <route>.route after its route " +
    "file; for a folder that is its own unit, the folder's name), no __tests__/ sits inside " +
    'another, and every app unit with a tracked suffix has a test.',
  id: 'verify-tests',
  notCovered:
    'the root tooling tests under scripts/ and eslint-local-rules/, which keep their own layout; ' +
    'the e2e specs and the SQL tests; whether a test named after a unit tests that unit, and ' +
    'whether one named after its folder tests the whole folder (a block test named after its ' +
    'block folder rather than its component passes as a folder test); a unit ' +
    'with two tests under different names, the second named after another file; the ' +
    'components and hooks of an app that declares expo, which the presence check exempts; and ' +
    'package units, which it does not judge.',
  run: ({ expoApps, files, routeTrees }) => [
    ...classifyTests({ files, routeTrees }).misplaced,
    ...missingTests({ expoApps, files }).findings
  ]
})

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

const isDirectory = (path) => {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

const walk = ({ absolute, out, relativePath }) => {
  readdirSync(absolute).forEach((entry) => {
    const full = join(absolute, entry)
    const next = joinPath(relativePath, entry)
    if (isDirectory(full)) {
      if (!IGNORED_DIRS.has(entry))
        walk({ absolute: full, out, relativePath: next })
      return
    }
    out.push(next)
  })
  return out
}

export const workspacesOf = ({ root }) =>
  WORKSPACE_GROUPS.flatMap((group) => {
    const absolute = join(root, group)
    if (!isDirectory(absolute)) return []
    return readdirSync(absolute)
      .filter((entry) => !IGNORED_DIRS.has(entry))
      .filter((entry) => isDirectory(join(absolute, entry)))
      .map((entry) => `${group}/${entry}`)
  }).sort()

const dependsOnRouter = ({ manifest }) =>
  [manifest?.dependencies, manifest?.devDependencies].some(
    (deps) => deps !== undefined && deps !== null && ROUTER_PACKAGE in deps
  )

// The Expo Router tree of every workspace that depends on expo-router: its
// `src/app/`, or `app/` when it has no `src/`.
export const routeTreesOf = ({ root, workspaces }) =>
  workspaces
    .filter((workspace) =>
      dependsOnRouter({
        manifest: readJson(join(root, workspace, MANIFEST))
      })
    )
    .map((workspace) =>
      [
        `${workspace}/${SOURCE_FOLDER}/${ROUTE_FOLDER}`,
        `${workspace}/${ROUTE_FOLDER}`
      ].find((tree) => isDirectory(join(root, tree)))
    )
    .filter((tree) => tree !== undefined)

export const collectContext = ({ root }) => {
  const workspaces = workspacesOf({ root })
  const files = workspaces
    .flatMap((workspace) =>
      walk({
        absolute: join(root, workspace),
        out: [],
        relativePath: workspace
      })
    )
    .map(toPosix)
    .sort()
  return {
    expoApps: readFrameworks({ root }).expo,
    files,
    routeTrees: routeTreesOf({ root, workspaces }),
    workspaces
  }
}

const main = () => {
  const { values } = parseArgs({
    options: { root: { default: REPO_ROOT, type: 'string' } }
  })
  const root = resolve(values.root)
  if (!existsSync(root)) {
    console.error(`verify-tests: ${root} does not exist.`)
    process.exitCode = 1
    return
  }
  let context
  try {
    context = collectContext({ root })
  } catch (error) {
    console.error(`verify-tests: ${error.message}`)
    process.exitCode = 1
    return
  }
  const { tests } = classifyTests(context)
  const { units } = missingTests(context)
  reportGate({
    context,
    denominator:
      `${tests.length} test file(s) and ${units} unit(s) that need one, across ` +
      `${context.workspaces.length} workspace(s)`,
    gate
  })
}

if (import.meta.main) main()
