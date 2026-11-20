#!/usr/bin/env node
// ---------------------------------------------------------------------------
// mcp-check — the MCP part of the SessionStart hook. Each case builds a
// scratch tree with a .mcp.json, a catalog and the entry files the case
// installs, and reads the line the check returns for it.
//
// Usage:
//   node --test scripts/agent-harness/reaper/mcp-check.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, test } from 'node:test'

import { mcpCheckLine } from './mcp-check.mjs'

const LAUNCHER = 'scripts/mcp/launch.mjs'
const CATALOG = '.agents/contracts/mcp-servers.json'
const CONFIG = '.mcp.json'

const server = ({ area, entry, name, packageName }) => ({
  area,
  args: [LAUNCHER, name],
  capability: 'mobile-expo',
  command: 'node',
  docs: [],
  entry,
  name,
  package: packageName,
  version: '1.0.0'
})

const SERVERS = [
  server({
    area: 'mobile',
    entry: 'bin/expo-mcp.mjs',
    name: 'expo',
    packageName: 'expo-mcp'
  }),
  server({
    area: 'mobile',
    entry: 'dist/bin/metro-mcp.js',
    name: 'metro',
    packageName: 'metro-mcp'
  }),
  server({
    area: 'web',
    entry: 'dist/index.js',
    name: 'next-devtools',
    packageName: 'next-devtools-mcp'
  })
]

const launched = ({ name }) => ({
  args: [LAUNCHER, name],
  command: 'node'
})

const scratchRoots = []
after(() =>
  scratchRoots.forEach((root) =>
    rmSync(root, { force: true, recursive: true })
  )
)

const write = ({ path, root, text }) => {
  const target = join(root, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, text)
}

// A scratch tree with the catalog of SERVERS, `config` as its .mcp.json
// when given, and the entry file of each server `installed` names.
const treeOf = ({ config, installed = [] }) => {
  const root = mkdtempSync(join(tmpdir(), 'reap-mcp-check-test-'))
  scratchRoots.push(root)
  write({
    path: CATALOG,
    root,
    text: JSON.stringify({ servers: SERVERS })
  })
  if (config !== undefined)
    write({ path: CONFIG, root, text: JSON.stringify(config) })
  SERVERS.filter(({ name }) => installed.includes(name)).forEach(
    ({ entry, package: packageName }) =>
      write({
        path: join('node_modules', packageName, entry),
        root,
        text: 'export {}\n'
      })
  )
  return root
}

test('the MCP check names every launcher server whose entry is missing, and the install command', () => {
  const root = treeOf({
    config: {
      mcpServers: {
        expo: launched({ name: 'expo' }),
        metro: launched({ name: 'metro' }),
        'next-devtools': launched({ name: 'next-devtools' }),
        remote: { type: 'http', url: 'https://mcp.example.com/mcp' },
        shared: { args: ['-y', 'acme-mcp'], command: 'npx' }
      }
    },
    installed: ['next-devtools']
  })

  assert.equal(
    mcpCheckLine({ root }),
    'mcp-check: 2 MCP server(s) cannot start, their pinned entry not ' +
      'installed under node_modules: expo, metro; run ' +
      '`pnpm install --frozen-lockfile`'
  )
})

test('the MCP check says nothing without a .mcp.json, or when every entry is installed', () => {
  assert.equal(mcpCheckLine({ root: treeOf({}) }), null)
  assert.equal(
    mcpCheckLine({
      root: treeOf({
        config: {
          mcpServers: {
            expo: launched({ name: 'expo' }),
            'next-devtools': launched({ name: 'next-devtools' })
          }
        },
        installed: ['expo', 'next-devtools']
      })
    }),
    null
  )
})
