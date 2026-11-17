#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-skills, the structural check of the seven ticket
// skills. No gate read a skill's shape before it, so its cases are the only
// evidence it can go red at all.
//
// The cases hand the check's `run` seven synthetic skills, built from the
// contracts the check exports, each case differing from the healthy set by
// one thing. The checks then run the check as a process over a scratch tree
// in the OS temp directory, which `withScratchTree` removes, and over the
// repository itself.
//
// Usage:
//   node --test scripts/verify-skills.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import {
  collectContext,
  FINDING_KIND,
  gate,
  OPERATIONS_TABLE_HEADER,
  SKILL_CONTRACTS,
  SKILL_FILE,
  SKILLS_ROOT,
  STATES_TABLE_HEADER
} from './verify-skills.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CHECK = join(HERE, 'verify-skills.mjs')
const REPO_ROOT = join(HERE, '..')
const FAILED = 1
const PASSED = 0
const CONTRACT = 'ticket-flow'
const INTAKE = 'process-intake'
const TICKET_TEMPLATE = 'ticket.template.md'
const RELEASE_TEMPLATE = 'release.template.md'
const PROCESS_TEMPLATE = 'ticket-flow.template.md'
const DROPPED_STATE = 'Ready to merge'
const DROPPED_OPERATION = 'link'
const READ_FIRST =
  'Read `ticket-flow` first: `.claude/skills/ticket-flow/SKILL.md`.'
const RULES = '## Rules every role follows'
const QA_MERGE_STEP = '## Step 6 — One merge at a time, under the merge policy'
const INTAKE_MAPPING_STEP = '## Step 3 — Map it onto the core'
const MANUAL_NAMED = 'It names `manual`.'
const LOW_RISK_NAMED = 'It names `low-risk`.'
const NAMES_NOTHING = 'It names nothing.'
const POLICY_FIELD = '- **Policy:**'
const POLICY_LINE = `${POLICY_FIELD} \`manual\``

const frontmatter = ({ name }) =>
  [
    '---',
    `name: ${name}`,
    'description: >',
    `  The ${name} procedure.`,
    '  USE WHEN: "a ticket moved".',
    '  DO NOT USE: anything else.',
    '---'
  ].join('\n')

const tableOf = ({ header, keys }) => [
  `| ${header.join(' | ')} |`,
  `| ${header.map(() => '---').join(' | ')} |`,
  ...keys.map((key) => `| ${key} | ${header.slice(1).map(() => 'x').join(' | ')} |`)
]

// One section per heading the contract names, with its table under it when
// the contract names one, the text a section must mention, and the line a
// section must give its default in.
const sectionsOf = ({ contract }) =>
  contract.headings.flatMap((heading) => {
    const table = (contract.tables ?? []).find(
      (item) => item.heading === heading
    )
    const mentions = (contract.mentions ?? [])
      .filter((item) => item.heading === heading)
      .map(({ text }) => `It names ${text}.`)
    const defaults = (contract.defaults ?? [])
      .filter((item) => item.heading === heading)
      .map(({ field, value }) => `${field} ${value}`)
    return [
      heading,
      '',
      ...mentions,
      ...defaults,
      ...(table ? tableOf(table) : []),
      ''
    ]
  })

const skillText = ({ contract }) =>
  [
    frontmatter({ name: contract.folder }),
    '',
    `# ${contract.folder}`,
    '',
    ...(contract.role ? [READ_FIRST, ''] : ['The contract.', '']),
    ...sectionsOf({ contract })
  ].join('\n')

const fileText = ({ file }) =>
  [`# ${file.name}`, '', ...sectionsOf({ contract: file })].join('\n')

// The seven skills, every one of them whole: SKILL.md and each file its
// contract names, keyed by their path under .claude/skills/.
const HEALTHY = Object.fromEntries(
  SKILL_CONTRACTS.flatMap((contract) => [
    [`${contract.folder}/${SKILL_FILE}`, skillText({ contract })],
    ...(contract.files ?? []).map((file) => [
      `${contract.folder}/${file.name}`,
      fileText({ file })
    ])
  ])
)

const treeOf = ({ edits = {} }) =>
  Object.fromEntries(
    Object.entries(HEALTHY)
      .map(([path, text]) => [
        path,
        path in edits ? edits[path]({ text }) : text
      ])
      .filter(([, text]) => text !== null)
  )

// The context the check's collector would gather from that tree: every
// file each contract names, null when the tree does not hold it.
const contextOf = ({ tree }) => ({
  skills: SKILL_CONTRACTS.map((contract) => ({
    files: Object.fromEntries(
      [SKILL_FILE, ...(contract.files ?? []).map(({ name }) => name)].map(
        (name) => [name, tree[`${contract.folder}/${name}`] ?? null]
      )
    ),
    folder: contract.folder
  }))
})

const skills =
  ({ edits } = {}) =>
  () =>
    contextOf({ tree: treeOf({ edits }) })

const without =
  ({ line }) =>
  ({ text }) =>
    text
      .split('\n')
      .filter((item) => !item.startsWith(line))
      .join('\n')

