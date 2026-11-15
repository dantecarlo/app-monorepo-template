// ---------------------------------------------------------------------------
// Resolver behind the package-src-alias rule in ./index.mjs.
//
// A package source reaches its own modules through the `#src/` key of its
// package.json. Given the linted file's absolute path and a specifier, this
// returns what the rule does with it:
//   null                     — not a path this rule judges
//   { alias: '#src/<path>' } — the specifier to write instead
//   { alias: null }          — own-path form with no fix
//
// The fix names the file the specifier resolves to today, found the way the
// bundler finds it: the path itself, then the path with a source extension,
// then the folder's index. The alias is derived from the package's own
// "imports" patterns and resolved back through the whole map the way Node
// does: an exact key first, then the pattern with the longest prefix before
// its `*`. It is written only when it lands on that same file. A path that
// leaves the package's src, a file that does not exist, a file no `#src/`
// alias resolves back to, and a package whose package.json cannot be read as
// an object are reported with no fix. Each package's map is read once per
// run. Everything is computed from the file's own path, so the fix is the
// same whichever folder ESLint runs from.
// ---------------------------------------------------------------------------

import { existsSync, readFileSync, statSync } from 'node:fs'
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep
} from 'node:path'

export const SRC_ALIAS = '#src/'
const APP_ALIAS = '@/'
const RELATIVE_PREFIXES = ['./', '../']
const RELATIVE_SELF = ['.', '..']
const PARENT_SEGMENT = '..'
const PATTERN_WILDCARD = '*'
const PACKAGE_MANIFEST = 'package.json'
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.json']
const INDEX_FILES = ['index.ts', 'index.tsx']
const PACKAGE_SRC = /^(.*[\\/]packages[\\/][^\\/]+[\\/]src)[\\/]/
const NO_FIX = Object.freeze({ alias: null })

const isRelative = ({ source }) =>
  RELATIVE_SELF.includes(source) ||
  RELATIVE_PREFIXES.some((prefix) => source.startsWith(prefix))

export const isOwnPathForm = ({ source }) =>
  source.startsWith(APP_ALIAS) || isRelative({ source })

const isFile = ({ path }) => existsSync(path) && statSync(path).isFile()

const resolveFile = ({ target }) =>
  [
    target,
    ...SOURCE_EXTENSIONS.map((extension) => `${target}${extension}`),
    ...INDEX_FILES.map((name) => join(target, name))
  ].find((path) => isFile({ path })) ?? null

const isPlainObject = ({ value }) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// The "imports" map of a package.json, or an empty map when the file is
// missing, is not JSON, or holds no object map.
const parseImports = ({ manifest }) => {
  if (!isFile({ path: manifest })) return {}
  try {
    const parsed = JSON.parse(readFileSync(manifest, 'utf8'))
    const imports = isPlainObject({ value: parsed })
      ? parsed.imports
      : null
    return isPlainObject({ value: imports }) ? imports : {}
  } catch {
    return {}
  }
}

// Each package's map is read once per lint run: the process that runs the
// rule keeps it for every later specifier of that package.
const importsByPackage = new Map()

const readImports = ({ packageDir }) => {
  if (!importsByPackage.has(packageDir)) {
    importsByPackage.set(
      packageDir,
      parseImports({ manifest: join(packageDir, PACKAGE_MANIFEST) })
    )
  }
  return importsByPackage.get(packageDir)
}

const isPatternKey = ({ key }) => key.split(PATTERN_WILDCARD).length === 2

const isPlainPattern = ({ entry }) =>
  typeof entry === 'string' && isPatternKey({ key: entry })

// Node matches a pattern only when its `*` stands for at least one character.
const fits = ({ prefix, suffix, value }) =>
  value.length > prefix.length + suffix.length &&
  value.startsWith(prefix) &&
  value.endsWith(suffix)

const starOf = ({ prefix, suffix, value }) =>
  value.slice(prefix.length, value.length - suffix.length)

// Node's choice for a specifier over the WHOLE map: an exact key first; then,
// among the pattern keys it fits, the longest prefix before the `*`, then the
// longest key. A winner whose target is not one plain string (null, a
// conditional object, an array) resolves to nothing this rule can prove.
const resolveAlias = ({ alias, imports }) => {
  if (Object.hasOwn(imports, alias) && !alias.includes(PATTERN_WILDCARD)) {
    const exact = imports[alias]
    return typeof exact === 'string' ? exact : null
  }
  const [chosen] = Object.keys(imports)
    .filter((key) => isPatternKey({ key }))
    .map((key) => {
      const [prefix, suffix] = key.split(PATTERN_WILDCARD)
      return { key, prefix, suffix }
    })
    .filter(({ prefix, suffix }) => fits({ prefix, suffix, value: alias }))
    .sort(
      (a, b) =>
        b.prefix.length - a.prefix.length || b.key.length - a.key.length
    )
  if (!chosen || !isPlainPattern({ entry: imports[chosen.key] }))
    return null
  const [targetPrefix, targetSuffix] =
    imports[chosen.key].split(PATTERN_WILDCARD)
  return `${targetPrefix}${starOf({ ...chosen, value: alias })}${targetSuffix}`
}

// The `#src/` alias an entry spells for the file, if it spells one at all.
const spellingsFor = ({ entry, key, target }) => {
  if (!isPatternKey({ key })) return entry === target ? [key] : []
  if (!isPlainPattern({ entry })) return []
  const [keyPrefix, keySuffix] = key.split(PATTERN_WILDCARD)
  const [targetPrefix, targetSuffix] = entry.split(PATTERN_WILDCARD)
  const pattern = { prefix: targetPrefix, suffix: targetSuffix }
  if (!fits({ ...pattern, value: target })) return []
  return [
    `${keyPrefix}${starOf({ ...pattern, value: target })}${keySuffix}`
  ]
}

// Every spelling is kept only when it resolves back to that file through the
// whole map.
const aliasFor = ({ file, packageDir }) => {
  const imports = readImports({ packageDir })
  const target = `./${relative(packageDir, file).split(sep).join('/')}`
  const alias = Object.entries(imports)
    .filter(([key]) => key.startsWith(SRC_ALIAS))
    .flatMap(([key, entry]) => spellingsFor({ entry, key, target }))
    .find(
      (candidate) => resolveAlias({ alias: candidate, imports }) === target
    )
  return alias ? { alias } : NO_FIX
}

export const toSrcAlias = ({ filename, source }) => {
  if (!isOwnPathForm({ source })) return null
  const match = PACKAGE_SRC.exec(filename)
  if (!match) return NO_FIX
  const srcRoot = match[1]
  const target = source.startsWith(APP_ALIAS)
    ? resolve(srcRoot, source.slice(APP_ALIAS.length))
    : resolve(dirname(filename), source)
  const path = relative(srcRoot, target)
  const leavesSrc =
    path === '' ||
    isAbsolute(path) ||
    path.split(sep)[0] === PARENT_SEGMENT
  if (leavesSrc) return NO_FIX
  const file = resolveFile({ target })
  if (!file) return NO_FIX
  return aliasFor({ file, packageDir: dirname(srcRoot) })
}
