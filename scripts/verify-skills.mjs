#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-skills — the seven ticket skills carry the sections the flow needs.
//
// The ticket flow is seven skills under .claude/skills/: `ticket-flow`, the
// contract every role reads first; five role procedures (`po-ticket`,
// `refine-ticket`, `dev-ticket`, `qa-ticket`, `release-ticket`) that open by
// sending the reader to it and never copy it; and `process-intake`, which
// writes a project's layer from a template in its folder. A skill that loses
// a state, a role, a board operation or a section reads as whole to the agent
// that loads it, and nothing else notices, so this check holds each to its
// contract:
//
//   - every skill: a frontmatter `name` that is its folder, a description
//     with USE WHEN and DO NOT USE, a CONTRACT and an Output section;
//   - `ticket-flow`: its sections, a row for every state, role and board
//     operation, board operations that name the board the source of every
//     open ticket, a pre-flight that names `process-intake`, messages that
//     name the hotfix's line `<id> ready to merge, hotfix`, rules that name
//     both merge policies, a ticket identity that names `branchTypes` and
//     the `json ticket-identity` block, and its ticket and release
//     templates, the ticket's target version marked required;
//   - a role skill: a first paragraph that names ticket-flow's SKILL.md, and
//     neither of the contract's two tables; `po-ticket` a close step that
//     records the closed tickets in the plan's closed ticket catalog, one
//     pull request per close or release; `refine-ticket` a merge queue
//     that names both merge policies and a release step that names the
//     hotfix's line; `qa-ticket` a checkout step that adds a `--detach`
//     worktree, a decide step that pushes `HEAD:<branch>`, a hand-off step
//     that names its `<id> ready to merge, PR #<n>` line and the hotfix's
//     line, and no move of a ticket to Done, which is the architect's; and
//     `release-ticket` its deploy targets, branching, migrations and a hotfix
//     section in which QA leaves the hotfix at Ready to merge;
//   - `process-intake`: a mapping step that names both merge policies and
//     the `json ticket-identity` block, and the template of the project
//     layer, with a row for every board operation and every state, a board
//     adapter that names the board the source of every open ticket, its
//     deploy targets, a merge policy section that names both policies and
//     gives `manual` as the default, a branching model whose production
//     branch line gives `production` as the default, and a ticket identity
//     section holding
//     one block that verify-ticket-branch reads with no finding and whose
//     fields are its defaults, so the contract, the template and the check
//     agree.
//
// `run` is pure: it decides on the files `collectContext` gathers, so a case
// drives it from synthetic skills.
//
// Usage:
//   node scripts/verify-skills.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'
import {
  DEFAULT_IDENTITY,
  IDENTITY_INFO,
  readIdentityBlock
} from './verify-ticket-branch.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const NOT_FOUND = -1
const LINE_BREAK = /\r?\n/u
const FRONTMATTER_FENCE = '---'
const NAME_LINE = /^name:\s*(?<name>\S.*?)\s*$/u
const TITLE = /^# /u
const SECTION = /^## /u
const TABLE_LINE = /^\s*\|/u
const CELL_SEPARATOR = '|'
const USE_WHEN = 'USE WHEN:'
const DO_NOT_USE = 'DO NOT USE:'
const CONTRACT_LINK = 'ticket-flow/SKILL.md'

export const SKILLS_ROOT = '.claude/skills'
export const SKILL_FILE = 'SKILL.md'

export const FINDING_KIND = Object.freeze({
  forbidden: 'forbidden',
  frontmatter: 'frontmatter',
  heading: 'heading',
  mention: 'mention',
  missing: 'missing',
  name: 'name',
  opening: 'opening',
  restated: 'restated',
  row: 'row',
  table: 'table',
  trigger: 'trigger',
  value: 'value'
})

export const STATES = [
  'Backlog',
  'Refinement',
  'Ready for dev',
  'In dev',
  'Ready for QA',
  'In QA',
  'Changes requested',
  'Ready to merge',
  'Done',
  'Closed',
  'Ready for prod',
  'In release',
  'Released'
]

export const ROLES = [
  'PO',
  'Architect',
  'Dev',
  'QA',
  'CI/CD',
  'Independent area'
]

