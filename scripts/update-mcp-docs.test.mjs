#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for `pnpm mcp:docs`. Every case builds a throwaway tree in the
// OS temp directory (a catalog, a docs/mcp.md with its markers, the docs the
// catalog names, and a .mcp.json when the case needs one) and drives the
// updater over it with an injected registry fetcher and an injected time.
// `fetch` itself throws for the whole suite, so a case that reached the
// network would fail: no case touches it.
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
import { fetchFromRegistry, updateMcpDocs } from './update-mcp-docs.mjs'

const UPDATER = join(
  dirname(fileURLToPath(import.meta.url)),
  'update-mcp-docs.mjs'
)
const FAILED = 1
const PASSED = 0

const DAY_ONE = '2026-11-01'
const DAY_TWO = '2026-11-15'
const NOON = 'T12:00:00.000Z'
const AT_DAY_ONE = Date.parse(`${DAY_ONE}${NOON}`)
const AT_DAY_TWO = Date.parse(`${DAY_TWO}${NOON}`)
const TWO_DAYS_BEFORE = '2026-11-13T12:00:00.000Z'
const ONE_HOUR_BEFORE = '2026-11-15T11:00:00.000Z'
const NEXT_DOC = 'docs/next.md'
const EXPO_DOC = 'docs/expo.md'
const NEXT_BIN = 'dist/index.js'
const NEXT_NEW_BIN = 'dist/cli.js'
const EXPO_BIN = 'bin/expo-mcp.mjs'
const PROSE_BEFORE = '# MCP servers\n\nHand-written prose.\n\n'
const PROSE_AFTER = '\n\nMore prose after the block.\n'
const EMPTY_BLOCK = `${BLOCK_START}\n<!-- mcp-docs:end -->`
const NO_FETCH = 'the suite reached fetch'

// Written out, never imported: the updater's own constant would hide a
// wrong one.
const LAUNCHER = 'scripts/mcp/launch.mjs'

const launcherCommand = ({ name }) => `node ${LAUNCHER} ${name}`

const entry = ({
  area,
  bin,
  capability,
  docs,
  name,
  packageName,
  version
}) => ({
  area,
  args: [LAUNCHER, name],
  capability,
  command: 'node',
  docs,
  entry: bin,
  name,
  package: packageName,
  version
})

const NEXT_ENTRY = {
  area: 'web',
  bin: NEXT_BIN,
  capability: 'web-next',
  docs: [NEXT_DOC],
  name: 'next-devtools',
  packageName: 'next-devtools-mcp',
  version: '0.3.0'
}

const CATALOG = {
  servers: [
    entry(NEXT_ENTRY),
    entry({
      area: 'mobile',
      bin: EXPO_BIN,
      capability: 'mobile-expo',
      docs: [EXPO_DOC],
      name: 'expo',
      packageName: 'expo-mcp',
      version: '0.2.0'
    })
  ]
}

// A catalog whose next-devtools pin moved to `version` and `bin`.
const repinned = ({ bin, version }) => ({
  servers: [entry({ ...NEXT_ENTRY, bin, version }), CATALOG.servers[1]]
})

const release = ({ entry: file = NEXT_BIN, published, version }) => ({
  entry: file,
  published,
  version
})

// One package as the registry reader returns it: `latest` names one of the
// releases, the last one unless said otherwise.
const packageOf = ({ latest, releases }) => {
  const tagged =
    releases.find(({ version }) => version === latest) ?? releases.at(-1)
  return {
    latest: { published: tagged.published, version: tagged.version },
    releases
  }
}

const EXPO_DAY_ONE = packageOf({
  releases: [
    release({
      entry: EXPO_BIN,
      published: '2026-10-20T08:00:00.000Z',
      version: '0.2.0'
    })
  ]
})
const NEXT_0_3_0 = release({
  published: '2026-10-01T10:30:00.000Z',
  version: '0.3.0'
})

const REGISTRY_DAY_ONE = {
  'expo-mcp': EXPO_DAY_ONE,
  'next-devtools-mcp': packageOf({ releases: [NEXT_0_3_0] })
}

const REGISTRY_DAY_TWO = {
  ...REGISTRY_DAY_ONE,
  'next-devtools-mcp': packageOf({
    releases: [
      NEXT_0_3_0,
      release({
        entry: NEXT_NEW_BIN,
        published: '2026-11-10T12:00:00.000Z',
        version: '0.4.0'
      })
    ]
  })
}

