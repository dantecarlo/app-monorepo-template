// ---------------------------------------------------------------------------
// prune-boundary — what pruning one capability of template.manifest.json
// would leave dangling.
//
// Pruning an absent capability deletes every file it claims and every path
// its `remove` actions name, and drops the dependencies of its `remove-dep`
// actions. A file the prune keeps must then import none of those files and
// none of those dependencies, and no Expo `app.json` it keeps may list a
// plugin of a removed dependency: `expo prebuild` would fail to resolve it.
// A `patch-json` that sets `expo.plugins` must leave exactly the app's
// plugins without the removed ones, or it drifts from `app.json`.
//
// Pure: the caller hands in the file list, the reader and the glob matcher
// of the manifest engine (scripts/manifest.mjs), so the claims match here
// exactly as the coverage gate matches them.
//
// The registry the prune leaves must stay true too: the prune drops every
// entry of .agents/contracts/dependencies.json the capability owns, with its
// seam globs, and then no kept entry may name a package no kept package.json
// declares, no kept seam glob may match no kept file under apps/ or
// packages/, and no kept package.json may declare a package no kept entry
// names: the three findings verify:dependency-seams would report.
//
// An import is any `from '…'`, `import '…'`, `import('…')` or `require('…')`
// with a literal specifier. A specifier resolves relative to its file, `@/`
// to the `src/` of its workspace and `#src/` to the `src/` of its package;
// any other one names a package.
// ---------------------------------------------------------------------------

import { posix } from 'node:path'

const { dirname, join } = posix

const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/u
const IMPORT_SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/gu
const WORKSPACE_ROOT = /^(?<root>(?:apps|packages)\/[^/]+)\//u
const RESOLVED_EXTENSIONS = [
  '',
  '.ts',
  '.tsx',
  '.mts',
  '.js',
  '.jsx',
  '.mjs'
]
const INDEX_FILES = ['/index.ts', '/index.tsx', '/index.js']
const APP_ALIAS = '@/'
const PACKAGE_ALIAS = '#src/'
const SOURCE_FOLDER = 'src'
const EXPO_CONFIG = 'app.json'
const EXPO_PLUGINS_PATH = 'expo.plugins'
const REGISTRY_FILE = '.agents/contracts/dependencies.json'
const WORKSPACE_MANIFEST =
  /^(?:(?:apps|packages)\/[^/]+\/)?package\.json$/u
const WORKSPACE_FILE = /^(?:apps|packages)\//u
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
]
const BUILTIN_ENTRY = 'node:*'
const CORE_OWNER = 'core'
const SCOPE_MARK = '@'
const PATH_SEPARATOR = '/'
const SCOPED_NAME_PARTS = 2

const asArray = (value) => (Array.isArray(value) ? value : [])

const actionsOf = ({ capability, verb }) =>
  asArray(capability.onAbsent).filter((action) => action.verb === verb)

const isRelative = (specifier) =>
  specifier.startsWith('./') || specifier.startsWith('../')

// The repository path a specifier names, or null when it names a package.
const resolveBase = ({ file, specifier }) => {
  if (isRelative(specifier)) return join(dirname(file), specifier)
  const workspace = WORKSPACE_ROOT.exec(file)?.groups?.root
  const alias = [APP_ALIAS, PACKAGE_ALIAS].find((prefix) =>
    specifier.startsWith(prefix)
  )
  if (!workspace || !alias) return null
  return join(workspace, SOURCE_FOLDER, specifier.slice(alias.length))
}

const candidatesOf = ({ base }) => [
  ...RESOLVED_EXTENSIONS.map((extension) => `${base}${extension}`),
  ...INDEX_FILES.map((index) => `${base}${index}`)
]

const namesDependency = ({ dependencies, specifier }) =>
  dependencies.some(
    (name) => specifier === name || specifier.startsWith(`${name}/`)
  )

const specifiersOf = ({ text }) =>
  [...text.matchAll(IMPORT_SPECIFIER)].map((match) => match[2])

const importLeaksOf = ({ dependencies, file, pruned, text }) =>
  specifiersOf({ text })
    .filter((specifier) => {
      const base = resolveBase({ file, specifier })
      if (base === null)
        return namesDependency({ dependencies, specifier })
      return candidatesOf({ base }).some((path) => pruned.has(path))
    })
    .map((specifier) => ({ file, kind: 'import', specifier }))

const pluginName = (entry) => (Array.isArray(entry) ? entry[0] : entry)

const withoutRemovedPlugins = ({ dependencies, plugins }) =>
  plugins.filter(
    (entry) =>
      !namesDependency({
        dependencies,
        specifier: String(pluginName(entry))
      })
  )

const pluginLeaksOf = ({ capability, dependencies, file, text }) => {
  const plugins = asArray(JSON.parse(text)?.expo?.plugins)
  const patch = actionsOf({ capability, verb: 'patch-json' }).find(
    (action) =>
      action.file === file &&
      action.op === 'set' &&
      action.path === EXPO_PLUGINS_PATH
  )
  const left = patch ? asArray(patch.value) : plugins
  const leaks = left
    .map((entry) => String(pluginName(entry)))
    .filter((specifier) => namesDependency({ dependencies, specifier }))
    .map((specifier) => ({ file, kind: 'plugin', specifier }))
  const expected = withoutRemovedPlugins({ dependencies, plugins })
  const drifts =
    patch !== undefined &&
    leaks.length === 0 &&
    JSON.stringify(left) !== JSON.stringify(expected)

  return drifts
    ? [
        ...leaks,
        { file, kind: 'plugin-drift', specifier: EXPO_PLUGINS_PATH }
      ]
    : leaks
}