const withoutSection =
  ({ heading }) =>
  ({ text }) => {
    const lines = text.split('\n')
    const start = lines.indexOf(heading)
    const end = lines.findIndex(
      (line, index) => index > start && line.startsWith('## ')
    )
    return [...lines.slice(0, start), ...lines.slice(end)].join('\n')
  }

const replace =
  ({ from, to }) =>
  ({ text }) =>
    text.replace(from, to)

const append =
  ({ lines }) =>
  ({ text }) =>
    [text, ...lines].join('\n')

const SKILL = ({ folder }) => `${folder}/${SKILL_FILE}`

export const CASES = [
  {
    context: skills(),
    expected: 0,
    name: 'healthy ticket skills pass'
  },
  {
    context: () =>
      contextOf({
        tree: Object.fromEntries(
          Object.entries(treeOf({})).map(([path, text]) => [
            path,
            text.replaceAll('\n', '\r\n')
          ])
        )
      }),
    expected: 0,
    name: 'a skill checked out with CRLF line endings passes'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: without({
          line: `| ${DROPPED_STATE} |`
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow that drops a state is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: withoutSection({
          heading: '## Board operations'
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow without its board operations is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: 'It names process-intake.',
          to: 'It names nothing.'
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose pre-flight does not send the team to process-intake is refused'
  },
  {
    context: skills({
      edits: { [`${CONTRACT}/${TICKET_TEMPLATE}`]: () => null }
    }),
    expected: 1,
    name: 'a ticket-flow without its ticket template is refused'
  },
  {
    context: skills({
      edits: {
        [`${CONTRACT}/${TICKET_TEMPLATE}`]: withoutSection({
          heading: '## Target version'
        })
      }
    }),
    expected: 1,
    name: 'a ticket template without its target version is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: without({ line: '| set version |' })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose board operations cannot set the target version is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: without({ line: '| CI/CD |' })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose roles table has no CI/CD row is refused'
  },
  {
    context: skills({
      edits: { [`${CONTRACT}/${RELEASE_TEMPLATE}`]: () => null }
    }),
    expected: 1,
    name: 'a ticket-flow without its release template is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'dev-ticket' })]: replace({
          from: READ_FIRST,
          to: 'Build the ticket.'
        })
      }
    }),
    expected: 1,
    name: 'a role skill that does not open with ticket-flow is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: append({
          lines: tableOf({ header: STATES_TABLE_HEADER, keys: [] })
        })
      }
    }),
    expected: 1,
    name: 'a role skill that copies the states table is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'po-ticket' })]: append({
          lines: tableOf({ header: OPERATIONS_TABLE_HEADER, keys: [] })
        })
      }
    }),
    expected: 1,
    name: 'a role skill that copies the board operations table is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: 'name: refine-ticket',
          to: 'name: refine'
        })
      }
    }),
    expected: 1,
    name: 'a ticket skill whose name is not its folder is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'po-ticket' })]: without({
          line: '  DO NOT USE:'
        })
      }
    }),
    expected: 1,
    name: 'a ticket skill without DO NOT USE is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: withoutSection({
          heading: '## CONTRACT'
        })
      }
    }),
    expected: 1,
    name: 'a ticket skill without its CONTRACT section is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: INTAKE })]: replace({
          from: /^---\n[\s\S]*?\n---\n/u,
          to: ''
        })
      }
    }),
    expected: 1,
    name: 'a ticket skill with no frontmatter is refused once'
  },
  {
    context: skills({
      edits: { [SKILL({ folder: 'dev-ticket' })]: () => null }
    }),
    expected: 1,
    name: 'a missing ticket skill is caught, not skipped'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: withoutSection({
          heading: '## Board adapter'
        })
      }
    }),
    expected: 1,
    name: 'a process template without the board adapter section is refused'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: without({
          line: `| ${DROPPED_OPERATION} |`
        })
      }
    }),
    expected: 1,
    name: 'a process template that leaves out a board operation is refused'
  },
  {
    context: skills({
      edits: { [`${INTAKE}/${PROCESS_TEMPLATE}`]: () => null }
    }),
    expected: 1,
    name: 'a missing process template is caught, not skipped'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: withoutSection({
          heading: '## Deploy targets'
        })
      }
    }),
    expected: 1,
    name: 'a process template without the deploy targets section is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'release-ticket' })]: withoutSection({
          heading: '## Branching'
        })
      }
    }),
    expected: 1,
    name: 'a release-ticket without its branching section is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'release-ticket' })]: replace({
          from: 'It names tags only.',
          to: 'It names nothing.'
        })
      }
    }),
    expected: 1,
    name: 'a release-ticket whose branching names no tags-only alternative is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: withoutSection({
          heading: '## Group a release'
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket without its release step is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: LOW_RISK_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose rules name no low-risk merge policy is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: replace({
          from: MANUAL_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket whose merge step names no manual merge policy is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: replace({
          from: LOW_RISK_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket whose merge step names no low-risk merge policy is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: withoutSection({
          heading: QA_MERGE_STEP
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket without its merge step is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: INTAKE })]: replace({
          from: LOW_RISK_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a process-intake whose mapping step names no low-risk merge policy is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: INTAKE })]: withoutSection({
          heading: INTAKE_MAPPING_STEP
        })
      }
    }),
    expected: 1,
    name: 'a process-intake without its mapping step is refused'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: replace({
          from: LOW_RISK_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a process template whose merge policy names no low-risk policy is refused'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: without({ line: POLICY_FIELD })
      }
    }),
    expected: 1,
    name: 'a process template whose merge policy has no Policy line is refused'
  }
]

