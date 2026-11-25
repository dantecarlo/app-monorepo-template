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
// repository itself. It also runs the checks of the general plan's
// validator, which the architect's close step writes through, since no other
// script runs a test under .claude/skills/.
//
// Usage:
//   node --test scripts/verify-skills.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { GENERAL_PLAN_CHECKS } from '../.claude/skills/general-plan/validate-general-plan.test.mjs'
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
import { HARNESS_CONFIG } from './verify-harness-config.mjs'
import { DEFAULT_IDENTITY, IDENTITY_INFO } from './verify-ticket-branch.mjs'

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
const QA_CHECKOUT_STEP = '## Step 2 — Check out the branch'
const QA_DECIDE_STEP = '## Step 5 — Decide'
const QA_HANDOFF_STEP = '## Step 6 — Hand it to the architect'
const MERGE_QUEUE = '## Merge queue'
const INTAKE_MAPPING_STEP = '## Step 3 — Map it onto the core'
const LOW_RISK_NAMED = 'It names `low-risk`.'
const NAMES_NOTHING = 'It names nothing.'
const DETACH = '--detach'
const DETACH_NAMED = `It names ${DETACH}.`
const PUSH_NAMED = 'It names git push origin HEAD:<branch>.'
const HOTFIX_NAMED = 'It names `<id> ready to merge, hotfix`.'
const READY_TO_MERGE_NAMED = 'It names ready to merge, PR #.'
const DONE_MOVE = 'Ready to merge → Done'
const VERSION_REQUIRED_NAMED = 'It names **Version (required):**.'
const HOTFIX_LEFT_NAMED = 'It names QA leaves it at Ready to merge.'
const POLICY_FIELD = '- **Policy:**'
// The merge policy is read from the harness config: the four sections that
// name both policies name the file, and the template's Policy line names the
// setting rather than recording a policy of its own.
const CONFIG_NAMED = `It names \`${HARNESS_CONFIG}\`.`
// The two sections that read the policy fail closed, and read it from the
// default branch, so a pull request cannot change its own policy. The
// fail-closed clause names both policies, so a section that drops one of
// them drops the clause with it.
const LOW_RISK = 'low-risk'
const MANUAL = 'manual'
const FAIL_CLOSED =
  'value other than `low-risk`, a missing file, or a file that does not parse means `manual`'
const FAIL_CLOSED_NAMED = `It names ${FAIL_CLOSED}.`
const DEFAULT_BRANCH_COPY =
  "the default branch's copy, never from the pull request's own branch"
const DEFAULT_BRANCH_COPY_NAMED = `It names ${DEFAULT_BRANCH_COPY}.`
const POLICY_DROPPED = `does not name \`${LOW_RISK}\``
const ANY_POLICY_LINE = /^- \*\*Policy:\*\* .*$/mu
const POLICY_RECORDED = `${POLICY_FIELD} \`manual\``
const PRODUCTION_FIELD = '- **Production branch:**'
const PRODUCTION_LINE = `${PRODUCTION_FIELD} \`production\``
const IDENTITY = '## Ticket identity'
const BRANCH_TYPES_NAMED = 'It names `branchTypes`.'
const BLOCK_NAMED = `It names \`${IDENTITY_INFO}\`.`
const REQUIRED_SLUG = '"slug": "required"'
const SOURCE_NAMED = 'It names source of every open ticket.'
// The architect, not the PO, records each closed ticket in the general plan's
// catalog, in one pull request per close or release, and brings that pull
// request current itself, since no QA holds it.
const RECORD_STEP = '## Record the closed tickets'
const CATALOG_NAMED = 'It names § Closed Ticket Catalog.'
const ONE_PULL_REQUEST_NAMED = 'It names one pull request per close or release.'
const CATALOG_CURRENT_NAMED = 'It names the architect brings it current itself.'
// The PO does no repository work, so its CONTRACT lists no file it edits.
const EDITS = 'edits:'
// A ticket closed without delivery ends in Dropped, apart from Closed: the
// PO decides it and records why, the architect moves it and records it in
// the catalog's own table, and the dev and QA sessions stop on its line.
const DROPPED_ROW = '| Dropped |'
const DROPPED_HEADING = '## Dropped'
const SUPERSEDED_NAMED = 'It names Superseded by:.'
const DROPPED_NAMED = 'It names `<id> dropped`.'
const DROPPED_TABLE_NAMED = 'It names `### Dropped tickets`.'
const PO_DROP_STEP = '## Step 6 — Drop a ticket'
const DROP_STEP = '## Drop a ticket'
// Before the architect asks the owner for that pull request, it checks each
// row the pull request adds against the ticket's board page.
const CATALOG_BOARD_CHECK =
  'matches its board page in id, title, target version and closing pull request'