export const OPERATIONS = [
  'create',
  'read',
  'move',
  'comment',
  'link',
  'read version',
  'set version'
]

// The merge policies a project layer may record (decision 38): `manual`, the
// default, keeps the owner's word on every merge; `low-risk` lets the
// architect merge a pull request that meets every condition of ticket-flow's
// rule 4.
export const MERGE_POLICIES = ['manual', 'low-risk']
export const DEFAULT_MERGE_POLICY = 'manual'

// The header cells of the contract's two tables. A role skill holding
// either has copied the contract instead of reading it.
export const STATES_TABLE_HEADER = [
  'State',
  'Entered by',
  'Then the notifier tells',
  'GitHub label'
]
export const OPERATIONS_TABLE_HEADER = [
  'Operation',
  'What it does',
  'GitHub Issues, through `gh`'
]
const ROLES_TABLE_HEADER = ['Role', 'Responsibility', 'Skill']
const ADAPTER_TABLE_HEADER = ['Operation', 'Command or tool call']
const TARGETS_TABLE_HEADER = [
  'Target',
  'Kind',
  'Trigger',
  'Order',
  'Check',
  'Rollback',
  'Secrets in'
]
const STATE_NAMES_TABLE_HEADER = ['Core state', "This project's name"]

const SHAPE_HEADINGS = ['## CONTRACT', '## Output']

const RULES_HEADING = '## Rules every role follows'
const QA_CHECKOUT_STEP = '## Step 2 — Check out the branch'
const QA_DECIDE_STEP = '## Step 5 — Decide'
const QA_HANDOFF_STEP = '## Step 6 — Hand it to the architect'
const MERGE_QUEUE = '## Merge queue'
const INTAKE_MAPPING_STEP = '## Step 3 — Map it onto the core'
const IDENTITY_HEADING = '## Ticket identity'
const MERGE_POLICY_HEADING = '## Merge policy'
const POLICY_FIELD = '- **Policy:**'

// The production branch is the one the project layer names; the template
// ships `production`, the default, for a team that names no other.
const BRANCHING_MODEL_HEADING = '## Branching model'
const PRODUCTION_BRANCH_FIELD = '- **Production branch:**'
const DEFAULT_PRODUCTION_BRANCH = 'production'

// QA checks a ticket out detached at the remote branch, because the dev
// session's worktree holds the branch and git refuses to check one branch out
// in two worktrees; it pushes its detached HEAD back to the branch, unforced.
const DETACHED_CHECKOUT = '--detach'
const HEAD_PUSH = 'git push origin HEAD:<branch>'

// The architect keeps the merge queue and merges: QA stops at Ready to merge
// and hands the pull request over with this line, and never moves a ticket
// to Done.
const READY_TO_MERGE_MESSAGE = 'ready to merge, PR #'
const DONE_MOVE = 'Ready to merge → Done'

// A hotfix is never in the merge queue: QA leaves it at Ready to merge and
// tells the architect with this line, the architect lists it in a release of
// its own, and the CI/CD session merges it into the production branch as that
// release's deploy step.
const HOTFIX_MESSAGE = '<id> ready to merge, hotfix'
const HOTFIX_LEFT = 'QA leaves it at Ready to merge'
const RELEASE_STEP = '## Group a release'
const MESSAGES_HEADING = '## Messages'
const HOTFIX_HEADING = '## Hotfix'

// The board is the source of every open ticket, its content included:
// nothing in the repository writes or mirrors one, and the general plan
// records a ticket only once it is closed. The contract and the template of
// the project layer say so where they name the board.
const BOARD_SOURCE = 'source of every open ticket'
const BOARD_OPERATIONS_HEADING = '## Board operations'
const BOARD_ADAPTER_HEADING = '## Board adapter'

// On a close or a release the PO records each closed ticket in the general
// plan's catalog, in one pull request, and copies no open ticket there.
const PO_CLOSE_STEP = '## Step 6 — Record the closed tickets'
const CLOSED_CATALOG = '§ Closed Ticket Catalog'
const ONE_PULL_REQUEST = 'one pull request per close or release'

