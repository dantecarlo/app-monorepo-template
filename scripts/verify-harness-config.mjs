#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-harness-config — the project's harness settings are one file, held
// to its schema.
//
// .agents/harness.config.json holds the settings the harness reads: the
// workflow (decision 40), the merge policy (decision 38) and the backend,
// with its database-test mode; and the project's facts: its identity, and,
// when it records them, its vocabulary, stack, portable core and skill
// trees. .agents/contracts/harness-config.schema.json is their contract,
// and this gate holds the file to it:
//
//   - both files exist and parse, and each gives a key once in an object; a
//     file that is gone is a finding of its own, since a walk that skips an
//     absent file reports green over it, and so is a repeated key, which
//     JSON.parse reads as its last value while a reader may act on the first;
//   - every key the file holds is one the schema declares, every value one
//     it allows, every item of a list one its `items` allows, no text
//     shorter than its `minLength`, and every setting it marks required is
//     there, the database-test mode under a supabase backend only;
//   - the schema uses only the keywords this gate reads, each with a value
//     it can read, closes every object it declares with
//     `additionalProperties: false`, and every default is one of its own
//     values, so a rule written in the schema is never skipped in silence.
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
const SINGULAR = 1

export const HARNESS_CONFIG = '.agents/harness.config.json'
export const HARNESS_CONFIG_SCHEMA =
  '.agents/contracts/harness-config.schema.json'

// Where the merge policy lives, read by the ticket skills (verify-skills).
export const MERGE_POLICY_KEY = 'delivery.mergePolicy'