// A fetcher over a fixed registry, recording each package it was asked
// for; a package the registry lacks fails the way a real 404 does.
const registryOf = ({ packages }) => {
  const asked = []
  const fetchPackage = async ({ packageName }) => {
    asked.push(packageName)
    if (!Object.hasOwn(packages, packageName))
      throw new Error(`404 Not Found: ${packageName}`)
    return packages[packageName]
  }
  return { asked, fetchPackage }
}

const scratchRoots = []

const write = ({ path, root, text }) => {
  const target = join(root, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, text)
}

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
  Object.entries(files).forEach(([path, text]) =>
    write({ path, root, text })
  )
  return root
}

const read = ({ path, root }) => readFileSync(join(root, path), 'utf8')

const run = async ({ check, json, now, packages, root }) => {
  const lines = { errors: [], out: [] }
  const registry = registryOf({ packages })
  const result = await updateMcpDocs({
    check,
    fetchPackage: registry.fetchPackage,
    json,
    now,
    print: (line) => lines.out.push(line),
    root,
    warn: (line) => lines.errors.push(line)
  })
  return { ...result, ...lines, asked: registry.asked }
}

const rowsOf = ({ root }) =>
  readBlock({ text: read({ path: MCP_DOC_PATH, root }) }).rows

const rowNamed = ({ name, root }) =>
  rowsOf({ root }).find((row) => row.name === name)

const startsWith = ({ lines, prefix }) =>
  lines.filter((line) => line.startsWith(prefix))

// A tree whose block the updater wrote on day one, with the pins at the
// registry's latest.
const writtenOnDayOne = async () => {
  const root = treeOf({})
  await run({ now: AT_DAY_ONE, packages: REGISTRY_DAY_ONE, root })
  return root
}

const realFetch = globalThis.fetch

before(() => {
  globalThis.fetch = () => {
    throw new Error(NO_FETCH)
  }
})

after(() => {
  globalThis.fetch = realFetch
  scratchRoots.forEach((root) => rmSync(root, { recursive: true }))
})