// Every ticket carries a target version, so every ticket closes through a
// release: the ticket template marks the field required.
const TARGET_VERSION_HEADING = '## Target version'
const VERSION_REQUIRED = '**Version (required):**'
const hotfixMention = ({ heading }) => ({
  heading,
  text: codeOf({ text: HOTFIX_MESSAGE })
})

const codeOf = ({ text }) => `\`${text}\``

// A section that must name every merge policy, each in backticks.
const policyMentions = ({ heading }) =>
  MERGE_POLICIES.map((policy) => ({ heading, text: codeOf({ text: policy }) }))

// The ticket identity a section must describe: the block the branch check
// reads, and `branchTypes`, the field a branch's prefix comes from.
const identityMentions = ({ heading }) => [
  { heading, text: codeOf({ text: 'branchTypes' }) },
  { heading, text: codeOf({ text: IDENTITY_INFO }) }
]

// What each ticket skill carries: the headings of its SKILL.md, the tables
// under some of them and the keys each table must list in its first column,
// the text a section must mention, and the files its folder holds beside
// SKILL.md, judged the same way.
export const SKILL_CONTRACTS = [
  {
    files: [
      {
        headings: [
          '## Requirement',
          '## Acceptance criteria',
          TARGET_VERSION_HEADING,
          '## Spec',
          '## Areas and subtasks',
          '## Test plan',
          '## Branch and pull request',
          '## QA evidence',
          '## Risk'
        ],
        mentions: [
          { heading: TARGET_VERSION_HEADING, text: VERSION_REQUIRED }
        ],
        name: 'ticket.template.md'
      },
      {
        headings: [
          '## Version',
          '## Tickets',
          '## Versions per target',
          '## Migrations',
          '## Changelog',
          '## Rollback',
          '## Staging evidence',
          "## Owner's go"
        ],
        name: 'release.template.md'
      }
    ],
    folder: 'ticket-flow',
    headings: [
      '## Pre-flight',
      BOARD_OPERATIONS_HEADING,
      '## States and transitions',
      '## The architect dispatches',
      MESSAGES_HEADING,
      '## Roles',
      RULES_HEADING,
      '## Ticket identity',
      '## What a ticket carries',
      '## Ready to merge',
      '## Release stage',
      ...SHAPE_HEADINGS
    ],
    mentions: [
      { heading: '## Pre-flight', text: 'docs/process/ticket-flow.md' },
      { heading: '## Pre-flight', text: 'process-intake' },
      { heading: BOARD_OPERATIONS_HEADING, text: BOARD_SOURCE },
      hotfixMention({ heading: MESSAGES_HEADING }),
      ...policyMentions({ heading: RULES_HEADING }),
      ...identityMentions({ heading: IDENTITY_HEADING })
    ],
    tables: [
      {
        header: OPERATIONS_TABLE_HEADER,
        heading: BOARD_OPERATIONS_HEADING,
        keys: OPERATIONS
      },
      {
        header: STATES_TABLE_HEADER,
        heading: '## States and transitions',
        keys: STATES
      },
      { header: ROLES_TABLE_HEADER, heading: '## Roles', keys: ROLES }
    ]
  },
  {
    folder: 'po-ticket',
    headings: [PO_CLOSE_STEP, ...SHAPE_HEADINGS],
    mentions: [
      { heading: PO_CLOSE_STEP, text: CLOSED_CATALOG },
      { heading: PO_CLOSE_STEP, text: ONE_PULL_REQUEST }
    ],
    role: true
  },
  {
    folder: 'refine-ticket',
    headings: [MERGE_QUEUE, RELEASE_STEP, ...SHAPE_HEADINGS],
    mentions: [
      ...policyMentions({ heading: MERGE_QUEUE }),
      hotfixMention({ heading: RELEASE_STEP })
    ],
    role: true
  },
  { folder: 'dev-ticket', headings: SHAPE_HEADINGS, role: true },
  {
    folder: 'qa-ticket',
    forbids: [
      {
        text: DONE_MOVE,
        why: 'the architect merges a ticket and moves it to Done'
      }
    ],
    headings: [
      QA_CHECKOUT_STEP,
      QA_DECIDE_STEP,
      QA_HANDOFF_STEP,
      ...SHAPE_HEADINGS
    ],
    mentions: [
      { heading: QA_CHECKOUT_STEP, text: DETACHED_CHECKOUT },
      { heading: QA_DECIDE_STEP, text: HEAD_PUSH },
      { heading: QA_HANDOFF_STEP, text: READY_TO_MERGE_MESSAGE },
      hotfixMention({ heading: QA_HANDOFF_STEP })
    ],
    role: true
  },
  {
    folder: 'release-ticket',
    headings: [
      '## Deploy targets',
      '## Branching',
      '## Migrations',
      HOTFIX_HEADING,
      ...SHAPE_HEADINGS
    ],
    mentions: [
      { heading: '## Branching', text: 'production' },
      { heading: '## Branching', text: 'tags only' },
      { heading: HOTFIX_HEADING, text: HOTFIX_LEFT }
    ],
    role: true
  },
  {
    files: [
      {
        defaults: [
          {
            field: POLICY_FIELD,
            heading: MERGE_POLICY_HEADING,
            value: codeOf({ text: DEFAULT_MERGE_POLICY })
          },
          {
            field: PRODUCTION_BRANCH_FIELD,
            heading: BRANCHING_MODEL_HEADING,
            value: codeOf({ text: DEFAULT_PRODUCTION_BRANCH })
          }
        ],
        headings: [
          BOARD_ADAPTER_HEADING,
          '## States',
          '## Roles and sessions',
          '## Approvals',
          MERGE_POLICY_HEADING,
          '## Ticket identity',
          '## Branch check in CI',
          '## Deploy targets',
          BRANCHING_MODEL_HEADING,
          '## Source'
        ],
        identity: { heading: IDENTITY_HEADING },
        mentions: [
          { heading: BOARD_ADAPTER_HEADING, text: BOARD_SOURCE },
          ...policyMentions({ heading: MERGE_POLICY_HEADING })
        ],
        name: 'ticket-flow.template.md',
        tables: [
          {
            header: ADAPTER_TABLE_HEADER,
            heading: BOARD_ADAPTER_HEADING,
            keys: OPERATIONS
          },
          {
            header: STATE_NAMES_TABLE_HEADER,
            heading: '## States',
            keys: STATES
          },
          {
            header: TARGETS_TABLE_HEADER,
            heading: '## Deploy targets',
            keys: []
          }
        ]
      }
    ],
    folder: 'process-intake',
    headings: [INTAKE_MAPPING_STEP, ...SHAPE_HEADINGS],
    mentions: [
      ...policyMentions({ heading: INTAKE_MAPPING_STEP }),
      { heading: INTAKE_MAPPING_STEP, text: codeOf({ text: IDENTITY_INFO }) }
    ]
  }
]

