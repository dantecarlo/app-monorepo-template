// ---------------------------------------------------------------------------
// The companion contract of a gate, as a function.
//
// A companion exports its cases and drives the gate through its public `run`,
// so the same cases can be re-run against a blinded gate (`blindGate` in
// gate.mjs). It registers them, and every assertion of its own, as `node:test`
// tests through `registerCases`.
//
// A case supplies its own `context`: a detector takes whatever it needs to
// decide, a root for one and two lists for another.
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { after, test } from 'node:test'

export const runCases = ({ cases, gate }) =>
  cases.flatMap(({ context, expected, name }) => {
    const actual = gate.run(context()).length
    return actual === expected
      ? []
      : [`${name}: expected ${expected} finding(s), got ${actual}`]
  })

// Registers one test per case and one per check, in that order. A check is
// `{ name, run }` and fails by throwing. `cleanup` runs once after the last
// test.
//
// `meta` is the companion's `import.meta`. Registration happens only when the
// companion is the process entry point — `node --test file`, `node file` or a
// `run({ files })` child. An import registers nothing, prints nothing and sets
// no exit code, so another script can import a companion for its CASES.
// `import.meta.main` exists from Node 24.2; a runtime without it throws here
// and registers nothing.
export const registerCases = ({
  cases,
  checks = [],
  cleanup,
  gate,
  meta
}) => {
  if (typeof meta.main !== 'boolean') {
    throw new TypeError(
      'registerCases reads `import.meta.main`, which needs Node 24.2 or later.'
    )
  }
  if (!meta.main) return

  cases.forEach((item) =>
    test(item.name, () => {
      const [failure] = runCases({ cases: [item], gate })
      assert.ok(failure === undefined, failure)
    })
  )
  checks.forEach(({ name, run }) => test(name, run))
  if (cleanup) after(cleanup)
}
