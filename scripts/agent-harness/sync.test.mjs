#!/usr/bin/env node
// ---------------------------------------------------------------------------
// agent-harness:sync runs the writer, then hands the tree to the read-only
// checker, and reports a projection that still deviates instead of
// swallowing it. A writer that throws leaves the checker unrun.
//
// Ported from Certifipago's scripts/agent-harness/sync.test.mjs.
//
// Usage:
//   node --test scripts/agent-harness/sync.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { withScratchTree } from '../gate/scratch.mjs'
import { checkProjection } from './check.mjs'
import { generateProjection } from './generate.mjs'
import { auditConvergence, runSync } from './sync.mjs'

const OUTPUTS = 14

const converged = () => ({ failures: [], outputs: OUTPUTS })

const SOURCE = [
  '---',
  'name: scratch-agent',
  'description: A scratch agent used only by these tests.',
  'model: sonnet',
  'tools: Read, Grep',
  '---',
  '',
  '# Scratch',
  ''
].join('\n')

test('a sync whose own check comes back clean has converged', () => {
  assert.deepEqual(auditConvergence({ check: converged(), pass: 2 }), [])
})

// The generator runs, then the repository is re-judged by the read-only
// checker, which shares no code path with it.
test('a check still failing after the write is reported, not swallowed', () => {
  const findings = auditConvergence({
    check: { failures: ['changed: opencode.json'], outputs: OUTPUTS },
    pass: 2
  })

  assert.equal(findings.length, 1)
  assert.match(findings[0], /did not converge/)
  assert.match(
    findings[0],
    /changed: opencode\.json/,
    'the deviation the checker named is the only actionable half — a ' +
      'finding that drops it sends the reader back to run the checker'
  )
})

test('the finding names how many passes were spent', () => {
  const [finding] = auditConvergence({
    check: {
      failures: ['extra: .codex/agents/ghost.toml'],
      outputs: OUTPUTS
    },
    pass: 3
  })

  assert.match(finding, /3 pass/)
})

test('sync writes, then re-checks with the read-only checker', () => {
  const calls = []
  const result = runSync({
    check: () => {
      calls.push('check')
      return converged()
    },
    generate: () => {
      calls.push('generate')
      return ['.claude/agents/validator.md']
    },
    root: '/repo'
  })

  assert.deepEqual(calls, ['generate', 'check'])
  assert.deepEqual(result.findings, [])
  assert.equal(result.outputs, OUTPUTS)
  assert.deepEqual(result.written, ['.claude/agents/validator.md'])
})

test('a second sync over a converged tree writes the same bytes', () => {
  const first = runSync({
    check: converged,
    generate: () => ['opencode.json'],
    root: '/repo'
  })
  const second = runSync({
    check: converged,
    generate: () => ['opencode.json'],
    root: '/repo'
  })

  assert.deepEqual(
    first.written,
    second.written,
    'idempotence is the contract a caller relies on to run this after any ' +
      'upstream change without reading the diff twice'
  )
})

test('a generator that throws leaves the checker unrun', () => {
  let checked = false

  assert.throws(
    () =>
      runSync({
        check: () => {
          checked = true
          return converged()
        },
        generate: () => {
          throw new Error('adapter=codex field=depth is not in the schema')
        },
        root: '/repo'
      }),
    /adapter=codex/
  )
  assert.equal(
    checked,
    false,
    'an unmapped semantic must stop the run naming the field, never fall ' +
      'through to a check that would judge a half-written tree'
  )
})

test('a sync with the real writer and checker converges over a fresh tree', () => {
  withScratchTree({
    files: { '.agents/agents/scratch-agent.agent.md': SOURCE },
    prefix: 'agent-harness-sync-',
    use: ({ root }) => {
      const result = runSync({
        check: checkProjection,
        generate: generateProjection,
        root
      })

      assert.deepEqual(result.findings, [])
      assert.ok(result.outputs > 0, 'the tree rendered no output')
      assert.ok(
        result.written.includes('.claude/agents/scratch-agent.md'),
        result.written.join(', ')
      )
    }
  })
})
