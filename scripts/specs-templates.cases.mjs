// ---------------------------------------------------------------------------
// The artifact templates of openspec/templates/ as verify-specs cases.
//
// Each template filled in the way its placeholders ask is accepted, and each
// with one structural element taken out is refused, so the templates and the
// gate cannot drift apart without a red case. The verify report and design
// templates are not here: the gate requires a verify report to exist and
// reads neither file's content.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TEMPLATE_DIR = 'openspec/templates'

const TEST_PATH = 'tpl/__tests__/unit.test.ts'
const TEST_TITLE = 'does the thing'
const TEST_FILES = { [TEST_PATH]: `test('${TEST_TITLE}', () => {})` }
const LIVING_PATH = 'openspec/specs/tpl/spec.md'
const CHANGE_NAME = '2026-01-01-template'
const PREFIX = 'TPL'
const PLACEHOLDER = /<[^<>\n]+>/gu
const TEMPLATE_TEST_LINE =
  '`<test file path>` › "<test title, exactly as written in the file>"'
const TEMPLATE_DELTA_TEST_LINE = '`<test file path>` › "<test title>"'
const FILLED_TEST_LINE = `\`${TEST_PATH}\` › "${TEST_TITLE}"`
const MODIFIED_PLACEHOLDER = /<The whole requirement[\s\S]*?>/u
const MODIFIED_BODY = [
  'The unit SHALL do the thing another way.',
  '',
  '#### Scenario: the changed case',
  '',
  '- **GIVEN** a state',
  '- **WHEN** an event',
  '- **THEN** the new result',
  `- **Test:** ${FILLED_TEST_LINE}`
].join('\n')

const readTemplate = ({ name }) =>
  readFileSync(join(REPO_ROOT, TEMPLATE_DIR, name), 'utf8').replace(
    /\r\n/gu,
    '\n'
  )

const fillPlaceholders = ({ text }) =>
  text.replaceAll('<PREFIX>', PREFIX).replace(PLACEHOLDER, 'placeholder')

const fillSpecTemplate = () =>
  fillPlaceholders({
    text: readTemplate({ name: 'spec.md' }).replace(
      TEMPLATE_TEST_LINE,
      FILLED_TEST_LINE
    )
  })

const fillDeltaTemplate = () =>
  fillPlaceholders({
    text: readTemplate({ name: 'spec-delta.md' })
      .replace(MODIFIED_PLACEHOLDER, MODIFIED_BODY)
      .replace(TEMPLATE_DELTA_TEST_LINE, FILLED_TEST_LINE)
      .replaceAll('<PREFIX>-<next free number>', `${PREFIX}-02`)
      .replaceAll('<PREFIX>-<existing number>', `${PREFIX}-01`)
  })

const fillProposalTemplate = () =>
  fillPlaceholders({ text: readTemplate({ name: 'proposal.md' }) })

const fillTasksTemplate = () =>
  fillPlaceholders({ text: readTemplate({ name: 'tasks.md' }) })

const templateChange = ({
  delta = fillDeltaTemplate(),
  proposal = fillProposalTemplate(),
  tasks = fillTasksTemplate()
} = {}) => ({
  files: {
    deltas: [{ specPath: 'tpl', text: delta }],
    proposal,
    tasks,
    verifyReport: undefined
  },
  name: CHANGE_NAME
})

const templateContext = ({
  changes = [],
  spec = fillSpecTemplate()
} = {}) => ({
  changes,
  specs: [{ path: LIVING_PATH, text: spec }],
  testFiles: TEST_FILES
})

export const TEMPLATE_CASES = [
  {
    context: () => templateContext(),
    expected: 0,
    name: 'the spec template, filled in, is accepted'
  },
  {
    context: () =>
      templateContext({
        spec: fillSpecTemplate().replace('## Purpose', '## Intro')
      }),
    expected: 1,
    name: 'the spec template without its Purpose section is refused'
  },
  {
    context: () =>
      templateContext({ spec: readTemplate({ name: 'spec.md' }) }),
    expected: 3,
    name: 'the spec template left unfilled is refused'
  },
  {
    context: () => templateContext({ changes: [templateChange()] }),
    expected: 0,
    name: 'the proposal, tasks and delta templates, filled in, are accepted'
  },
  {
    context: () =>
      templateContext({
        changes: [
          templateChange({
            proposal: fillProposalTemplate().replace('## Out of scope', '')
          })
        ]
      }),
    expected: 1,
    name: 'the proposal template without Out of scope is refused'
  },
  {
    context: () =>
      templateContext({
        changes: [
          templateChange({
            tasks: fillTasksTemplate().replace(' · Requirements: ', ' - ')
          })
        ]
      }),
    expected: 1,
    name: 'the tasks template without its Requirements field is refused'
  },
  {
    context: () =>
      templateContext({
        changes: [
          templateChange({
            delta: fillDeltaTemplate().replace(
              '## ADDED Requirements',
              '## NEW Requirements'
            )
          })
        ]
      }),
    expected: 2,
    name: 'the delta template with a section outside the three is refused'
  }
]
