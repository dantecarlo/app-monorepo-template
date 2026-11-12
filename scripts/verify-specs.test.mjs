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

const TEST_PATH = 'pkg/__tests__/unit.test.ts'
const TEST_TEXT = "test('does the thing', () => {})"
const SPEC_PATH = 'openspec/specs/pkg/spec.md'

const scenario = ({
  steps = ['GIVEN', 'WHEN', 'THEN'],
  test = `\`${TEST_PATH}\` › "does the thing"`
} = {}) =>
  [
    '#### Scenario: the case',
    '',
    ...steps.map((keyword) => `- **${keyword}** something`),
    ...(test === null ? [] : [`- **Test:** ${test}`])
  ].join('\n')

const requirement = ({
  id = 'PKG-01',
  scenarios = [scenario()],
  statement = 'The unit SHALL do the thing.'
} = {}) =>
  [
    `### Requirement: ${id} — the thing`,
    '',
    statement,
    '',
    ...scenarios
  ].join('\n')

const spec = ({
  governs = '> **Governs:** `pkg/src/`',
  prefix = '> **ID prefix:** `PKG`',
  purpose = '## Purpose',
  requirements = [requirement()]
} = {}) =>
  [
    '# pkg — living spec',
    '',
    governs,
    prefix,
    '',
    purpose,
    '',
    'What it does.',
    '',
    '## Requirements',
    '',
    ...requirements
  ].join('\n')

const PROPOSAL = [
  '# Proposal: a change',
  '',
  '> **Status:** open',
  '',
  '## Why',
  '## What changes',
  '## Out of scope',
  '## Affected specs'
].join('\n')

const TASKS =
  '- [x] T1 — build it · Requirements: PKG-01 · Commit: 1a2b3c4\n' +
  '- [ ] T2 — finish it · Requirements: none · Commit: —\n'

const change = ({
  deltas = [],
  name = '2026-11-10-a-change',
  proposal = PROPOSAL,
  tasks = TASKS,
  verifyReport = undefined
} = {}) => ({ files: { deltas, proposal, tasks, verifyReport }, name })

// A default parameter replaces an explicit undefined, so a missing file is
// removed from a built change after it is built.
const changeWithout = ({ file }) => {
  const built = change()
  return { ...built, files: { ...built.files, [file]: undefined } }
}

const delta = ({ text }) => ({ specPath: 'pkg', text })

const context = ({
  changes = [],
  specs = [{ path: SPEC_PATH, text: spec() }],
  testFiles = { [TEST_PATH]: TEST_TEXT }
} = {}) => ({ changes, specs, testFiles })

