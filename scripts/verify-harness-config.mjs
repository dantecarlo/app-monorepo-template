#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-harness-config — the project's harness settings are one file, held
// to its schema.
//
// .agents/harness.config.json holds the settings the harness reads: the
// workflow (decision 40), the merge policy (decision 38) and the backend,
// with its database-test mode. .agents/contracts/harness-config.schema.json
// is their contract, and this gate holds the file to it:
//
//   - both files exist and parse; a file that is gone is a finding of its
//     own, since a walk that skips an absent file reports green over it;
//   - every key the file holds is one the schema declares, every value one
//     it allows, and every setting it marks required is there, the
//     database-test mode under a supabase backend only;
//   - the schema uses only the keywords this gate reads, each with a value
//     it can read, and every default is one of its own values, so a rule
//     written in the schema is never skipped in silence.
//
// The gate validates BY the schema rather than restating its rules: a new
// setting or value is a change to the schema alone. What the schema cannot
// be read as is reported alone, since no setting can be judged without it.
//
// `run` is pure: it decides on the texts `collectContext` reads.
//
// Usage:
//   node scripts/verify-harness-config.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const NOT_FOUND = -1

export const HARNESS_CONFIG = '.agents/harness.config.json'
export const HARNESS_CONFIG_SCHEMA =
  '.agents/contracts/harness-config.schema.json'

// Where the merge policy lives, read by the ticket skills (verify-skills).
export const MERGE_POLICY_KEY = 'delivery.mergePolicy'

export const FINDING_KIND = Object.freeze({
  forbidden: 'forbidden',
  keyword: 'keyword',
  missing: 'missing',
  required: 'required',
  type: 'type',
  unknownKey: 'unknown-key',
  unreadable: 'unreadable',
  value: 'value'
})

// What each file is for, said when it is gone.
const MISSING_WHY = {
  [HARNESS_CONFIG]:
    "the project's harness settings (its workflow, merge policy and " +
    'backend) are recorded nowhere else',
  [HARNESS_CONFIG_SCHEMA]:
    'nothing says which settings the harness config may hold'
}

// The keywords this gate reads. Annotations say something to the reader and
// judge nothing; every other keyword in the schema is a finding.
const ANNOTATIONS = [
  '$comment',
  '$schema',
  'default',
  'description',
  'title'
]
const ASSERTIONS = [
  'additionalProperties',
  'const',
  'else',
  'enum',
  'if',
  'properties',
  'required',
  'then',
  'type'
]
const KEYWORDS = [...ANNOTATIONS, ...ASSERTIONS]
const BRANCHES = ['if', 'then', 'else']
const ROOT_POINTER = '#'

const isRecord = ({ value }) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isText = ({ value }) => typeof value === 'string'

// The types a schema may give, how each is tested, and how it reads.
const TYPES = {
  object: { name: 'an object', test: isRecord },
  string: { name: 'text', test: isText }
}

const describeValue = ({ value }) => {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'a list'
  if (isRecord({ value })) return 'an object'
  if (isText({ value })) return 'text'
  return `a ${typeof value}`
}

const codeOf = ({ text }) => `\`${text}\``

const listOf = ({ items }) =>
  items.map((text) => codeOf({ text })).join(', ')

const finding = ({ detail, kind, path }) => ({
  detail: `${path}: ${detail}`,
  kind,
  path
})

const configFinding = ({ detail, kind }) =>
  finding({ detail, kind, path: HARNESS_CONFIG })

const schemaFinding = ({ detail, kind }) =>
  finding({ detail, kind, path: HARNESS_CONFIG_SCHEMA })

// A setting by its dotted path, as `delivery.mergePolicy`; the file itself
// when the path is empty.
const settingOf = ({ path }) =>
  path.length === 0 ? 'the file' : codeOf({ text: path.join('.') })

// The reason a conditional branch states, appended to what it refuses.
const because = ({ reason }) => (reason ? ` — ${reason}` : '')

// --- The schema, as a contract this gate can read ---------------------------

const judgeKeywordValues = ({ pointer, schema }) => {
  const unreadable = [
    ['properties', isRecord({ value: schema.properties })],
    [
      'required',
      Array.isArray(schema.required) &&
        schema.required.every((value) => isText({ value }))
    ],
    ['enum', Array.isArray(schema.enum)],
    [
      'additionalProperties',
      typeof schema.additionalProperties === 'boolean' ||
        isRecord({ value: schema.additionalProperties })
    ]
  ].filter(
    ([keyword, readable]) => Object.hasOwn(schema, keyword) && !readable
  )
  return unreadable.map(([keyword]) =>
    schemaFinding({
      detail:
        `${pointer} gives ${codeOf({ text: keyword })} a value ` +
        'verify-harness-config cannot read',
      kind: FINDING_KIND.keyword
    })
  )
}

