#!/usr/bin/env node
// ---------------------------------------------------------------------------
// pnpm mcp:docs — refresh the generated block of docs/mcp.md from the npm
// registry, and report the pin bumps the registry makes possible (decision
// 61: every catalog server is pinned and launched with `node`).
//
// It reads the catalog (.agents/contracts/mcp-servers.json) plus the
// project's .mcp.json when one exists, asks the registry for each npm
// package's `latest` dist-tag, the publish time of every release and the
// bin file each release runs, and rewrites the block: per server, the
// devDependency line, the direct command and the latest release. A server
// whose command is neither `npx` nor `node node_modules/<package>/…` is
// listed as "not on npm" and never requested.
//
//   - A newer release of a catalog server's pinned major prints as
//     `bump: … version <from> -> <to>, entry <from> -> <to>`, a planned
//     change, once it is 1,440 minutes old (pnpm's minimumReleaseAge); a
//     younger one prints as `waits:`, and a new major as `major:`, which a
//     person bumps. The updater never writes the catalog.
//   - A server whose pin changed, or that is new in the block, prints its
//     catalog docs as `review: <path>`: its tools may have changed, so a
//     person or an agent re-reads them. The updater never rewrites them.
//   - A run that finds nothing new writes nothing, whatever its date: a row
//     keeps the date its values were recorded.
//   - A malformed catalog or .mcp.json, a doc without its markers, or a
//     failed request exits 1, names what failed, and leaves the doc as it
//     was. Every other result is still printed.
//
// This is the only command that uses the network, and only when run
// explicitly; `pnpm verify:mcp-docs` judges the block offline.
//
// Usage:
//   node scripts/update-mcp-docs.mjs [--root <dir>]
// ---------------------------------------------------------------------------

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import {
  listServers,
  MCP_CATALOG_PATH,
  MCP_CONFIG_PATH,
  MCP_DOC_PATH,
  parseCatalog,
  parseMcpConfig,
  planRows,
  readBlock,
  replaceBlock
} from './mcp-docs.detect.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const REGISTRY = 'https://registry.npmjs.org'
// A full packument (it holds every publish time) runs to megabytes for a
// package that publishes often, such as shadcn.
const REQUEST_TIMEOUT_MS = 60_000
const DATE_LENGTH = 10
const EXIT_FAILED = 1
const EXIT_PASSED = 0
// pnpm's minimumReleaseAge: a release younger than this is never pinned.
const RELEASE_AGE_MINUTES = 1_440
const MS_PER_MINUTE = 60_000
const RELEASE_AGE_MS = RELEASE_AGE_MINUTES * MS_PER_MINUTE
const STABLE = /^\d+\.\d+\.\d+$/u
const CURRENT_DIR = /^\.\//u

const readText = ({ path, root }) => {
  const target = join(root, path)
  return existsSync(target) ? readFileSync(target, 'utf8') : null
}

// What both commands read: the parsed catalog and .mcp.json, the doc's
// text (null when it is missing) and which catalog docs exist.
export const readSources = ({ root }) => {
  const catalog = parseCatalog({
    text: readText({ path: MCP_CATALOG_PATH, root })
  })
  return {
    catalog,
    config: parseMcpConfig({
      text: readText({ path: MCP_CONFIG_PATH, root })
    }),
    doc: readText({ path: MCP_DOC_PATH, root }),
    docsPresent: new Set(
      catalog.servers
        .flatMap(({ docs }) => docs)
        .filter((path) => existsSync(join(root, path)))
    )
  }
}

// The file a release's `bin` runs: the string itself, else the command
// named after the package, else its only command; null when it has none.
const binOf = ({ bin, packageName }) => {
  if (typeof bin === 'string') return bin
  if (bin === null || typeof bin !== 'object') return null
  const own = bin[packageName.split('/').pop()]
  if (typeof own === 'string') return own
  const files = Object.values(bin).filter(
    (file) => typeof file === 'string'
  )
  return files.length === 1 ? files[0] : null
}