// The check as `node scripts/verify-skills.mjs --root <tree>` runs it, over
// a scratch tree holding the skills under .claude/skills/.
const runCheck = ({ edits }) =>
  withScratchTree({
    files: Object.fromEntries(
      Object.entries(treeOf({ edits })).map(([path, text]) => [
        `${SKILLS_ROOT}/${path}`,
        text
      ])
    ),
    prefix: 'verify-skills-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [CHECK, '--root', root], {
        encoding: 'utf8'
      })
  })

const checks = [
  {
    name: 'a dropped state is named with the skill it is missing from',
    run: () => {
      const [finding] = gate.run(
        skills({
          edits: {
            [SKILL({ folder: CONTRACT })]: without({
              line: `| ${DROPPED_STATE} |`
            })
          }
        })()
      )
      assert.equal(finding.kind, FINDING_KIND.row)
      assert.equal(finding.folder, CONTRACT)
      assert.ok(
        finding.detail.includes(DROPPED_STATE),
        `the finding does not name the state: ${finding.detail}`
      )
    }
  },
  {
    name: 'a name that is not its folder is named with both',
    run: () => {
      const [finding] = gate.run(
        skills({
          edits: {
            [SKILL({ folder: 'refine-ticket' })]: replace({
              from: 'name: refine-ticket',
              to: 'name: refine'
            })
          }
        })()
      )
      assert.equal(finding.kind, FINDING_KIND.name)
      assert.match(finding.detail, /refine-ticket/u)
      assert.match(finding.detail, /`refine`/u)
    }
  },
  {
    name: 'a dropped merge policy is named with its file and section',
    run: () => {
      const findings = gate.run(
        skills({
          edits: {
            [SKILL({ folder: CONTRACT })]: replace({
              from: LOW_RISK_NAMED,
              to: NAMES_NOTHING
            })
          }
        })()
      )
      assert.equal(findings.length, 1, JSON.stringify(findings))
      const [finding] = findings
      assert.equal(finding.kind, FINDING_KIND.mention)
      assert.equal(finding.folder, CONTRACT)
      assert.ok(
        finding.detail.startsWith(`${SKILLS_ROOT}/${CONTRACT}/${SKILL_FILE}`),
        `the finding does not name the file: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(RULES),
        `the finding does not name the section: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes('`low-risk`'),
        `the finding does not name the policy: ${finding.detail}`
      )
    }
  },
  {
    name: 'a process template whose merge policy does not default to manual is refused',
    run: () => {
      const findings = gate.run(
        skills({
          edits: {
            [`${INTAKE}/${PROCESS_TEMPLATE}`]: replace({
              from: POLICY_LINE,
              to: `${POLICY_FIELD} \`low-risk\``
            })
          }
        })()
      )
      assert.equal(findings.length, 1, JSON.stringify(findings))
      const [finding] = findings
      assert.equal(finding.kind, FINDING_KIND.value)
      assert.equal(finding.folder, INTAKE)
      assert.ok(
        finding.detail.startsWith(`${SKILLS_ROOT}/${INTAKE}/${PROCESS_TEMPLATE}`),
        `the finding does not name the file: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(POLICY_FIELD),
        `the finding does not name the line: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes('`manual`'),
        `the finding does not name the default it owes: ${finding.detail}`
      )
    }
  },
  {
    name: 'the cases fail against a gate that finds nothing',
    run: () => {
      const failures = runCases({ cases: CASES, gate: blindGate({ gate }) })
      assert.ok(failures.length > 0, 'every case passed a blinded gate')
    }
  },
  {
    name: 'the check run over a tree that lacks a ticket skill exits 1 and names it',
    run: () => {
      const result = runCheck({
        edits: { [SKILL({ folder: 'dev-ticket' })]: () => null }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-skills: 1 problem/u)
      assert.match(result.stderr, /dev-ticket\/SKILL\.md/u)
    }
  },
  {
    name: 'the seven ticket skills of the repository pass',
    run: () => {
      const findings = gate.run(collectContext({ root: REPO_ROOT }))
      assert.deepEqual(
        findings.map(({ detail }) => detail),
        [],
        'the ticket skills of the repository break their contracts'
      )
    }
  },
  {
    name: 'the check exits 0 over the repository and states what it judged',
    run: () => {
      const result = spawnSync(process.execPath, [CHECK], {
        encoding: 'utf8'
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-skills: PASS/u)
      assert.match(result.stdout, /7 ticket skill\(s\)/u)
      assert.match(result.stdout, /NOT covered: /u)
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
