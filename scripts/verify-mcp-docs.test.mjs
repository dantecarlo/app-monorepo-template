#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for `pnpm verify:mcp-docs`. The template's block is what the
// updater wrote, so these cases are the only evidence the gate can go red.
//
// Each case builds a throwaway tree in the OS temp directory (a catalog,
// docs/mcp.md with a block rendered the way the updater renders it, the docs
// the catalog names, and a .mcp.json when the case needs one) and drives
// the gate's own collector over it. Each case asserts the number of
// findings and what they say. The checks then run the gate as a process,
// prove it makes no network request, and re-run every red case against a
// blinded gate.
//
// Usage:
//   node --test scripts/verify-mcp-docs.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import {
  BLOCK_START,
  MCP_CATALOG_PATH,
  MCP_CONFIG_PATH,
  MCP_DOC_PATH,
  PROJECT_CAPABILITY,
  renderBlock
} from './mcp-docs.detect.mjs'
import { collectContext, gate } from './verify-mcp-docs.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-mcp-docs.mjs'
)
const FAILED = 1
const PASSED = 0

const OLD_VERSION = '0.0.1'
const OLD_DATE = '2025-01-01'

const EXPO = {
  capability: 'mobile-expo',
  docs: [MCP_DOC_PATH],
  name: 'expo',
  packageName: 'expo-mcp'
}
const NEXT = {
  capability: 'web-next',
  docs: [MCP_DOC_PATH],
  name: 'next-devtools',
  packageName: 'next-devtools-mcp'
}
const METRO = {
  capability: 'mobile-expo',
  docs: [MCP_DOC_PATH],
  name: 'metro',
  packageName: 'metro-mcp'
}

const entryOf = ({ args, capability, docs, name, packageName }) => ({
  args: args ?? ['-y', packageName],
  capability,
  command: 'npx',
  docs,
  name,
  package: packageName
})

const rowOf = ({ capability, name, packageName }) => ({
  capability,
  checked: packageName === null ? null : OLD_DATE,
  name,
  packageName,
  published: packageName === null ? null : OLD_DATE,
  version: packageName === null ? null : OLD_VERSION
})

const docOf = ({ eol = '\n', rows }) =>
  ['# MCP servers', '', ...renderBlock({ rows }), ''].join(eol)

const treeOf = ({ catalog, config, doc }) => ({
  [MCP_CATALOG_PATH]: JSON.stringify({ servers: catalog.map(entryOf) }),
  [MCP_DOC_PATH]: doc,
  ...(config ? { [MCP_CONFIG_PATH]: JSON.stringify(config) } : {})
})

const walk =
  ({ catalog = [EXPO, NEXT], config, doc }) =>
  () =>
    withScratchTree({
      files: treeOf({
        catalog,
        config,
        doc: doc ?? docOf({ rows: [EXPO, NEXT].map(rowOf) })
      }),
      prefix: 'mcp-docs-verify-',
      use: ({ root }) => collectContext({ root })
    })

