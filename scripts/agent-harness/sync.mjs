#!/usr/bin/env node
// ---------------------------------------------------------------------------
// agent-harness:sync — regenerate every projection, then prove it converged.
//
// `agent-harness:generate` writes. `agent-harness:projection-check` judges.
// This runs the writer, then hands the result to the judge, which shares no
// code path with it. A new output reads as untracked until it is added to
// git, as it does for the checker.
//
// Ported from Certifipago's scripts/agent-harness/sync.mjs.
//
// Usage:
//   node scripts/agent-harness/sync.mjs
// ---------------------------------------------------------------------------

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { checkProjection, trackedFiles } from './check.mjs'
import { generateProjection } from './generate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..', '..')

export const auditConvergence = ({ check, pass }) => {
  if (check.failures.length === 0) return []

  return [
    `the projection did not converge after ${pass} pass(es): ` +
      check.failures.join('; ')
  ]
}

/**
 * `generate` and `check` are injected, so the companion can drive the ORDER:
 * write, then judge with the read-only checker.
 */
export const runSync = ({ check, generate, root }) => {
  const written = generate({ root })
  const result = check({ root })

  return {
    findings: auditConvergence({ check: result, pass: 1 }),
    outputs: result.outputs,
    written
  }
}

const main = () => {
  const { findings, outputs, written } = runSync({
    check: ({ root }) =>
      checkProjection({ root, tracked: trackedFiles({ root }) }),
    generate: generateProjection,
    root: REPO_ROOT
  })

  if (findings.length > 0) {
    console.error(`agent-harness:sync: ${findings.length} problem(s).`)
    findings.forEach((finding) => console.error(`  ${finding}`))
    process.exitCode = 1
    return
  }

  console.log(
    `agent-harness:sync: ${written.length} projected output(s) rewritten ` +
      `from their neutral sources; the read-only checker then found ${outputs} ` +
      'output(s) matching. Review the diff and commit it.'
  )
  console.log(
    '  NOT covered: whether a neutral SOURCE is right, which review decides; ' +
      'and anything outside the projection, which this never reads.'
  )
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'sync.mjs')
) {
  main()
}
