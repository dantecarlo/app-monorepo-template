#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for `pnpm mcp:docs`. Every case builds a throwaway tree in the
// OS temp directory (a catalog, a docs/mcp.md with its markers, the docs the
// catalog names, and a .mcp.json when the case needs one) and drives the
// updater over it with an injected registry fetcher. `fetch` itself throws
// for the whole suite, so a case that reached the network would fail: no
// case touches it.
//
// Usage:
//   node --test scripts/update-mcp-docs.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import {
  BLOCK_START,
  MCP_CATALOG_PATH,
  MCP_CONFIG_PATH,
  MCP_DOC_PATH,
  NOT_ON_NPM,
  PROJECT_CAPABILITY,
  readBlock
} from './mcp-docs.detect.mjs'
import { updateMcpDocs } from './update-mcp-docs.mjs'

const UPDATER = join(
  dirname(fileURLToPath(import.meta.url)),
  'update-mcp-docs.mjs'
)
const FAILED = 1
const PASSED = 0

const DAY_ONE = '2026-11-01'
const DAY_TWO = '2026-11-15'
const NEXT_DOC = 'docs/next.md'
const EXPO_DOC = 'docs/expo.md'
const PROSE_BEFORE = '# MCP servers\n\nHand-written prose.\n\n'
const PROSE_AFTER = '\n\nMore prose after the block.\n'
const EMPTY_BLOCK = `${BLOCK_START}\n<!-- mcp-docs:end -->`
const NO_FETCH = 'the suite reached fetch'

const entry = ({ bin, capability, docs, name, packageName, version }) => ({
  args: [`node_modules/${packageName}/${bin}`],
  capability,
  command: 'node',
  docs,
  entry: bin,
  name,
  package: packageName,
  version
})

const CATALOG = {
  servers: [
    entry({
      bin: 'dist/index.js',
      capability: 'web-next',
      docs: [NEXT_DOC],
      name: 'next-devtools',
      packageName: 'next-devtools-mcp',
      version: '0.3.0'
    }),
    entry({
      bin: 'bin/expo-mcp.mjs',
      capability: 'mobile-expo',
      docs: [EXPO_DOC],
      name: 'expo',
      packageName: 'expo-mcp',
      version: '0.2.0'
    })
  ]
}

const release = ({ published, version }) => ({ published, version })

const REGISTRY_DAY_ONE = {
  'expo-mcp': release({
    published: '2026-10-20T08:00:00.000Z',
    version: '0.2.0'
  }),
  'next-devtools-mcp': release({
    published: '2026-10-01T10:30:00.000Z',
    version: '0.3.0'
  })
}

const REGISTRY_DAY_TWO = {
  ...REGISTRY_DAY_ONE,
  'next-devtools-mcp': release({
    published: '2026-11-10T12:00:00.000Z',
    version: '0.4.0'
  })
}

// A fetcher over a fixed registry, recording each package it was asked
// for; a package the registry lacks fails the way a real 404 does.
const registryOf = ({ packages }) => {
  const asked = []
  const fetchLatest = async ({ packageName }) => {
    asked.push(packageName)
    if (!Object.hasOwn(packages, packageName))
      throw new Error(`404 Not Found: ${packageName}`)
    return packages[packageName]
  }
  return { asked, fetchLatest }
}

const scratchRoots = []

const treeOf = ({ catalog = CATALOG, config, doc }) => {
  const root = mkdtempSync(resolve(tmpdir(), 'mcp-docs-update-'))
  scratchRoots.push(root)
  const files = {
    [EXPO_DOC]: '# Expo\n',
    [MCP_CATALOG_PATH]: JSON.stringify(catalog, null, 2),
    [MCP_DOC_PATH]: doc ?? `${PROSE_BEFORE}${EMPTY_BLOCK}${PROSE_AFTER}`,
    [NEXT_DOC]: '# Next\n',
    ...(config ? { [MCP_CONFIG_PATH]: JSON.stringify(config) } : {})
  }
  Object.entries(files).forEach(([name, text]) => {
    const target = join(root, name)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, text)
  })
  return root
}

const read = ({ path, root }) => readFileSync(join(root, path), 'utf8')

const run = async ({ packages, root, today }) => {
  const lines = { errors: [], out: [] }
  const registry = registryOf({ packages })
  const result = await updateMcpDocs({
    fetchLatest: registry.fetchLatest,
    print: (line) => lines.out.push(line),
    root,
    today,
    warn: (line) => lines.errors.push(line)
  })
  return { ...result, ...lines, asked: registry.asked }
}

const rowsOf = ({ root }) =>
  readBlock({ text: read({ path: MCP_DOC_PATH, root }) }).rows

const rowNamed = ({ name, root }) =>
  rowsOf({ root }).find((row) => row.name === name)

const realFetch = globalThis.fetch

before(() => {
  globalThis.fetch = () => {
    throw new Error(NO_FETCH)
  }
})

after(() => {
  globalThis.fetch = realFetch
  scratchRoots.forEach((root) =>
    rmSync(root, { force: true, recursive: true })
  )
})

