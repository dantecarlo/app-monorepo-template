#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-ticket-branch — a pull request's branch names its ticket, and its
// body names the same one, under the project's ticket identity.
//
// The ticket flow (.claude/skills/ticket-flow/SKILL.md) builds every ticket
// on a branch `<type>/<id>-<slug>`, or `<type>/<id>` when the project's slug
// is optional. What a type, an id and a slug may be is the project's: its
// layer, docs/process/ticket-flow.md, declares them in one fenced block with
// the info string `json ticket-identity`:
//
//   - `idPattern`: a regular-expression source for one id, matched whole;
//   - `branchTypes`: the prefixes a ticket branch may start with;
//   - `slug`: `required` or `optional`.
//
// With no layer, or no block in it, the defaults hold: a number, as a GitHub
// issue has, or an upper-case key, a hyphen and a number, as Jira and Linear
// write it; the types feature, fix, tech and chore; and a required slug. A
// malformed block is a finding, never a silent fall back to the defaults.
// The pull request body names the id: `#<number>` for a number, the id
// itself otherwise.
//
// `run` is pure: it decides on a branch, a body, the layer's text and the
// flags handed to it. `main` reads the layer from the working directory. The
// template's own `validate` does not run the check, since the template's
// branches carry no ticket id; a project that adopts the flow may add it to
// its CI, a decision its docs/process/ticket-flow.md records.
//
// Usage:
//   node scripts/verify-ticket-branch.mjs --branch <name> --body <text>
//     [--layer <path>] [--id-pattern <source>] [--types <a,b,...>]
//     [--slug <required|optional>]
// ---------------------------------------------------------------------------

import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const BRANCH_FLAG = '--branch'
const BODY_FLAG = '--body'
const LAYER_FLAG = '--layer'
const NOT_FOUND = -1
const TYPE_SEPARATOR = '/'
const SLUG_SEPARATOR = '-'
const LIST_SEPARATOR = ','
const LINE_BREAK = /\r?\n/u
const UNICODE = 'u'

export const LAYER_PATH = 'docs/process/ticket-flow.md'
export const IDENTITY_INFO = 'json ticket-identity'
export const BRANCH_SHAPE = '<type>/<id>-<slug>'
export const OPTIONAL_SLUG_SHAPE = `<type>/<id> or ${BRANCH_SHAPE}`

export const SLUG_RULE = Object.freeze({
  optional: 'optional',
  required: 'required'
})

// The three fields of a ticket identity, each with the flag that replaces
// it on the command line.
export const IDENTITY_FIELDS = Object.freeze({
  branchTypes: '--types',
  idPattern: '--id-pattern',
  slug: '--slug'
})

export const TICKET_TYPES = Object.freeze(['feature', 'fix', 'tech', 'chore'])

// A number, or an upper-case key, a hyphen and a number.
export const DEFAULT_IDENTITY = Object.freeze({
  branchTypes: TICKET_TYPES,
  idPattern: '\\d+|[A-Z][A-Z0-9]*-\\d+',
  slug: SLUG_RULE.required
})
const DEFAULT_ID_WORDS = 'a number or an upper-case key and a number'

export const FINDING_KIND = Object.freeze({
  body: 'body',
  id: 'id',
  identity: 'identity',
  shape: 'shape',
  slug: 'slug',
  type: 'type'
})

const NUMBER_ID = /^\d+$/u
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const BRANCH_TYPE = /^[^\s/]+$/u
const NUMBER_REFERENCE = /#\d+/gu
const WHITESPACE = /\s/u
const PATTERN_CHARACTERS = /[$()*+.?[\\\]^{|}]/gu
const BLOCK_OPEN = /^\s*(?<fence>`{3,})\s*json\s+ticket-identity\s*$/u
const BLOCK_CLOSE = /^\s*(?<fence>`{3,})\s*$/u
const KEY_BEFORE = '(?<![\\p{L}\\p{N}-])'
const NO_DIGIT_AFTER = '(?!\\p{N})'

const fieldList = Object.keys(IDENTITY_FIELDS).join(', ')
const quote = ({ value }) => JSON.stringify(value)