// A registry document as `{ latest: { published, version }, releases }`,
// each release `{ entry, published, version }`, `entry` relative to the
// package root, or null when the release has no bin.
const releasesOf = ({ document, packageName }) => {
  const version = document['dist-tags']?.latest
  const published = document.time?.[version]
  if (typeof version !== 'string' || typeof published !== 'string')
    throw new Error('no latest dist-tag with a publish time')
  const releases = Object.entries(document.versions ?? {}).flatMap(
    ([release, manifest]) => {
      const time = document.time?.[release]
      if (typeof time !== 'string') return []
      const file = binOf({ bin: manifest?.bin, packageName })
      return [
        {
          entry: file === null ? null : file.replace(CURRENT_DIR, ''),
          published: time,
          version: release
        }
      ]
    }
  )
  return { latest: { published, version }, releases }
}

// One package as the registry describes it (`releasesOf`). `request` is the
// HTTP client, `fetch` unless a caller injects another.
export const fetchFromRegistry = async ({
  packageName,
  request = fetch
}) => {
  const response = await request(
    `${REGISTRY}/${encodeURIComponent(packageName).replace('%40', '@')}`,
    {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    }
  )
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText}`)
  return releasesOf({ document: await response.json(), packageName })
}

const partsOf = (version) => version.split('-')[0].split('.').map(Number)

const compareVersions = ({ left, right }) => {
  const [ours, theirs] = [partsOf(left), partsOf(right)]
  const index = ours.findIndex((part, at) => part !== theirs[at])
  return index === -1 ? 0 : ours[index] - theirs[index]
}

const majorOf = (version) => partsOf(version)[0]

// The bump a server's pin can take: `bump`, the highest stable release of
// the pinned major that the `latest` dist-tag covers, that has a bin and is
// at least 1,440 minutes old; `waits`, a newer one still younger, with the
// time it becomes eligible; `major`, a `latest` of a higher major. Each is
// null when there is none.
const planBump = ({ now, pinned, registry }) => {
  const isOld = ({ published }) =>
    now - Date.parse(published) >= RELEASE_AGE_MS
  const newer = registry.releases
    .filter(
      ({ entry, version }) =>
        entry !== null &&
        STABLE.test(version) &&
        majorOf(version) === majorOf(pinned) &&
        compareVersions({ left: version, right: pinned }) > 0 &&
        compareVersions({
          left: version,
          right: registry.latest.version
        }) <= 0
    )
    .sort((left, right) =>
      compareVersions({ left: right.version, right: left.version })
    )
  const bump = newer.find(isOld) ?? null
  const young = newer.find((release) => !isOld(release)) ?? null
  const waits =
    young !== null &&
    (bump === null ||
      compareVersions({ left: young.version, right: bump.version }) > 0)
  return {
    bump,
    major:
      majorOf(registry.latest.version) > majorOf(pinned)
        ? registry.latest.version
        : null,
    waits: waits
      ? {
          eligible: new Date(
            Date.parse(young.published) + RELEASE_AGE_MS
          ).toISOString(),
          version: young.version
        }
      : null
  }
}

const bumpLines = ({ now, registry, server }) => {
  if (server.version === null || registry === undefined) return []
  const { bump, major, waits } = planBump({
    now,
    pinned: server.version,
    registry
  })
  const label = `${server.name} ${server.packageName}`
  return [
    bump &&
      `bump: ${label} version ${server.version} -> ${bump.version}, ` +
        `entry ${server.entry} -> ${bump.entry}`,
    waits &&
      `waits: ${label} ${waits.version} is younger than 1,440 minutes; ` +
        `it can be pinned from ${waits.eligible}`,
    major &&
      `major: ${label} ${major} is a new major over ${server.version}; ` +
        'bump it by hand'
  ].filter(Boolean)
}

const isoDate = (time) =>
  new Date(time).toISOString().slice(0, DATE_LENGTH)

const fail = ({ problems, warn }) => {
  problems.forEach((problem) => warn(`mcp-docs: ${problem}`))
  warn(`mcp-docs: ${MCP_DOC_PATH} left as it was`)
  return { code: EXIT_FAILED }
}

const askRegistry = async ({ fetchPackage, servers }) => {
  const npm = servers.filter(({ packageName }) => packageName !== null)
  const settled = await Promise.allSettled(
    npm.map(({ packageName }) => fetchPackage({ packageName }))
  )
  const found = new Map()
  const problems = []
  settled.forEach((outcome, index) => {
    const { name, packageName } = npm[index]
    if (outcome.status === 'fulfilled') {
      found.set(name, outcome.value)
      return
    }
    problems.push(
      `${name} (${packageName}): the registry request failed: ` +
        (outcome.reason?.message ?? String(outcome.reason))
    )
  })
  return { found, problems }
}

const describe = ({ found, released, server }) => {
  if (server.packageName === null)
    return `mcp-docs: ${server.name} is not on npm; no version to check`
  const registry = found.get(server.name)
  if (registry === undefined) return null
  const change = released.find(({ name }) => name === server.name)
  const note =
    change === undefined
      ? 'unchanged'
      : change.from === null
        ? 'new in the block'
        : `was ${change.from}`
  return `mcp-docs: ${server.name} ${server.packageName} ${registry.latest.version} (${note})`
}

// A failed run reports what it found but names no doc to review: it wrote
// nothing, so the next run that writes still sees the change.
const report = ({ found, now, plan, print, reviews, servers }) =>
  servers.forEach((server) => {
    const line = describe({ found, released: plan.released, server })
    if (line !== null) print(line)
    bumpLines({ now, registry: found.get(server.name), server }).forEach(
      (bump) => print(bump)
    )
    if (!reviews) return
    plan.repinned
      .filter(({ name }) => name === server.name)
      .flatMap(({ docs }) => docs)
      .forEach((path) => print(`review: ${path}`))
  })

export const updateMcpDocs = async ({
  fetchPackage = fetchFromRegistry,
  now = Date.now(),
  print = console.log,
  root = REPO_ROOT,
  warn = console.error
}) => {
  const { catalog, config, doc } = readSources({ root })
  const sourceProblems = [...catalog.problems, ...config.problems]
  if (sourceProblems.length > 0)
    return fail({ problems: sourceProblems, warn })
  if (doc === null)
    return fail({ problems: [`${MCP_DOC_PATH} is missing`], warn })
  const block = readBlock({ text: doc })
  if (block.problem) return fail({ problems: [block.problem], warn })

  const servers = listServers({
    catalog: catalog.servers,
    config: config.servers
  })
  const { found, problems } = await askRegistry({ fetchPackage, servers })
  const plan = planRows({
    latest: new Map(
      [...found].map(([name, registry]) => [name, registry.latest])
    ),
    previous: block.rows,
    servers,
    today: isoDate(now)
  })
  if (problems.length > 0) {
    report({ found, now, plan, print, reviews: false, servers })
    return fail({ problems, warn })
  }

  report({ found, now, plan, print, reviews: true, servers })
  const { text } = replaceBlock({ rows: plan.rows, text: doc })
  if (text === doc) {
    print(`mcp-docs: no server changed; ${MCP_DOC_PATH} left as it was`)
    return { code: EXIT_PASSED }
  }
  writeFileSync(join(root, MCP_DOC_PATH), text)
  print(`mcp-docs: wrote the generated block of ${MCP_DOC_PATH}`)
  return { code: EXIT_PASSED }
}

const main = async () => {
  const { values } = parseArgs({
    options: { root: { default: REPO_ROOT, type: 'string' } }
  })
  const { code } = await updateMcpDocs({ root: resolve(values.root) })
  process.exitCode = code
}

if (import.meta.main) await main()
