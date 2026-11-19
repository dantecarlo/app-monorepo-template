// ---------------------------------------------------------------------------
// dependency-seams.detect — the pure checks behind verify-dependency-seams.
//
// The caller gathers the registry, the package.json files, every file under
// apps/ and packages/, the import sites of their sources and the allowlist;
// these functions only decide. An import site is judged by the detection
// local/dependency-seam runs (eslint-local-rules/dependency-seam.detect.mjs),
// so the gate and the lint cannot disagree on which import breaks the seam.
// ---------------------------------------------------------------------------

import { posix } from 'node:path'

import {
  BUILTIN_ENTRY,
  CATEGORY,
  DEPENDENCY_REGISTRY_FILE,
  indexRegistry,
  judgeImport,
  packageNameOf,
  SEAM_ALLOWLIST_FILE,
  SEAM_FINDING,
  TYPES
} from '../eslint-local-rules/dependency-seam.detect.mjs'

export const FINDING_KIND = Object.freeze({
  allowlistDuplicate: 'allowlist-duplicate',
  allowlistMalformed: 'allowlist-malformed',
  allowlistStale: 'allowlist-stale',
  allowlistUnlisted: 'allowlist-unlisted',
  registryMalformed: 'registry-malformed',
  staleEntry: 'stale-entry',
  unlinted: 'unlinted',
  unmatchedGlob: 'unmatched-glob',
  unparsed: 'unparsed',
  unreadableManifest: 'unreadable-manifest',
  unregisteredDependency: 'unregistered-dependency'
})

// The dependency fields of a package.json the registry answers for.
export const DEPENDENCY_FIELDS = Object.freeze([
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies'
])

const REGISTRY_KEYS = new Set([
  '$comment',
  'packages',
  'testInfrastructure'
])
const ENTRY_KEYS = new Set([
  'category',
  'name',
  'note',
  'owner',
  'seam',
  'types'
])
const ALLOWLIST_KEYS = new Set(['package', 'path', 'reason'])
const CATEGORIES = new Set(Object.values(CATEGORY))
const TYPE_POLICIES = new Set(Object.values(TYPES))
// A frozen import names the F.8 unit that moves it: units 2 to 8 do.
const UNIT_REASON_RE = /^F\.8 unit [2-8]\b/u
const PATTERN_MARK = '*'

const isText = (value) => typeof value === 'string' && value.trim() !== ''
const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const unknownKeys = ({ allowed, value }) =>
  Object.keys(value).filter((key) => !allowed.has(key))

const malformed = (detail) => ({
  detail: `${DEPENDENCY_REGISTRY_FILE}: ${detail}`,
  kind: FINDING_KIND.registryMalformed
})

// ---------------------------------------------------------------------------
// The registry's own shape
// ---------------------------------------------------------------------------

// Why the whole registry cannot be read, or null. Nothing else is judged
// against a registry that fails here.
export const registryUnreadable = ({ registry }) => {
  if (registry?.unreadable) return `cannot be read: ${registry.unreadable}`
  if (!isObject(registry)) return 'is not a JSON object'
  if (!Array.isArray(registry.packages)) return 'has no "packages" array'
  return null
}

const globsProblem = ({ field, value }) => {
  if (!Array.isArray(value)) return `${field} is not an array of globs`
  return value.every(isText)
    ? null
    : `${field} holds a glob that is not text`
}

const entryProblem = ({ entry }) => {
  if (!isObject(entry)) return 'is not an object'
  const extra = unknownKeys({ allowed: ENTRY_KEYS, value: entry })
  if (extra.length > 0) {
    return `has keys the registry does not define: ${extra.join(', ')}`
  }
  if (!isText(entry.name)) return 'has no name'
  const namesPackage =
    entry.name === BUILTIN_ENTRY ||
    (!entry.name.includes(PATTERN_MARK) &&
      packageNameOf({ source: entry.name }) !== null)
  if (!namesPackage) {
    return `names ${JSON.stringify(entry.name)}, which is neither a package, a package subpath nor ${BUILTIN_ENTRY}`
  }
  if (!CATEGORIES.has(entry.category)) {
    return `has the category ${JSON.stringify(entry.category)}, which is none of ${[...CATEGORIES].join(', ')}`
  }
  if (entry.category === CATEGORY.CORE) {
    if (Object.hasOwn(entry, 'seam') || Object.hasOwn(entry, 'types')) {
      return 'is core, which is imported anywhere, and so names no seam and no types'
    }
  } else {
    if (!Object.hasOwn(entry, 'seam')) {
      return `is ${entry.category} and names no seam: list the globs of the files that may import it, or [] for none yet`
    }
    const globs = globsProblem({ field: 'its seam', value: entry.seam })
    if (globs) return globs
  }
  if (Object.hasOwn(entry, 'types') && !TYPE_POLICIES.has(entry.types)) {
    return `has types ${JSON.stringify(entry.types)}, which is neither ${[...TYPE_POLICIES].join(' nor ')}`
  }
  if (Object.hasOwn(entry, 'note') && !isText(entry.note)) {
    return 'has a note that is not text'
  }
  // Which capability's prune removes the entry is the manifest's question:
  // verify-manifest-coverage holds the owner to template.manifest.json.
  if (Object.hasOwn(entry, 'owner') && !isText(entry.owner)) {
    return 'has an owner that is not text'
  }
  return null
}