const judgeSchema = ({ pointer, schema }) => {
  if (typeof schema === 'boolean') return []
  if (!isRecord({ value: schema })) {
    return [
      schemaFinding({
        detail: `${pointer} is ${describeValue({ value: schema })}, not a schema`,
        kind: FINDING_KIND.keyword
      })
    ]
  }
  const unknown = Object.keys(schema)
    .filter((keyword) => !KEYWORDS.includes(keyword))
    .map((keyword) =>
      schemaFinding({
        detail:
          `${pointer} uses ${codeOf({ text: keyword })}, which ` +
          'verify-harness-config does not read, so the rule it states ' +
          `would pass every config; the keywords it reads are ${listOf({ items: KEYWORDS })}`,
        kind: FINDING_KIND.keyword
      })
    )
  const type =
    Object.hasOwn(schema, 'type') && !Object.hasOwn(TYPES, schema.type)
      ? [
          schemaFinding({
            detail:
              `${pointer} gives the type ${JSON.stringify(schema.type)}; ` +
              `verify-harness-config reads ${listOf({ items: Object.keys(TYPES) })}`,
            kind: FINDING_KIND.keyword
          })
        ]
      : []
  const unreadable = judgeKeywordValues({ pointer, schema })
  const outsideItsValues =
    Object.hasOwn(schema, 'default') &&
    Array.isArray(schema.enum) &&
    !schema.enum.includes(schema.default)
      ? [
          schemaFinding({
            detail:
              `${pointer} defaults to ${JSON.stringify(schema.default)}, ` +
              `which its own values refuse: ${listOf({ items: schema.enum })}`,
            kind: FINDING_KIND.value
          })
        ]
      : []
  const properties = isRecord({ value: schema.properties })
    ? Object.entries(schema.properties).flatMap(([key, child]) =>
        judgeSchema({
          pointer: `${pointer}/properties/${key}`,
          schema: child
        })
      )
    : []
  const branches = BRANCHES.filter((keyword) =>
    Object.hasOwn(schema, keyword)
  ).flatMap((keyword) =>
    judgeSchema({
      pointer: `${pointer}/${keyword}`,
      schema: schema[keyword]
    })
  )
  const additional = isRecord({ value: schema.additionalProperties })
    ? judgeSchema({
        pointer: `${pointer}/additionalProperties`,
        schema: schema.additionalProperties
      })
    : []
  return [
    ...unknown,
    ...type,
    ...unreadable,
    ...outsideItsValues,
    ...properties,
    ...branches,
    ...additional
  ]
}

// --- The config, judged by the schema ---------------------------------------

const judgeType = ({ path, schema, value }) =>
  !Object.hasOwn(schema, 'type') || TYPES[schema.type].test({ value })
    ? []
    : [
        configFinding({
          detail:
            `${settingOf({ path })} is ${describeValue({ value })}; it is ` +
            TYPES[schema.type].name,
          kind: FINDING_KIND.type
        })
      ]

const judgeConst = ({ path, schema, value }) =>
  !Object.hasOwn(schema, 'const') || value === schema.const
    ? []
    : [
        configFinding({
          detail:
            `${settingOf({ path })} is ${JSON.stringify(value)}; it is ` +
            JSON.stringify(schema.const),
          kind: FINDING_KIND.value
        })
      ]

const judgeEnum = ({ path, schema, value }) =>
  !Object.hasOwn(schema, 'enum') || schema.enum.includes(value)
    ? []
    : [
        configFinding({
          detail:
            `${settingOf({ path })} is ${JSON.stringify(value)}; it is one ` +
            `of ${listOf({ items: schema.enum })}`,
          kind: FINDING_KIND.value
        })
      ]

const judgeRequired = ({ path, reason, schema, value }) =>
  (schema.required ?? [])
    .filter((key) => !Object.hasOwn(value, key))
    .map((key) =>
      configFinding({
        detail:
          `${settingOf({ path: [...path, key] })} is missing` +
          because({ reason }),
        kind: FINDING_KIND.required
      })
    )

const judgeKeys = ({ path, schema, value }) => {
  if (schema.additionalProperties !== false) return []
  const declared = Object.keys(schema.properties ?? {})
  return Object.keys(value)
    .filter((key) => !declared.includes(key))
    .map((key) =>
      configFinding({
        detail:
          `${settingOf({ path: [...path, key] })} is no key the schema ` +
          `declares; ${settingOf({ path })} holds ${listOf({ items: declared })}`,
        kind: FINDING_KIND.unknownKey
      })
    )
}