// ---------------------------------------------------------------------------
// The identity: one field at a time, then the block, then the flags.
// ---------------------------------------------------------------------------

// Each returns null for a valid value, or the clause that says what is
// wrong with it, written after the field's name.
const FIELD_RULES = {
  branchTypes: ({ value }) =>
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((type) => typeof type === 'string' && BRANCH_TYPE.test(type))
      ? null
      : `is ${quote({ value })}; it is a non-empty list of branch prefixes, ` +
        'each with no / and no space',
  idPattern: ({ value }) => {
    if (typeof value !== 'string' || value === '') {
      return (
        `is ${quote({ value })}; it is a non-empty regular-expression ` +
        'source for one id'
      )
    }
    const error = compileError({ source: value })
    if (error !== null) return `${quote({ value })} does not compile: ${error}`
    return wholeMatch({ idPattern: value }).test('')
      ? `${quote({ value })} matches the empty string; an id is never empty`
      : null
  },
  slug: ({ value }) =>
    Object.values(SLUG_RULE).includes(value)
      ? null
      : `is ${quote({ value })}; it is ${SLUG_RULE.required} or ` +
        SLUG_RULE.optional
}

const compileError = ({ source }) => {
  try {
    RegExp(source, UNICODE)
    return null
  } catch (error) {
    return error.message
  }
}

// The pattern of a whole id. A source that compiles alone compiles here.
const wholeMatch = ({ idPattern }) =>
  new RegExp(`^(?:${idPattern})$`, UNICODE)

// Every prefix of `text`, the longest first, from `from` characters up.
const prefixesOf = ({ from = 1, text }) =>
  Array.from({ length: Math.max(text.length - from + 1, 0) }, (_, index) =>
    text.slice(0, text.length - index)
  )

// The fenced blocks whose info string is `json ticket-identity`, each with
// its text and the line it opens on; an unclosed one runs to the end.
const blocksOf = ({ text }) => {
  const lines = text.split(LINE_BREAK)
  const blocks = []
  let open = null
  lines.forEach((line, index) => {
    if (open === null) {
      const start = line.match(BLOCK_OPEN)
      if (start) open = { fence: start.groups.fence, line: index + 1, rows: [] }
      return
    }
    const end = line.match(BLOCK_CLOSE)
    if (end && end.groups.fence.length >= open.fence.length) {
      blocks.push({ closed: true, line: open.line, text: open.rows.join('\n') })
      open = null
      return
    }
    open.rows.push(line)
  })
  if (open !== null) {
    blocks.push({ closed: false, line: open.line, text: open.rows.join('\n') })
  }
  return blocks
}

const isObject = ({ value }) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const parseBlock = ({ block }) => {
  if (!block.closed) {
    return {
      problems: [`the ${IDENTITY_INFO} block opened at line ${block.line} is never closed`]
    }
  }
  let value
  try {
    value = JSON.parse(block.text)
  } catch (error) {
    return {
      problems: [`the ${IDENTITY_INFO} block is not JSON: ${error.message}`]
    }
  }
  if (!isObject({ value })) {
    return { problems: [`the ${IDENTITY_INFO} block is not a JSON object`] }
  }
  const problems = [
    ...Object.keys(value)
      .filter((key) => !(key in IDENTITY_FIELDS))
      .map(
        (key) =>
          `the ${IDENTITY_INFO} block has a field ${key} it does not know; ` +
          `it holds ${fieldList}`
      ),
    ...Object.keys(IDENTITY_FIELDS).flatMap((field) => {
      if (!(field in value)) {
        return [
          `the ${IDENTITY_INFO} block has no field ${field}; it holds ${fieldList}`
        ]
      }
      const reason = FIELD_RULES[field]({ value: value[field] })
      return reason === null
        ? []
        : [`the ${IDENTITY_INFO} block's ${field} ${reason}`]
    })
  ]
  return problems.length > 0 ? { problems } : { fields: value, problems }
}