const CATALOG_BOARD_CHECK_NAMED = `It names ${CATALOG_BOARD_CHECK}.`
// QA brings a pull request current once, before Ready to merge; every later
// bring-current is the architect's, from a spare worktree of its own, pushed
// unforced in the background, and a code conflict goes back to the dev
// session. No session is asked to bring a branch current, and QA moves no
// ticket back from Ready to merge.
const MESSAGES = '## Messages'
const SPARE_WORKTREE = "a spare worktree of its own, never QA's or the dev's"
const SPARE_WORKTREE_NAMED = `It names ${SPARE_WORKTREE}.`
const BACKGROUND_NAMED = 'It names in the background.'
const CONFLICT_BACK_NAMED =
  'It names a code conflict goes back to the dev session.'
const BRING_CURRENT = '<id> bring current'
const BRING_CURRENT_ROW = `| \`${BRING_CURRENT}\` | architect to the ticket's QA |`
const BACK_FROM_READY = 'Ready to merge → Changes requested'

// The block a process template's Ticket identity section ships: the branch
// check's defaults, as JSON.
const IDENTITY_BLOCK = [
  `\`\`\`${IDENTITY_INFO}`,
  JSON.stringify(DEFAULT_IDENTITY, null, 2),
  '```'
]
const ANY_IDENTITY_BLOCK = /```json ticket-identity\n[\s\S]*?\n```\n/u

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
// the contract names one, the text a section must mention, the line a
// section must give its default in, and the ticket identity block a section
// must hold.
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
    const identity =
      contract.identity?.heading === heading ? [...IDENTITY_BLOCK, ''] : []
    return [
      heading,
      '',
      ...mentions,
      ...defaults,
      ...identity,
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

// Every mention of one merge policy gone from a file, the fail-closed
// clause's included.
const withoutPolicy =
  ({ policy }) =>
  ({ text }) =>
    text.replaceAll(`\`${policy}\``, 'nothing')

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
        [`${CONTRACT}/${TICKET_TEMPLATE}`]: replace({
          from: VERSION_REQUIRED_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a ticket template that does not mark its version required is refused'
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
  // The policy and the fail-closed clause, which names it: two findings.
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: withoutPolicy({ policy: LOW_RISK })
      }
    }),
    expected: 2,
    name: 'a ticket-flow whose rules name no low-risk merge policy is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: withoutPolicy({
          policy: MANUAL
        })
      }
    }),
    expected: 2,
    name: 'a refine-ticket whose merge queue names no manual merge policy is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: withoutPolicy({
          policy: LOW_RISK
        })
      }
    }),
    expected: 2,
    name: 'a refine-ticket whose merge queue names no low-risk merge policy is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: FAIL_CLOSED_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose rules do not fail closed to manual is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: DEFAULT_BRANCH_COPY_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: "a ticket-flow whose rules do not read the policy from the default branch's copy is refused"
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: FAIL_CLOSED_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose merge queue does not fail closed to manual is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: DEFAULT_BRANCH_COPY_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: "a refine-ticket whose merge queue does not read the policy from the default branch's copy is refused"
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: withoutSection({
          heading: MERGE_QUEUE
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket without its merge queue is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: withoutSection({
          heading: QA_HANDOFF_STEP
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket without its hand-off step is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: replace({
          from: READY_TO_MERGE_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket whose hand-off step names no ready to merge message is refused'
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
        [SKILL({ folder: CONTRACT })]: replace({
          from: CONFIG_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose rules never name the harness config is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: CONFIG_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose merge queue never names the harness config is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: INTAKE })]: replace({
          from: CONFIG_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a process-intake whose mapping step never names the harness config is refused'
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
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: without({ line: PRODUCTION_FIELD })
      }
    }),
    expected: 1,
    name: 'a process template whose branching model names no production branch is refused'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: replace({
          from: PRODUCTION_LINE,
          to: `${PRODUCTION_FIELD} \`prod\``
        })
      }
    }),
    expected: 1,
    name: 'a process template whose production branch does not default to production is refused'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: replace({
          from: ANY_IDENTITY_BLOCK,
          to: ''
        })
      }
    }),
    expected: 1,
    name: 'a process template whose ticket identity holds no block is refused'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: replace({
          from: REQUIRED_SLUG,
          to: '"slug": "optional"'
        })
      }
    }),
    expected: 1,
    name: 'a process template whose ticket identity block is not the defaults is refused'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: replace({
          from: REQUIRED_SLUG,
          to: `${REQUIRED_SLUG},`
        })
      }
    }),
    expected: 1,
    name: 'a process template whose ticket identity block is malformed is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: BRANCH_TYPES_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose ticket identity names no branchTypes is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: BLOCK_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose ticket identity names no ticket-identity block is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: INTAKE })]: replace({
          from: BLOCK_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a process-intake whose mapping step names no ticket-identity block is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: replace({
          from: DETACH_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket whose checkout step adds no detached worktree is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: withoutSection({
          heading: QA_CHECKOUT_STEP
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket without its checkout step is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: replace({
          from: PUSH_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket whose decide step does not push HEAD to the ticket branch is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: withoutSection({
          heading: QA_DECIDE_STEP
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket without its decide step is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: replace({
          from: HOTFIX_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket whose hand-off step sends no hotfix message is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: HOTFIX_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose release step names no hotfix message is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: HOTFIX_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose messages name no hotfix line is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'release-ticket' })]: replace({
          from: HOTFIX_LEFT_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a release-ticket whose hotfix section does not leave it at Ready to merge is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: SOURCE_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose board operations do not make the board the source of open tickets is refused'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: replace({
          from: SOURCE_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a process template whose board adapter does not make the board the source of open tickets is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: withoutSection({
          heading: RECORD_STEP
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket without its close step is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: CATALOG_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose close step names no closed ticket catalog is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: ONE_PULL_REQUEST_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose close step does not open one pull request per close or release is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: CATALOG_CURRENT_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose merge queue does not bring the catalog pull request current is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: DROPPED_TABLE_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose close step does not record a dropped ticket apart is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: without({ line: DROPPED_ROW })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose states table has no Dropped row is refused'
  },
  {
    context: skills({
      edits: {
        [`${INTAKE}/${PROCESS_TEMPLATE}`]: without({ line: DROPPED_ROW })
      }
    }),
    expected: 1,
    name: 'a process template whose states table has no Dropped row is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: withoutSection({
          heading: DROPPED_HEADING
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow without its Dropped section is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: SUPERSEDED_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose Dropped section names no superseding ticket is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: DROPPED_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose messages name no dropped line is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'po-ticket' })]: withoutSection({
          heading: PO_DROP_STEP
        })
      }
    }),
    expected: 1,
    name: 'a po-ticket without its drop step is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'po-ticket' })]: replace({
          from: DROPPED_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a po-ticket whose drop step sends no dropped message is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: withoutSection({
          heading: DROP_STEP
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket without its drop step is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: DROPPED_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose drop step tells no session the ticket was dropped is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'dev-ticket' })]: replace({
          from: DROPPED_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a dev-ticket that does not stop on a dropped ticket is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: replace({
          from: DROPPED_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket that does not stop on a dropped ticket is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: DETACH_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose merge queue adds no detached worktree is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: PUSH_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose merge queue does not push HEAD to the ticket branch is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: BACKGROUND_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose merge queue does not push in the background is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: replace({
          from: CONFLICT_BACK_NAMED,
          to: NAMES_NOTHING
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket whose merge queue does not send a code conflict back to the dev session is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'refine-ticket' })]: append({
          lines: [`- Message its QA \`${BRING_CURRENT}\`.`]
        })
      }
    }),
    expected: 1,
    name: 'a refine-ticket that asks QA to bring a pull request current is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: CONTRACT })]: replace({
          from: `${MESSAGES}\n`,
          to: `${MESSAGES}\n\n${BRING_CURRENT_ROW}\n`
        })
      }
    }),
    expected: 1,
    name: 'a ticket-flow whose messages carry a bring current line is refused'
  },
  {
    context: skills({
      edits: {
        [SKILL({ folder: 'qa-ticket' })]: append({
          lines: ['moves:', `  - ${BACK_FROM_READY}`]
        })
      }
    }),
    expected: 1,
    name: 'a qa-ticket that moves a ticket back from Ready to merge is refused'
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
            [SKILL({ folder: CONTRACT })]: withoutPolicy({ policy: LOW_RISK })
          }
        })()
      )
      // The fail-closed clause names the policy, so it goes with it.
      assert.equal(findings.length, 2, JSON.stringify(findings))
      const finding = findings.find(({ detail }) =>
        detail.endsWith(POLICY_DROPPED)
      )
      assert.ok(finding, `no finding names the policy: ${JSON.stringify(findings)}`)
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
    name: 'a process template whose merge policy records a policy, not the harness config, is refused',
    run: () => {
      const findings = gate.run(
        skills({
          edits: {
            [`${INTAKE}/${PROCESS_TEMPLATE}`]: replace({
              from: ANY_POLICY_LINE,
              to: POLICY_RECORDED
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
        finding.detail.includes(`\`${HARNESS_CONFIG}\``),
        `the finding does not name the setting it owes: ${finding.detail}`
      )
    }
  },
  {
    name: 'a template block off the defaults is named with its file and field',
    run: () => {
      const findings = gate.run(
        skills({
          edits: {
            [`${INTAKE}/${PROCESS_TEMPLATE}`]: replace({
              from: REQUIRED_SLUG,
              to: '"slug": "optional"'
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
        finding.detail.includes(IDENTITY),
        `the finding does not name the section: ${finding.detail}`
      )
      assert.match(finding.detail, /\bslug\b/u)
      assert.ok(
        finding.detail.includes('"required"'),
        `the finding does not name the default it owes: ${finding.detail}`
      )
    }
  },
  {
    name: 'a checkout that is not detached is named with its file and section',
    run: () => {
      const findings = gate.run(
        skills({
          edits: {
            [SKILL({ folder: 'qa-ticket' })]: replace({
              from: DETACH_NAMED,
              to: NAMES_NOTHING
            })
          }
        })()
      )
      assert.equal(findings.length, 1, JSON.stringify(findings))
      const [finding] = findings
      assert.equal(finding.kind, FINDING_KIND.mention)
      assert.equal(finding.folder, 'qa-ticket')
      assert.ok(
        finding.detail.startsWith(`${SKILLS_ROOT}/qa-ticket/${SKILL_FILE}`),
        `the finding does not name the file: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(QA_CHECKOUT_STEP),
        `the finding does not name the section: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(DETACH),
        `the finding does not name what the step owes: ${finding.detail}`
      )
    }
  },
  {
    name: 'a qa-ticket that moves a ticket to Done is refused',
    run: () => {
      const findings = gate.run(
        skills({
          edits: {
            [SKILL({ folder: 'qa-ticket' })]: append({
              lines: ['moves:', `  - ${DONE_MOVE}`]
            })
          }
        })()
      )
      assert.equal(findings.length, 1, JSON.stringify(findings))
      const [finding] = findings
      assert.equal(finding.kind, FINDING_KIND.forbidden)
      assert.equal(finding.folder, 'qa-ticket')
      assert.ok(
        finding.detail.startsWith(`${SKILLS_ROOT}/qa-ticket/${SKILL_FILE}`),
        `the finding does not name the file: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(DONE_MOVE),
        `the finding does not name the move: ${finding.detail}`
      )
    }
  },
  {
    name: 'a po-ticket that edits a repository file is refused',
    run: () => {
      const findings = gate.run(
        skills({
          edits: {
            [SKILL({ folder: 'po-ticket' })]: append({
              lines: [EDITS, '  - docs/GENERAL_PLAN.md']
            })
          }
        })()
      )
      assert.equal(findings.length, 1, JSON.stringify(findings))
      const [finding] = findings
      assert.equal(finding.kind, FINDING_KIND.forbidden)
      assert.equal(finding.folder, 'po-ticket')
      assert.ok(
        finding.detail.startsWith(`${SKILLS_ROOT}/po-ticket/${SKILL_FILE}`),
        `the finding does not name the file: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(EDITS),
        `the finding does not name what the PO must not list: ${finding.detail}`
      )
    }
  },
  {
    name: 'a refine-ticket whose merge queue does not check the catalog rows against the board is refused',
    run: () => {
      const findings = gate.run(
        skills({
          edits: {
            [SKILL({ folder: 'refine-ticket' })]: replace({
              from: CATALOG_BOARD_CHECK_NAMED,
              to: NAMES_NOTHING
            })
          }
        })()
      )
      assert.equal(findings.length, 1, JSON.stringify(findings))
      const [finding] = findings
      assert.equal(finding.kind, FINDING_KIND.mention)
      assert.equal(finding.folder, 'refine-ticket')
      assert.ok(
        finding.detail.startsWith(
          `${SKILLS_ROOT}/refine-ticket/${SKILL_FILE}`
        ),
        `the finding does not name the file: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(MERGE_QUEUE),
        `the finding does not name the section: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(CATALOG_BOARD_CHECK),
        `the finding does not name the check it owes: ${finding.detail}`
      )
    }
  },
  {
    name: 'a refine-ticket whose merge queue brings no pull request current from a spare worktree of its own is refused',
    run: () => {
      const findings = gate.run(
        skills({
          edits: {
            [SKILL({ folder: 'refine-ticket' })]: replace({
              from: SPARE_WORKTREE_NAMED,
              to: NAMES_NOTHING
            })
          }
        })()
      )
      assert.equal(findings.length, 1, JSON.stringify(findings))
      const [finding] = findings
      assert.equal(finding.kind, FINDING_KIND.mention)
      assert.equal(finding.folder, 'refine-ticket')
      assert.ok(
        finding.detail.startsWith(
          `${SKILLS_ROOT}/refine-ticket/${SKILL_FILE}`
        ),
        `the finding does not name the file: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(MERGE_QUEUE),
        `the finding does not name the section: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(SPARE_WORKTREE),
        `the finding does not name the statement it owes: ${finding.detail}`
      )
    }
  },
  {
    name: 'a qa-ticket that waits for a later bring current is refused',
    run: () => {
      const findings = gate.run(
        skills({
          edits: {
            [SKILL({ folder: 'qa-ticket' })]: append({
              lines: [`- **\`${BRING_CURRENT}\`** — bring it current again.`]
            })
          }
        })()
      )
      assert.equal(findings.length, 1, JSON.stringify(findings))
      const [finding] = findings
      assert.equal(finding.kind, FINDING_KIND.forbidden)
      assert.equal(finding.folder, 'qa-ticket')
      assert.ok(
        finding.detail.startsWith(`${SKILLS_ROOT}/qa-ticket/${SKILL_FILE}`),
        `the finding does not name the file: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(BRING_CURRENT),
        `the finding does not name the line: ${finding.detail}`
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

registerCases({
  cases: CASES,
  checks: [...checks, ...GENERAL_PLAN_CHECKS],
  gate,
  meta: import.meta
})
