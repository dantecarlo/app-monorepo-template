// ---------------------------------------------------------------------------
// manifest — the pure core of the template capability manifest.
//
// The manifest is the single deterministic answer to "what does this project
// need, and what exactly gets touched when the answer changes". Nothing here
// reads the filesystem or shells out: both gates (verify-manifest and
// verify-manifest-coverage) feed it data and render its findings.
//
// Ownership model
// ---------------
// `claims` is the ONLY source of truth for file ownership. Every tracked file
// belongs to exactly one owner — a capability, or `core` (never removable).
// A capability that is NOT selected has every path it claims removed. The six
// action verbs exist only for the surgery that file ownership cannot express
// (json keys, workspace entries, dependency records).
//
// That single rule is what makes the manifest unable to lie in either
// direction: an unclaimed file is a hole, and a claim matching nothing is
// drift. Both are hard failures.
// ---------------------------------------------------------------------------

// The closed action vocabulary. A seventh verb is a design conversation,
// never an ad-hoc script — that is the whole point of the closed set.
export const ACTION_VERBS = {
  copy: ['from', 'to'],
  'patch-json': ['file', 'op', 'path'],
  'remove-dep': ['file', 'name', 'scope'],
  'remove-workspace': ['entry'],
  remove: ['paths'],
  render: ['from', 'to']
}

export const MANIFEST_VERSION = 1

const KEBAB_CASE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Sentinels stand in for glob tokens while the literal text is escaped, so the
// regex we emit is never itself re-escaped. They cannot occur in a path.
const NUL = String.fromCharCode(0)
const GLOBSTAR_MID = `${NUL}A`
const GLOBSTAR_HEAD = `${NUL}B`
const GLOBSTAR_TAIL = `${NUL}C`
const GLOBSTAR_BARE = `${NUL}D`
const STAR = `${NUL}E`

// ---------------------------------------------------------------------------
// Glob contract
//
//   **   crosses path separators, and collapses to zero segments
//   *    matches within a single segment
//   everything else is literal
// ---------------------------------------------------------------------------