// Reads the one `json ticket-identity` block of a layer's text. `fields` is
// null when the text holds no block; `problems` says, in clauses, what is
// wrong with a block that is there.
export const readIdentityBlock = ({ text }) => {
  const blocks = blocksOf({ text })
  if (blocks.length === 0) return { fields: null, problems: [] }
  if (blocks.length > 1) {
    return {
      fields: null,
      problems: [
        `holds ${blocks.length} ${IDENTITY_INFO} blocks, at lines ` +
          `${blocks.map(({ line }) => line).join(', ')}; a layer holds one`
      ]
    }
  }
  const { fields = null, problems } = parseBlock({ block: blocks[0] })
  return { fields, problems }
}

// A flag's raw text as the field it replaces: `--types` is a comma list.
const flagValue = ({ field, text }) =>
  field === 'branchTypes'
    ? text.split(LIST_SEPARATOR).map((type) => type.trim())
    : text

const identityFinding = ({ detail }) => ({ detail, kind: FINDING_KIND.identity })

const layerFields = ({ layer }) => {
  if (layer === null || layer === undefined) {
    return { fields: {}, findings: [], source: 'the default ticket identity' }
  }
  const path = layer.path === '' ? '(none)' : layer.path
  if (layer.text === null) {
    return {
      fields: {},
      findings: [
        identityFinding({
          detail:
            `${path}: the layer ${LAYER_FLAG} names is not there; the check ` +
            'judges no branch under a layer it cannot read'
        })
      ],
      source: path
    }
  }
  const { fields, problems } = readIdentityBlock({ text: layer.text })
  return {
    fields: fields ?? {},
    findings: problems.map((problem) =>
      identityFinding({ detail: `${path}: ${problem}` })
    ),
    source:
      fields === null && problems.length === 0
        ? `the default ticket identity, as ${path} holds no ${IDENTITY_INFO} block`
        : `the ticket identity of ${path}`
  }
}

// The identity a branch is judged under: the defaults, then the layer's
// block, then each flag over its one field. `findings` names every field
// that is malformed, with the file or the flag it came from.
export const resolveIdentity = ({ flags = {}, layer = null } = {}) => {
  const fromLayer = layerFields({ layer })
  const given = Object.entries(IDENTITY_FIELDS).filter(
    ([field]) => typeof flags[flagKey({ field })] === 'string'
  )
  const fromFlags = given.map(([field, flag]) => {
    const value = flagValue({ field, text: flags[flagKey({ field })] })
    return { field, flag, reason: FIELD_RULES[field]({ value }), value }
  })
  const findings = [
    ...fromLayer.findings,
    ...fromFlags
      .filter(({ reason }) => reason !== null)
      .map(({ field, flag, reason }) =>
        identityFinding({ detail: `${flag}: its ${field} ${reason}` })
      )
  ]
  const identity = {
    ...DEFAULT_IDENTITY,
    ...fromLayer.fields,
    ...Object.fromEntries(fromFlags.map(({ field, value }) => [field, value]))
  }
  const over =
    fromFlags.length === 0
      ? ''
      : `, with ${fromFlags.map(({ flag }) => flag).join(' and ')} over it`
  return { findings, identity, source: `${fromLayer.source}${over}` }
}

// The context names a flag by the field it replaces, `types` for
// `branchTypes`, as the command line spells it.
const flagKey = ({ field }) => (field === 'branchTypes' ? 'types' : field)

// ---------------------------------------------------------------------------
// The branch and the body, under one identity.
// ---------------------------------------------------------------------------

const shapeOf = ({ identity }) =>
  identity.slug === SLUG_RULE.optional ? OPTIONAL_SLUG_SHAPE : BRANCH_SHAPE

const describeId = ({ identity }) =>
  identity.idPattern === DEFAULT_IDENTITY.idPattern
    ? DEFAULT_ID_WORDS
    : `an id the pattern ${identity.idPattern} matches whole`

const literal = ({ text }) => text.replace(PATTERN_CHARACTERS, '\\$&')

// The ends of every prefix of `rest` that may be an id: before each
// hyphen, and the end of `rest`.
const idEnds = ({ rest }) => [
  ...Array.from({ length: rest.length }, (_, index) => index).filter(
    (index) => index > 0 && rest[index] === SLUG_SEPARATOR
  ),
  rest.length
]