test('a changed pin rewrites its row and prints the review paths', async () => {
  const root = await writtenOnDayOne()
  const docsBefore = [NEXT_DOC, EXPO_DOC].map((path) =>
    read({ path, root })
  )
  write({
    path: MCP_CATALOG_PATH,
    root,
    text: JSON.stringify(repinned({ bin: NEXT_NEW_BIN, version: '0.4.0' }))
  })

  const result = await run({
    now: AT_DAY_TWO,
    packages: REGISTRY_DAY_TWO,
    root
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(rowNamed({ name: 'next-devtools', root }), {
    capability: 'web-next',
    checked: DAY_TWO,
    command: launcherCommand({ name: 'next-devtools' }),
    latest: '0.4.0',
    name: 'next-devtools',
    packageName: 'next-devtools-mcp',
    published: '2026-11-10',
    version: '0.4.0'
  })
  assert.deepEqual(rowNamed({ name: 'expo', root }), {
    capability: 'mobile-expo',
    checked: DAY_ONE,
    command: launcherCommand({ name: 'expo' }),
    latest: '0.2.0',
    name: 'expo',
    packageName: 'expo-mcp',
    published: '2026-10-20',
    version: '0.2.0'
  })
  const doc = read({ path: MCP_DOC_PATH, root })
  assert.ok(doc.includes('`"next-devtools-mcp": "0.4.0"`'), doc)
  assert.ok(
    doc.includes(`\`${launcherCommand({ name: 'next-devtools' })}\``),
    doc
  )
  assert.ok(doc.startsWith(PROSE_BEFORE), 'the prose before the block')
  assert.ok(doc.endsWith(PROSE_AFTER), 'the prose after the block')
  assert.deepEqual(startsWith({ lines: result.out, prefix: 'review: ' }), [
    `review: ${NEXT_DOC}`
  ])
  assert.deepEqual(
    [NEXT_DOC, EXPO_DOC].map((path) => read({ path, root })),
    docsBefore
  )
})

test('an unchanged version writes nothing', async () => {
  const root = await writtenOnDayOne()
  const target = join(root, MCP_DOC_PATH)
  const bytes = readFileSync(target)
  const { mtimeMs } = statSync(target)

  const result = await run({
    now: AT_DAY_TWO,
    packages: REGISTRY_DAY_ONE,
    root
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(readFileSync(target), bytes)
  assert.equal(statSync(target).mtimeMs, mtimeMs)
  assert.deepEqual(
    startsWith({ lines: result.out, prefix: 'review: ' }),
    []
  )
  assert.deepEqual(startsWith({ lines: result.out, prefix: 'bump: ' }), [])
  assert.equal(rowNamed({ name: 'expo', root }).checked, DAY_ONE)
})

test('a newer release is reported as a pin bump once it is 1,440 minutes old', async () => {
  const root = await writtenOnDayOne()
  const catalogBefore = read({ path: MCP_CATALOG_PATH, root })

  const result = await run({
    now: AT_DAY_TWO,
    packages: {
      ...REGISTRY_DAY_ONE,
      'next-devtools-mcp': packageOf({
        releases: [
          NEXT_0_3_0,
          release({
            entry: NEXT_NEW_BIN,
            published: TWO_DAYS_BEFORE,
            version: '0.3.1'
          })
        ]
      })
    },
    root
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(startsWith({ lines: result.out, prefix: 'bump: ' }), [
    `bump: next-devtools next-devtools-mcp version 0.3.0 -> 0.3.1, entry ${NEXT_BIN} -> ${NEXT_NEW_BIN}`
  ])
  assert.equal(read({ path: MCP_CATALOG_PATH, root }), catalogBefore)
  assert.deepEqual(
    startsWith({ lines: result.out, prefix: 'review: ' }),
    []
  )
  assert.equal(rowNamed({ name: 'next-devtools', root }).version, '0.3.0')
  assert.equal(rowNamed({ name: 'next-devtools', root }).latest, '0.3.1')
})

test('a release younger than 1,440 minutes waits', async () => {
  const root = await writtenOnDayOne()

  const result = await run({
    now: AT_DAY_TWO,
    packages: {
      ...REGISTRY_DAY_ONE,
      'next-devtools-mcp': packageOf({
        releases: [
          NEXT_0_3_0,
          release({ published: TWO_DAYS_BEFORE, version: '0.3.1' }),
          release({ published: ONE_HOUR_BEFORE, version: '0.3.2' })
        ]
      })
    },
    root
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(startsWith({ lines: result.out, prefix: 'bump: ' }), [
    `bump: next-devtools next-devtools-mcp version 0.3.0 -> 0.3.1, entry ${NEXT_BIN} -> ${NEXT_BIN}`
  ])
  assert.deepEqual(startsWith({ lines: result.out, prefix: 'waits: ' }), [
    'waits: next-devtools next-devtools-mcp 0.3.2 is younger than 1,440 minutes; it can be pinned from 2026-11-16T11:00:00.000Z'
  ])
})

test('a new major is never proposed as a bump', async () => {
  const root = await writtenOnDayOne()

  const result = await run({
    now: AT_DAY_TWO,
    packages: {
      ...REGISTRY_DAY_ONE,
      'next-devtools-mcp': packageOf({
        releases: [
          NEXT_0_3_0,
          release({ published: TWO_DAYS_BEFORE, version: '1.0.0' })
        ]
      })
    },
    root
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(startsWith({ lines: result.out, prefix: 'bump: ' }), [])
  assert.deepEqual(startsWith({ lines: result.out, prefix: 'major: ' }), [
    'major: next-devtools next-devtools-mcp 1.0.0 is a new major over 0.3.0; bump it by hand'
  ])
})

test("the registry reader takes the latest dist-tag and each release's bin entry", async () => {
  const urls = []
  const document = {
    'dist-tags': { latest: '1.1.0', next: '2.0.0-beta.1' },
    time: {
      '1.0.0': '2026-09-01T00:00:00.000Z',
      '1.1.0': '2026-10-01T00:00:00.000Z',
      created: '2026-08-01T00:00:00.000Z',
      modified: '2026-10-01T00:00:01.000Z'
    },
    versions: {
      '1.0.0': { bin: './dist/cli.js' },
      '1.1.0': {
        bin: { 'mcp-server': 'dist/server.js', other: 'dist/other.js' }
      }
    }
  }
  const request = async (url) => {
    urls.push(url)
    return { json: async () => document, ok: true }
  }

  const found = await fetchFromRegistry({
    packageName: '@acme/mcp-server',
    request
  })

  assert.deepEqual(urls, ['https://registry.npmjs.org/@acme%2Fmcp-server'])
  assert.deepEqual(found, {
    latest: { published: '2026-10-01T00:00:00.000Z', version: '1.1.0' },
    releases: [
      {
        entry: 'dist/cli.js',
        published: '2026-09-01T00:00:00.000Z',
        version: '1.0.0'
      },
      {
        entry: 'dist/server.js',
        published: '2026-10-01T00:00:00.000Z',
        version: '1.1.0'
      }
    ]
  })
})

test('a registry failure leaves the doc byte-identical and exits non-zero', async () => {
  const root = await writtenOnDayOne()
  const target = join(root, MCP_DOC_PATH)
  const bytes = readFileSync(target)
  const withoutExpo = Object.fromEntries(
    Object.entries(REGISTRY_DAY_TWO).filter(
      ([name]) => name !== 'expo-mcp'
    )
  )

  const result = await run({
    now: AT_DAY_TWO,
    packages: withoutExpo,
    root
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
  assert.deepEqual(
    startsWith({ lines: result.out, prefix: 'review: ' }),
    []
  )
  assert.ok(
    result.out.includes(
      'mcp-docs: next-devtools next-devtools-mcp 0.4.0 (was 0.3.0)'
    ),
    result.out
  )
})

const ACME = packageOf({
  releases: [
    release({
      entry: 'dist/cli.js',
      published: '2026-09-09T09:09:09.000Z',
      version: '3.1.4'
    })
  ]
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
    now: AT_DAY_ONE,
    packages: { ...REGISTRY_DAY_ONE, '@acme/mcp-server': ACME },
    root
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.ok(result.asked.includes('@acme/mcp-server'), result.asked)
  assert.deepEqual(rowNamed({ name: 'acme', root }), {
    capability: PROJECT_CAPABILITY,
    checked: DAY_ONE,
    command: 'npx -y @acme/mcp-server@latest',
    latest: '3.1.4',
    name: 'acme',
    packageName: '@acme/mcp-server',
    published: '2026-09-09',
    version: null
  })
  assert.deepEqual(
    rowsOf({ root }).map(({ name }) => name),
    ['acme', 'expo', 'next-devtools']
  )
})

test('a .mcp.json server launched from node_modules is listed with its package', async () => {
  const root = treeOf({
    config: {
      mcpServers: {
        acme: {
          args: ['node_modules/@acme/mcp-server/dist/cli.js'],
          command: 'node'
        }
      }
    }
  })

  const result = await run({
    now: AT_DAY_ONE,
    packages: { ...REGISTRY_DAY_ONE, '@acme/mcp-server': ACME },
    root
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.ok(result.asked.includes('@acme/mcp-server'), result.asked)
  assert.deepEqual(rowNamed({ name: 'acme', root }), {
    capability: PROJECT_CAPABILITY,
    checked: DAY_ONE,
    command: 'node node_modules/@acme/mcp-server/dist/cli.js',
    latest: '3.1.4',
    name: 'acme',
    packageName: '@acme/mcp-server',
    published: '2026-09-09',
    version: null
  })
  assert.match(
    read({ path: MCP_DOC_PATH, root }),
    /\| acme +\| project +\| `@acme\/mcp-server` +\| — +\| `node node_modules\/@acme\/mcp-server\/dist\/cli\.js` +\| 3\.1\.4 +\|/u
  )
})

test('a .mcp.json server that runs the launcher is listed with its catalog package', async () => {
  const root = treeOf({
    config: {
      mcpServers: {
        'docs-expo': { args: [LAUNCHER, 'expo'], command: 'node' },
        expo: { args: [LAUNCHER, 'expo'], command: 'node' }
      }
    }
  })

  const result = await run({
    now: AT_DAY_ONE,
    packages: REGISTRY_DAY_ONE,
    root
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(
    result.asked.filter((name) => name === 'expo-mcp'),
    ['expo-mcp', 'expo-mcp']
  )
  const expoRow = {
    checked: DAY_ONE,
    command: launcherCommand({ name: 'expo' }),
    latest: '0.2.0',
    packageName: 'expo-mcp',
    published: '2026-10-20'
  }
  assert.deepEqual(rowNamed({ name: 'expo', root }), {
    ...expoRow,
    capability: 'mobile-expo',
    name: 'expo',
    version: '0.2.0'
  })
  assert.deepEqual(rowNamed({ name: 'docs-expo', root }), {
    ...expoRow,
    capability: PROJECT_CAPABILITY,
    name: 'docs-expo',
    version: null
  })
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
    now: AT_DAY_ONE,
    packages: REGISTRY_DAY_ONE,
    root
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(result.asked.sort(), ['expo-mcp', 'next-devtools-mcp'])
  assert.deepEqual(
    ['local', 'remote'].map((name) => rowNamed({ name, root })),
    [
      { command: 'node tools/mcp-server.js', name: 'local' },
      { command: null, name: 'remote' }
    ].map(({ command, name }) => ({
      capability: PROJECT_CAPABILITY,
      checked: null,
      command,
      latest: null,
      name,
      packageName: null,
      published: null,
      version: null
    }))
  )
  assert.match(
    read({ path: MCP_DOC_PATH, root }),
    new RegExp(
      `\\| local +\\| project +\\| — +\\| — +\\| \`node tools/mcp-server\\.js\` +\\| ${NOT_ON_NPM} +\\|`,
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

// The update mode as it was before `--check` and `--json`: every line it
// prints, on stdout and stderr, and its exit code, over a first write, a
// run that finds nothing new, a failed request and a release.
test('the update mode prints the lines and exit codes it printed before --check', async () => {
  const root = treeOf({
    config: {
      mcpServers: {
        local: { args: ['tools/mcp-server.js'], command: 'node' }
      }
    }
  })
  const withoutExpo = Object.fromEntries(
    Object.entries(REGISTRY_DAY_TWO).filter(
      ([name]) => name !== 'expo-mcp'
    )
  )
  const notOnNpm = 'mcp-docs: local is not on npm; no version to check'
  const bump =
    'bump: next-devtools next-devtools-mcp version 0.3.0 -> 0.4.0, ' +
    `entry ${NEXT_BIN} -> ${NEXT_NEW_BIN}`
  const steps = [
    {
      code: PASSED,
      errors: [],
      now: AT_DAY_ONE,
      out: [
        'mcp-docs: expo expo-mcp 0.2.0 (new in the block)',
        `review: ${EXPO_DOC}`,
        notOnNpm,
        'mcp-docs: next-devtools next-devtools-mcp 0.3.0 (new in the block)',
        `review: ${NEXT_DOC}`,
        `mcp-docs: wrote the generated block of ${MCP_DOC_PATH}`
      ],
      packages: REGISTRY_DAY_ONE
    },
    {
      code: PASSED,
      errors: [],
      now: AT_DAY_TWO,
      out: [
        'mcp-docs: expo expo-mcp 0.2.0 (unchanged)',
        notOnNpm,
        'mcp-docs: next-devtools next-devtools-mcp 0.3.0 (unchanged)',
        `mcp-docs: no server changed; ${MCP_DOC_PATH} left as it was`
      ],
      packages: REGISTRY_DAY_ONE
    },
    {
      code: FAILED,
      errors: [
        'mcp-docs: expo (expo-mcp): the registry request failed: 404 Not Found: expo-mcp',
        `mcp-docs: ${MCP_DOC_PATH} left as it was`
      ],
      now: AT_DAY_TWO,
      out: [
        notOnNpm,
        'mcp-docs: next-devtools next-devtools-mcp 0.4.0 (was 0.3.0)',
        bump
      ],
      packages: withoutExpo
    },
    {
      code: PASSED,
      errors: [],
      now: AT_DAY_TWO,
      out: [
        'mcp-docs: expo expo-mcp 0.2.0 (unchanged)',
        notOnNpm,
        'mcp-docs: next-devtools next-devtools-mcp 0.4.0 (was 0.3.0)',
        bump,
        `mcp-docs: wrote the generated block of ${MCP_DOC_PATH}`
      ],
      packages: REGISTRY_DAY_TWO
    }
  ]

  for (const { code, errors, now, out, packages } of steps) {
    const result = await run({ now, packages, root })
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
const NEXT_BUMP =
  'bump: next-devtools next-devtools-mcp version 0.3.0 -> 0.4.0, ' +
  `entry ${NEXT_BIN} -> ${NEXT_NEW_BIN}`

// The bytes and the modification time of the doc, to prove a run wrote
// nothing.
const docState = ({ root }) => {
  const target = join(root, MCP_DOC_PATH)
  return { bytes: readFileSync(target), mtimeMs: statSync(target).mtimeMs }
}

const isReview = (line) => line.startsWith('review: ')

test('--check over a current block exits 0 and writes nothing', async () => {
  const root = await writtenOnDayOne()
  const before = docState({ root })

  const result = await run({
    check: true,
    now: AT_DAY_TWO,
    packages: REGISTRY_DAY_ONE,
    root
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
  const root = await writtenOnDayOne()
  const before = docState({ root })

  const result = await run({
    check: true,
    now: AT_DAY_TWO,
    packages: REGISTRY_DAY_TWO,
    root
  })

  assert.equal(result.code, OUTDATED, result.errors.join('\n'))
  assert.deepEqual(docState({ root }), before)
  assert.deepEqual(result.out, [
    'mcp-docs: expo expo-mcp 0.2.0 (unchanged)',
    'mcp-docs: next-devtools next-devtools-mcp 0.4.0 (was 0.3.0)',
    NEXT_BUMP,
    OUTDATED_LINE
  ])
  assert.ok(!result.out.some(isReview), result.out)
  assert.deepEqual(result.errors, [])
})

test('--check exits 1 and writes nothing when a registry request fails', async () => {
  const root = await writtenOnDayOne()
  const before = docState({ root })

  const result = await run({
    check: true,
    now: AT_DAY_TWO,
    packages: {
      'next-devtools-mcp': REGISTRY_DAY_TWO['next-devtools-mcp']
    },
    root
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
        local: { args: ['tools/mcp-server.js'], command: 'node' }
      }
    }
  })
  await run({ now: AT_DAY_ONE, packages: REGISTRY_DAY_ONE, root })
  write({
    path: MCP_CATALOG_PATH,
    root,
    text: JSON.stringify(repinned({ bin: NEXT_NEW_BIN, version: '0.4.0' }))
  })

  const result = await run({
    json: true,
    now: AT_DAY_TWO,
    packages: REGISTRY_DAY_TWO,
    root
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.equal(result.out.length, 1, result.out)
  assert.deepEqual(JSON.parse(result.out[0]), {
    bumps: [],
    mode: 'update',
    problems: [],
    review: [NEXT_DOC],
    servers: [
      {
        change: 'unchanged',
        from: '0.2.0',
        latest: '0.2.0',
        name: 'expo',
        package: 'expo-mcp',
        version: '0.2.0'
      },
      {
        change: NOT_ON_NPM,
        from: null,
        latest: null,
        name: 'local',
        package: null,
        version: null
      },
      {
        change: 'released',
        from: '0.3.0',
        latest: '0.4.0',
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
  const root = await writtenOnDayOne()
  const before = docState({ root })

  const outdated = await run({
    check: true,
    json: true,
    now: AT_DAY_TWO,
    packages: REGISTRY_DAY_TWO,
    root
  })
  const failed = await run({
    check: true,
    json: true,
    now: AT_DAY_TWO,
    packages: {},
    root
  })

  assert.equal(outdated.code, OUTDATED, outdated.errors.join('\n'))
  assert.deepEqual(docState({ root }), before)
  assert.equal(outdated.out.length, 1, outdated.out)
  const plan = JSON.parse(outdated.out[0])
  assert.equal(plan.mode, 'check')
  assert.equal(plan.status, 'outdated')
  assert.deepEqual(plan.writes, [MCP_DOC_PATH])
  assert.deepEqual(plan.review, [])
  assert.deepEqual(plan.bumps, [NEXT_BUMP])
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
// the registry does: its `latest` dist-tag, every release's publish time
// and each release's bin.
const registryModule = ({ packages }) =>
  'data:text/javascript,' +
  encodeURIComponent(
    `const packages = ${JSON.stringify(packages)};` +
      'globalThis.fetch = async (url) => {' +
      "const name = decodeURIComponent(String(url).split('/').slice(3).join('/'));" +
      'const found = packages[name];' +
      "if (!found) return { ok: false, status: 404, statusText: 'Not Found' };" +
      'return { ok: true, json: async () => ({' +
      "'dist-tags': { latest: found.latest.version }," +
      'time: Object.fromEntries(found.releases.map((r) => [r.version, r.published])),' +
      'versions: Object.fromEntries(found.releases.map((r) => [r.version, { bin: r.entry }]))' +
      '}) };' +
      '};'
  )

test('the command exits 2 under --check and 0 without it over the same out-of-date doc', async () => {
  const root = await writtenOnDayOne()
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
  assert.equal(rowNamed({ name: 'next-devtools', root }).latest, '0.4.0')
})