const SHAPE_CASES = [
  {
    context: () => context({ changes: [change()] }),
    expected: 0,
    name: 'a well-formed spec and a well-formed open change fire nothing'
  },
  {
    // A malformed prefix once became the ID pattern itself, so `pkg-01`
    // passed under the prefix `pkg`.
    context: () =>
      context({
        specs: [
          {
            path: SPEC_PATH,
            text: spec({
              prefix: '> **ID prefix:** `pkg`',
              requirements: [requirement({ id: 'pkg-01' })]
            })
          }
        ]
      }),
    expected: 2,
    name: 'a lower-case prefix fires, and so does an ID written under it'
  },
  {
    context: () =>
      context({
        specs: [
          {
            path: SPEC_PATH,
            text: spec({
              requirements: [
                requirement({
                  scenarios: [
                    scenario({ test: 'Not covered — device only' })
                  ]
                })
              ]
            })
          }
        ]
      }),
    expected: 0,
    name: 'a scenario marked Not covered with its reason fires nothing'
  },
  {
    context: () =>
      context({
        specs: [{ path: SPEC_PATH, text: spec({ governs: '' }) }]
      }),
    expected: 1,
    name: 'a spec with no Governs line fires'
  },
  {
    context: () =>
      context({
        specs: [{ path: SPEC_PATH, text: spec({ prefix: '' }) }]
      }),
    expected: 1,
    name: 'a spec with no ID prefix fires'
  },
  {
    context: () =>
      context({
        specs: [
          { path: SPEC_PATH, text: spec() },
          {
            path: 'openspec/specs/other/spec.md',
            text: spec({ requirements: [requirement({ id: 'PKG-02' })] })
          }
        ]
      }),
    expected: 1,
    name: 'two specs declaring one prefix fire once'
  },
  {
    context: () =>
      context({
        specs: [{ path: SPEC_PATH, text: spec({ purpose: '## Intro' }) }]
      }),
    expected: 1,
    name: 'a spec with no Purpose section fires'
  },
  {
    context: () =>
      context({
        specs: [{ path: SPEC_PATH, text: spec({ requirements: [] }) }]
      }),
    expected: 1,
    name: 'a spec that states no requirement fires'
  },
  {
    context: () =>
      context({
        specs: [
          {
            path: SPEC_PATH,
            text: spec({
              requirements: [requirement(), requirement()]
            })
          }
        ]
      }),
    expected: 1,
    name: 'a requirement ID declared twice fires'
  },
  {
    context: () =>
      context({
        specs: [
          {
            path: SPEC_PATH,
            text: spec({ requirements: [requirement({ id: 'OTHER-01' })] })
          }
        ]
      }),
    expected: 1,
    name: 'a requirement ID with another prefix fires'
  },
  {
    context: () =>
      context({
        specs: [
          {
            path: SPEC_PATH,
            text: spec({
              requirements: [
                requirement({ statement: 'The unit does the thing.' })
              ]
            })
          }
        ]
      }),
    expected: 1,
    name: 'a requirement with no SHALL fires'
  },
  {
    context: () =>
      context({
        specs: [
          {
            path: SPEC_PATH,
            text: spec({ requirements: [requirement({ scenarios: [] })] })
          }
        ]
      }),
    expected: 1,
    name: 'a requirement with no scenario fires'
  },
  {
    context: () =>
      context({
        specs: [
          {
            path: SPEC_PATH,
            text: spec({
              requirements: [
                requirement({
                  scenarios: [scenario({ steps: ['GIVEN', 'WHEN'] })]
                })
              ]
            })
          }
        ]
      }),
    expected: 1,
    name: 'a scenario with no THEN fires'
  },
  {
    context: () =>
      context({
        specs: [
          {
            path: SPEC_PATH,
            text: spec({
              requirements: [
                requirement({ scenarios: [scenario({ test: null })] })
              ]
            })
          }
        ]
      }),
    expected: 1,
    name: 'a scenario with no test line fires'
  },
  {
    context: () =>
      context({
        specs: [
          {
            path: SPEC_PATH,
            text: spec({
              requirements: [
                requirement({
                  scenarios: [scenario({ test: 'the unit test' })]
                })
              ]
            })
          }
        ]
      }),
    expected: 1,
    name: 'a test line that names no backticked file fires'
  },
  {
    context: () => context({ testFiles: { [TEST_PATH]: null } }),
    expected: 1,
    name: 'a cited test file that does not exist fires'
  },
  {
    context: () =>
      context({ testFiles: { [TEST_PATH]: "test('another', () => {})" } }),
    expected: 1,
    name: 'a quoted title the test file does not hold fires'
  },
  {
    context: () => context({ changes: [change({ name: 'a-change' })] }),
    expected: 1,
    name: 'a change folder without its date fires'
  },
  {
    context: () =>
      context({ changes: [changeWithout({ file: 'proposal' })] }),
    expected: 1,
    name: 'a change with no proposal fires'
  },
  {
    context: () =>
      context({
        changes: [
          change({
            proposal: PROPOSAL.replace(
              '> **Status:** open',
              '> **Status:** archived'
            )
          })
        ]
      }),
    expected: 1,
    name: 'an open change whose proposal is not marked open fires'
  },
  {
    context: () =>
      context({
        changes: [
          change({ proposal: PROPOSAL.replace('## Out of scope', '') })
        ]
      }),
    expected: 1,
    name: 'a proposal missing a section fires'
  },
  {
    context: () =>
      context({ changes: [changeWithout({ file: 'tasks' })] }),
    expected: 1,
    name: 'a change with no tasks fires'
  },
  {
    context: () =>
      context({
        changes: [
          change({
            tasks:
              '- [x] T1 — build it · Requirements: PKG-01 · Commit: —\n' +
              '- [ ] T2 — finish it · Requirements: none · Commit: —\n'
          })
        ]
      }),
    expected: 1,
    name: 'a done task without a sha fires'
  },
  {
    context: () =>
      context({
        changes: [change({ tasks: '- [ ] T1 — build it\n' })]
      }),
    expected: 1,
    name: 'a task without its requirements and commit fires'
  },
  {
    context: () =>
      context({
        changes: [
          change({
            tasks:
              '- [x] T1 — build it · Requirements: none · Commit: 1a2b3c4\n'
          })
        ]
      }),
    expected: 1,
    name: 'a change with every task done and no verify report fires'
  },
  {
    context: () =>
      context({
        changes: [
          change({
            deltas: [
              delta({
                text: [
                  '## MODIFIED Requirements',
                  '',
                  requirement({ id: 'PKG-09' })
                ].join('\n')
              })
            ]
          })
        ]
      }),
    expected: 1,
    name: 'a modified ID the living spec does not have fires'
  },
  {
    context: () =>
      context({
        changes: [
          change({
            deltas: [
              delta({
                text: ['## ADDED Requirements', '', requirement()].join(
                  '\n'
                )
              })
            ]
          })
        ]
      }),
    expected: 1,
    name: 'an added ID the living spec already has fires'
  },
  {
    context: () =>
      context({
        changes: [
          change({
            deltas: [
              delta({
                text: [
                  '## REMOVED Requirements',
                  '',
                  '### Requirement: PKG-01 — the thing',
                  '',
                  'It goes.'
                ].join('\n')
              })
            ]
          })
        ]
      }),
    expected: 1,
    name: 'a removed requirement with no reason fires'
  },
  {
    context: () =>
      context({
        changes: [
          change({
            deltas: [
              delta({
                text: [
                  '## RENAMED Requirements',
                  '',
                  '## ADDED Requirements',
                  '',
                  requirement({ id: 'PKG-02' })
                ].join('\n')
              })
            ]
          })
        ]
      }),
    expected: 1,
    name: 'a delta section outside ADDED, MODIFIED and REMOVED fires'
  },
  {
    // An added test does not exist until apply; it is judged from the
    // verify report on.
    context: () =>
      context({
        changes: [
          change({
            deltas: [
              delta({
                text: [
                  '## ADDED Requirements',
                  '',
                  requirement({
                    id: 'PKG-02',
                    scenarios: [
                      scenario({
                        test: '`pkg/__tests__/new.test.ts` › "new"'
                      })
                    ]
                  })
                ].join('\n')
              })
            ]
          })
        ]
      }),
    expected: 0,
    name: 'a delta test not written yet fires nothing before the verify report'
  },
  {
    // Before the verify report no test file is read, so only the shape of
    // the line can be judged; it still is.
    context: () =>
      context({
        changes: [
          change({
            deltas: [
              delta({
                text: [
                  '## ADDED Requirements',
                  '',
                  requirement({
                    id: 'PKG-02',
                    scenarios: [scenario({ test: 'the new unit test' })]
                  })
                ].join('\n')
              })
            ]
          })
        ]
      }),
    expected: 1,
    name: 'a malformed delta test line fires even before the verify report'
  },
  {
    context: () =>
      context({
        changes: [change({ tasks: '# Tasks: a change\n\nNothing yet.\n' })]
      }),
    expected: 1,
    name: 'a tasks file that lists no task fires'
  }
]

export const CASES = [...SHAPE_CASES, ...TEMPLATE_CASES]

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