const labelOf = ({ entry, index }) =>
  isText(entry?.name) ? entry.name : `entry ${index}`

export const registryFindings = ({ registry }) => {
  const extra = unknownKeys({ allowed: REGISTRY_KEYS, value: registry })
  const infrastructure = globsProblem({
    field: '"testInfrastructure"',
    value: registry.testInfrastructure
  })
  const seen = new Set()
  return [
    ...(extra.length > 0
      ? [malformed(`has keys it does not define: ${extra.join(', ')}`)]
      : []),
    ...(infrastructure ? [malformed(infrastructure)] : []),
    ...registry.packages.flatMap((entry, index) => {
      const problem = entryProblem({ entry })
      if (problem) {
        return [malformed(`${labelOf({ entry, index })} ${problem}`)]
      }
      if (seen.has(entry.name)) {
        return [malformed(`${entry.name} is named by two entries`)]
      }
      seen.add(entry.name)
      return []
    })
  ]
}

const validEntries = ({ registry }) =>
  registry.packages.filter((entry) => entryProblem({ entry }) === null)

// ---------------------------------------------------------------------------
// The registry against the workspace
// ---------------------------------------------------------------------------

const declaredBy = ({ manifests }) =>
  new Set(manifests.flatMap(({ names }) => names))

// A manifest that cannot be read declares packages nobody can name, so its
// dependencies go unjudged and every entry it alone declares would read as
// stale: the gate names the file and calls no entry stale until it reads.
export const unreadableManifestFindings = ({ manifests }) =>
  manifests
    .filter(({ problem }) => problem)
    .map(({ path, problem }) => ({
      detail:
        `${path} ${problem}: its dependencies are not judged, and no ` +
        'registry entry is called stale until it reads',
      kind: FINDING_KIND.unreadableManifest,
      path
    }))

export const unregisteredDependencyFindings = ({ index, manifests }) =>
  manifests.flatMap(({ names, path }) =>
    names
      .filter((name) => !index.entries.has(name))
      .map((name) => ({
        detail:
          `${path} declares ${name}, which ${DEPENDENCY_REGISTRY_FILE} ` +
          'does not name: register it with its category and seam',
        kind: FINDING_KIND.unregisteredDependency,
        path
      }))
  )

export const staleEntryFindings = ({ manifests, registry }) => {
  const declared = declaredBy({ manifests })
  return validEntries({ registry })
    .filter(({ name }) => name !== BUILTIN_ENTRY)
    .filter(({ name }) => !declared.has(packageNameOf({ source: name })))
    .map(({ name }) => ({
      detail:
        `${DEPENDENCY_REGISTRY_FILE}: ${name} names a package no ` +
        'package.json declares — remove the entry',
      kind: FINDING_KIND.staleEntry
    }))
}

export const unmatchedGlobFindings = ({ files, registry }) => {
  const matchesAFile = (glob) =>
    files.some((path) => posix.matchesGlob(path, glob))
  const owners = [
    ...validEntries({ registry })
      .filter(({ category }) => category !== CATEGORY.CORE)
      .flatMap(({ name, seam }) =>
        seam.map((glob) => ({ glob, owner: `the seam of ${name}` }))
      ),
    ...(Array.isArray(registry.testInfrastructure)
      ? registry.testInfrastructure
          .filter(isText)
          .map((glob) => ({ glob, owner: 'testInfrastructure' }))
      : [])
  ]
  return owners
    .filter(({ glob }) => !matchesAFile(glob))
    .map(({ glob, owner }) => ({
      detail: `${DEPENDENCY_REGISTRY_FILE}: ${owner} lists ${glob}, which matches no file under apps/ or packages/`,
      kind: FINDING_KIND.unmatchedGlob
    }))
}

// ---------------------------------------------------------------------------
// Violations and the allowlist
// ---------------------------------------------------------------------------

const keyOf = ({ package: name, path }) => `${name} ${path}`

// One row per file and package whose imports break the seam: `{ count,
// kind, linted, package, path }`.
export const collectViolations = ({ index, sites }) => {
  const rows = new Map()
  sites.forEach(({ linted, path, source, typeOnly }) => {
    const finding = judgeImport({ index, path, source, typeOnly })
    if (!finding) return
    const key = keyOf({ package: finding.package, path })
    const row = rows.get(key) ?? {
      count: 0,
      kind: finding.kind,
      linted,
      package: finding.package,
      path
    }
    row.count += 1
    rows.set(key, row)
  })
  return [...rows.values()]
}

const VIOLATION_TEXT = Object.freeze({
  [SEAM_FINDING.OUTSIDE_SEAM]: 'outside its seam',
  [SEAM_FINDING.UNREGISTERED]: 'unregistered'
})