test('a new version rewrites the block and prints the review paths', async () => {
  const root = treeOf({})
  await run({ packages: REGISTRY_DAY_ONE, root, today: DAY_ONE })
  const docsBefore = [NEXT_DOC, EXPO_DOC].map((path) =>
    read({ path, root })
  )

  const result = await run({
    packages: REGISTRY_DAY_TWO,
    root,
    today: DAY_TWO
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(rowNamed({ name: 'next-devtools', root }), {
    capability: 'web-next',
    checked: DAY_TWO,
    name: 'next-devtools',
    packageName: 'next-devtools-mcp',
    published: '2026-11-10',
    version: '0.4.0'
  })
  assert.deepEqual(rowNamed({ name: 'expo', root }), {
    capability: 'mobile-expo',
    checked: DAY_ONE,
    name: 'expo',
    packageName: 'expo-mcp',
    published: '2026-10-20',
    version: '0.2.0'
  })
  const doc = read({ path: MCP_DOC_PATH, root })
  assert.ok(doc.startsWith(PROSE_BEFORE), 'the prose before the block')
  assert.ok(doc.endsWith(PROSE_AFTER), 'the prose after the block')
  assert.ok(result.out.includes(`review: ${NEXT_DOC}`), result.out)
  assert.ok(!result.out.includes(`review: ${EXPO_DOC}`), result.out)
  assert.deepEqual(
    [NEXT_DOC, EXPO_DOC].map((path) => read({ path, root })),
    docsBefore
  )
})

test('an unchanged version writes nothing', async () => {
  const root = treeOf({})
  await run({ packages: REGISTRY_DAY_ONE, root, today: DAY_ONE })
  const target = join(root, MCP_DOC_PATH)
  const bytes = readFileSync(target)
  const { mtimeMs } = statSync(target)

  const result = await run({
    packages: REGISTRY_DAY_ONE,
    root,
    today: DAY_TWO
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(readFileSync(target), bytes)
  assert.equal(statSync(target).mtimeMs, mtimeMs)
  assert.ok(
    !result.out.some((line) => line.startsWith('review: ')),
    result.out
  )
  assert.equal(rowNamed({ name: 'expo', root }).checked, DAY_ONE)
})

test('a registry failure leaves the doc byte-identical and exits non-zero', async () => {
  const root = treeOf({})
  await run({ packages: REGISTRY_DAY_ONE, root, today: DAY_ONE })
  const target = join(root, MCP_DOC_PATH)
  const bytes = readFileSync(target)
  const withoutExpo = Object.fromEntries(
    Object.entries(REGISTRY_DAY_TWO).filter(
      ([name]) => name !== 'expo-mcp'
    )
  )

  const result = await run({
    packages: withoutExpo,
    root,
    today: DAY_TWO
  })

  assert.equal(result.code, FAILED)
  assert.deepEqual(readFileSync(target), bytes)
  assert.ok(
    result.errors.some(
      (line) =>
        line.includes('expo (expo-mcp)') &&
        line.includes('registry request failed')
    ),
    result.errors
  )
  assert.ok(
    !result.out.some((line) => line.startsWith('review: ')),
    result.out
  )
  assert.ok(
    result.out.includes(
      'mcp-docs: next-devtools next-devtools-mcp 0.4.0 (was 0.3.0)'
    ),
    result.out
  )
})

test('a .mcp.json server outside the catalog is listed', async () => {
  const root = treeOf({
    config: {
      mcpServers: {
        acme: { args: ['-y', '@acme/mcp-server@latest'], command: 'npx' },
        expo: { args: ['-y', 'expo-mcp'], command: 'npx' }
      }
    }
  })

  const result = await run({
    packages: {
      ...REGISTRY_DAY_ONE,
      '@acme/mcp-server': release({
        published: '2026-09-09T09:09:09.000Z',
        version: '3.1.4'
      })
    },
    root,
    today: DAY_ONE
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.ok(result.asked.includes('@acme/mcp-server'), result.asked)
  assert.deepEqual(rowNamed({ name: 'acme', root }), {
    capability: PROJECT_CAPABILITY,
    checked: DAY_ONE,
    name: 'acme',
    packageName: '@acme/mcp-server',
    published: '2026-09-09',
    version: '3.1.4'
  })
  assert.deepEqual(
    rowsOf({ root }).map(({ name }) => name),
    ['acme', 'expo', 'next-devtools']
  )
})

test('a non-npm command is listed as not on npm', async () => {
  const root = treeOf({
    config: {
      mcpServers: {
        local: { args: ['tools/mcp-server.js'], command: 'node' },
        remote: { type: 'http', url: 'https://mcp.example.com/mcp' }
      }
    }
  })

  const result = await run({
    packages: REGISTRY_DAY_ONE,
    root,
    today: DAY_ONE
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(result.asked.sort(), ['expo-mcp', 'next-devtools-mcp'])
  ;['local', 'remote'].forEach((name) =>
    assert.deepEqual(rowNamed({ name, root }), {
      capability: PROJECT_CAPABILITY,
      checked: null,
      name,
      packageName: null,
      published: null,
      version: null
    })
  )
  assert.match(
    read({ path: MCP_DOC_PATH, root }),
    new RegExp(
      `\\| local +\\| project +\\| — +\\| ${NOT_ON_NPM} +\\|`,
      'u'
    )
  )
})

test('the command exits 1 and requests nothing when the doc has no generated block', () => {
  const doc = `${PROSE_BEFORE}No markers here.${PROSE_AFTER}`
  const root = treeOf({ doc })
  const noNetwork =
    'data:text/javascript,globalThis.fetch=()=>{' +
    `process.stderr.write(${JSON.stringify(NO_FETCH)});` +
    "throw new Error('no network')}"

  const result = spawnSync(
    process.execPath,
    ['--import', noNetwork, UPDATER, '--root', root],
    { encoding: 'utf8' }
  )

  assert.equal(result.status, FAILED, result.stderr)
  assert.match(result.stderr, /has no "<!-- mcp-docs:start/u)
  assert.ok(!result.stderr.includes(NO_FETCH), result.stderr)
  assert.equal(read({ path: MCP_DOC_PATH, root }), doc)
})
