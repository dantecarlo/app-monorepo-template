#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for scripts/mcp/launch.mjs, the command every catalog MCP server
// runs. The area gate is checked as a pure function; the launcher itself
// runs as a process over a scratch tree that holds a copy of it, of the
// catalog reader it imports, a catalog and, when the case needs one, an
// installed fixture entry that records its argv and its pid. The committed
// catalog is read for each server's entry path, and every server is run
// against a scratch copy that installed none of them: no real server is
// ever started, since the template installs none.
//
// Usage:
//   node --test scripts/mcp/launch.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, isAbsolute, join, resolve, sep } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { parseCatalog } from '../mcp-docs.detect.mjs'
import { entryPathOf, startsIn } from './launch.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..')
const CATALOG = '.agents/contracts/mcp-servers.json'
const LAUNCHER = 'scripts/mcp/launch.mjs'
const DETECTOR = 'scripts/mcp-docs.detect.mjs'
const EXIT_OK = 0
const EXIT_FAILED = 1
const PROCESS_GUARD_MS = 20_000

const FIXTURE = {
  area: 'mobile',
  args: [LAUNCHER, 'fixture'],
  capability: 'mobile-expo',
  command: 'node',
  docs: [],
  entry: 'bin/server.mjs',
  name: 'fixture',
  package: 'fixture-mcp',
  serverArgs: ['mcp', '--stdio'],
  version: '1.0.0'
}
const FIXTURE_ENTRY = join(
  'node_modules',
  'fixture-mcp',
  'bin',
  'server.mjs'
)
// The fixture server: it records what it ran with, then ends.
const FIXTURE_SOURCE = [
  "import { writeFileSync } from 'node:fs'",
  'writeFileSync(',
  '  process.env.FIXTURE_RECORD,',
  '  JSON.stringify({ argv: process.argv, pid: process.pid })',
  ')'
].join('\n')

const scratchRoots = []
after(() =>
  scratchRoots.forEach((root) => rmSync(root, { recursive: true }))
)

const write = ({ path, root, text }) => {
  const target = join(root, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, text)
}

// A scratch tree holding the launcher and the reader it imports, copied
// from this checkout, and `catalog` as its catalog text.
const treeOf = ({ catalog, installed = false }) => {
  const root = mkdtempSync(join(tmpdir(), 'mcp-launch-test-'))
  scratchRoots.push(root)
  ;[LAUNCHER, DETECTOR].forEach((path) => {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    copyFileSync(join(REPO_ROOT, path), join(root, path))
  })
  write({ path: CATALOG, root, text: catalog })
  if (installed) write({ path: FIXTURE_ENTRY, root, text: FIXTURE_SOURCE })
  return root
}

const fixtureTree = ({ installed = true } = {}) =>
  treeOf({
    catalog: JSON.stringify({ servers: [FIXTURE] }),
    installed
  })

// The environment of this process, without ATL_MCP_AREA unless `area`
// names it.
const envOf = ({ area, record }) => {
  const env = { ...process.env, FIXTURE_RECORD: record }
  delete env.ATL_MCP_AREA
  return area === undefined ? env : { ...env, ATL_MCP_AREA: area }
}

const launch = ({ area, extra = [], name, record = '', root }) =>
  spawnSync(process.execPath, [join(root, LAUNCHER), name, ...extra], {
    cwd: root,
    encoding: 'utf8',
    env: envOf({ area, record }),
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: PROCESS_GUARD_MS
  })

const stderrLines = ({ run }) =>
  run.stderr.split(/\r?\n/u).filter((line) => line !== '')

const committedServers = () =>
  parseCatalog({ text: readFileSync(join(REPO_ROOT, CATALOG), 'utf8') })
    .servers

test('the area gate starts a server when ATL_MCP_AREA is unset, empty or names its area, and holds it otherwise', () => {
  ;[undefined, '', '  ', 'web', 'web,mobile', ' Web , mobile '].forEach(
    (value) =>
      assert.equal(
        startsIn({ area: 'web', value }),
        true,
        `ATL_MCP_AREA=${JSON.stringify(value)} holds a web server`
      )
  )
  ;['mobile', 'none', 'mobile,none'].forEach((value) =>
    assert.equal(
      startsIn({ area: 'web', value }),
      false,
      `ATL_MCP_AREA=${JSON.stringify(value)} starts a web server`
    )
  )
})

test('the area gate holds every server for a list of unknown words, and starts all for separators alone', () => {
  for (const value of ['desktop', 'we b', 'mobile;web'])
    assert.equal(startsIn({ area: 'web', value }), false, value)
  for (const value of [',', ' ', ' , '])
    assert.equal(startsIn({ area: 'mobile', value }), true, value)
})

