#!/usr/bin/env node
// ---------------------------------------------------------------------------
// pnpm mcp:docs — refresh the generated block of docs/mcp.md from the npm
// registry, and report the pin bumps the registry makes possible (decision
// 61: every catalog server is pinned and launched with `node
// scripts/mcp/launch.mjs <name>`).
//
// It reads the catalog (.agents/contracts/mcp-servers.json) plus the
// project's .mcp.json when one exists, asks the registry for each npm
// package's `latest` dist-tag, the publish time of every release and the
// bin file each release runs, and rewrites the block: per server, the
// devDependency line, the command a client runs and the latest release. A
// server whose command is neither `npx`, `node node_modules/<package>/…`
// nor the launcher with a catalog name is listed as "not on npm" and never
// requested.
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
// It is the first updater of .agents/contracts/updaters.json, so it keeps
// the updater contract (docs/harness.md section 3i):
//
//   --check  asks the registry the same way and writes nothing: it exits 0
//            when the block is current, 2 when a run would rewrite it, and
//            1 on any failure the update exits 1 for; it prints the server
//            and bump lines and no `review:` line, since it wrote nothing.
//            A bump alone leaves the block current: the catalog is never
//            written
//   --json   prints the run as one JSON document on stdout and nothing else
//            there: { bumps, mode, problems, review, servers, status,
//            updater, writes }, status one of current, outdated (--check
//            only), updated or failed; stderr and the exit code are those
//            of the same run without it
//
// This is the only command that uses the network, and only when run
// explicitly; `pnpm verify:mcp-docs` judges the block offline.
//
// Usage:
//   node scripts/update-mcp-docs.mjs [--check] [--json] [--root <dir>]
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
  NOT_ON_NPM,
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
const EXIT_OUTDATED = 2
const EXIT_PASSED = 0
const JSON_INDENT = 2
const UPDATER_ID = 'mcp-docs'

const MODE = Object.freeze({ check: 'check', update: 'update' })

const STATUS = Object.freeze({
  current: 'current',
  failed: 'failed',
  outdated: 'outdated',
  updated: 'updated'
})

const CHANGE = Object.freeze({
  failed: 'failed',
  new: 'new',
  notOnNpm: NOT_ON_NPM,
  released: 'released',
  unchanged: 'unchanged'
})
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

const changeOf = ({ released, server }) => {
  const change = released.find(({ name }) => name === server.name)
  if (change === undefined) return CHANGE.unchanged
  return change.from === null ? CHANGE.new : CHANGE.released
}

// One server as the run found it: its package, its pin, the latest release
// the registry names, the latest the block recorded before, and what
// changed between the two.
const summaryOf = ({ found, previous, released, server }) => {
  const record = {
    from: previous.get(server.name)?.latest ?? null,
    latest: null,
    name: server.name,
    package: server.packageName,
    version: server.version ?? null
  }
  if (server.packageName === null)
    return { ...record, change: CHANGE.notOnNpm, from: null }
  const registry = found.get(server.name)
  if (registry === undefined) return { ...record, change: CHANGE.failed }
  return {
    ...record,
    change: changeOf({ released, server }),
    latest: registry.latest.version
  }
}

const NOTE = Object.freeze({
  [CHANGE.new]: () => 'new in the block',
  [CHANGE.released]: ({ from }) => `was ${from}`,
  [CHANGE.unchanged]: () => 'unchanged'
})

const describe = ({ summary }) => {
  if (summary.change === CHANGE.notOnNpm)
    return `mcp-docs: ${summary.name} is not on npm; no version to check`
  if (summary.change === CHANGE.failed) return null
  return `mcp-docs: ${summary.name} ${summary.package} ${summary.latest} (${NOTE[summary.change](summary)})`
}

const reviewsOf = ({ plan, server }) =>
  plan.repinned
    .filter(({ name }) => name === server.name)
    .flatMap(({ docs }) => docs)

