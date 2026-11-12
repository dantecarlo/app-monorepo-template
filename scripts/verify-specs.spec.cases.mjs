// ---------------------------------------------------------------------------
// verify-specs cases for living specs: one synthetic spec per failure branch,
// and the well-formed ones that must fire nothing.
//
// Used by: verify-specs.test.mjs.
// ---------------------------------------------------------------------------

import {
  TEST_PATH,
  SPEC_PATH,
  scenario,
  requirement,
  spec,
  change,
  context
} from './verify-specs.fixtures.mjs'

export const SPEC_CASES = [
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
  }
]
