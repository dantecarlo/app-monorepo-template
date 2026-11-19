// ---------------------------------------------------------------------------
// manifest-owners — the owners of what is smaller than a file: the entries of
// the dependency registry and the regions of a file another owner keeps.
//
// The other half of the pure manifest engine (scripts/manifest.mjs, which
// re-exports it). Nothing here reads the filesystem: the coverage gate and
// prune-boundary feed it text and render its findings.
// ---------------------------------------------------------------------------

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.length > 0

const asArray = (value) => (Array.isArray(value) ? value : [])

// ---------------------------------------------------------------------------
// Registry ownership — every entry of .agents/contracts/dependencies.json
// names one owner the manifest knows: the capability whose claims remove the
// entry's package from the workspace, or `core` (docs/manifest.md). An absent
// capability takes every entry it owns, with its seam globs, the way it takes
// the files it claims, and a `remove-dep` takes the entries of a package it
// removes from the last package.json declaring it. A field cannot hold two
// owners, so a conflict cannot be written.
// ---------------------------------------------------------------------------

export const CORE_OWNER = 'core'
export const REGISTRY_FILE = '.agents/contracts/dependencies.json'

export const analyzeRegistryOwners = ({ manifest, registry }) => {
  if (!Array.isArray(registry?.packages)) {
    return [
      {
        detail:
          'the registry holds no "packages" array, so no entry has an owner',
        name: REGISTRY_FILE
      }
    ]
  }

  const owners = new Set([
    CORE_OWNER,
    ...asArray(manifest?.capabilities).map(({ id }) => id)
  ])

  return registry.packages.flatMap((entry, index) => {
    const name = isNonEmptyString(entry?.name)
      ? entry.name
      : `entry ${index}`

    if (!isNonEmptyString(entry?.owner)) {
      return [
        {
          detail: `${name} names no owner: name the capability whose prune removes it, or ${CORE_OWNER}`,
          name
        }
      ]
    }

    if (!owners.has(entry.owner)) {
      return [
        {
          detail: `${name} is owned by "${entry.owner}", which template.manifest.json does not declare`,
          name
        }
      ]
    }

    return []
  })
}

// ---------------------------------------------------------------------------
// Regions — the lines of a file another owner keeps that a capability owns.
//
// A region runs from a `region <capability>` comment to the matching
// `endregion <capability>` comment, each alone on its line and written in
// the file's own comment syntax: `# region sentry` (YAML, dotenv),
// `// region sentry` (JavaScript, TypeScript) or `<!-- region sentry -->`
// (Markdown). The prune of that capability drops both markers and every
// line between; the regions of other capabilities stay. Regions do not
// nest. A region owns lines the way a claim owns a file, so the closed set
// of verbs needs no seventh one to edit the text a capability adds to a
// file it does not own.
// ---------------------------------------------------------------------------

const REGION_MARKER =
  /^\s*(?:(?:#|\/\/)\s*(?<lineKind>region|endregion) (?<lineOwner>[a-z0-9]+(?:-[a-z0-9]+)*)|<!--\s*(?<blockKind>region|endregion) (?<blockOwner>[a-z0-9]+(?:-[a-z0-9]+)*)\s*-->)\s*$/u
// A comment line that is a marker in all but its spelling: a capitalised or
// malformed owner, a doubled space, a capitalised keyword. It is reported
// rather than read as text, so a misspelled marker cannot leave a region's
// lines behind a prune while the gate passes. A comment of several words
// that only mentions a region is prose and matches neither pattern.
const NEAR_REGION_MARKER =
  /^\s*(?:#|\/\/|<!--)\s*(?:end)?region\s+\S+\s*(?:-->)?\s*$/iu
const REGION_OPEN = 'region'
const LINE_BREAK = '\n'
const CARRIAGE_RETURN = /\r$/u

const markerOf = (line) => {
  const groups = line
    .replace(CARRIAGE_RETURN, '')
    .match(REGION_MARKER)?.groups
  if (!groups) return null
  return {
    opens: (groups.lineKind ?? groups.blockKind) === REGION_OPEN,
    owner: groups.lineOwner ?? groups.blockOwner
  }
}

// Every region of a text with its 1-based first and last line, and every
// marker that leaves the text unbalanced.
export const parseRegions = ({ text }) => {
  const regions = []
  const problems = []
  let current = null

  text.split(LINE_BREAK).forEach((line, index) => {
    const marker = markerOf(line)
    const lineNumber = index + 1
    if (!marker) {
      const bare = line.replace(CARRIAGE_RETURN, '')
      if (NEAR_REGION_MARKER.test(bare)) {
        problems.push({
          detail: `"${bare.trim()}" does not follow the marker grammar: \`region <capability>\` or \`endregion <capability>\`, lowercase, one space before the capability`,
          line: lineNumber
        })
      }
      return
    }

    if (marker.opens) {
      if (current) {
        problems.push({
          detail: `region "${marker.owner}" opens inside region "${current.owner}", opened at line ${current.start}: regions do not nest`,
          line: lineNumber
        })
        return
      }
      current = { owner: marker.owner, start: lineNumber }
      return
    }

    if (!current) {
      problems.push({
        detail: `endregion "${marker.owner}" closes no open region`,
        line: lineNumber
      })
      return
    }

    if (current.owner !== marker.owner) {
      problems.push({
        detail: `endregion "${marker.owner}" closes region "${current.owner}", opened at line ${current.start}`,
        line: lineNumber
      })
      current = null
      return
    }

    regions.push({ ...current, end: lineNumber })
    current = null
  })

  if (current) {
    problems.push({
      detail: `region "${current.owner}" is never closed`,
      line: current.start
    })
  }

  return { problems, regions }
}

// The text without the regions of `owner`. A text whose regions are
// unbalanced cannot be pruned by line, so it throws rather than guess.
export const dropRegions = ({ owner, text }) => {
  const { problems, regions } = parseRegions({ text })
  if (problems.length > 0) {
    throw new Error(
      `cannot drop the regions of "${owner}": ${problems
        .map(({ detail, line }) => `line ${line}: ${detail}`)
        .join('; ')}`
    )
  }
  const dropped = regions.filter((region) => region.owner === owner)
  if (dropped.length === 0) return text
  return text
    .split(LINE_BREAK)
    .filter((_, index) =>
      dropped.every(
        ({ end, start }) => index + 1 < start || index + 1 > end
      )
    )
    .join(LINE_BREAK)
}

// Every region of `files` (`{ path, text }`) a prune could not drop
// cleanly: an owner the manifest does not declare (core is never pruned,
// so it owns no region), and every marker that leaves a file unbalanced.
export const analyzeRegions = ({ files, manifest }) => {
  const owners = new Set(
    asArray(manifest?.capabilities).map(({ id }) => id)
  )

  return files.flatMap(({ path, text }) => {
    const { problems, regions } = parseRegions({ text })
    const unknown = regions
      .filter(({ owner }) => !owners.has(owner))
      .map(({ owner, start }) => ({
        detail: `region "${owner}" names a capability template.manifest.json does not declare`,
        line: start
      }))
    return [...unknown, ...problems]
      .sort((a, b) => a.line - b.line)
      .map(({ detail, line }) => ({ detail, line, path }))
  })
}