const judgeValue = ({ path, reason, schema, value }) => {
  if (schema === true) return []
  if (schema === false) {
    return [
      configFinding({
        detail: `${settingOf({ path })} is not allowed here${because({ reason })}`,
        kind: FINDING_KIND.forbidden
      })
    ]
  }
  const typed = judgeType({ path, schema, value })
  if (typed.length > 0) return typed
  const scalar = [
    ...judgeConst({ path, schema, value }),
    ...judgeEnum({ path, schema, value })
  ]
  if (!isRecord({ value })) return scalar
  const children = Object.entries(schema.properties ?? {})
    .filter(([key]) => Object.hasOwn(value, key))
    .flatMap(([key, child]) =>
      judgeValue({
        path: [...path, key],
        reason,
        schema: child,
        value: value[key]
      })
    )
  // The branch a conditional takes: `then` when the value passes `if`,
  // `else` when it does not. A branch's description is the reason it gives.
  const holds =
    Object.hasOwn(schema, 'if') &&
    judgeValue({ path, schema: schema.if, value }).length === 0
  const branch = Object.hasOwn(schema, 'if')
    ? schema[holds ? 'then' : 'else']
    : undefined
  const branched =
    branch === undefined
      ? []
      : judgeValue({
          path,
          reason: isRecord({ value: branch })
            ? (branch.description ?? reason)
            : reason,
          schema: branch,
          value
        })
  return [
    ...scalar,
    ...judgeRequired({ path, reason, schema, value }),
    ...judgeKeys({ path, schema, value }),
    ...children,
    ...branched
  ]
}

// --- Reading -----------------------------------------------------------------

// A file that is gone or does not parse, named on its own.
const parse = ({ file }) => {
  if (file.text === null) {
    return {
      problems: [
        {
          detail: `${file.path} is missing: ${MISSING_WHY[file.path]}`,
          kind: FINDING_KIND.missing,
          path: file.path
        }
      ]
    }
  }
  try {
    return { problems: [], value: JSON.parse(file.text) }
  } catch (error) {
    return {
      problems: [
        {
          detail: `${file.path} does not parse: ${error.message}`,
          kind: FINDING_KIND.unreadable,
          path: file.path
        }
      ]
    }
  }
}

const judge = ({ config, schema }) => {
  const read = [parse({ file: schema }), parse({ file: config })]
  const problems = read.flatMap(({ problems: found }) => found)
  if (problems.length > 0) return problems
  const [contract, settings] = read.map(({ value }) => value)
  const unreadable = judgeSchema({
    pointer: ROOT_POINTER,
    schema: contract
  })
  if (unreadable.length > 0) return unreadable
  return judgeValue({ path: [], schema: contract, value: settings })
}

// The settings a schema declares: every property whose schema holds no
// properties of its own, the annotations ($schema, $comment) aside.
export const settingsOf = ({ schema }) =>
  isRecord({ value: schema }) && isRecord({ value: schema.properties })
    ? Object.entries(schema.properties)
        .filter(([key]) => !key.startsWith('$'))
        .reduce(
          (count, [, child]) =>
            count +
            (isRecord({ value: child?.properties })
              ? settingsOf({ schema: child })
              : 1),
          0
        )
    : 0

export const gate = defineGate({
  claims:
    `${HARNESS_CONFIG} and ${HARNESS_CONFIG_SCHEMA} exist and parse; ` +
    'every key the config holds is one the schema declares, every value ' +
    'one it allows, every setting it marks required is there, and the ' +
    'database-test mode sits under a supabase backend only; the schema ' +
    'uses only the keywords this gate reads, each with a value it can ' +
    'read, and every default is one of its own values.',
  id: 'verify-harness-config',
  notCovered:
    'whether a setting is the right one for the project, which its owner ' +
    'decides; whether the tree agrees with the file (a supabase backend ' +
    'with no packages/supabase, an sdd workflow with no openspec/); ' +
    'whether anything reads a setting: the ticket skills read ' +
    `${MERGE_POLICY_KEY} as prose (verify-skills proves they name it), and ` +
    'nothing reads workflow.mode or the backend yet; and the JSON Schema ' +
    'keywords this gate refuses rather than reads.',
  run: judge
})

const readOptional = ({ path }) =>
  existsSync(path) && statSync(path).isFile()
    ? readFileSync(path, 'utf8')
    : null

// The text of both files, null when one is not there.
export const collectContext = ({ root }) => ({
  config: {
    path: HARNESS_CONFIG,
    text: readOptional({ path: join(root, HARNESS_CONFIG) })
  },
  schema: {
    path: HARNESS_CONFIG_SCHEMA,
    text: readOptional({ path: join(root, HARNESS_CONFIG_SCHEMA) })
  }
})

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === NOT_FOUND
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

const declaredSettings = ({ context }) => {
  try {
    return settingsOf({
      schema: JSON.parse(context.schema.text ?? 'null')
    })
  } catch {
    return 0
  }
}

const main = () => {
  const context = collectContext({ root: readRoot() })
  reportGate({
    context,
    denominator:
      `${HARNESS_CONFIG}, held to the ${declaredSettings({ context })} ` +
      `setting(s) ${HARNESS_CONFIG_SCHEMA} declares`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-harness-config.mjs')
) {
  main()
}
