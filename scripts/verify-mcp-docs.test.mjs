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
  entry: 'bin/expo-mcp.mjs',
  name: 'expo',
  packageName: 'expo-mcp',
  version: '0.2.4'
}
const NEXT = {
  capability: 'web-next',
  docs: [MCP_DOC_PATH],
  entry: 'dist/index.js',
  name: 'next-devtools',
  packageName: 'next-devtools-mcp',
  version: '0.4.0'
}
const METRO = {
  capability: 'mobile-expo',
  docs: [MCP_DOC_PATH],
  entry: 'dist/bin/metro-mcp.js',
  name: 'metro',
  packageName: 'metro-mcp',
  version: '0.15.0'
}

const SHADCN = {
  capability: 'ui-kit-shadcn',
  docs: [MCP_DOC_PATH],
  entry: 'dist/index.js',
  name: 'shadcn',
  packageName: 'shadcn',
  serverArgs: ['mcp'],
  version: '4.23.0'
}

const launcherOf = ({ entry, packageName }) =>
  `node_modules/${packageName}/${entry}`

const entryOf = ({
  args,
  capability,
  command = 'node',
  docs,
  entry,
  name,
  packageName,
  serverArgs = [],
  version
}) => ({
  args: args ?? [launcherOf({ entry, packageName }), ...serverArgs],
  capability,
  command,
  docs,
  entry,
  name,
  package: packageName,
  version
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

// `catalogText` and `configText` replace the file built from the entries:
// `null` leaves the catalog out, a string is written as it is.
const treeOf = ({ catalog, catalogText, config, configText, doc }) => {
  const catalogFile =
    catalogText === undefined
      ? JSON.stringify({ servers: catalog.map(entryOf) })
      : catalogText
  const configFile =
    configText ?? (config ? JSON.stringify(config) : undefined)
  return {
    ...(catalogFile === null ? {} : { [MCP_CATALOG_PATH]: catalogFile }),
    [MCP_DOC_PATH]: doc,
    ...(configFile === undefined ? {} : { [MCP_CONFIG_PATH]: configFile })
  }
}

const walk =
  ({ catalog = [EXPO, NEXT], catalogText, config, configText, doc }) =>
  () =>
    withScratchTree({
      files: treeOf({
        catalog,
        catalogText,
        config,
        configText,
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

const NOT_EXACT =
  'which is not an exact version: a catalog version is one release, such ' +
  'as 1\\.2\\.3, never a range, `latest` or a tag'

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
    patterns: [
      /metro is in the catalog but not in the block — run `pnpm mcp:docs`/u
    ]
  },
  {
    context: walk({ catalog: [EXPO] }),
    expected: 1,
    name: 'a block server the catalog no longer has fails',
    patterns: [
      /next-devtools is in the block but neither in the catalog nor in \.mcp\.json/u
    ]
  },
  {
    context: walk({ config: ACME_CONFIG }),
    expected: 2,
    name: 'a .mcp.json server missing from the block fails',
    patterns: [/acme is in \.mcp\.json but not in the block/u]
  },
  {
    context: walk({
      catalog: [{ ...EXPO, packageName: '@expo/mcp' }, NEXT]
    }),
    expected: 1,
    name: 'a package that differs from the catalog fails',
    patterns: [
      /expo: the block names the package expo-mcp, the catalog and \.mcp\.json name @expo\/mcp/u
    ]
  },
  {
    context: walk({
      catalog: [{ ...EXPO, capability: 'mobile-rn' }, NEXT]
    }),
    expected: 1,
    name: 'a capability that differs from the catalog fails',
    patterns: [
      /expo: the block names the capability mobile-expo, the catalog and \.mcp\.json name mobile-rn/u
    ]
  },
  {
    context: walk({
      doc: handEdited({
        edit: (doc) => doc.replace(`| ${OLD_VERSION} `, '| 9.9.9 ')
      })
    }),
    expected: 1,
    name: 'a version edited by hand fails',
    patterns: [
      /the generated block of docs\/mcp\.md was edited by hand: its lines do not match the digest .*run `pnpm mcp:docs`/u
    ]
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
    patterns: [/was edited by hand/u]
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
    patterns: [/has no digest: `pnpm mcp:docs` never wrote it/u]
  },
  {
    context: walk({ doc: '# MCP servers\n\nNo block here.\n' }),
    expected: 1,
    name: 'a doc without the generated block fails',
    patterns: [/docs\/mcp\.md has no "<!-- mcp-docs:start/u]
  },
  {
    context: walk({
      catalog: [
        { ...EXPO, args: ['-y', 'expo-mcp'], command: 'npx' },
        NEXT
      ]
    }),
    expected: 1,
    name: 'a catalog entry that runs npx is refused',
    patterns: [
      /expo runs npx -y expo-mcp; a catalog command never goes through npx: it is `node node_modules\/expo-mcp\/bin\/expo-mcp\.mjs`, then the server's own arguments \(decision 61\)/u
    ]
  },
  {
    context: walk({ catalog: [{ ...EXPO, version: undefined }, NEXT] }),
    expected: 1,
    name: 'a catalog entry with no version is refused',
    patterns: [/mcp-servers\.json: expo has no version$/u]
  },
  {
    context: walk({
      catalog: [
        { ...EXPO, version: '^0.2.4' },
        { ...METRO, version: 'latest' },
        { ...NEXT, version: 'next' }
      ],
      doc: docOf({ rows: [EXPO, METRO, NEXT].map(rowOf) })
    }),
    expected: 3,
    name: 'a catalog version that is a range, latest or a tag is refused',
    patterns: [
      new RegExp(`expo pins \\^0\\.2\\.4, ${NOT_EXACT}`, 'u'),
      new RegExp(`metro pins latest, ${NOT_EXACT}`, 'u'),
      new RegExp(`next-devtools pins next, ${NOT_EXACT}`, 'u')
    ]
  },
  {
    context: walk({
      catalog: [
        { ...EXPO, args: ['node_modules/expo-mcp/dist/index.js'] },
        NEXT
      ]
    }),
    expected: 1,
    name: 'a catalog entry whose first argument does not name its entry is refused',
    patterns: [
      /expo runs node node_modules\/expo-mcp\/dist\/index\.js; a catalog command is `node node_modules\/expo-mcp\/bin\/expo-mcp\.mjs`, its entry first, then the server's own arguments \(decision 61\)/u
    ]
  },
  {
    context: walk({
      catalog: [{ ...EXPO, entry: '../other/index.js' }, NEXT]
    }),
    expected: 1,
    name: 'a catalog entry whose entry leaves its package is refused',
    patterns: [
      /expo names the entry \.\.\/other\/index\.js, which is not a relative path inside its package/u
    ]
  },
  {
    context: walk({ catalog: [{ ...EXPO, command: 'pnpm' }, NEXT] }),
    expected: 1,
    name: 'a catalog npm server whose command is not node is refused',
    patterns: [
      /expo runs pnpm node_modules\/expo-mcp\/bin\/expo-mcp\.mjs; the command of an npm server is `node` \(decision 61\)/u
    ]
  },
  {
    context: walk({
      catalog: [EXPO, NEXT, SHADCN],
      doc: docOf({ rows: [EXPO, NEXT, SHADCN].map(rowOf) })
    }),
    expected: 0,
    name: 'a catalog entry with server args after its entry passes'
  },
  {
    context: walk({
      catalog: [{ ...EXPO, docs: ['docs/gone.md'] }, NEXT]
    }),
    expected: 1,
    name: 'a catalog doc that does not exist is refused',
    patterns: [/expo names the doc docs\/gone\.md, which does not exist/u]
  },
  {
    context: walk({ catalogText: null }),
    expected: 1,
    name: 'a missing catalog is refused',
    patterns: [/^\.agents\/contracts\/mcp-servers\.json is missing$/u]
  },
  {
    context: walk({ catalogText: '{ "servers": [' }),
    expected: 1,
    name: 'a catalog that is not JSON is refused',
    patterns: [
      /^\.agents\/contracts\/mcp-servers\.json is not valid JSON: /u
    ]
  },
  {
    context: walk({ catalogText: '{ "servers": {} }' }),
    expected: 1,
    name: 'a catalog with no servers array is refused',
    patterns: [/mcp-servers\.json has no "servers" array$/u]
  },
  {
    context: walk({
      catalogText: JSON.stringify({ servers: ['expo', entryOf(NEXT)] })
    }),
    expected: 1,
    name: 'a catalog entry that is not an object is refused',
    patterns: [/mcp-servers\.json: entry 0 is not an object$/u]
  },
  {
    context: walk({
      catalog: [{ ...EXPO, capability: undefined, entry: undefined }, NEXT]
    }),
    expected: 1,
    name: 'a catalog entry without its fields is refused',
    patterns: [/mcp-servers\.json: expo has no capability, entry$/u]
  },
  {
    context: walk({
      catalog: [{ ...EXPO, packageName: 'Expo MCP' }, NEXT]
    }),
    expected: 1,
    name: 'a catalog package that is not an npm name is refused',
    patterns: [/expo names Expo MCP, which is not an npm package name$/u]
  },
  {
    context: walk({ catalog: [{ ...EXPO, docs: undefined }, NEXT] }),
    expected: 1,
    name: 'a catalog entry with no docs list is refused',
    patterns: [/expo has no docs list \(an empty list is allowed\)$/u]
  },
  {
    context: walk({ catalog: [EXPO, EXPO, NEXT] }),
    expected: 1,
    name: 'a server listed twice in the catalog is refused',
    patterns: [/mcp-servers\.json: expo is listed more than once$/u]
  },
  {
    context: walk({ configText: '{ "mcpServers": {' }),
    expected: 1,
    name: 'a .mcp.json that is not JSON is refused',
    patterns: [/^\.mcp\.json is not valid JSON: /u]
  },
  {
    context: walk({ configText: '{ "servers": {} }' }),
    expected: 1,
    name: 'a .mcp.json with no mcpServers object is refused',
    patterns: [/^\.mcp\.json has no "mcpServers" object$/u]
  }
]

const detailsOf = (findings) =>
  findings.map((finding) => finding.detail ?? finding).join('\n')

CASES.forEach(({ context, expected, name, patterns = [] }) =>
  test(name, () => {
    const details = detailsOf(gate.run(context()))
    assert.equal(
      details === '' ? 0 : details.split('\n').length,
      expected,
      details
    )
    patterns.forEach((pattern) =>
      assert.ok(
        details.split('\n').some((line) => pattern.test(line)),
        `${pattern} matches no finding:\n${details}`
      )
    )
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