// The id is the longest prefix the pattern matches whole that ends at a
// hyphen or at the end: the end only when the slug is optional, or when
// nothing shorter leaves a slug. With none, the longest prefix the
// pattern matches at all, so `123abc-x` reads as the id 123 and a slug that
// is not kebab, as it did before the identity was the project's.
const findId = ({ identity, rest }) => {
  const whole = wholeMatch(identity)
  const ends = idEnds({ rest }).filter((end) => whole.test(rest.slice(0, end)))
  const leavesSlug = ends.filter((end) => end < rest.length)
  const chosen =
    identity.slug === SLUG_RULE.required && leavesSlug.length > 0
      ? leavesSlug
      : ends
  if (chosen.length > 0) return rest.slice(0, Math.max(...chosen))
  return prefixesOf({ text: rest }).find((prefix) => whole.test(prefix)) ?? null
}

// How a body writes an id: `#123` for a number, the id itself otherwise.
const referenceOf = ({ id }) => (NUMBER_ID.test(id) ? `#${id}` : id)

// An id is named where its reference stands with no longer id starting at
// the same place: `#1234` does not name `#123`, nor `PROJ-421` `PROJ-42`.
// A longer id never spans a space, since an id comes from a branch name.
const namesId = ({ body, id, identity }) => {
  const number = NUMBER_ID.test(id)
  const reference = referenceOf({ id })
  const pattern = new RegExp(
    `${number ? '' : KEY_BEFORE}${literal({ text: reference })}${NO_DIGIT_AFTER}`,
    'gu'
  )
  const whole = wholeMatch(identity)
  return [...body.matchAll(pattern)].some((match) => {
    const start = match.index + reference.length - id.length
    const tail = body.slice(start)
    const space = tail.search(WHITESPACE)
    const word = space === NOT_FOUND ? tail : tail.slice(0, space)
    return !prefixesOf({ from: id.length + 1, text: word }).some((prefix) =>
      whole.test(prefix)
    )
  })
}

const namedIds = ({ body, identity }) => {
  const ids = new RegExp(
    `${KEY_BEFORE}(?:${identity.idPattern})${NO_DIGIT_AFTER}`,
    'gu'
  )
  return [
    ...new Set([
      ...(body.match(NUMBER_REFERENCE) ?? []),
      ...[...body.matchAll(ids)]
        .map(([match]) => match)
        .filter((match) => match !== '' && !NUMBER_ID.test(match))
    ])
  ]
}

const finding = ({ branch, kind, reason }) => ({
  detail: `${branch === '' ? '(no branch)' : branch}: ${reason}`,
  kind
})

const describeBody = ({ body, id, identity }) => {
  const others = namedIds({ body, identity })
  const named =
    others.length === 0
      ? 'it names no ticket'
      : `it names ${others.join(', ')}`
  return (
    `the pull request body does not name the ticket ${referenceOf({ id })}, ` +
    `and ${named}; the body names the id its branch carries`
  )
}

const judgeSlug = ({ afterId, branch, id, identity }) => {
  const shape = shapeOf({ identity })
  if (afterId === '') {
    return identity.slug === SLUG_RULE.required
      ? [
          finding({
            branch,
            kind: FINDING_KIND.slug,
            reason: `the slug is missing after the id ${id}; a ticket branch is ${shape}`
          })
        ]
      : []
  }
  const slug = afterId.startsWith(SLUG_SEPARATOR)
    ? afterId.slice(SLUG_SEPARATOR.length)
    : null
  return slug !== null && SLUG.test(slug)
    ? []
    : [
        finding({
          branch,
          kind: FINDING_KIND.slug,
          reason:
            `the slug after the id ${id} is not lower-case kebab, ` +
            `as in ${shape}`
        })
      ]
}