const runGate = ({
  catalog = [EXPO, NEXT],
  doc = docOf({ rows: [EXPO, NEXT].map(rowOf) })
}) =>
  withScratchTree({
    files: treeOf({ catalog, doc }),
    prefix: 'mcp-docs-verify-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

const handEdited = ({ edit }) =>
  edit(docOf({ rows: [EXPO, NEXT].map(rowOf) }))

const ACME_CONFIG = {
  mcpServers: {
    acme: { args: ['-y', 'acme-mcp@latest'], command: 'npx' },
    local: { args: ['tools/server.js'], command: 'node' }
  }
}

const CASES = [
  {
    context: walk({}),
    expected: 0,
    name: 'a block the updater wrote passes, whatever versions it holds'
  },
  {
    context: walk({
      doc: docOf({ eol: '\r\n', rows: [EXPO, NEXT].map(rowOf) })
    }),
    expected: 0,
    name: 'a block checked out with CRLF line endings passes'
  },
  {
    context: walk({
      config: ACME_CONFIG,
      doc: docOf({
        rows: [
          {
            capability: PROJECT_CAPABILITY,
            name: 'acme',
            packageName: 'acme-mcp'
          },
          EXPO,
          {
            capability: PROJECT_CAPABILITY,
            name: 'local',
            packageName: null
          },
          NEXT
        ].map(rowOf)
      })
    }),
    expected: 0,
    name: 'a .mcp.json server the block lists passes, on npm or not'
  },
  {
    context: walk({ catalog: [EXPO, METRO, NEXT] }),
    expected: 1,
    name: 'a catalog server missing from the block fails',
    pattern:
      /metro is in the catalog but not in the block — run `pnpm mcp:docs`/u
  },
  {
    context: walk({ catalog: [EXPO] }),
    expected: 1,
    name: 'a block server the catalog no longer has fails',
    pattern:
      /next-devtools is in the block but neither in the catalog nor in \.mcp\.json/u
  },
  {
    context: walk({ config: ACME_CONFIG }),
    expected: 2,
    name: 'a .mcp.json server missing from the block fails',
    pattern: /acme is in \.mcp\.json but not in the block/u
  },
  {
    context: walk({
      catalog: [{ ...EXPO, packageName: '@expo/mcp' }, NEXT]
    }),
    expected: 1,
    name: 'a package that differs from the catalog fails',
    pattern:
      /expo: the block names the package expo-mcp, the catalog and \.mcp\.json name @expo\/mcp/u
  },
  {
    context: walk({
      catalog: [{ ...EXPO, capability: 'mobile-rn' }, NEXT]
    }),
    expected: 1,
    name: 'a capability that differs from the catalog fails',
    pattern:
      /expo: the block names the capability mobile-expo, the catalog and \.mcp\.json name mobile-rn/u
  },
  {
    context: walk({
      doc: handEdited({
        edit: (doc) => doc.replace(`| ${OLD_VERSION} `, '| 9.9.9 ')
      })
    }),
    expected: 1,
    name: 'a version edited by hand fails',
    pattern:
      /the generated block of docs\/mcp\.md was edited by hand: its lines do not match the digest .*run `pnpm mcp:docs`/u
  },
  {
    context: walk({
      doc: handEdited({
        edit: (doc) =>
          doc.replace(
            '\n| Server',
            '\nNote: expo is flaky on Windows.\n| Server'
          )
      })
    }),
    expected: 1,
    name: 'a line added by hand inside the block fails',
    pattern: /was edited by hand/u
  },
  {
    context: walk({
      doc: [
        '# MCP servers',
        '',
        BLOCK_START,
        '<!-- mcp-docs:end -->'
      ].join('\n')
    }),
    expected: 1,
    name: 'a block the updater never wrote fails',
    pattern: /has no digest: `pnpm mcp:docs` never wrote it/u
  },
  {
    context: walk({ doc: '# MCP servers\n\nNo block here.\n' }),
    expected: 1,
    name: 'a doc without the generated block fails',
    pattern: /docs\/mcp\.md has no "<!-- mcp-docs:start/u
  },
  {
    context: walk({
      catalog: [{ ...EXPO, args: ['-y', 'expo-mcp@0.2.0'] }, NEXT]
    }),
    expected: 1,
    name: 'a catalog entry that pins its version is refused',
    pattern:
      /expo runs npx -y expo-mcp@0\.2\.0; a catalog command is the unpinned `npx -y expo-mcp` \(decision 55\)/u
  },
  {
    context: walk({
      catalog: [{ ...EXPO, docs: ['docs/gone.md'] }, NEXT]
    }),
    expected: 1,
    name: 'a catalog doc that does not exist is refused',
    pattern: /expo names the doc docs\/gone\.md, which does not exist/u
  }
]

const detailsOf = (findings) =>
  findings.map((finding) => finding.detail ?? finding).join('\n')

CASES.forEach(({ context, expected, name, pattern }) =>
  test(name, () => {
    const details = detailsOf(gate.run(context()))
    assert.equal(
      details === '' ? 0 : details.split('\n').length,
      expected,
      details
    )
    if (pattern) assert.match(details, pattern)
  })
)

test('the gate exits 1 and names the server the block is missing', () => {
  const result = runGate({ catalog: [EXPO, METRO, NEXT] })
  assert.equal(result.status, FAILED, result.stderr)
  assert.match(result.stderr, /verify-mcp-docs: 1 problem/u)
  assert.match(
    result.stderr,
    /metro is in the catalog but not in the block/u
  )
})

test('the gate exits 0 over a block the updater wrote and states what it judged', () => {
  const result = runGate({ doc: docOf({ rows: [EXPO, NEXT].map(rowOf) }) })
  assert.equal(result.status, PASSED, result.stderr)
  assert.match(
    result.stdout,
    /verify-mcp-docs: PASS — 2 server\(s\) of the catalog and \.mcp\.json against 2 row\(s\) of the generated block/u
  )
})

test('the gate makes no network request', () => {
  const realFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = (...args) => {
    calls.push(args)
    throw new Error('the gate reached fetch')
  }
  try {
    CASES.forEach(({ context }) => gate.run(context()))
  } finally {
    globalThis.fetch = realFetch
  }
  assert.deepEqual(calls, [])
})

test('every case fails against a blinded gate', () => {
  const red = CASES.filter(({ expected }) => expected > 0)
  const failures = runCases({ cases: red, gate: blindGate({ gate }) })
  assert.equal(failures.length, red.length)
})