const linesOf = ({ text }) => text.split(LINE_BREAK)

const cellsOf = ({ line }) =>
  line
    .trim()
    .replace(/^\|/u, '')
    .replace(/\|$/u, '')
    .split(CELL_SEPARATOR)
    .map((cell) => cell.trim())

const sameCells = ({ cells, header }) =>
  cells.length === header.length &&
  cells.every((cell, index) => cell === header[index])

const isHeader = ({ header, line }) =>
  TABLE_LINE.test(line) && sameCells({ cells: cellsOf({ line }), header })

// The lines of a section: from its heading to the next `## ` heading.
const sectionOf = ({ heading, lines }) => {
  const start = lines.indexOf(heading)
  if (start === NOT_FOUND) return null
  const rest = lines.slice(start + 1)
  const end = rest.findIndex((line) => SECTION.test(line))
  return end === NOT_FOUND ? rest : rest.slice(0, end)
}

// The first cell of every row of the table under `header`, the header and
// its divider excluded; null when the section holds no such table.
const tableKeys = ({ header, lines }) => {
  const start = lines.findIndex((line) => isHeader({ header, line }))
  if (start === NOT_FOUND) return null
  const rows = lines.slice(start + 2)
  const end = rows.findIndex((line) => !TABLE_LINE.test(line))
  return (end === NOT_FOUND ? rows : rows.slice(0, end)).map(
    (line) => cellsOf({ line })[0]
  )
}