// Every defect of the branch is a finding of its own, so a fix for one
// does not hide the next: the type, then the id, then the slug, then the
// body, which is judged only once the branch has an id to look for.
const judge = ({ body, branch, identity }) => {
  const shape = shapeOf({ identity })
  const separator = branch.indexOf(TYPE_SEPARATOR)
  if (separator === NOT_FOUND) {
    return [
      finding({
        branch,
        kind: FINDING_KIND.shape,
        reason: `a ticket branch is ${shape}, and this one has no type before a /`
      })
    ]
  }

  const type = branch.slice(0, separator)
  const rest = branch.slice(separator + TYPE_SEPARATOR.length)
  const typeFindings = identity.branchTypes.includes(type)
    ? []
    : [
        finding({
          branch,
          kind: FINDING_KIND.type,
          reason:
            `the type ${type === '' ? '(none)' : type} is not one of ` +
            `${identity.branchTypes.join(', ')}; a ticket branch is ${shape}`
        })
      ]

  const id = findId({ identity, rest })
  if (id === null) {
    return [
      ...typeFindings,
      finding({
        branch,
        kind: FINDING_KIND.id,
        reason:
          `no ticket id follows the type: ${describeId({ identity })}, ` +
          `as in ${shape}`
      })
    ]
  }

  const bodyFindings = namesId({ body, id, identity })
    ? []
    : [
        finding({
          branch,
          kind: FINDING_KIND.body,
          reason: describeBody({ body, id, identity })
        })
      ]

  return [
    ...typeFindings,
    ...judgeSlug({ afterId: rest.slice(id.length), branch, id, identity }),
    ...bodyFindings
  ]
}

export const gate = defineGate({
  claims:
    'the ticket identity is well formed: the one json ticket-identity ' +
    `block of the project layer (${LAYER_PATH} under the working ` +
    'directory, or the file --layer names), each of --id-pattern, --types ' +
    'and --slug over its one field, or the defaults when there is no ' +
    `layer or no block (the types ${TICKET_TYPES.join(', ')}; an id that ` +
    `is ${DEFAULT_ID_WORDS}; a required slug); the branch is ` +
    `${BRANCH_SHAPE}, or <type>/<id> when the slug is optional, with a ` +
    'type the identity allows, an id its pattern matches whole and a ' +
    'lower-case kebab slug; and the pull request body names that id, as ' +
    '#<number> or as the id itself.',
  id: 'verify-ticket-branch',
  notCovered:
    'whether the ticket exists on the board, which state it is in and ' +
    'whether its type matches the branch type, all of which need the board ' +
    'and the network; the Conventional Commit types of the commits, which ' +
    'commitlint judges; whether the slug describes the ticket; and whether ' +
    "the layer's block is the identity its team confirmed.",
  run: ({ body, branch, flags, layer }) => {
    const { findings, identity } = resolveIdentity({ flags, layer })
    return findings.length > 0 ? findings : judge({ body, branch, identity })
  }
})

// A flag's value, or null when the flag is not given.
const readFlag = ({ flag }) => {
  const index = process.argv.indexOf(flag)
  return index === NOT_FOUND ? null : (process.argv[index + 1] ?? '')
}

const readFile = ({ path }) =>
  existsSync(path) && statSync(path).isFile()
    ? readFileSync(path, 'utf8')
    : null

// The layer `--layer` names, read even when it is not there so the check
// can say so; otherwise docs/process/ticket-flow.md under the working
// directory, or none when the project has no layer.
const readLayer = () => {
  const named = readFlag({ flag: LAYER_FLAG })
  if (named !== null) {
    return {
      path: named,
      text: named === '' ? null : readFile({ path: resolve(named) })
    }
  }
  const text = readFile({ path: resolve(LAYER_PATH) })
  return text === null ? null : { path: LAYER_PATH, text }
}

const main = () => {
  const context = {
    body: readFlag({ flag: BODY_FLAG }) ?? '',
    branch: readFlag({ flag: BRANCH_FLAG }) ?? '',
    flags: Object.fromEntries(
      Object.entries(IDENTITY_FIELDS).flatMap(([field, flag]) => {
        const value = readFlag({ flag })
        return value === null ? [] : [[flagKey({ field }), value]]
      })
    ),
    layer: readLayer()
  }
  const { source } = resolveIdentity(context)

  reportGate({
    context,
    denominator:
      `the branch ${context.branch === '' ? '(none)' : context.branch} and ` +
      `a pull request body of ${context.body.split(LINE_BREAK).length} ` +
      `line(s), under ${source}`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-ticket-branch.mjs')
) {
  main()
}
