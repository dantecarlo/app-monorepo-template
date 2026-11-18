// @ts-check
// ---------------------------------------------------------------------------
// dependency-seam.detect — every package is imported only inside its seam.
//
// Shared by the ESLint rule local/dependency-seam (./index.mjs) and the gate
// scripts/verify-dependency-seams.mjs, so the lint and the gate judge the
// same imports the same way.
//
// The registry, `.agents/contracts/dependencies.json`, names every package
// (or package subpath) the workspace declares or imports: its category and,
// for every category but `core`, its seam, the repository globs of the files
// that may import it. A file of `apps/*` or `packages/*` may import:
//   - a `core` package anywhere;
//   - any other registered package inside its seam. A type-only import is
//     judged the same way, unless the entry sets `types` to `anywhere`;
//   - in a test, also what the seam of the unit it tests admits: the unit
//     named by the test's stem in the folder that holds its `__tests__/`
//     (the scripts/verify-tests.mjs convention);
//   - under a test-infrastructure glob of the registry (`src/test/**`), any
//     registered package.
// A package no entry names is refused everywhere: the rule fails closed.
// The most specific entry wins: `next/navigation` before `next`. A Node
// builtin (`node:fs`, `path`) resolves to the one entry `node:*`.
//
// Read: static imports and re-exports, `import x = require()`, `import()`
// types, and with a literal specifier dynamic `import()`, `require()` and
// the module argument of the `vi` module helpers (`vi.mock` and its family).
//
// The allowlist, `eslint-dependency-seam-allowlist.json`, freezes the
// imports that broke the rule when it landed: an entry `{ path, package,
// reason }` exempts that package in that file, and the gate fails an entry
// whose file no longer breaks the rule with it, so the list only shrinks.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { isBuiltin } from 'node:module'
import { isAbsolute, join, posix, relative } from 'node:path'

export const DEPENDENCY_REGISTRY_FILE =
  '.agents/contracts/dependencies.json'
export const SEAM_ALLOWLIST_FILE = 'eslint-dependency-seam-allowlist.json'

// The entry every Node builtin resolves to.
export const BUILTIN_ENTRY = 'node:*'

export const CATEGORY = Object.freeze({
  BUILD: 'build',
  CORE: 'core',
  INFRA: 'infra',
  PEER: 'peer',
  UI: 'ui',
  VENDOR: 'vendor',
  VENDOR_PACKAGE: 'vendor-package'
})

export const TYPES = Object.freeze({ ANYWHERE: 'anywhere', SEAM: 'seam' })

export const SEAM_FINDING = Object.freeze({
  OUTSIDE_SEAM: 'outsideSeam',
  UNREGISTERED: 'unregistered'
})

// The workspaces the rule governs, by pattern: every app and every package.
const SCOPE_RE = /^(?:apps|packages)\/[^/]+\/./u

// Specifiers that name a file of the project, never a package: relative and
// absolute paths, the app alias, package subpath imports (`#src/`).
const LOCAL_PREFIXES = ['./', '../', '/', '@/', '~/', '#']
const LOCAL_EXACT = new Set(['.', '..'])

const TESTS_FOLDER = '__tests__'
const TEST_FILE_RE = /^(?<stem>.+)\.(?:test|spec)\.(?<ext>[cm]?[jt]sx?)$/u
const ROUTE_MARK = '.route'
const ROUTE_PRIVATE_PREFIX = '_'
const UNIT_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs']

// The `vi` helpers whose first argument names a module.
const VI_MODULE_HELPERS = new Set([
  'doMock',
  'doUnmock',
  'importActual',
  'importMock',
  'mock',
  'unmock'
])

const toPosix = (path) => String(path).replaceAll('\\', '/')

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

// The repository-relative path of a linted file, or null when it lies
// outside `root`.
export const toRepoPath = ({ filename, root }) => {
  const path = relative(root, String(filename))
  if (path === '' || isAbsolute(path) || path.startsWith('..')) return null
  return toPosix(path)
}

export const isInScope = ({ path }) => SCOPE_RE.test(path)