export const globToRegExp = ({ pattern }) => {
  const tokenized = pattern
    .replace(/^\*\*\//, GLOBSTAR_HEAD)
    .replace(/\/\*\*\//g, GLOBSTAR_MID)
    .replace(/\/\*\*$/, GLOBSTAR_TAIL)
    .replace(/\*\*/g, GLOBSTAR_BARE)
    .replace(/\*/g, STAR)

  const escaped = tokenized.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

  const source = escaped
    .split(GLOBSTAR_HEAD)
    .join('(?:.*/)?')
    .split(GLOBSTAR_MID)
    .join('/(?:.*/)?')
    .split(GLOBSTAR_TAIL)
    .join('(?:/.*)?')
    .split(GLOBSTAR_BARE)
    .join('.*')
    .split(STAR)
    .join('[^/]*')

  return new RegExp(`^${source}$`)
}

export const matchesAny = ({ path, patterns }) =>
  patterns.some((pattern) => globToRegExp({ pattern }).test(path))

// ---------------------------------------------------------------------------
// Structural validation — is the manifest itself well formed?
// ---------------------------------------------------------------------------

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.length > 0

const asArray = (value) => (Array.isArray(value) ? value : [])

const validateClaim = ({ claim, owner, violations }) => {
  if (!isNonEmptyString(claim)) {
    violations.push({
      detail: 'A claim must be a non-empty string',
      owner,
      rule: 'claim-not-a-string'
    })
    return
  }

  const escapes = claim.startsWith('/') || claim.split('/').includes('..')

  if (escapes) {
    violations.push({
      detail: `Claim "${claim}" is not repo-relative (absolute path or ".." segment)`,
      owner,
      rule: 'claim-not-repo-relative'
    })
  }
}

const validateAction = ({ action, owner, phase, violations }) => {
  const required = ACTION_VERBS[action?.verb]

  if (!required) {
    violations.push({
      detail: `Unknown verb "${action?.verb}" in ${phase}. Allowed: ${Object.keys(ACTION_VERBS).sort().join(', ')}`,
      owner,
      rule: 'action-verb-unknown'
    })
    return
  }

  const missing = required.filter((field) => action[field] === undefined)

  if (missing.length > 0) {
    violations.push({
      detail: `Verb "${action.verb}" in ${phase} is missing: ${missing.join(', ')}`,
      owner,
      rule: 'action-field-missing'
    })
  }

  if (
    action.verb === 'patch-json' &&
    action.op === 'set' &&
    action.value === undefined
  ) {
    violations.push({
      detail: 'patch-json with op "set" must carry a value',
      owner,
      rule: 'action-field-missing'
    })
  }
}

const validateCapability = ({
  capability,
  knownIds,
  seenIds,
  violations
}) => {
  const {
    claims,
    conflictsWith,
    group,
    id,
    onAbsent,
    onPresent,
    requires,
    title
  } = capability
  const owner = id ?? '(unnamed)'

  if (!isNonEmptyString(id) || !KEBAB_CASE_RE.test(id)) {
    violations.push({
      detail: `Capability id "${id}" must be kebab-case`,
      owner,
      rule: 'capability-id-not-kebab-case'
    })
  }

  if (seenIds.has(id)) {
    violations.push({
      detail: `Capability id "${id}" is declared more than once`,
      owner,
      rule: 'capability-id-duplicate'
    })
  }
  seenIds.add(id)

  if (!isNonEmptyString(title)) {
    violations.push({
      detail: 'Capability is missing a title',
      owner,
      rule: 'capability-title-missing'
    })
  }

  if (!isNonEmptyString(group)) {
    violations.push({
      detail: 'Capability is missing a group',
      owner,
      rule: 'capability-group-missing'
    })
  }

  if (!Array.isArray(claims) || claims.length === 0) {
    violations.push({
      detail:
        'A capability must claim at least one path — an unclaiming capability can never be pruned',
      owner,
      rule: 'capability-claims-empty'
    })
  }

  for (const claim of asArray(claims)) {
    validateClaim({ claim, owner, violations })
  }

  for (const ref of asArray(requires)) {
    if (!knownIds.has(ref)) {
      violations.push({
        detail: `requires "${ref}", which is not a declared capability`,
        owner,
        rule: 'requires-unknown-capability'
      })
    }
  }

  for (const ref of asArray(conflictsWith)) {
    if (!knownIds.has(ref)) {
      violations.push({
        detail: `conflictsWith "${ref}", which is not a declared capability`,
        owner,
        rule: 'conflicts-unknown-capability'
      })
    }
  }

  const contradictions = asArray(requires).filter((ref) =>
    asArray(conflictsWith).includes(ref)
  )

  for (const ref of contradictions) {
    violations.push({
      detail: `both requires and conflictsWith "${ref}" — unsatisfiable`,
      owner,
      rule: 'requires-conflicts-contradiction'
    })
  }

  for (const action of asArray(onPresent)) {
    validateAction({ action, owner, phase: 'onPresent', violations })
  }

  for (const action of asArray(onAbsent)) {
    validateAction({ action, owner, phase: 'onAbsent', violations })
  }
}

const validatePreset = ({ byId, knownIds, preset, violations }) => {
  const { capabilities, id, title } = preset
  const owner = `preset:${id ?? '(unnamed)'}`

  if (!isNonEmptyString(id) || !KEBAB_CASE_RE.test(id)) {
    violations.push({
      detail: `Preset id "${id}" must be kebab-case`,
      owner,
      rule: 'preset-id-not-kebab-case'
    })
  }

  if (!isNonEmptyString(title)) {
    violations.push({
      detail: 'Preset is missing a title',
      owner,
      rule: 'preset-title-missing'
    })
  }

  const selected = asArray(capabilities)
  const unknown = selected.filter((ref) => !knownIds.has(ref))

  for (const ref of unknown) {
    violations.push({
      detail: `names "${ref}", which is not a declared capability`,
      owner,
      rule: 'preset-unknown-capability'
    })
  }

  const selectedSet = new Set(selected)

  for (const ref of selected) {
    const capability = byId.get(ref)
    if (!capability) continue

    const unmet = asArray(capability.requires).filter(
      (need) => !selectedSet.has(need)
    )

    for (const need of unmet) {
      violations.push({
        detail: `includes "${ref}" but omits its required "${need}"`,
        owner,
        rule: 'preset-unsatisfied-requires'
      })
    }

    const clashes = asArray(capability.conflictsWith).filter((other) =>
      selectedSet.has(other)
    )

    for (const other of clashes) {
      violations.push({
        detail: `includes both "${ref}" and "${other}", which conflict`,
        owner,
        rule: 'preset-conflicting-capabilities'
      })
    }
  }
}

export const validateManifest = ({ manifest }) => {
  const violations = []

  if (manifest?.version !== MANIFEST_VERSION) {
    violations.push({
      detail: `Manifest version must be ${MANIFEST_VERSION}, got ${manifest?.version}`,
      owner: 'manifest',
      rule: 'manifest-version-unsupported'
    })
  }

  const capabilities = asArray(manifest?.capabilities)
  const knownIds = new Set(capabilities.map(({ id }) => id))
  const byId = new Map(
    capabilities.map((capability) => [capability.id, capability])
  )
  const seenIds = new Set()

  for (const capability of capabilities) {
    validateCapability({ capability, knownIds, seenIds, violations })
  }

  for (const claim of asArray(manifest?.core)) {
    validateClaim({ claim, owner: 'core', violations })
  }

  for (const preset of asArray(manifest?.presets)) {
    validatePreset({ byId, knownIds, preset, violations })
  }

  return violations
}

// ---------------------------------------------------------------------------
// Coverage — does the manifest describe the repo exactly?
//
//   unclaimed   a tracked file nobody owns          → the manifest has a hole
//   conflicts   a tracked file two owners claim     → pruning is ambiguous
//   staleClaims a claim matching no tracked file    → the manifest has drifted
// ---------------------------------------------------------------------------

export const analyzeCoverage = ({ files, manifest }) => {
  const claimSets = [
    { owner: 'core', patterns: asArray(manifest?.core) },
    ...asArray(manifest?.capabilities).map(({ claims, id }) => ({
      owner: id,
      patterns: asArray(claims)
    }))
  ]

  const unclaimed = []
  const conflicts = []
  const matchedClaims = new Set()

  for (const path of files) {
    const owners = []

    for (const { owner, patterns } of claimSets) {
      const hit = patterns.filter((pattern) =>
        globToRegExp({ pattern }).test(path)
      )

      if (hit.length === 0) continue

      owners.push(owner)
      for (const pattern of hit) {
        matchedClaims.add(`${owner}${NUL}${pattern}`)
      }
    }

    if (owners.length === 0) {
      unclaimed.push(path)
    } else if (owners.length > 1) {
      conflicts.push({ owners: [...owners].sort(), path })
    }
  }

  const staleClaims = []

  for (const { owner, patterns } of claimSets) {
    for (const claim of patterns) {
      if (!matchedClaims.has(`${owner}${NUL}${claim}`)) {
        staleClaims.push({ claim, owner })
      }
    }
  }

  return {
    conflicts: conflicts.sort((a, b) => a.path.localeCompare(b.path)),
    staleClaims,
    unclaimed: unclaimed.sort()
  }
}
