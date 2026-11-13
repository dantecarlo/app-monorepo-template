#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Mutation gate for verify-english. Each failure branch is driven by its own
// synthetic file or allowlist, and the clean cases must fire nothing: without
// them the gate could reject everything and still pass here.
//
// The cases are EXPORTED, and a check re-runs them against a blinded gate:
// at least one must then fail, or they assert nothing about the detector.
//
// Usage:
//   node --test scripts/verify-english.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ENGLISH_CASES } from './english.cases.mjs'
import { findSpanishLines, SPANISH_WORDS } from './english.detect.mjs'
import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { gate } from './verify-english.mjs'

export const CASES = ENGLISH_CASES

const HERE = dirname(fileURLToPath(import.meta.url))
const OWN_SOURCES = [
  'english.cases.mjs',
  'english.detect.mjs',
  'verify-english.mjs',
  'verify-english.test.mjs'
]
const WORDS_THAT_COLLIDE = ['algo', 'con', 'del', 'solo', 'todo', 'todos']
const THIRD_LINE = 3

const checks = [
  {
    name: 'a finding names the file and the line it sits on',
    run: () => {
      const [hit] = findSpanishLines({
        files: [{ path: 'docs/a.md', text: 'one\ntwo\nAuthor: Jos\u00e9' }]
      })
      assert.equal(hit.path, 'docs/a.md')
      assert.equal(hit.line, THIRD_LINE)
    }
  },
  {
    name: 'the word list leaves out words English or code also use',
    run: () => {
      WORDS_THAT_COLLIDE.forEach((word) =>
        assert.ok(!SPANISH_WORDS.has(word), `${word} is in the word list`)
      )
    }
  },
  {
    name: "the gate's own sources hold no Spanish line",
    run: () => {
      const files = OWN_SOURCES.map((name) => ({
        path: `scripts/${name}`,
        text: readFileSync(join(HERE, name), 'utf8')
      }))
      assert.deepEqual(findSpanishLines({ files }), [])
    }
  },
  {
    name: 'the cases fail against a gate that finds nothing',
    run: () => {
      const failures = runCases({
        cases: CASES,
        gate: blindGate({ gate })
      })
      assert.ok(failures.length > 0, 'every case passed a blinded gate')
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
