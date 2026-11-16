#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-ticket-branch — a pull request's branch names its ticket, and its
// body names the same one.
//
// The ticket flow (.claude/skills/ticket-flow/SKILL.md) builds every ticket
// on a branch `<type>/<id>-<slug>`: a type of the four the flow knows, the
// ticket's id as the board writes it, and a lower-case kebab slug. The id is
// a number, as a GitHub issue has, or an upper-case key, a hyphen and a
// number, as Jira and Linear write it. The pull request body names the id:
// `#<number>` for a number, the key itself for a key.
//
// Pure: `run` decides on a branch name and a body handed to it, and reads
// nothing. The template's own `validate` does not run it, since the
// template's branches carry no ticket id; a project that adopts the flow
// may add it to its CI, a decision its docs/process/ticket-flow.md records.
//
// Usage:
//   node scripts/verify-ticket-branch.mjs --branch <name> --body <text>
// ---------------------------------------------------------------------------

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const BRANCH_FLAG = '--branch'
const BODY_FLAG = '--body'
const NOT_FOUND = -1
const TYPE_SEPARATOR = '/'
const SLUG_SEPARATOR = '-'
const LINE_BREAK = /\r?\n/u

export const BRANCH_SHAPE = '<type>/<id>-<slug>'
export const TICKET_TYPES = ['feature', 'fix', 'tech', 'chore']

export const FINDING_KIND = Object.freeze({
  body: 'body',
  id: 'id',
  shape: 'shape',
  slug: 'slug',
  type: 'type'
})

// A number, or an upper-case key, a hyphen and a number. The number comes
// first, so `123-add` reads as the id 123 and the slug `add`.
const LEADING_ID = /^(?<id>\d+|[A-Z][A-Z0-9]*-\d+)/u
const NUMBER_ID = /^\d+$/u
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const NUMBER_REFERENCE = /#\d+/gu
const KEY_REFERENCE = /(?<![\p{L}\p{N}-])[A-Z][A-Z0-9]*-\d+(?!\p{N})/gu

// How a body writes an id: `#123` for a number, `PROJ-42` for a key. A
// longer id that starts with it, `#1234` or `PROJ-421`, is another ticket.
const referenceOf = ({ id }) => (NUMBER_ID.test(id) ? `#${id}` : id)

const namesId = ({ body, id }) => {
  const reference = referenceOf({ id })
  const pattern = NUMBER_ID.test(id)
    ? new RegExp(`${reference}(?!\\p{N})`, 'u')
    : new RegExp(`(?<![\\p{L}\\p{N}-])${reference}(?!\\p{N})`, 'u')
  return pattern.test(body)
}

const namedIds = ({ body }) => [
  ...new Set([
    ...(body.match(NUMBER_REFERENCE) ?? []),
    ...(body.match(KEY_REFERENCE) ?? [])
  ])
]

const finding = ({ branch, kind, reason }) => ({
  detail: `${branch === '' ? '(no branch)' : branch}: ${reason}`,
  kind
})

const describeBody = ({ body, id }) => {
  const others = namedIds({ body })
  const named =
    others.length === 0
      ? 'it names no ticket'
      : `it names ${others.join(', ')}`
  return (
    `the pull request body does not name the ticket ${referenceOf({ id })}, ` +
    `and ${named}; the body names the id its branch carries`
  )
}

// Every defect of the branch is a finding of its own, so a fix for one
// does not hide the next: the type, then the id, then the slug, then the
// body, which is judged only once the branch has an id to look for.
const judge = ({ body, branch }) => {
  const separator = branch.indexOf(TYPE_SEPARATOR)
  if (separator === NOT_FOUND) {
    return [
      finding({
        branch,
        kind: FINDING_KIND.shape,
        reason: `a ticket branch is ${BRANCH_SHAPE}, and this one has no type before a /`
      })
    ]
  }

  const type = branch.slice(0, separator)
  const rest = branch.slice(separator + TYPE_SEPARATOR.length)
  const typeFindings = TICKET_TYPES.includes(type)
    ? []
    : [
        finding({
          branch,
          kind: FINDING_KIND.type,
          reason:
            `the type ${type === '' ? '(none)' : type} is not one of ` +
            `${TICKET_TYPES.join(', ')}; a ticket branch is ${BRANCH_SHAPE}`
        })
      ]

  const match = rest.match(LEADING_ID)
  if (!match) {
    return [
      ...typeFindings,
      finding({
        branch,
        kind: FINDING_KIND.id,
        reason:
          'no ticket id follows the type: a number or an upper-case key ' +
          `and a number, as in ${BRANCH_SHAPE}`
      })
    ]
  }

  const { id } = match.groups
  const afterId = rest.slice(id.length)
  const slug = afterId.startsWith(SLUG_SEPARATOR)
    ? afterId.slice(SLUG_SEPARATOR.length)
    : null
  const slugFindings =
    slug !== null && SLUG.test(slug)
      ? []
      : [
          finding({
            branch,
            kind: FINDING_KIND.slug,
            reason:
              afterId === ''
                ? `the slug is missing after the id ${id}; a ticket branch is ${BRANCH_SHAPE}`
                : `the slug after the id ${id} is not lower-case kebab, ` +
                  `as in ${BRANCH_SHAPE}`
          })
        ]

  const bodyFindings = namesId({ body, id })
    ? []
    : [
        finding({
          branch,
          kind: FINDING_KIND.body,
          reason: describeBody({ body, id })
        })
      ]

  return [...typeFindings, ...slugFindings, ...bodyFindings]
}

export const gate = defineGate({
  claims:
    `the branch is ${BRANCH_SHAPE}, with a type of ` +
    `${TICKET_TYPES.join(', ')}, an id that is a number or an upper-case ` +
    'key and a number, and a lower-case kebab slug; and the pull request ' +
    'body names that id, as #<number> or as the key.',
  id: 'verify-ticket-branch',
  notCovered:
    'whether the ticket exists on the board, which state it is in and ' +
    'whether its type matches the branch type, all of which need the board ' +
    'and the network; the Conventional Commit types of the commits, which ' +
    'commitlint judges; and whether the slug describes the ticket.',
  run: ({ body, branch }) => judge({ body, branch })
})

const readFlag = ({ flag }) => {
  const index = process.argv.indexOf(flag)
  return index === NOT_FOUND ? '' : (process.argv[index + 1] ?? '')
}

const main = () => {
  const context = {
    body: readFlag({ flag: BODY_FLAG }),
    branch: readFlag({ flag: BRANCH_FLAG })
  }

  reportGate({
    context,
    denominator:
      `the branch ${context.branch === '' ? '(none)' : context.branch} and ` +
      `a pull request body of ${context.body.split(LINE_BREAK).length} line(s)`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-ticket-branch.mjs')
) {
  main()
}