const finding = ({ detail, folder, kind, path }) => ({
  detail: `${path}: ${detail}`,
  folder,
  kind
})

const judgeTables = ({ folder, lines, path, tables = [] }) =>
  tables.flatMap(({ header, heading, keys }) => {
    const section = sectionOf({ heading, lines })
    if (section === null) return []
    const listed = tableKeys({ header, lines: section })
    if (listed === null) {
      return [
        finding({
          detail: `the section ${heading} holds no table | ${header.join(' | ')} |`,
          folder,
          kind: FINDING_KIND.table,
          path
        })
      ]
    }
    return keys
      .filter((key) => !listed.includes(key))
      .map((key) =>
        finding({
          detail: `the table under ${heading} has no row for ${key}`,
          folder,
          kind: FINDING_KIND.row,
          path
        })
      )
  })

const judgeMentions = ({ folder, lines, mentions = [], path }) =>
  mentions.flatMap(({ heading, text }) => {
    const section = sectionOf({ heading, lines })
    if (section === null || section.some((line) => line.includes(text))) {
      return []
    }
    return [
      finding({
        detail: `the section ${heading} does not name ${text}`,
        folder,
        kind: FINDING_KIND.mention,
        path
      })
    ]
  })

// Text a file must not hold anywhere: a role skill that holds it does what
// another role owns.
const judgeForbids = ({ folder, forbids = [], lines, path }) =>
  forbids
    .filter(({ text }) => lines.some((line) => line.includes(text)))
    .map(({ text, why }) =>
      finding({
        detail: `names ${text}, which it must not: ${why}`,
        folder,
        kind: FINDING_KIND.forbidden,
        path
      })
    )

// The line a section gives its default in: the field, then the default
// value alone, as in "- **Policy:** `manual`".
const judgeDefaults = ({ defaults = [], folder, lines, path }) =>
  defaults.flatMap(({ field, heading, value }) => {
    const section = sectionOf({ heading, lines })
    if (section === null) return []
    const line = section.find((item) => item.trim().startsWith(field))
    if (line === undefined) {
      return [
        finding({
          detail: `the section ${heading} has no line ${field}, which owes the default ${value}`,
          folder,
          kind: FINDING_KIND.value,
          path
        })
      ]
    }
    const given = line.trim().slice(field.length).trim()
    return given === value
      ? []
      : [
          finding({
            detail: `the line ${field} under ${heading} gives ${given === '' ? 'nothing' : given}, not the default ${value}`,
            folder,
            kind: FINDING_KIND.value,
            path
          })
        ]
  })

const sameValue = ({ left, right }) =>
  JSON.stringify(left) === JSON.stringify(right)

// The one ticket identity block a section holds, as the branch check reads
// it: no finding of its own, and every field the branch check's default.
const judgeIdentity = ({ folder, identity, lines, path }) => {
  if (identity === undefined) return []
  const section = sectionOf({ heading: identity.heading, lines })
  if (section === null) return []
  const at = `the section ${identity.heading}`
  const report = ({ detail }) =>
    finding({ detail, folder, kind: FINDING_KIND.value, path })
  const { fields, problems } = readIdentityBlock({ text: section.join('\n') })
  if (problems.length > 0) {
    return problems.map((problem) => report({ detail: `${at}: ${problem}` }))
  }
  if (fields === null) {
    return [
      report({
        detail:
          `${at} holds no ${codeOf({ text: IDENTITY_INFO })} block, which ` +
          "owes the branch check's defaults"
      })
    ]
  }
  return Object.entries(DEFAULT_IDENTITY)
    .filter(([field, value]) => !sameValue({ left: fields[field], right: value }))
    .map(([field, value]) =>
      report({
        detail:
          `${at}: the block's ${field} is ${JSON.stringify(fields[field])}, ` +
          `not the default ${JSON.stringify(value)}`
      })
    )
}