export const FINDING_KIND = Object.freeze({
  duplicate: 'duplicate-key',
  forbidden: 'forbidden',
  keyword: 'keyword',
  missing: 'missing',
  open: 'open-object',
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
    'backend) and its identity are recorded nowhere else',
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
  'items',
  'minLength',
  'properties',
  'required',
  'then',
  'type'
]
const KEYWORDS = [...ANNOTATIONS, ...ASSERTIONS]
const BRANCHES = ['if', 'then', 'else']
const ROOT_POINTER = '#'
const CLOSED = '"additionalProperties": false'

const isRecord = ({ value }) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isText = ({ value }) => typeof value === 'string'

const isList = ({ value }) => Array.isArray(value)

// A schema is an object or true or false.
const isSchema = ({ value }) =>
  typeof value === 'boolean' || isRecord({ value })

// The types a schema may give, how each is tested, and how it reads.
const TYPES = {
  array: { name: 'a list', test: isList },
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
    ['items', isSchema({ value: schema.items })],
    [
      'minLength',
      Number.isInteger(schema.minLength) && schema.minLength >= 0
    ],
    // A schema here would be a rule on every undeclared key, which this gate
    // does not apply; only true or false is read, so none passes in silence.
    [
      'additionalProperties',
      typeof schema.additionalProperties === 'boolean'
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

// An object the schema declares, by its type or its properties, lets no
// undeclared key through, so "every key is one the schema declares" holds of
// the whole file. A conditional branch refines the object it sits on, whose
// own `additionalProperties: false` holds its keys, so a branch owes none.
const judgeClosed = ({ branch, pointer, schema }) => {
  const declaresObject =
    schema.type === 'object' || Object.hasOwn(schema, 'properties')
  const open =
    !Object.hasOwn(schema, 'additionalProperties') ||
    schema.additionalProperties === true
  return branch || !declaresObject || !open
    ? []
    : [
        schemaFinding({
          detail:
            `${pointer} is an object that lets through a key it does not ` +
            `declare; every object of the schema sets ${codeOf({ text: CLOSED })}, ` +
            'so every key the config holds is one it declares',
          kind: FINDING_KIND.open
        })
      ]
}

const judgeSchema = ({ branch = false, pointer, schema }) => {
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
  const closed =
    unreadable.length === 0 ? judgeClosed({ branch, pointer, schema }) : []
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
          branch,
          pointer: `${pointer}/properties/${key}`,
          schema: child
        })
      )
    : []
  const items = isSchema({ value: schema.items })
    ? judgeSchema({
        branch,
        pointer: `${pointer}/items`,
        schema: schema.items
      })
    : []
  const branches = BRANCHES.filter((keyword) =>
    Object.hasOwn(schema, keyword)
  ).flatMap((keyword) =>
    judgeSchema({
      branch: true,
      pointer: `${pointer}/${keyword}`,
      schema: schema[keyword]
    })
  )
  return [
    ...unknown,
    ...type,
    ...unreadable,
    ...closed,
    ...outsideItsValues,
    ...properties,
    ...items,
    ...branches
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

const charactersOf = ({ count }) =>
  `${count} character${count === SINGULAR ? '' : 's'}`

const judgeMinLength = ({ path, schema, value }) =>
  !Object.hasOwn(schema, 'minLength') ||
  !isText({ value }) ||
  value.length >= schema.minLength
    ? []
    : [
        configFinding({
          detail:
            `${settingOf({ path })} is ${JSON.stringify(value)}; it is ` +
            `text of at least ${charactersOf({ count: schema.minLength })}`,
          kind: FINDING_KIND.value
        })
      ]

// Every item of a list, judged by the schema its `items` gives and named
// by its place, as `vocabulary.forbiddenInCore.1`.
const judgeItems = ({ path, reason, schema, value }) =>
  Object.hasOwn(schema, 'items') && isList({ value })
    ? value.flatMap((item, index) =>
        judgeValue({
          path: [...path, String(index)],
          reason,
          schema: schema.items,
          value: item
        })
      )
    : []

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
    ...judgeEnum({ path, schema, value }),
    ...judgeMinLength({ path, schema, value }),
    ...judgeItems({ path, reason, schema, value })
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

// --- Repeated keys -----------------------------------------------------------

// JSON whitespace, the characters a number or a literal ends at, and the
// width of an escape's first two characters, which the scan steps over.
const JSON_SPACE = [' ', '\t', '\n', '\r']
const VALUE_END = [',', ']', '}']
const QUOTE = '"'
const ESCAPE = '\\'
const ESCAPE_WIDTH = 2

// Every key path a JSON text gives more than once in one object, once each.
// JSON.parse keeps the last value of a repeated key, while a reader of the
// text may act on the first, so a file that repeats one says two things. The
// text has parsed already, so the scan reads only its structure, and it
// compares each key decoded: `"a"` and `"a"` are one key to JSON.parse.
export const repeatedKeysOf = ({ text }) => {
  const cursor = { at: 0 }
  const found = []
  const peek = () => text[cursor.at]
  const skipSpace = () => {
    while (JSON_SPACE.includes(peek())) cursor.at += 1
  }
  const readString = () => {
    const start = cursor.at
    cursor.at += 1
    while (peek() !== QUOTE)
      cursor.at += peek() === ESCAPE ? ESCAPE_WIDTH : 1
    cursor.at += 1
    return JSON.parse(text.slice(start, cursor.at))
  }
  const skipScalar = () => {
    while (
      cursor.at < text.length &&
      !VALUE_END.includes(peek()) &&
      !JSON_SPACE.includes(peek())
    ) {
      cursor.at += 1
    }
  }
  // The members of the object or list the cursor opens, to its close.
  const readMembers = ({ close, member }) => {
    cursor.at += 1
    skipSpace()
    if (peek() === close) {
      cursor.at += 1
      return
    }
    for (let index = 0; ; index += 1) {
      member({ index })
      skipSpace()
      const separator = peek()
      cursor.at += 1
      if (separator === close) return
    }
  }
  const readObject = ({ path }) => {
    const seen = new Set()
    const repeated = new Set()
    readMembers({
      close: '}',
      member: () => {
        skipSpace()
        const key = readString()
        if (seen.has(key) && !repeated.has(key)) {
          repeated.add(key)
          found.push([...path, key])
        }
        seen.add(key)
        skipSpace()
        cursor.at += 1
        readValue({ path: [...path, key] })
      }
    })
  }
  const readValue = ({ path }) => {
    skipSpace()
    if (peek() === '{') {
      readObject({ path })
    } else if (peek() === '[') {
      readMembers({
        close: ']',
        member: ({ index }) =>
          readValue({ path: [...path, String(index)] })
      })
    } else if (peek() === QUOTE) {
      readString()
    } else {
      skipScalar()
    }
  }
  readValue({ path: [] })
  return found
}

// --- Reading -----------------------------------------------------------------

// A file that is gone, does not parse or gives a key twice, named on its own.
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
    const value = JSON.parse(file.text)
    return {
      problems: repeatedKeysOf({ text: file.text }).map((path) =>
        finding({
          detail:
            `${settingOf({ path })} is given more than once: JSON.parse ` +
            'keeps its last value while a reader may act on the first, so ' +
            'the file gives each key once',
          kind: FINDING_KIND.duplicate,
          path: file.path
        })
      ),
      value
    }
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
    `${HARNESS_CONFIG} and ${HARNESS_CONFIG_SCHEMA} exist and parse, and ` +
    'neither gives a key twice in one object; every key the config holds ' +
    'is one the schema declares, every value one it allows, every item of ' +
    'a list one its items allows, no text shorter than its minLength, ' +
    'every setting it marks required, the identity among them, is there, ' +
    'and the database-test mode sits under a supabase backend only; the ' +
    'schema uses only the keywords this gate ' +
    'reads, each with a value it can read (additionalProperties true or ' +
    'false, never a schema), sets additionalProperties false on every ' +
    'object it declares outside a conditional branch, and every default ' +
    'is one of its own values.',
  id: 'verify-harness-config',
  notCovered:
    'whether a setting is the right one for the project, which its owner ' +
    'decides; whether the tree agrees with the file (a supabase backend ' +
    'with no packages/supabase, an sdd workflow with no openspec/); ' +
    'whether anything reads a setting: the ticket skills read ' +
    `${MERGE_POLICY_KEY} as prose, from the default branch's copy ` +
    '(verify-skills proves they say so), and nothing in the template reads ' +
    'workflow.mode, the backend or the facts yet; whether the identity ' +
    'names this project rather than the template it came from, or the ' +
    'paths of core and skills exist; and the JSON Schema keywords this ' +
    'gate refuses rather than reads.',
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
