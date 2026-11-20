#!/usr/bin/env node
// ---------------------------------------------------------------------------
// writers.tools — the pnpm and JS-tool forms a read-only agent may run, and
// why every other form, and every other package manager, is a write. The
// commands are those of Certifipago's enforce-agent-writes test.
//
// Usage:
//   node --test scripts/agent-harness/write-guard/writers.tools.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { literal } from './expansion.mjs'
import {
  CODEGRAPH_READS,
  JS_TOOLS,
  PACKAGE_MANAGERS,
  pnpmWrite,
  REPORT_FLAGS,
  TOOL_ADVICE,
  toolWrite
} from './writers.tools.mjs'

const rest = ({ command }) =>
  command
    .split(' ')
    .slice(1)
    .map((text) => literal({ text }))

for (const command of [
  'pnpm verify:maps',
  'pnpm -s verify:tests',
  'pnpm --filter @app/web test',
  'pnpm -C apps/web typecheck',
  'pnpm lint',
  'pnpm knip',
  'pnpm validate',
  'pnpm write-guard:test',
  'pnpm docs:diagrams:check',
  'pnpm view react version',
  'pnpm exec vitest run src/a.test.ts',
  'pnpm exec eslint src/a.ts',
  'pnpm exec prettier --check src/a.ts',
  'pnpm exec tsc --noEmit -p apps/web',
  'pnpm test -- src/a.test.ts',
  'pnpm --version',
  'pnpm'
]) {
  test(`a read-only pnpm form is no write: ${command}`, () => {
    assert.equal(pnpmWrite({ rest: rest({ command }) }), undefined)
  })
}

for (const [command, why] of [
  ['pnpm install', /read-only pnpm form/],
  ['pnpm add left-pad', /read-only pnpm form/],
  ['pnpm dlx create-x', /read-only pnpm form/],
  ['pnpm build', /read-only pnpm form/],
  ['pnpm lint --fix', /rewrites files/],
  ['pnpm exec eslint --fix src', /rewrites files/],
  ['pnpm exec prettier --write src', /rewrites files/],
  ['pnpm exec tsc', /without --noEmit/],
  ['pnpm exec rimraf dist', /not a read-only form/],
  ['pnpm --filter web test -u', /snapshots/],
  ['pnpm test -- -u', /snapshots/],
  ['pnpm verify:maps --update', /snapshots/],
  ['pnpm web:test --update-snapshots', /snapshots/],
  ['pnpm exec vitest run -u', /snapshots/],
  ['pnpm exec vitest', /vitest run/]
]) {
  test(`a writing pnpm form says why: ${command}`, () => {
    assert.match(pnpmWrite({ rest: rest({ command }) }) ?? '', why)
  })
}

for (const [command, why] of [
  ['prettier --check .', undefined],
  ['prettier .', 'is not the read-only `prettier --check`'],
  ['eslint --fix .', 'rewrites files'],
  ['tsc --noEmit', undefined],
  ['vitest run', undefined]
]) {
  test(`a JS tool run directly is judged like its pnpm exec form: ${command}`, () => {
    const [name] = command.split(' ')
    assert.equal(toolWrite({ name, rest: rest({ command }) }), why)
  })
}

test('the package managers, the JS tools and the codegraph reads are listed', () => {
  for (const name of ['npm', 'npx', 'yarn', 'bunx', 'pip', 'uv']) {
    assert.ok(PACKAGE_MANAGERS.has(name), name)
  }
  assert.ok(!PACKAGE_MANAGERS.has('pnpm'))
  assert.deepEqual([...JS_TOOLS].sort(), [
    'eslint',
    'prettier',
    'tsc',
    'vitest'
  ])
  assert.ok(CODEGRAPH_READS.has('explore'))
  assert.ok(!CODEGRAPH_READS.has('init'))
  assert.deepEqual(REPORT_FLAGS, ['-o', '--output-file', '--outputFile'])
  assert.match(TOOL_ADVICE, /pnpm exec vitest run/)
})