// The package an entry names: a subpath (next/cache) names its package.
const packageOf = (name) =>
  name
    .split(PATH_SEPARATOR)
    .slice(0, name.startsWith(SCOPE_MARK) ? SCOPED_NAME_PARTS : 1)
    .join(PATH_SEPARATOR)

const removalKey = ({ file, name, scope }) => `${file} ${scope} ${name}`

// What each kept package.json still declares once the remove-dep actions
// of the capability apply.
const declarationsOf = ({ capability, kept, readKept }) => {
  const removed = new Set(
    actionsOf({ capability, verb: 'remove-dep' }).map(removalKey)
  )
  return kept
    .filter((file) => WORKSPACE_MANIFEST.test(file))
    .map((file) => {
      const manifest = JSON.parse(readKept(file))
      const names = DEPENDENCY_FIELDS.flatMap((scope) =>
        Object.keys(manifest?.[scope] ?? {}).filter(
          (name) => !removed.has(removalKey({ file, name, scope }))
        )
      )
      return { file, names: [...new Set(names)] }
    })
}

const registryLeaksOf = ({ capability, kept, readKept }) => {
  if (!kept.includes(REGISTRY_FILE)) return []
  const registry = JSON.parse(readKept(REGISTRY_FILE))
  const declarations = declarationsOf({ capability, kept, readKept })
  const declared = new Set(declarations.flatMap(({ names }) => names))
  const removedPackages = new Set(
    actionsOf({ capability, verb: 'remove-dep' }).map(({ name }) => name)
  )
  // An entry goes with its owner, or with the remove-dep that takes its
  // package from the last package.json declaring it, the way a `remove`
  // takes a file another capability claims. Core is never pruned.
  const goes = ({ name, owner }) =>
    owner === capability.id ||
    (owner !== CORE_OWNER &&
      removedPackages.has(packageOf(name)) &&
      !declared.has(packageOf(name)))
  const entries = asArray(registry?.packages).filter(
    (entry) => !goes(entry)
  )
  const registered = new Set(entries.map(({ name }) => name))
  const workspaceFiles = kept.filter((path) => WORKSPACE_FILE.test(path))
  const matchesAFile = (glob) =>
    workspaceFiles.some((path) => posix.matchesGlob(path, glob))

  const stale = entries
    .filter(({ name }) => name !== BUILTIN_ENTRY)
    .filter(({ name }) => !declared.has(packageOf(name)))
    .map(({ name }) => ({
      file: REGISTRY_FILE,
      kind: 'registry-stale',
      specifier: name
    }))
  const seams = [
    ...entries.flatMap(({ name, seam }) =>
      asArray(seam).map((glob) => ({ glob, owner: name }))
    ),
    ...asArray(registry?.testInfrastructure).map((glob) => ({
      glob,
      owner: 'testInfrastructure'
    }))
  ]
    .filter(({ glob }) => !matchesAFile(glob))
    .map(({ glob, owner }) => ({
      file: REGISTRY_FILE,
      kind: 'registry-seam',
      specifier: `${owner} ${glob}`
    }))
  const unregistered = declarations.flatMap(({ file, names }) =>
    names
      .filter((name) => !registered.has(name))
      .map((name) => ({
        file,
        kind: 'registry-unregistered',
        specifier: name
      }))
  )
  return [...stale, ...seams, ...unregistered]
}

const byFileThenSpecifier = (a, b) =>
  a.file.localeCompare(b.file) || a.specifier.localeCompare(b.specifier)

/**
 * Every reference a file kept by the prune of `capabilityId` still makes to
 * what that prune deletes or removes, sorted by file and specifier.
 */
export const findPruneLeaks = ({
  capabilityId,
  files,
  manifest,
  matches,
  readText
}) => {
  const capability = asArray(manifest?.capabilities).find(
    ({ id }) => id === capabilityId
  )
  if (!capability) {
    throw new Error(
      `prune-boundary: the manifest declares no capability "${capabilityId}"`
    )
  }

  const patterns = [
    ...asArray(capability.claims),
    ...actionsOf({ capability, verb: 'remove' }).flatMap(({ paths }) =>
      asArray(paths)
    )
  ]
  const pruned = new Set(
    files.filter((path) => matches({ path, patterns }))
  )
  const dependencies = actionsOf({ capability, verb: 'remove-dep' }).map(
    ({ name }) => name
  )
  const kept = files.filter((path) => !pruned.has(path))
  const readKept = (path) => readText({ path })

  const importLeaks = kept
    .filter((file) => SOURCE_FILE.test(file))
    .flatMap((file) =>
      importLeaksOf({
        dependencies,
        file,
        pruned,
        text: readText({ path: file })
      })
    )
  const pluginLeaks = kept
    .filter((file) => posix.basename(file) === EXPO_CONFIG)
    .flatMap((file) =>
      pluginLeaksOf({
        capability,
        dependencies,
        file,
        text: readText({ path: file })
      })
    )

  const registryLeaks = registryLeaksOf({ capability, kept, readKept })

  return [...importLeaks, ...pluginLeaks, ...registryLeaks].sort(
    byFileThenSpecifier
  )
}
