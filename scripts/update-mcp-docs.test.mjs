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

const entry = ({ capability, docs, name, packageName }) => ({
  args: ['-y', packageName],
  capability,
  command: 'npx',
  docs,
  name,
  package: packageName
})

const CATALOG = {
  servers: [
    entry({
      capability: 'web-next',
      docs: [NEXT_DOC],
      name: 'next-devtools',
      packageName: 'next-devtools-mcp'
    }),
    entry({
      capability: 'mobile-expo',
      docs: [EXPO_DOC],
      name: 'expo',
      packageName: 'expo-mcp'
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

const run = async ({ check, json, packages, root, today }) => {
  const lines = { errors: [], out: [] }
  const registry = registryOf({ packages })
  const result = await updateMcpDocs({
    check,
    fetchLatest: registry.fetchLatest,
    json,
    print: (line) => lines.out.push(line),
    root,
    today,
    warn: (line) => lines.errors.push(line)
  })
  return { ...result, ...lines, asked: registry.asked }
}

// The bytes and the modification time of the doc, to prove a run wrote
// nothing.
const docState = ({ root }) => {
  const target = join(root, MCP_DOC_PATH)
  return { bytes: readFileSync(target), mtimeMs: statSync(target).mtimeMs }
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

// The update mode as it was before `--check` and `--json`: every line it
// prints, on stdout and stderr, and its exit code, over a first write, a
// run that finds nothing new, a release and a failed request.
test('the update mode prints the lines and exit codes it printed before --check', async () => {
  const root = treeOf({
    config: {
      mcpServers: {
        expo: { args: ['-y', 'expo-mcp'], command: 'npx' },
        local: { args: ['tools/mcp-server.js'], command: 'node' },
        'next-devtools': {
          args: ['-y', 'next-devtools-mcp'],
          command: 'npx'
        }
      }
    }
  })
  const withoutExpo = Object.fromEntries(
    Object.entries(REGISTRY_DAY_TWO).filter(
      ([name]) => name !== 'expo-mcp'
    )
  )
  const notOnNpm = 'mcp-docs: local is not on npm; no version to check'
  const steps = [
    {
      code: PASSED,
      errors: [],
      out: [
        'mcp-docs: expo expo-mcp 0.2.0 (new in the block)',
        `review: ${EXPO_DOC}`,
        notOnNpm,
        'mcp-docs: next-devtools next-devtools-mcp 0.3.0 (new in the block)',
        `review: ${NEXT_DOC}`,
        `mcp-docs: wrote the generated block of ${MCP_DOC_PATH}`
      ],
      packages: REGISTRY_DAY_ONE,
      today: DAY_ONE
    },
    {
      code: PASSED,
      errors: [],
      out: [
        'mcp-docs: expo expo-mcp 0.2.0 (unchanged)',
        notOnNpm,
        'mcp-docs: next-devtools next-devtools-mcp 0.3.0 (unchanged)',
        `mcp-docs: no server changed; ${MCP_DOC_PATH} left as it was`
      ],
      packages: REGISTRY_DAY_ONE,
      today: DAY_TWO
    },
    {
      code: FAILED,
      errors: [
        'mcp-docs: expo (expo-mcp): the registry request failed: 404 Not Found: expo-mcp',
        `mcp-docs: ${MCP_DOC_PATH} left as it was`
      ],
      out: [
        notOnNpm,
        'mcp-docs: next-devtools next-devtools-mcp 0.4.0 (was 0.3.0)'
      ],
      packages: withoutExpo,
      today: DAY_TWO
    },
    {
      code: PASSED,
      errors: [],
      out: [
        'mcp-docs: expo expo-mcp 0.2.0 (unchanged)',
        notOnNpm,
        'mcp-docs: next-devtools next-devtools-mcp 0.4.0 (was 0.3.0)',
        `review: ${NEXT_DOC}`,
        `mcp-docs: wrote the generated block of ${MCP_DOC_PATH}`
      ],
      packages: REGISTRY_DAY_TWO,
      today: DAY_TWO
    }
  ]

  for (const { code, errors, out, packages, today } of steps) {
    const result = await run({ packages, root, today })
    assert.deepEqual(
      { code: result.code, errors: result.errors, out: result.out },
      { code, errors, out }
    )
  }
})

const OUTDATED = 2
const CURRENT_LINE = `mcp-docs: no server changed; ${MCP_DOC_PATH} is current`
const OUTDATED_LINE =
  `mcp-docs: out of date; \`pnpm mcp:docs\` would rewrite the generated block of ${MCP_DOC_PATH} ` +
  '(--check writes nothing)'

const isReview = (line) => line.startsWith('review: ')

test('--check over a current block exits 0 and writes nothing', async () => {
  const root = treeOf({})
  await run({ packages: REGISTRY_DAY_ONE, root, today: DAY_ONE })
  const before = docState({ root })

  const result = await run({
    check: true,
    packages: REGISTRY_DAY_ONE,
    root,
    today: DAY_TWO
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(docState({ root }), before)
  assert.deepEqual(result.out, [
    'mcp-docs: expo expo-mcp 0.2.0 (unchanged)',
    'mcp-docs: next-devtools next-devtools-mcp 0.3.0 (unchanged)',
    CURRENT_LINE
  ])
  assert.deepEqual(result.errors, [])
})

test('--check over an out-of-date block exits 2 and writes nothing', async () => {
  const root = treeOf({})
  await run({ packages: REGISTRY_DAY_ONE, root, today: DAY_ONE })
  const before = docState({ root })

  const result = await run({
    check: true,
    packages: REGISTRY_DAY_TWO,
    root,
    today: DAY_TWO
  })

  assert.equal(result.code, OUTDATED, result.errors.join('\n'))
  assert.deepEqual(docState({ root }), before)
  assert.deepEqual(result.out, [
    'mcp-docs: expo expo-mcp 0.2.0 (unchanged)',
    'mcp-docs: next-devtools next-devtools-mcp 0.4.0 (was 0.3.0)',
    OUTDATED_LINE
  ])
  assert.ok(!result.out.some(isReview), result.out)
  assert.deepEqual(result.errors, [])
})

test('--check exits 1 and writes nothing when a registry request fails', async () => {
  const root = treeOf({})
  await run({ packages: REGISTRY_DAY_ONE, root, today: DAY_ONE })
  const before = docState({ root })

  const result = await run({
    check: true,
    packages: { 'next-devtools-mcp': REGISTRY_DAY_TWO['next-devtools-mcp'] },
    root,
    today: DAY_TWO
  })

  assert.equal(result.code, FAILED)
  assert.deepEqual(docState({ root }), before)
  assert.deepEqual(result.errors, [
    'mcp-docs: expo (expo-mcp): the registry request failed: 404 Not Found: expo-mcp',
    `mcp-docs: ${MCP_DOC_PATH} left as it was`
  ])
  assert.ok(!result.out.some(isReview), result.out)
})

test('--json prints the run as one JSON document', async () => {
  const root = treeOf({
    config: {
      mcpServers: {
        expo: { args: ['-y', 'expo-mcp'], command: 'npx' },
        local: { args: ['tools/mcp-server.js'], command: 'node' },
        'next-devtools': {
          args: ['-y', 'next-devtools-mcp'],
          command: 'npx'
        }
      }
    }
  })
  await run({ packages: REGISTRY_DAY_ONE, root, today: DAY_ONE })

  const result = await run({
    json: true,
    packages: REGISTRY_DAY_TWO,
    root,
    today: DAY_TWO
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.equal(result.out.length, 1, result.out)
  assert.deepEqual(JSON.parse(result.out[0]), {
    mode: 'update',
    problems: [],
    review: [NEXT_DOC],
    servers: [
      {
        change: 'unchanged',
        from: '0.2.0',
        name: 'expo',
        package: 'expo-mcp',
        version: '0.2.0'
      },
      {
        change: NOT_ON_NPM,
        from: null,
        name: 'local',
        package: null,
        version: null
      },
      {
        change: 'released',
        from: '0.3.0',
        name: 'next-devtools',
        package: 'next-devtools-mcp',
        version: '0.4.0'
      }
    ],
    status: 'updated',
    updater: 'mcp-docs',
    writes: [MCP_DOC_PATH]
  })
  assert.equal(rowNamed({ name: 'next-devtools', root }).version, '0.4.0')
  assert.deepEqual(result.errors, [])
})

test('--json with --check prints the plan and writes nothing', async () => {
  const root = treeOf({})
  await run({ packages: REGISTRY_DAY_ONE, root, today: DAY_ONE })
  const before = docState({ root })

  const outdated = await run({
    check: true,
    json: true,
    packages: REGISTRY_DAY_TWO,
    root,
    today: DAY_TWO
  })
  const failed = await run({
    check: true,
    json: true,
    packages: {},
    root,
    today: DAY_TWO
  })

  assert.equal(outdated.code, OUTDATED, outdated.errors.join('\n'))
  assert.deepEqual(docState({ root }), before)
  assert.equal(outdated.out.length, 1, outdated.out)
  const plan = JSON.parse(outdated.out[0])
  assert.equal(plan.mode, 'check')
  assert.equal(plan.status, 'outdated')
  assert.deepEqual(plan.writes, [MCP_DOC_PATH])
  assert.deepEqual(plan.review, [NEXT_DOC])
  assert.deepEqual(plan.problems, [])

  assert.equal(failed.code, FAILED)
  assert.equal(failed.out.length, 1, failed.out)
  const refused = JSON.parse(failed.out[0])
  assert.equal(refused.status, 'failed')
  assert.deepEqual(refused.writes, [])
  assert.deepEqual(refused.review, [])
  assert.equal(refused.problems.length, 2, refused.problems)
})

// A `fetch` for a child process that answers each package of `packages` as
// the registry does, with its `latest` dist-tag and its publish time.
const registryModule = ({ packages }) =>
  'data:text/javascript,' +
  encodeURIComponent(
    `const packages = ${JSON.stringify(packages)};` +
      'globalThis.fetch = async (url) => {' +
      "const name = decodeURIComponent(String(url).split('/').slice(3).join('/'));" +
      'const found = packages[name];' +
      "if (!found) return { ok: false, status: 404, statusText: 'Not Found' };" +
      'return { ok: true, json: async () => ({' +
      "'dist-tags': { latest: found.version }," +
      'time: { [found.version]: found.published } }) };' +
      '};'
  )

test('the command exits 2 under --check and 0 without it over the same out-of-date doc', async () => {
  const root = treeOf({})
  await run({ packages: REGISTRY_DAY_ONE, root, today: DAY_ONE })
  const before = docState({ root })
  const command = ({ flags }) =>
    spawnSync(
      process.execPath,
      [
        '--import',
        registryModule({ packages: REGISTRY_DAY_TWO }),
        UPDATER,
        '--root',
        root,
        ...flags
      ],
      { encoding: 'utf8' }
    )

  const checked = command({ flags: ['--check'] })
  const afterCheck = docState({ root })
  const updated = command({ flags: [] })

  assert.equal(checked.status, OUTDATED, checked.stderr)
  assert.ok(checked.stdout.includes(OUTDATED_LINE), checked.stdout)
  assert.deepEqual(afterCheck, before)
  assert.equal(updated.status, PASSED, updated.stderr)
  assert.ok(
    updated.stdout.includes(
      `mcp-docs: wrote the generated block of ${MCP_DOC_PATH}`
    ),
    updated.stdout
  )
  assert.equal(rowNamed({ name: 'next-devtools', root }).version, '0.4.0')
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