// The headings, tables, mentions, defaults and forbidden text a file owes; every file a
// contract names is judged by this, SKILL.md and the templates alike.
const judgeBody = ({ folder, lines, path, spec }) => [
  ...spec.headings
    .filter((heading) => !lines.includes(heading))
    .map((heading) =>
      finding({
        detail: `has no section ${heading}`,
        folder,
        kind: FINDING_KIND.heading,
        path
      })
    ),
  ...judgeTables({ folder, lines, path, tables: spec.tables }),
  ...judgeMentions({ folder, lines, mentions: spec.mentions, path }),
  ...judgeDefaults({ defaults: spec.defaults, folder, lines, path }),
  ...judgeForbids({ folder, forbids: spec.forbids, lines, path }),
  ...judgeIdentity({ folder, identity: spec.identity, lines, path })
]

const readFrontmatter = ({ lines }) => {
  if (lines[0] !== FRONTMATTER_FENCE) return null
  const end = lines.indexOf(FRONTMATTER_FENCE, 1)
  return end === NOT_FOUND ? null : lines.slice(1, end)
}

const judgeFrontmatter = ({ folder, lines, path }) => {
  const head = readFrontmatter({ lines })
  if (head === null) {
    return [
      finding({
        detail:
          'has no frontmatter between --- fences, so no runtime reads its ' +
          'name or its triggers',
        folder,
        kind: FINDING_KIND.frontmatter,
        path
      })
    ]
  }
  const name = head
    .map((line) => line.match(NAME_LINE))
    .find(Boolean)?.groups.name
  const text = head.join('\n')
  return [
    ...(name === folder
      ? []
      : [
          finding({
            detail: `its frontmatter name is \`${name ?? ''}\`, not its folder ${folder}`,
            folder,
            kind: FINDING_KIND.name,
            path
          })
        ]),
    ...[USE_WHEN, DO_NOT_USE]
      .filter((trigger) => !text.includes(trigger))
      .map((trigger) =>
        finding({
          detail: `its description has no ${trigger}`,
          folder,
          kind: FINDING_KIND.trigger,
          path
        })
      )
  ]
}

// The first paragraph after the title: the lines up to the next blank one.
const openingOf = ({ lines }) => {
  const title = lines.findIndex((line) => TITLE.test(line))
  if (title === NOT_FOUND) return []
  const rest = lines.slice(title + 1)
  const start = rest.findIndex((line) => line.trim() !== '')
  if (start === NOT_FOUND) return []
  const paragraph = rest.slice(start)
  const end = paragraph.findIndex((line) => line.trim() === '')
  return end === NOT_FOUND ? paragraph : paragraph.slice(0, end)
}

const judgeRole = ({ folder, lines, path }) => [
  ...(openingOf({ lines }).some((line) => line.includes(CONTRACT_LINK))
    ? []
    : [
        finding({
          detail: `its first paragraph does not send the reader to .claude/skills/${CONTRACT_LINK}`,
          folder,
          kind: FINDING_KIND.opening,
          path
        })
      ]),
  ...[
    { header: STATES_TABLE_HEADER, table: 'states table' },
    { header: OPERATIONS_TABLE_HEADER, table: 'board operations table' }
  ]
    .filter(({ header }) => lines.some((line) => isHeader({ header, line })))
    .map(({ table }) =>
      finding({
        detail: `copies the contract's ${table}; a role skill reads ticket-flow instead`,
        folder,
        kind: FINDING_KIND.restated,
        path
      })
    )
]

const missing = ({ folder, path }) =>
  finding({
    detail: 'is not there',
    folder,
    kind: FINDING_KIND.missing,
    path
  })

const judgeSkill = ({ contract, skill }) => {
  const { folder } = contract
  const skillPath = `${SKILLS_ROOT}/${folder}/${SKILL_FILE}`
  const text = skill?.files?.[SKILL_FILE] ?? null
  const extra = (contract.files ?? []).flatMap((spec) => {
    const path = `${SKILLS_ROOT}/${folder}/${spec.name}`
    const fileText = skill?.files?.[spec.name] ?? null
    return fileText === null
      ? [missing({ folder, path })]
      : judgeBody({
          folder,
          lines: linesOf({ text: fileText }),
          path,
          spec
        })
  })
  if (text === null) return [missing({ folder, path: skillPath }), ...extra]

  const lines = linesOf({ text })
  return [
    ...judgeFrontmatter({ folder, lines, path: skillPath }),
    ...judgeBody({ folder, lines, path: skillPath, spec: contract }),
    ...(contract.role ? judgeRole({ folder, lines, path: skillPath }) : []),
    ...extra
  ]
}