// The files a test stands for: the unit named by its stem in the folder
// that holds its `__tests__/`, under each source extension, and the route
// file of a `<route>.route.test.*` (`layout.route` tests `_layout`).
export const unitPathsOf = ({ path }) => {
  const { base, dir } = posix.parse(path)
  const match = TEST_FILE_RE.exec(base)
  if (!match?.groups) return []
  const folder =
    posix.basename(dir) === TESTS_FOLDER ? posix.dirname(dir) : dir
  const { ext, stem } = match.groups
  const stems = stem.endsWith(ROUTE_MARK)
    ? [
        stem.slice(0, -ROUTE_MARK.length),
        `${ROUTE_PRIVATE_PREFIX}${stem.slice(0, -ROUTE_MARK.length)}`
      ]
    : [stem]
  const extensions = [...new Set([ext, ...UNIT_EXTENSIONS])]
  return stems.flatMap((unit) =>
    extensions.map((extension) => `${folder}/${unit}.${extension}`)
  )
}

const matchesAny = ({ globs, path }) =>
  globs.some((glob) => posix.matchesGlob(path, glob))

// ---------------------------------------------------------------------------
// The registry
// ---------------------------------------------------------------------------

const isLocal = ({ source }) =>
  LOCAL_EXACT.has(source) ||
  LOCAL_PREFIXES.some((prefix) => source.startsWith(prefix))

