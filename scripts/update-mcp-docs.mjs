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

const fail = ({ problems, warn }) => {
  problems.forEach((problem) => warn(`mcp-docs: ${problem}`))
  warn(`mcp-docs: ${MCP_DOC_PATH} left as it was`)
  return { code: EXIT_FAILED }
}

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

const describe = ({ latest, released, server }) => {
  if (server.packageName === null)
    return `mcp-docs: ${server.name} is not on npm; no version to check`
  const found = latest.get(server.name)
  if (found === undefined) return null
  const change = released.find(({ name }) => name === server.name)
  const note =
    change === undefined
      ? 'unchanged'
      : change.from === null
        ? 'new in the block'
        : `was ${change.from}`
  return `mcp-docs: ${server.name} ${server.packageName} ${found.version} (${note})`
}

// A failed run reports what it found but names no doc to review: it wrote
// nothing, so the next run that writes still sees the change.
const report = ({ latest, print, released, reviews, servers }) =>
  servers.forEach((server) => {
    const line = describe({ latest, released, server })
    if (line !== null) print(line)
    if (!reviews) return
    released
      .filter(({ name }) => name === server.name)
      .flatMap(({ docs }) => docs)
      .forEach((path) => print(`review: ${path}`))
  })

export const updateMcpDocs = async ({
  fetchLatest = fetchFromRegistry,
  print = console.log,
  root = REPO_ROOT,
  today = todayUtc(),
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
  const { latest, problems } = await askRegistry({ fetchLatest, servers })
  const { released, rows } = planRows({
    latest,
    previous: block.rows,
    servers,
    today
  })
  if (problems.length > 0) {
    report({ latest, print, released, reviews: false, servers })
    return fail({ problems, warn })
  }

  report({ latest, print, released, reviews: true, servers })
  const { text } = replaceBlock({ rows, text: doc })
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
