#!/usr/bin/env node
// ---------------------------------------------------------------------------
// contract — `.agents/contracts/process-reaper.json`, the families the reaper
// may end, read through its closed schema. The committed contract is read
// from this checkout; every refusal is a synthetic text.
//
// Usage:
//   node --test scripts/agent-harness/reaper/contract.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { CONTRACT, loadContract, parseContract } from './contract.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..', '..')

const FAMILY = { id: 'turbo', pattern: 'turbo', what: 'turbo' }
const textOf = ({ families = [FAMILY], ...rest } = {}) =>
  JSON.stringify({ boundSeconds: 8, families, graceSeconds: 60, ...rest })

test('the committed contract lists every family the reaper may end', () => {
  const contract = loadContract({ root: REPO_ROOT })
  assert.deepEqual(
    contract.families.map(({ id }) => id),
    [
      'npx-mcp',
      'mcp-server',
      'vitest',
      'turbo',
      'esbuild',
      'tsc',
      'jest',
      'git-remote-https',
      'console-wrapper'
    ]
  )
  assert.equal(contract.graceSeconds, 60)
  assert.equal(contract.boundSeconds, 8)
  assert.deepEqual(
    contract.families.filter(({ wrapper }) => wrapper).map(({ id }) => id),
    ['console-wrapper']
  )
  contract.families.forEach(({ regex, what }) => {
    assert.ok(regex instanceof RegExp)
    assert.ok(what.trim().length > 0)
  })
})

// The shapes each family must recognise, as the listings print them; every
// line is synthetic, its paths made up.
const SHAPES = [
  ['npx-mcp', '"C:\\nodejs\\node.exe" "C:\\nodejs\\node_modules\\npm\\bin\\npx-cli.js" "-y" "next-devtools-mcp"'],
  ['npx-mcp', '"node" "C:\\u\\npm-cache\\_npx\\1a2b\\node_modules\\@upstash\\context7-mcp\\dist\\index.js"'],
  ['npx-mcp', 'npm exec -y metro-mcp'],
  ['npx-mcp', 'node /home/u/.npm/_npx/1a2b/node_modules/.bin/react-native-docs-mcp'],
  ['mcp-server', '"node" "C:\\u\\codegraph\\npm-shim.js" "serve" "--mcp"'],
  ['mcp-server', 'C:/u/.venv/Scripts/scrapling-mcp.exe'],
  ['mcp-server', 'node /opt/shadcn/dist/index.js mcp'],
  ['vitest', 'node /repo/node_modules/vitest/vitest.mjs run'],
  ['vitest', 'node /repo/node_modules/tinypool/dist/entry/process.js'],
  ['turbo', '"C:\\repo\\node_modules\\turbo-windows-64\\bin\\turbo.exe" --skip-infer run lint'],
  ['esbuild', '/repo/node_modules/@esbuild/linux-x64/bin/esbuild --service=0.25.0 --ping'],
  ['tsc', 'node /repo/node_modules/typescript/bin/tsc --noEmit'],
  ['jest', 'node /repo/node_modules/jest-worker/build/workers/processChild.js'],
  ['git-remote-https', 'git remote-https origin https://example.com/a.git'],
  ['git-remote-https', '/usr/lib/git-core/git-remote-https origin https://example.com/a.git']
]

for (const [id, command] of SHAPES) {
  test(`the ${id} family matches ${command}`, () => {
    const { families } = loadContract({ root: REPO_ROOT })
    const first = families.find(
      ({ regex, wrapper }) => !wrapper && regex.test(command)
    )
    assert.equal(first?.id, id)
  })
}

// What no family may take: a live session started through npx, a dev
// server, the reaper itself, a script runner and a session hook.
const STRANGERS = [
  'node /u/_npx/1a2b/node_modules/@anthropic-ai/claude-code/cli.js --mcp-config x.json',
  'node /repo/node_modules/next/dist/bin/next dev --turbo',
  'node /repo/scripts/agent-harness/reaper/reap.mjs --kill',
  'node /repo/node_modules/pnpm/bin/pnpm.cjs validate',
  'node /u/lib/node_modules/@colbymchenry/codegraph/npm-shim.js prompt-hook'
]

for (const command of STRANGERS) {
  test(`no family that reads a command line matches ${command}`, () => {
    const { families } = loadContract({ root: REPO_ROOT })
    const matched = families
      .filter(({ wrapper }) => !wrapper)
      .filter(({ regex }) => regex.test(command))
      .map(({ id }) => id)
    assert.deepEqual(matched, [])
  })
}

test('the wrapper family matches cmd.exe and conhost.exe by name, in any case', () => {
  const { families } = loadContract({ root: REPO_ROOT })
  const wrapper = families.find(({ wrapper: is }) => is)
  assert.ok(wrapper.regex.test('cmd.exe'))
  assert.ok(wrapper.regex.test('CONHOST.EXE'))
  assert.ok(!wrapper.regex.test('node.exe'))
  assert.ok(!wrapper.regex.test('mycmd.exe'))
})

for (const [name, text, pattern] of [
  ['an unknown top-level key', textOf({ minutes: 1 }), /minutes/u],
  ['a missing what', textOf({ families: [{ id: 'turbo', pattern: 'turbo' }] }), /turbo.*what/u],
  ['an id that is not kebab-case', textOf({ families: [{ ...FAMILY, id: 'Turbo' }] }), /Turbo/u],
  ['an id used twice', textOf({ families: [FAMILY, FAMILY] }), /turbo.*twice/u],
  ['a wrapper flag that is not true', textOf({ families: [{ ...FAMILY, wrapper: false }] }), /wrapper/u],
  ['no family', textOf({ families: [] }), /families/u],
  ['a grace that is not a whole number', textOf({ graceSeconds: 1.5 }), /graceSeconds/u],
  ['a bound of zero', textOf({ boundSeconds: 0 }), /boundSeconds/u],
  ['text that does not parse', '{ "families": ', /parse/u]
]) {
  test(`a contract with ${name} is refused, naming the file`, () => {
    assert.throws(
      () => parseContract({ text }),
      (error) =>
        error.message.startsWith(`${CONTRACT}:`) && pattern.test(error.message)
    )
  })
}

test('a contract with an unknown key is refused, naming the file', () => {
  assert.throws(
    () =>
      parseContract({ text: textOf({ families: [{ ...FAMILY, kill: true }] }) }),
    (error) =>
      error.message.startsWith(`${CONTRACT}:`) &&
      error.message.includes('turbo') &&
      error.message.includes('kill')
  )
})

test('a family whose pattern does not compile is refused, naming the family', () => {
  assert.throws(
    () =>
      parseContract({ text: textOf({ families: [{ ...FAMILY, pattern: '(' }] }) }),
    (error) =>
      error.message.startsWith(`${CONTRACT}:`) &&
      error.message.includes('turbo') &&
      error.message.includes('pattern')
  )
})

test("a family's pattern matches in any letter case", () => {
  const { families } = parseContract({ text: textOf() })
  assert.ok(families[0].regex.test('C:\\TURBO.EXE run'))
})