// The package a specifier names (`@scope/name`, `name`), or null for a file
// of the project. A builtin names itself.
export const packageNameOf = ({ source }) => {
  if (typeof source !== 'string' || source === '' || isLocal({ source })) {
    return null
  }
  if (isBuiltin(source)) return source
  const parts = source.split('/')
  return source.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

const asGlobs = (value) =>
  Array.isArray(value)
    ? value.filter((glob) => typeof glob === 'string')
    : []

// `{ entries, testInfrastructure }`: the entries by name. A registry that
// cannot be read indexes nothing, so every package is unregistered.
export const indexRegistry = ({ registry }) => {
  const entries = new Map()
  const packages = Array.isArray(registry?.packages)
    ? registry.packages
    : []
  packages
    .filter((entry) => typeof entry?.name === 'string')
    .forEach((entry) => {
      if (!entries.has(entry.name)) entries.set(entry.name, entry)
    })
  return {
    entries,
    testInfrastructure: asGlobs(registry?.testInfrastructure)
  }
}

// The entry that judges a specifier: the longest registered name that is
// the specifier or one of its parent paths down to its package.
export const resolveEntry = ({ index, source }) => {
  const name = packageNameOf({ source })
  if (!name) return null
  if (isBuiltin(source)) return index.entries.get(BUILTIN_ENTRY) ?? null
  const segments = source.split('/')
  const floor = name.split('/').length
  for (let length = segments.length; length >= floor; length -= 1) {
    const entry = index.entries.get(segments.slice(0, length).join('/'))
    if (entry) return entry
  }
  return null
}

const seamOf = ({ entry }) => asGlobs(entry.seam)

// null when the import is allowed, else `{ kind, package, entry }`.
export const judgeImport = ({ index, path, source, typeOnly }) => {
  const name = packageNameOf({ source })
  if (!name) return null
  const entry = resolveEntry({ index, source })
  if (!entry) {
    return { entry: null, kind: SEAM_FINDING.UNREGISTERED, package: name }
  }
  if (entry.category === CATEGORY.CORE) return null
  if (matchesAny({ globs: index.testInfrastructure, path })) return null
  if (typeOnly && entry.types === TYPES.ANYWHERE) return null
  const seam = seamOf({ entry })
  const admitted = [path, ...unitPathsOf({ path })].some((candidate) =>
    matchesAny({ globs: seam, path: candidate })
  )
  return admitted
    ? null
    : { entry, kind: SEAM_FINDING.OUTSIDE_SEAM, package: entry.name }
}

export const isSeamAllowlisted = ({ allowlist, package: name, path }) =>
  Array.isArray(allowlist) &&
  allowlist.some(
    (entry) => entry?.path === path && entry?.package === name
  )

// ---------------------------------------------------------------------------
// Import sites
// ---------------------------------------------------------------------------

const literalOf = (node) => {
  if (node?.type === 'Literal' && typeof node.value === 'string') {
    return node
  }
  if (node?.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node
  }
  return null
}

const textOf = (node) =>
  node.type === 'Literal' ? node.value : node.quasis[0].value.cooked

const allTyped = ({ key, specifiers }) =>
  specifiers.length > 0 &&
  specifiers.every((specifier) => specifier[key] === 'type')

const isRequireCall = (node) =>
  node.callee.type === 'Identifier' && node.callee.name === 'require'

const isViModuleCall = (node) =>
  node.callee.type === 'MemberExpression' &&
  !node.callee.computed &&
  node.callee.object.type === 'Identifier' &&
  node.callee.object.name === 'vi' &&
  node.callee.property.type === 'Identifier' &&
  VI_MODULE_HELPERS.has(node.callee.property.name)

// `{ node, typeOnly }` when the node reaches a module, else null; `node` is
// the specifier's literal.
const siteOf = (node) => {
  switch (node.type) {
    case 'ImportDeclaration':
      return {
        node: literalOf(node.source),
        typeOnly:
          node.importKind === 'type' ||
          allTyped({ key: 'importKind', specifiers: node.specifiers })
      }
    case 'ExportNamedDeclaration':
      return node.source
        ? {
            node: literalOf(node.source),
            typeOnly:
              node.exportKind === 'type' ||
              allTyped({ key: 'exportKind', specifiers: node.specifiers })
          }
        : null
    case 'ExportAllDeclaration':
      return {
        node: literalOf(node.source),
        typeOnly: node.exportKind === 'type'
      }
    case 'ImportExpression':
      return { node: literalOf(node.source), typeOnly: false }
    case 'TSImportType':
      return {
        node: literalOf(node.argument?.literal ?? node.argument),
        typeOnly: true
      }
    case 'TSImportEqualsDeclaration':
      return node.moduleReference?.type === 'TSExternalModuleReference'
        ? {
            node: literalOf(node.moduleReference.expression),
            typeOnly: node.importKind === 'type'
          }
        : null
    case 'CallExpression':
      return isRequireCall(node) || isViModuleCall(node)
        ? { node: literalOf(node.arguments[0]), typeOnly: false }
        : null
    default:
      return null
  }
}

const childNodes = (node) =>
  Object.entries(node)
    .filter(
      ([key, value]) =>
        key !== 'parent' && value !== null && typeof value === 'object'
    )
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
    .filter((child) => typeof child?.type === 'string')

// Every place the program reaches a module by a literal specifier:
// `{ node, source, typeOnly }`, in source order.
export const collectImportSites = ({ program }) => {
  const sites = []
  const visit = (node) => {
    const site = siteOf(node)
    if (site?.node) {
      sites.push({
        node: site.node,
        source: textOf(site.node),
        typeOnly: site.typeOnly
      })
    }
    childNodes(node).forEach(visit)
  }
  visit(program)
  return sites
}

// Every import of the file the rule reports: `{ kind, node, package,
// source, entry }`. A file outside `apps/*` and `packages/*` has none.
export const collectSeamViolations = ({
  allowlist = [],
  index,
  path,
  program
}) => {
  if (!isInScope({ path })) return []
  return collectImportSites({ program }).flatMap(
    ({ node, source, typeOnly }) => {
      const finding = judgeImport({ index, path, source, typeOnly })
      if (!finding) return []
      if (
        isSeamAllowlisted({ allowlist, package: finding.package, path })
      ) {
        return []
      }
      return [{ ...finding, node, source }]
    }
  )
}

// ---------------------------------------------------------------------------
// The files at a repository root
// ---------------------------------------------------------------------------

const readJson = ({ path }) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

// `{ allowlist, registry }` as read from `root`. A file that cannot be read
// reads as nothing: no entry, so every package fails closed, and no
// exemption. The gate reports the unreadable file.
export const readSeamInputs = ({ root }) => {
  const allowlist = readJson({ path: join(root, SEAM_ALLOWLIST_FILE) })
  return {
    allowlist: Array.isArray(allowlist) ? allowlist : [],
    registry: readJson({ path: join(root, DEPENDENCY_REGISTRY_FILE) })
  }
}
