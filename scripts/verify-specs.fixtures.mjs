// ---------------------------------------------------------------------------
// The builders verify-specs cases share: a scenario, a requirement, a spec, a
// change with its proposal and tasks, a delta, and the gate context they run in.
//
// Used by: verify-specs.spec.cases.mjs, verify-specs.change.cases.mjs and
// verify-specs.test.mjs.
// ---------------------------------------------------------------------------

export const TEST_PATH = 'pkg/__tests__/unit.test.ts'
export const TEST_TEXT = "test('does the thing', () => {})"
export const SPEC_PATH = 'openspec/specs/pkg/spec.md'

export const scenario = ({
  steps = ['GIVEN', 'WHEN', 'THEN'],
  test = `\`${TEST_PATH}\` › "does the thing"`
} = {}) =>
  [
    '#### Scenario: the case',
    '',
    ...steps.map((keyword) => `- **${keyword}** something`),
    ...(test === null ? [] : [`- **Test:** ${test}`])
  ].join('\n')

export const requirement = ({
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

export const spec = ({
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

export const PROPOSAL = [
  '# Proposal: a change',
  '',
  '> **Status:** open',
  '',
  '## Why',
  '## What changes',
  '## Out of scope',
  '## Affected specs'
].join('\n')

export const TASKS =
  '- [x] T1 — build it · Requirements: PKG-01 · Commit: 1a2b3c4\n' +
  '- [ ] T2 — finish it · Requirements: none · Commit: —\n'

export const change = ({
  deltas = [],
  name = '2026-11-10-a-change',
  proposal = PROPOSAL,
  tasks = TASKS,
  verifyReport = undefined
} = {}) => ({ files: { deltas, proposal, tasks, verifyReport }, name })

// A default parameter replaces an explicit undefined, so a missing file is
// removed from a built change after it is built.
export const changeWithout = ({ file }) => {
  const built = change()
  return { ...built, files: { ...built.files, [file]: undefined } }
}

export const delta = ({ text }) => ({ specPath: 'pkg', text })

export const context = ({
  changes = [],
  specs = [{ path: SPEC_PATH, text: spec() }],
  testFiles = { [TEST_PATH]: TEST_TEXT }
} = {}) => ({ changes, specs, testFiles })