export const gate = defineGate({
  claims:
    `each of the ${SKILL_CONTRACTS.length} ticket skills has a SKILL.md ` +
    'whose frontmatter name is its folder, whose description holds USE ' +
    'WHEN and DO NOT USE, and which has a CONTRACT and an Output section; ' +
    'ticket-flow has its sections, a row for every state, role and board ' +
    'operation, board operations that name the board the ' +
    `${BOARD_SOURCE}, a pre-flight that names process-intake, messages that name ` +
    `${HOTFIX_MESSAGE}, rules that name ` +
    'both merge policies (manual and low-risk), a ticket identity that ' +
    `names branchTypes and the ${IDENTITY_INFO} block, and its ticket and ` +
    'release templates, the ticket template naming its target version ' +
    `${VERSION_REQUIRED}; each role skill opens by sending the reader to ` +
    'ticket-flow ' +
    "and copies neither of the contract's tables, po-ticket has a close " +
    `step that names ${CLOSED_CATALOG} and ${ONE_PULL_REQUEST}, ` +
    'refine-ticket has a ' +
    'merge queue that names both merge policies and a release step that ' +
    `names ${HOTFIX_MESSAGE}, qa-ticket a checkout step that names ` +
    `${DETACHED_CHECKOUT}, a decide step that names ${HEAD_PUSH}, a ` +
    `hand-off step that names ${READY_TO_MERGE_MESSAGE} and ` +
    `${HOTFIX_MESSAGE}, and no ${DONE_MOVE}, and release-ticket its ` +
    'deploy targets, its ' +
    'branching with the tags-only alternative, its migrations and a ' +
    `hotfix section that says ${HOTFIX_LEFT}; and ` +
    'process-intake has a mapping step that names both merge policies and ' +
    `the ${IDENTITY_INFO} block, and holds the template of the project ` +
    'layer, with a row for every board operation and every state, a board ' +
    `adapter that names the board the ${BOARD_SOURCE}, a deploy ` +
    'targets table, a merge policy section that names both policies and ' +
    'whose Policy line gives manual, the default, a branching model whose ' +
    `Production branch line gives ${DEFAULT_PRODUCTION_BRANCH}, the ` +
    'default, and a ticket identity ' +
    `section holding one ${IDENTITY_INFO} block that verify-ticket-branch ` +
    'reads with no finding and whose fields are its defaults.',
  id: 'verify-skills',
  notCovered:
    'whether a procedure says what an agent should do, which only the ' +
    'pull request review reads; a role skill that restates the contract ' +
    'in prose rather than by copying its tables; and the other skills of ' +
    '.claude/skills/, which do not all carry a DO NOT USE, a CONTRACT and ' +
    'an Output yet.',
  run: ({ skills }) =>
    SKILL_CONTRACTS.flatMap((contract) =>
      judgeSkill({
        contract,
        skill: skills.find(({ folder }) => folder === contract.folder)
      })
    )
})

const readOptional = ({ path }) =>
  existsSync(path) && statSync(path).isFile()
    ? readFileSync(path, 'utf8')
    : null

// Gathers every file each contract names, null when it is not there, so a
// missing skill is judged rather than skipped.
export const collectContext = ({ root }) => ({
  skills: SKILL_CONTRACTS.map(({ files = [], folder }) => ({
    files: Object.fromEntries(
      [SKILL_FILE, ...files.map(({ name }) => name)].map((name) => [
        name,
        readOptional({ path: join(root, SKILLS_ROOT, folder, name) })
      ])
    ),
    folder
  }))
})

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === NOT_FOUND
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

const main = () => {
  const context = collectContext({ root: readRoot() })
  const files = context.skills.reduce(
    (count, { files: named }) => count + Object.keys(named).length,
    0
  )

  reportGate({
    context,
    denominator:
      `${context.skills.length} ticket skill(s) and the ${files} file(s) ` +
      `they hold under ${SKILLS_ROOT}`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-skills.mjs')
) {
  main()
}