export const unlintedFindings = ({ violations }) =>
  violations
    .filter(({ linted }) => !linted)
    .map(({ count, kind, package: name, path }) => ({
      detail:
        `${path}, which ESLint does not lint, imports ${name} ` +
        `${VIOLATION_TEXT[kind]} ${count} time(s): list the file in the ` +
        'seam of its package, or import the project module that wraps it',
      kind: FINDING_KIND.unlinted,
      path
    }))

const allowlistEntryProblem = ({ entry }) => {
  if (!isObject(entry)) return 'is not an object'
  const extra = unknownKeys({ allowed: ALLOWLIST_KEYS, value: entry })
  if (extra.length > 0) {
    return `has keys the allowlist does not define: ${extra.join(', ')}`
  }
  if (!isText(entry.path)) return 'has no path'
  if (!isText(entry.package)) return 'names no package'
  if (!isText(entry.reason) || !UNIT_REASON_RE.test(entry.reason)) {
    return 'has no reason that starts with the F.8 unit, 2 to 8, that removes it ("F.8 unit 3: …")'
  }
  return null
}

export const allowlistUnreadable = ({ allowlist }) =>
  Array.isArray(allowlist)
    ? null
    : `${SEAM_ALLOWLIST_FILE} is not a JSON array${allowlist?.unreadable ? `: ${allowlist.unreadable}` : ''}`

export const allowlistFindings = ({ allowlist, violations }) => {
  const unreadable = allowlistUnreadable({ allowlist })
  if (unreadable) {
    return [{ detail: unreadable, kind: FINDING_KIND.allowlistMalformed }]
  }
  const seen = new Set()
  const shape = allowlist.flatMap((entry, index) => {
    const problem = allowlistEntryProblem({ entry })
    if (problem) {
      return [
        {
          detail: `${SEAM_ALLOWLIST_FILE} entry ${index} ${problem}`,
          kind: FINDING_KIND.allowlistMalformed
        }
      ]
    }
    if (seen.has(keyOf(entry))) {
      return [
        {
          detail: `${SEAM_ALLOWLIST_FILE}: ${entry.path} is listed twice for ${entry.package}`,
          kind: FINDING_KIND.allowlistDuplicate,
          path: entry.path
        }
      ]
    }
    seen.add(keyOf(entry))
    return []
  })
  const linted = violations.filter(({ linted: isLinted }) => isLinted)
  const breaking = new Set(linted.map(keyOf))
  const stale = [...seen]
    .filter((key) => !breaking.has(key))
    .map((key) => {
      const separator = key.indexOf(' ')
      const name = key.slice(0, separator)
      const path = key.slice(separator + 1)
      return {
        detail:
          `${SEAM_ALLOWLIST_FILE}: ${path} no longer imports ${name} ` +
          'outside its seam but is still exempt — remove the entry, the ' +
          'list only shrinks',
        kind: FINDING_KIND.allowlistStale,
        path
      }
    })
  const unlisted = linted
    .filter((violation) => !seen.has(keyOf(violation)))
    .map(({ count, kind, package: name, path }) => ({
      detail:
        `${path} imports ${name} ${VIOLATION_TEXT[kind]} ${count} ` +
        'time(s) and is not listed — import the project module that wraps ' +
        'it; a frozen import is a hand edit with the F.8 unit that removes it',
      kind: FINDING_KIND.allowlistUnlisted,
      path
    }))
  return [...shape, ...stale, ...unlisted]
}

// ---------------------------------------------------------------------------
// The whole verdict
// ---------------------------------------------------------------------------

// Why the gate refuses the registry, as findings: none for a registry every
// other check may read.
const refusalOf = ({ registry }) => {
  const unreadable = registryUnreadable({ registry })
  return unreadable
    ? [malformed(unreadable)]
    : registryFindings({ registry })
}

// The registry is the input of every other check, so a registry that cannot
// be read, or holds a malformed entry, is reported alone: nothing else is
// judged against it.
export const judgeSeams = ({
  allowlist,
  files,
  manifests,
  registry,
  sites,
  unparsed = []
}) => {
  const refusal = refusalOf({ registry })
  if (refusal.length > 0) return refusal
  const index = indexRegistry({ registry })
  const violations = collectViolations({ index, sites })
  const read = manifests.filter(({ problem }) => !problem)
  const unreadable = unreadableManifestFindings({ manifests })
  return [
    ...unparsed.map(({ message, path }) => ({
      detail: `${path} cannot be parsed, so its imports are not judged: ${message}`,
      kind: FINDING_KIND.unparsed,
      path
    })),
    ...unreadable,
    ...unregisteredDependencyFindings({ index, manifests: read }),
    ...(unreadable.length > 0
      ? []
      : staleEntryFindings({ manifests: read, registry })),
    ...unmatchedGlobFindings({ files, registry }),
    ...unlintedFindings({ violations }),
    ...allowlistFindings({ allowlist, violations })
  ]
}

// The file-package pairs outside their seam, or null against a registry the
// gate refuses: a count taken from it would judge what nothing else does.
export const countViolations = ({ registry, sites }) =>
  refusalOf({ registry }).length > 0
    ? null
    : collectViolations({ index: indexRegistry({ registry }), sites })
        .length