test('an unknown area in ATL_MCP_AREA is named on stderr with the valid ones, and the gate decides as before', () => {
  const root = fixtureTree()
  const record = join(root, 'record.json')
  const unknown =
    'mcp-launch: ATL_MCP_AREA names the unknown area(s) desktop, we b; ' +
    'the areas are web, mobile and none'

  const held = launch({
    area: 'desktop,we b',
    name: 'fixture',
    record,
    root
  })

  assert.equal(held.status, EXIT_OK, held.stderr)
  assert.deepEqual(stderrLines({ run: held }), [
    unknown,
    'mcp-launch: fixture not started: its area is mobile, and ATL_MCP_AREA is desktop,we b'
  ])
  assert.equal(existsSync(record), false, 'the fixture entry ran')

  const started = launch({
    area: 'Mobile,desktop',
    name: 'fixture',
    record,
    root
  })

  assert.equal(started.status, EXIT_OK, started.stderr)
  assert.deepEqual(stderrLines({ run: started }), [
    'mcp-launch: ATL_MCP_AREA names the unknown area(s) desktop; the areas ' +
      'are web, mobile and none'
  ])
  assert.equal(JSON.parse(readFileSync(record, 'utf8')).pid, started.pid)
})

test('a server outside ATL_MCP_AREA exits 0 at once with one line naming it and its area', () => {
  const root = fixtureTree()
  const record = join(root, 'record.json')

  const run = launch({ area: 'web', name: 'fixture', record, root })

  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.deepEqual(stderrLines({ run }), [
    'mcp-launch: fixture not started: its area is mobile, and ATL_MCP_AREA is web'
  ])
  assert.equal(run.stdout, '')
  assert.equal(existsSync(record), false, 'the fixture entry ran')
})

test("the launcher imports the pinned entry in its own process with the server's argv", () => {
  const root = fixtureTree()
  const record = join(root, 'record.json')

  const run = launch({
    extra: ['--dev-server-url', 'http://localhost:8081'],
    name: 'fixture',
    record,
    root
  })

  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(run.stderr, '')
  const seen = JSON.parse(readFileSync(record, 'utf8'))
  assert.deepEqual(seen.argv, [
    process.execPath,
    join(root, FIXTURE_ENTRY),
    'mcp',
    '--stdio',
    '--dev-server-url',
    'http://localhost:8081'
  ])
  assert.equal(seen.pid, run.pid, 'the entry ran in another process')
})

test('the launcher starts a server whose area ATL_MCP_AREA names', () => {
  const root = fixtureTree()
  const record = join(root, 'record.json')

  const run = launch({ area: 'web,mobile', name: 'fixture', record, root })

  assert.equal(run.status, EXIT_OK, run.stderr)
  assert.equal(JSON.parse(readFileSync(record, 'utf8')).pid, run.pid)
})

test('every catalog server resolves to its entry file inside its package', () => {
  const root = mkdtempSync(join(tmpdir(), 'mcp-launch-shape-'))
  scratchRoots.push(root)
  const servers = committedServers()
  assert.ok(servers.length > 0, 'the committed catalog lists no server')
  servers.forEach((server) => {
    const path = entryPathOf({ root, server })
    const packageDir = join(root, 'node_modules', server.packageName)
    assert.ok(isAbsolute(path), `${server.name}: ${path} is not absolute`)
    assert.ok(
      path.startsWith(`${packageDir}${sep}`),
      `${server.name}: ${path} is not inside ${packageDir}`
    )
    assert.equal(path, join(packageDir, ...server.entry.split('/')))
  })
})

test('an unknown server name exits 1, naming it and the command to run', () => {
  const root = treeOf({
    catalog: readFileSync(join(REPO_ROOT, CATALOG), 'utf8')
  })

  const run = launch({ name: 'no-such-server', root })

  assert.equal(run.status, EXIT_FAILED, run.stderr)
  assert.deepEqual(stderrLines({ run }), [
    'mcp-launch: no-such-server is not a server of ' +
      '.agents/contracts/mcp-servers.json; run `pnpm verify:mcp-docs` to see why'
  ])
})

test('a server whose entry is not installed exits 1, naming it and pnpm install', () => {
  const root = treeOf({
    catalog: readFileSync(join(REPO_ROOT, CATALOG), 'utf8')
  })
  committedServers().forEach((server) => {
    const run = launch({ name: server.name, root })
    assert.equal(run.status, EXIT_FAILED, `${server.name}: ${run.stderr}`)
    assert.deepEqual(stderrLines({ run }), [
      `mcp-launch: ${server.name} cannot start: ` +
        `node_modules/${server.packageName}/${server.entry} is not ` +
        'installed; run `pnpm install`'
    ])
  })
})

test('the root package runs this suite from validate', () => {
  const { scripts } = JSON.parse(
    readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')
  )
  assert.equal(
    scripts['mcp:launch:test'],
    'node --test scripts/mcp/*.test.mjs'
  )
  // validate runs the gate registry, so the suite is one of its steps, and
  // one the standard profile, the one CI runs, runs.
  const { steps } = JSON.parse(
    readFileSync(join(REPO_ROOT, '.agents/contracts/gates.json'), 'utf8')
  )
  assert.ok(
    steps.some(
      ({ id, profile }) =>
        id === 'mcp:launch:test' && profile === 'standard'
    ),
    'no standard step of .agents/contracts/gates.json runs mcp:launch:test'
  )
})
