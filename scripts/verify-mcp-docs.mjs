#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-mcp-docs — the generated block of docs/mcp.md lists what the MCP
// catalog and the project's .mcp.json hold, as `pnpm mcp:docs` wrote it.
//
// It reads the catalog (.agents/contracts/mcp-servers.json), .mcp.json when
// one exists, and docs/mcp.md, and fails:
//   - a malformed catalog: an entry without its fields, a command that is
//     not the unpinned `npx -y <package>` (decision 55), a doc that does
//     not exist; or a .mcp.json that does not parse;
//   - a block that is missing, or that differs from what the updater wrote:
//     its end marker carries a digest of its lines, so a value or a line
//     typed by hand fails; `pnpm mcp:docs` rewrites it;
//   - a server, a package or a capability that differs between the block
//     and the catalog plus .mcp.json.
//
// Versions are informational: the gate never judges whether one is the
// latest, and it makes no network request. Only `pnpm mcp:docs` asks the
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
      return [
        ['package', 'packageName'],
        ['capability', 'capability']
      ]
        .filter(([, field]) => row[field] !== server[field])
        .map(
          ([label, field]) =>
            `${server.name}: the block names the ${label} ${row[field] ?? '—'}, ` +
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
    `wrote, and lists every server, package and capability of ${MCP_CATALOG_PATH} ` +
    `plus ${MCP_CONFIG_PATH} and no other; every catalog entry is the ` +
    'unpinned `npx -y <package>` and names docs that exist.',
  id: 'verify-mcp-docs',
  notCovered:
    'whether a recorded version is still the latest, which only ' +
    '`pnpm mcp:docs` asks the registry; whether the prose of the doc ' +
    'still describes what a server does after a release; and a digest ' +
    'recomputed by hand, which review reads in the diff.',
  run: ({ catalog, config, doc, docsPresent }) => {
    const sourceProblems = [
      ...catalog.problems,
      ...config.problems,
      ...missingDocs({ catalog, docsPresent })
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
