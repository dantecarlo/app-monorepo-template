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

  return [...importLeaks, ...pluginLeaks].sort(byFileThenSpecifier)
}
