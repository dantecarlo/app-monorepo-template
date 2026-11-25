#!/usr/bin/env node
// ---------------------------------------------------------------------------
// contract — `.agents/contracts/process-reaper.json`, the families the reaper
// may end, read through its closed schema, and what each family and spare
// entry matches: a process's own executable and script, read by `entryOf`.
// The committed contract is read from this checkout; every refusal is a
// synthetic text, every command line made up.
//
// Usage:
//   node --test scripts/agent-harness/reaper/contract.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { CONTRACT, loadContract, parseContract } from './contract.mjs'
import { entryOf, familyOf, spareOf } from './plan.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..', '..')
const COMMITTED = loadContract({ root: REPO_ROOT })

const FAMILY = { id: 'turbo', match: [{ exe: 'turbo' }], what: 'turbo' }
const textOf = ({ families = [FAMILY], ...rest } = {}) =>
  JSON.stringify({ boundSeconds: 8, families, graceSeconds: 60, ...rest })

const processOf = ({ command, name = 'node.exe' }) => ({ command, name })

test('the committed contract lists every family the reaper may end', () => {
  assert.deepEqual(
    COMMITTED.families.map(({ id }) => id),
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
  assert.equal(COMMITTED.graceSeconds, 60)
  assert.equal(COMMITTED.boundSeconds, 8)
  assert.deepEqual(
    COMMITTED.families.filter(({ wrapper }) => wrapper).map(({ id }) => id),
    ['console-wrapper']
  )
  COMMITTED.families.forEach(({ match, what }) => {
    assert.ok(match.length > 0 && match.every(({ exe }) => exe instanceof RegExp))
    assert.ok(what.trim().length > 0)
  })
})

test('the committed contract spares the shared MCP proxy, detached by design', () => {
  assert.deepEqual(
    COMMITTED.spare.map(({ id }) => id),
    ['mcp-proxy', 'msys-runtime', 'terminal-multiplexer']
  )
  // However the proxy is launched.
  for (const process of [
    processOf({ command: '"C:\\u\\.local\\bin\\mcp-proxy.exe" --port 3710 --named-server context7 "node C:/u/context7-mcp/dist/index.js"', name: 'mcp-proxy.exe' }),
    processOf({ command: '/home/u/.local/bin/mcp-proxy --port 3710', name: 'mcp-proxy' }),
    processOf({ command: '"C:\\uv\\python.exe" "C:\\u\\.local\\bin\\mcp-proxy.exe" --port 3710', name: 'python.exe' }),
    processOf({ command: 'python3 -m mcp_proxy --port 3710', name: 'python3' }),
    processOf({ command: 'node /u/node_modules/mcp-proxy/dist/bin/mcp-proxy.js --port 3710', name: 'node' }),
    processOf({ command: 'node C:\\u\\bin\\mcp-proxy.mjs --port 3710' })
  ]) {
    assert.equal(spareOf({ contract: COMMITTED, process })?.id, 'mcp-proxy', process.command)
  }
  // An MCP server the proxy hosts is no proxy.
  assert.equal(
    spareOf({ contract: COMMITTED, process: processOf({ command: 'node /u/node_modules/.bin/metro-mcp' }) }),
    undefined
  )
})

test('the committed contract spares Git for Windows processes and terminal multiplexers', () => {
  for (const [id, process] of [
    ['msys-runtime', processOf({ command: '"C:\\Program Files\\Git\\usr\\bin\\sh.exe" -c "turbo run lint"', name: 'sh.exe' })],
    ['msys-runtime', processOf({ command: 'bash.exe "/c/Program Files/nodejs/npx" turbo run dev', name: 'bash.exe' })],
    ['msys-runtime', processOf({ command: 'timeout.exe 900s npx turbo run test', name: 'timeout.exe' })],
    ['msys-runtime', processOf({ command: 'C:\\Git\\usr\\bin\\env.exe node x.js', name: 'env.exe' })],
    ['terminal-multiplexer', processOf({ command: 'tmux new-session -d -s dev', name: 'tmux' })],
    ['terminal-multiplexer', processOf({ command: 'SCREEN -dmS dev', name: 'SCREEN' })]
  ]) {
    assert.equal(spareOf({ contract: COMMITTED, process })?.id, id, process.command)
  }
})

// The shapes each family must recognise, as the listings print them.
const SHAPES = [
  ['npx-mcp', '"node" "C:\\u\\npm-cache\\_npx\\1a2b\\node_modules\\.bin\\\\..\\@upstash\\context7-mcp\\dist\\index.js"'],
  ['npx-mcp', 'node /home/u/.npm/_npx/1a2b/node_modules/.bin/react-native-docs-mcp'],
  ['mcp-server', '"node" "C:\\u\\lib\\node_modules\\@colbymchenry\\codegraph\\npm-shim.js" "serve" "--mcp"'],
  ['mcp-server', 'C:\\u\\codegraph-win32-x64\\node.exe --liftoff-only C:\\u\\node_modules\\@colbymchenry\\codegraph-win32-x64\\lib\\dist\\bin\\codegraph.js serve --mcp'],
  ['mcp-server', 'C:/u/.venv/Scripts/scrapling-mcp.exe'],
  ['mcp-server', '"C:\\u\\.venv\\Scripts\\python.exe" "C:\\u\\.venv\\Scripts\\scrapling-mcp.exe"'],
  ['mcp-server', 'node /opt/node_modules/shadcn/dist/index.js mcp'],
  ['mcp-server', 'node /u/node_modules/@lottiefiles/creator-mcp/dist/index.mjs'],
  ['vitest', 'node /repo/node_modules/vitest/vitest.mjs run'],
  ['vitest', 'node /repo/node_modules/tinypool/dist/entry/process.js'],
  ['turbo', '"C:\\repo\\node_modules\\turbo-windows-64\\bin\\turbo.exe" --skip-infer run lint'],
  ['turbo', 'node /repo/node_modules/turbo/bin/turbo run build --filter @app/web'],
  ['esbuild', '/repo/node_modules/@esbuild/linux-x64/bin/esbuild --service=0.25.0 --ping'],
  ['tsc', 'node /repo/node_modules/typescript/bin/tsc --noEmit'],
  ['jest', 'node /repo/node_modules/jest-worker/build/workers/processChild.js'],
  ['git-remote-https', 'git remote-https origin https://example.com/a.git'],
  ['git-remote-https', '/usr/lib/git-core/git-remote-https origin https://example.com/a.git']
]

for (const [id, command] of SHAPES) {
  test(`the ${id} family matches ${command}`, () => {
    assert.equal(familyOf({ contract: COMMITTED, process: processOf({ command }) })?.id, id)
  })
}

// What no family may take: a live session started through npx, a dev
// server, the reaper itself, a script runner, a session hook, an editor, a
// fork of an MCP server, and a script whose arguments name a family.
const STRANGERS = [
  'node /u/_npx/1a2b/node_modules/@anthropic-ai/claude-code/cli.js --mcp-config x.json',
  'node /repo/node_modules/next/dist/bin/next dev --turbo',
  'node /repo/scripts/agent-harness/reaper/reap.mjs --kill',
  'node /repo/node_modules/pnpm/bin/pnpm.cjs validate',
  'node /u/lib/node_modules/@colbymchenry/codegraph-win32-x64/lib/dist/bin/codegraph.js prompt-hook',
  '"C:\\VSCode\\Code.exe" D:\\repos\\vitest\\src',
  'node D:\\Dev\\context7-mcp-fork\\server.js',
  'node scripts/run.mjs turbo run lint vitest run --service'
]

for (const command of STRANGERS) {
  test(`no family matches ${command}`, () => {
    assert.equal(familyOf({ contract: COMMITTED, process: processOf({ command }) }), undefined)
  })
}

test('the entry of a process is its executable and its script, the flags before it skipped', () => {
  assert.deepEqual(
    entryOf({
      process: processOf({
        command: '"C:\\nodejs\\\\node.exe" --max-old-space-size=4096 -r ts-node/register "C:\\r\\node_modules\\.bin\\\\..\\vitest\\vitest.mjs" run --reporter dot'
      })
    }),
    {
      args: 'run --reporter dot',
      exe: 'C:/nodejs/node.exe',
      label: 'vitest.mjs',
      script: 'C:/r/node_modules/vitest/vitest.mjs',
      watch: false
    }
  )
  assert.deepEqual(entryOf({ process: processOf({ command: 'python -m mcp_proxy --port 1', name: 'python' }) }), {
    args: '--port 1',
    exe: 'python',
    label: 'mcp_proxy',
    script: 'mcp_proxy',
    watch: false
  })
  assert.deepEqual(entryOf({ process: processOf({ command: 'node -e "setInterval(() => {}, 1)"' }) }).script, null)
  assert.deepEqual(entryOf({ process: { command: '', name: 'cmd.exe' } }), {
    args: '',
    exe: 'cmd.exe',
    label: 'cmd.exe',
    script: null,
    watch: false
  })
  assert.deepEqual(entryOf({ process: processOf({ command: 'git remote-https origin https://x/a.git', name: 'git.exe' }) }), {
    args: 'remote-https origin https://x/a.git',
    exe: 'git',
    label: 'git',
    script: null,
    watch: false
  })
})

test('a node process in watch mode reads as watch mode, and --watch-path takes the next argument as its value', () => {
  const TSC = 'C:\\r\\node_modules\\typescript\\bin\\tsc'
  const watched = {
    args: '-p .',
    exe: 'node',
    label: 'tsc',
    script: 'C:/r/node_modules/typescript/bin/tsc',
    watch: true
  }
  for (const flags of [
    '--watch',
    '--watch=true',
    '--watch-path src',
    '--watch-path=src',
    '--watch-preserve-output',
    '--max-old-space-size=4096 --watch-path "C:\\r\\src" --watch-preserve-output'
  ]) {
    assert.deepEqual(entryOf({ process: processOf({ command: `node ${flags} ${TSC} -p .` }) }), watched, flags)
  }
  // After the script, --watch is the script's own argument, read by its family.
  assert.deepEqual(entryOf({ process: processOf({ command: `node ${TSC} --watch` }) }), {
    ...watched,
    args: '--watch',
    watch: false
  })
})

test('the wrapper family matches the consoles, the POSIX shells and the npx launcher', () => {
  const wrapper = COMMITTED.families.find(({ wrapper: is }) => is)
  const wraps = ({ command, name }) =>
    familyOf({ contract: { ...COMMITTED, families: [wrapper] }, process: processOf({ command, name }) })?.id ===
    wrapper.id
  assert.ok(wraps({ command: 'C:\\WINDOWS\\system32\\cmd.exe /d /s /c x', name: 'cmd.exe' }))
  assert.ok(wraps({ command: '\\??\\C:\\WINDOWS\\system32\\conhost.exe 0x4', name: 'conhost.exe' }))
  assert.ok(wraps({ command: '"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -c x', name: 'powershell.exe' }))
  assert.ok(wraps({ command: '"C:\\nodejs\\node.exe" "C:\\nodejs\\node_modules\\npm\\bin\\npx-cli.js" -y x', name: 'node.exe' }))
  assert.ok(wraps({ command: 'npm exec -y metro-mcp', name: 'npm' }))
  assert.ok(wraps({ command: '/bin/sh -c metro-mcp', name: 'sh' }))
  assert.ok(!wraps({ command: '"C:\\Git\\usr\\bin\\sh.exe" -c x', name: 'sh.exe' }))
  assert.ok(!wraps({ command: 'node C:\\app\\server.js', name: 'node.exe' }))
})

for (const [name, text, pattern] of [
  ['an unknown top-level key', textOf({ minutes: 1 }), /minutes/u],
  ['a missing what', textOf({ families: [{ id: 'turbo', match: [{ exe: 'turbo' }] }] }), /turbo.*what/u],
  ['no match', textOf({ families: [{ ...FAMILY, match: [] }] }), /turbo.*match/u],
  ['a match with no exe', textOf({ families: [{ ...FAMILY, match: [{ args: 'run' }] }] }), /turbo.*exe/u],
  ['a match with an unknown key', textOf({ families: [{ ...FAMILY, match: [{ exe: 'turbo', text: 'x' }] }] }), /turbo.*text/u],
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
    () => parseContract({ text: textOf({ families: [{ ...FAMILY, kill: true }] }) }),
    (error) =>
      error.message.startsWith(`${CONTRACT}:`) &&
      error.message.includes('turbo') &&
      error.message.includes('kill')
  )
})

test('a family whose pattern does not compile is refused, naming the family', () => {
  assert.throws(
    () => parseContract({ text: textOf({ families: [{ ...FAMILY, match: [{ exe: '(' }] }] }) }),
    (error) =>
      error.message.startsWith(`${CONTRACT}:`) &&
      error.message.includes('turbo') &&
      error.message.includes('exe')
  )
})

test('a spare entry that carries the wrapper flag is refused, naming it', () => {
  assert.throws(
    () => parseContract({ text: textOf({ spare: [{ ...FAMILY, id: 'proxy', wrapper: true }] }) }),
    (error) =>
      error.message.startsWith(`${CONTRACT}:`) &&
      error.message.includes('proxy') &&
      error.message.includes('wrapper')
  )
})

test("a family's patterns match in any letter case", () => {
  const contract = parseContract({ text: textOf() })
  assert.equal(familyOf({ contract, process: processOf({ command: 'TURBO run' }) })?.id, 'turbo')
})
