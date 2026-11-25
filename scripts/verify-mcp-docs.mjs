#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-mcp-docs — the generated block of docs/mcp.md lists what the MCP
// catalog and the project's .mcp.json hold, as `pnpm mcp:docs` wrote it.
//
// It reads the catalog (.agents/contracts/mcp-servers.json), .mcp.json when
// one exists, and docs/mcp.md, and fails:
//   - a malformed catalog: an entry without its fields, an area other than
//     web or mobile, a version that is not exact (a range, `latest` or a
//     tag), an entry outside its package, server args that are not a list
//     of words, a command that is not `node scripts/mcp/launch.mjs <its
//     name>` (decision 61: never `npx`), a doc that does not exist; or a
//     .mcp.json that does not parse;
//   - a .mcp.json server named like a catalog server that does not run the
//     launcher with its own name, and one that runs the launcher with no
//     catalog name or more than that name;
//   - a block that is missing, or that differs from what the updater wrote:
//     its end marker carries a digest of its lines, so a value or a line
//     typed by hand fails; `pnpm mcp:docs` rewrites it;
//   - a server, a package, a capability, a pinned version or a command that
//     differs between the block and the catalog plus .mcp.json.
//
// Latest releases are informational: the gate never judges whether a pin is
// the latest, and it makes no network request. Only `pnpm mcp:docs` asks the
// registry, and only when run explicitly.
//
// Usage:
//   node scripts/verify-mcp-docs.mjs [--root <dir>]
// ---------------------------------------------------------------------------

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import { defineGate, reportGate } from './gate/gate.mjs'
import {
  digestOf,
  launcherProblems,
  listServers,
  MCP_CATALOG_PATH,
  MCP_CONFIG_PATH,
  MCP_DOC_PATH,
  readBlock
} from './mcp-docs.detect.mjs'
import { readSources } from './update-mcp-docs.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RUN_UPDATER = 'run `pnpm mcp:docs`'
const SOURCES = `the catalog and ${MCP_CONFIG_PATH}`
// What a row must agree on: its label, the server's field, the row's field.
const COMPARED = [
  ['package', 'packageName', 'packageName'],
  ['capability', 'capability', 'capability'],
  ['pinned version', 'version', 'version'],
  ['command', 'commandLine', 'command']
]

export const collectContext = ({ root }) => readSources({ root })

const missingDocs = ({ catalog, docsPresent }) =>
  catalog.servers.flatMap(({ docs, name }) =>
    docs
      .filter((path) => !docsPresent.has(path))
      .map(
        (path) =>
          `${MCP_CATALOG_PATH}: ${name} names the doc ${path}, which does not exist`
      )
  )

const differences = ({ expected, rows }) => {
  const listed = new Map(rows.map((row) => [row.name, row]))
  const known = new Set(expected.map(({ name }) => name))
  return [
    ...expected.flatMap((server) => {
      const row = listed.get(server.name)
      if (row === undefined) {
        const source = server.inCatalog ? 'the catalog' : MCP_CONFIG_PATH
        return [
          `${server.name} is in ${source} but not in the block — ${RUN_UPDATER}`
        ]
      }
      return COMPARED.filter(
        ([, field, rowField]) => row[rowField] !== server[field]
      ).map(
        ([label, field, rowField]) =>
          `${server.name}: the block names the ${label} ${row[rowField] ?? '—'}, ` +
          `${SOURCES} name ${server[field] ?? '—'} — ${RUN_UPDATER}`
      )
    }),
    ...rows
      .filter(({ name }) => !known.has(name))
      .map(
        ({ name }) =>
          `${name} is in the block but neither in the catalog nor in ` +
          `${MCP_CONFIG_PATH} — ${RUN_UPDATER}`
      )
  ]
}

const blockFindings = ({ doc }) => {
  if (doc === null) return { findings: [`${MCP_DOC_PATH} is missing`] }
  const block = readBlock({ text: doc })
  if (block.problem) return { findings: [block.problem] }
  if (block.digest === null) {
    return {
      findings: [
        `the generated block of ${MCP_DOC_PATH} has no digest: ` +
          `\`pnpm mcp:docs\` never wrote it — ${RUN_UPDATER}`
      ]
    }
  }
  if (block.digest !== digestOf({ lines: block.body })) {
    return {
      findings: [
        `the generated block of ${MCP_DOC_PATH} was edited by hand: its ` +
          `lines do not match the digest its end marker records — ${RUN_UPDATER}, ` +
          'and edit the catalog or the prose around the block instead'
      ]
    }
  }
  return { block, findings: [] }
}

export const gate = defineGate({
  claims:
    `the generated block of ${MCP_DOC_PATH} is the one \`pnpm mcp:docs\` ` +
    'wrote, and lists every server, package, capability, pinned version ' +
    `and command of ${MCP_CATALOG_PATH} plus ${MCP_CONFIG_PATH} and no ` +
    'other; every catalog entry has the area web or mobile, pins an exact ' +
    'version, runs `node scripts/mcp/launch.mjs <its name>`, never `npx`, ' +
    `and names docs that exist; and every ${MCP_CONFIG_PATH} server named ` +
    'like a catalog server, or that runs the launcher, runs it with one ' +
    'catalog name.',
  id: 'verify-mcp-docs',
  notCovered:
    'whether a pin is still the latest release, or old enough for the ' +
    'release-age policy, which only `pnpm mcp:docs` asks the registry; ' +
    'whether the entry is the bin file the pinned release publishes, or ' +
    'is installed, which the session-start check reads; whether a server ' +
    'starts when the launcher imports its entry; whether the prose of the ' +
    'doc still describes what a server does after a release; and a digest ' +
    'recomputed by hand, which review reads in the diff.',
  run: ({ catalog, config, doc, docsPresent }) => {
    const sourceProblems = [
      ...catalog.problems,
      ...config.problems,
      ...missingDocs({ catalog, docsPresent }),
      ...launcherProblems({
        catalog: catalog.servers,
        config: config.servers
      })
    ]
    const { block, findings } = blockFindings({ doc })
    if (block === undefined || catalog.problems.length > 0)
      return [...sourceProblems, ...findings]
    return [
      ...sourceProblems,
      ...differences({
        expected: listServers({
          catalog: catalog.servers,
          config: config.servers
        }),
        rows: block.rows
      })
    ]
  }
})

const main = () => {
  const { values } = parseArgs({
    options: { root: { default: REPO_ROOT, type: 'string' } }
  })
  const context = collectContext({ root: resolve(values.root) })
  const servers = listServers({
    catalog: context.catalog.servers,
    config: context.config.servers
  }).length
  const block =
    context.doc === null ? { rows: [] } : readBlock({ text: context.doc })
  reportGate({
    context,
    denominator:
      `${servers} server(s) of ${SOURCES} against ` +
      `${block.rows?.length ?? 0} row(s) of the generated block`,
    gate
  })
}

if (import.meta.main) main()
