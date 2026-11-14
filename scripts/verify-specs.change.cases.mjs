// ---------------------------------------------------------------------------
// verify-specs cases for open changes and their deltas: one synthetic change
// per failure branch, and the well-formed ones that must fire nothing.
//
// Used by: verify-specs.test.mjs.
// ---------------------------------------------------------------------------

import {
  scenario,
  requirement,
  PROPOSAL,
  change,
  changeWithout,
  delta,
  context
} from './verify-specs.fixtures.mjs'

export const CHANGE_CASES = [
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