// A failed run, and a check, report what they found but name no doc to
// review: they wrote nothing, so the next run that writes still sees the
// change.
const report = ({ found, now, plan, print, reviews, servers, summaries }) =>
  servers.forEach((server, index) => {
    const line = describe({ summary: summaries[index] })
    if (line !== null) print(line)
    bumpLines({ now, registry: found.get(server.name), server }).forEach(
      (bump) => print(bump)
    )
    if (!reviews) return
    reviewsOf({ plan, server }).forEach((path) => print(`review: ${path}`))
  })

// The document `--json` prints, from what the run decided.
const documentOf = ({ mode, outcome }) => ({
  bumps: outcome.bumps ?? [],
  mode,
  problems: outcome.problems ?? [],
  review: outcome.review ?? [],
  servers: outcome.servers ?? [],
  status: outcome.status,
  updater: UPDATER_ID,
  writes: outcome.writes ?? []
})

export const updateMcpDocs = async ({
  check = false,
  fetchPackage = fetchFromRegistry,
  json = false,
  now = Date.now(),
  print = console.log,
  root = REPO_ROOT,
  warn = console.error
}) => {
  const mode = check ? MODE.check : MODE.update
  const say = json ? () => {} : print
  const finish = (outcome) => {
    if (json) {
      print(
        JSON.stringify(documentOf({ mode, outcome }), null, JSON_INDENT)
      )
    }
    return { code: outcome.code, status: outcome.status }
  }
  const fail = ({ bumps, problems, servers }) => {
    problems.forEach((problem) => warn(`mcp-docs: ${problem}`))
    warn(`mcp-docs: ${MCP_DOC_PATH} left as it was`)
    return finish({
      bumps,
      code: EXIT_FAILED,
      problems,
      servers,
      status: STATUS.failed
    })
  }

  const { catalog, config, doc } = readSources({ root })
  const sourceProblems = [...catalog.problems, ...config.problems]
  if (sourceProblems.length > 0) return fail({ problems: sourceProblems })
  if (doc === null)
    return fail({ problems: [`${MCP_DOC_PATH} is missing`] })
  const block = readBlock({ text: doc })
  if (block.problem) return fail({ problems: [block.problem] })

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
  const previous = new Map(block.rows.map((row) => [row.name, row]))
  const summaries = servers.map((server) =>
    summaryOf({ found, previous, released: plan.released, server })
  )
  const bumps = servers.flatMap((server) =>
    bumpLines({ now, registry: found.get(server.name), server })
  )
  const shown = { found, now, plan, print: say, servers, summaries }
  if (problems.length > 0) {
    report({ ...shown, reviews: false })
    return fail({ bumps, problems, servers: summaries })
  }

  report({ ...shown, reviews: !check })
  const review = servers.flatMap((server) => reviewsOf({ plan, server }))
  const { text } = replaceBlock({ rows: plan.rows, text: doc })
  if (text === doc) {
    say(
      `mcp-docs: no server changed; ${MCP_DOC_PATH} ` +
        (check ? 'is current' : 'left as it was')
    )
    return finish({
      bumps,
      code: EXIT_PASSED,
      servers: summaries,
      status: STATUS.current
    })
  }
  if (check) {
    say(
      `mcp-docs: out of date; \`pnpm mcp:docs\` would rewrite the generated block of ${MCP_DOC_PATH} ` +
        '(--check writes nothing)'
    )
    return finish({
      bumps,
      code: EXIT_OUTDATED,
      review,
      servers: summaries,
      status: STATUS.outdated,
      writes: [MCP_DOC_PATH]
    })
  }
  writeFileSync(join(root, MCP_DOC_PATH), text)
  say(`mcp-docs: wrote the generated block of ${MCP_DOC_PATH}`)
  return finish({
    bumps,
    code: EXIT_PASSED,
    review,
    servers: summaries,
    status: STATUS.updated,
    writes: [MCP_DOC_PATH]
  })
}

const main = async () => {
  const { values } = parseArgs({
    options: {
      check: { default: false, type: 'boolean' },
      json: { default: false, type: 'boolean' },
      root: { default: REPO_ROOT, type: 'string' }
    }
  })
  const { code } = await updateMcpDocs({
    check: values.check,
    json: values.json,
    root: resolve(values.root)
  })
  process.exitCode = code
}

if (import.meta.main) await main()
