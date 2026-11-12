#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Mutation gate for verify-specs. Each failure branch is driven by its own
// synthetic spec or change, and the well-formed cases must fire nothing:
// without them the gate could reject everything and still pass here.
//
// The cases are EXPORTED, and a check re-runs them against a blinded gate:
// at least one must then fail, or they assert nothing about the detector.
//
// Usage:
//   node --test scripts/verify-specs.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { parseSpec } from './specs.detect.mjs'
import { TEMPLATE_CASES } from './specs-templates.cases.mjs'
import { gate } from './verify-specs.mjs'
import { CHANGE_CASES } from './verify-specs.change.cases.mjs'
import { requirement } from './verify-specs.fixtures.mjs'
import { SPEC_CASES } from './verify-specs.spec.cases.mjs'

export const CASES = [...SPEC_CASES, ...CHANGE_CASES, ...TEMPLATE_CASES]

const checks = [
  {
    name: 'a requirement records the section it sits in',
    run: () => {
      const { requirements } = parseSpec({
        text: ['## ADDED Requirements', '', requirement()].join('\n')
      })
      assert.equal(requirements[0].section, 'ADDED Requirements')
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
