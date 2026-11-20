#!/usr/bin/env node
// ---------------------------------------------------------------------------
// pnpm mcp:docs — refresh the generated block of docs/mcp.md from the npm
// registry (decision 55: MCP servers stay unpinned, and the docs follow
// their releases).
//
// It reads the catalog (.agents/contracts/mcp-servers.json) plus the
// project's .mcp.json when one exists, asks the registry for each npm
// package's `latest` dist-tag and its publish time, and rewrites the block.
// A server whose command is not `npx` with an npm package is listed as
// "not on npm" and never requested.
//
//   - A server whose version changed prints its catalog docs as
//     `review: <path>`: a release may have changed its tools, so a person or
//     an agent re-reads them. The updater never rewrites them.
//   - A run that finds nothing new writes nothing, whatever its date: a row
//     keeps the date its version was recorded.
//   - A malformed catalog or .mcp.json, a doc without its markers, or a
//     failed request exits 1, names what failed, and leaves the doc as it
//     was. Every other result is still printed.
//
// It is the first updater of .agents/contracts/updaters.json, so it keeps
// the updater contract (docs/harness.md section 3g):
//
//   --check  asks the registry the same way and writes nothing: it exits 0
//            when the block is current, 2 when a run would rewrite it, and
//            1 on any failure the update exits 1 for; it prints the server
//            lines and no `review:` line, since it wrote nothing
//   --json   prints the run as one JSON document on stdout and nothing else
//            there: { mode, problems, review, servers, status, updater,
//            writes }, status one of current, outdated (--check only),
//            updated or failed; stderr and the exit code are unchanged
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
const JSON_INDENT = 2
const EXIT_FAILED = 1
const EXIT_OUTDATED = 2
const EXIT_PASSED = 0
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

// The registry's `latest` release of one package: `{ published, version }`,
// `published` being the ISO time the registry records for that version.
export const fetchFromRegistry = async ({ packageName }) => {
  const response = await fetch(
    `${REGISTRY}/${encodeURIComponent(packageName).replace('%40', '@')}`,
    {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    }
  )
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText}`)
  const document = await response.json()
  const version = document['dist-tags']?.latest
  const published = document.time?.[version]
  if (typeof version !== 'string' || typeof published !== 'string')
    throw new Error('no latest dist-tag with a publish time')
  return { published, version }
}

const todayUtc = () => new Date().toISOString().slice(0, DATE_LENGTH)

const askRegistry = async ({ fetchLatest, servers }) => {
  const npm = servers.filter(({ packageName }) => packageName !== null)
  const settled = await Promise.allSettled(
    npm.map(({ packageName }) => fetchLatest({ packageName }))
  )
  const latest = new Map()
  const problems = []
  settled.forEach((outcome, index) => {
    const { name, packageName } = npm[index]
    if (outcome.status === 'fulfilled') {
      latest.set(name, outcome.value)
      return
    }
    problems.push(
      `${name} (${packageName}): the registry request failed: ` +
        (outcome.reason?.message ?? String(outcome.reason))
    )
  })
  return { latest, problems }
}

const changeOf = ({ released, server }) => {
  const change = released.find(({ name }) => name === server.name)
  if (change === undefined) return CHANGE.unchanged
  return change.from === null ? CHANGE.new : CHANGE.released
}

// One server as the run found it: its package and version, the version the
// block recorded before, and what changed between the two.
const summaryOf = ({ latest, previous, released, server }) => {
  const record = {
    from: previous.get(server.name)?.version ?? null,
    name: server.name,
    package: server.packageName,
    version: null
  }
  if (server.packageName === null)
    return { ...record, change: CHANGE.notOnNpm, from: null }
  const found = latest.get(server.name)
  if (found === undefined) return { ...record, change: CHANGE.failed }
  return {
    ...record,
    change: changeOf({ released, server }),
    version: found.version
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
  return `mcp-docs: ${summary.name} ${summary.package} ${summary.version} (${NOTE[summary.change](summary)})`
}

const reviewsOf = ({ released, server }) =>
  released
    .filter(({ name }) => name === server.name)
    .flatMap(({ docs }) => docs)

// A failed run, and a check, report what they found but name no doc to
// review: they wrote nothing, so the next run that writes still sees the
// change.
const report = ({ print, released, reviews, servers, summaries }) =>
  servers.forEach((server, index) => {
    const line = describe({ summary: summaries[index] })
    if (line !== null) print(line)
    if (!reviews) return
    reviewsOf({ released, server }).forEach((path) =>
      print(`review: ${path}`)
    )
  })

// The document `--json` prints, from what the run decided.
const documentOf = ({ mode, outcome }) => ({
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
  fetchLatest = fetchFromRegistry,
  json = false,
  print = console.log,
  root = REPO_ROOT,
  today = todayUtc(),
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
  const fail = ({ problems, servers }) => {
    problems.forEach((problem) => warn(`mcp-docs: ${problem}`))
    warn(`mcp-docs: ${MCP_DOC_PATH} left as it was`)
    return finish({
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
  const { latest, problems } = await askRegistry({ fetchLatest, servers })
  const { released, rows } = planRows({
    latest,
    previous: block.rows,
    servers,
    today
  })
  const previous = new Map(block.rows.map((row) => [row.name, row]))
  const summaries = servers.map((server) =>
    summaryOf({ latest, previous, released, server })
  )
  if (problems.length > 0) {
    report({ print: say, released, reviews: false, servers, summaries })
    return fail({ problems, servers: summaries })
  }

  report({ print: say, released, reviews: !check, servers, summaries })
  const review = servers.flatMap((server) => reviewsOf({ released, server }))
  const { text } = replaceBlock({ rows, text: doc })
  if (text === doc) {
    say(
      `mcp-docs: no server changed; ${MCP_DOC_PATH} ` +
        (check ? 'is current' : 'left as it was')
    )
    return finish({
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
