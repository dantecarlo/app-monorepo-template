#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-skill-frontmatter — every skill can be found, and found for the
// right work.
//
// A runtime reads only a skill's frontmatter to decide whether to load it:
// its `name`, and a `description` that says when to use it and when not.
// A frontmatter that does not parse hides the skill, a name that is not its
// folder makes it answer to another name, and a description past 1,024
// characters reaches the model cut short, its triggers last and lost first.
// So every `.claude/skills/*/SKILL.md` is held to:
//
//   - a frontmatter between `---` fences that parses;
//   - a `name` that is its folder;
//   - a `description` of at most 1,024 characters once parsed, the line
//     break a folded `>` block keeps counted;
//   - `USE WHEN:` and `DO NOT USE:` in that description.
//
// A skill `.claude/skills-lock.json` lists is vendored and keeps its
// upstream text, so it gets only the parse, name and length checks.
//
// The frontmatter is read by a small reader for the YAML a skill uses: one
// `key: value` per line, a plain, quoted or block (`|`, `>`) value, and an
// indented mapping or list under a key, which it accepts unread. It refuses
// what a YAML parser refuses there (a line that is no key, a repeated key, a
// plain value holding `: `, a tab in the indent) instead of guessing.
//
// `run` is pure: it decides on the files `collectContext` gathers.
//
// Usage:
//   node scripts/verify-skill-frontmatter.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const NOT_FOUND = -1
const FIRST_LINE = 1
const FRONTMATTER_FENCE = '---'
const LINE_BREAK = /\r?\n/u
const SKILLS_ROOT = '.claude/skills'
const SKILL_FILE = 'SKILL.md'
const LOCK_FILE = '.claude/skills-lock.json'
const DESCRIPTION_LIMIT = 1024
const TRIGGERS = ['USE WHEN:', 'DO NOT USE:']

const KEY_LINE = /^(?<key>[A-Za-z_][\w-]*):(?:[ \t]+(?<raw>.*))?$/u
const BLOCK_HEADER = /^(?<style>[|>])(?<chomp>[-+]?)(?:\s+#.*)?$/u
const COMMENT_LINE = /^\s*#/u
const TRAILING_COMMENT = /\s+#.*$/u
const INDENT = /^ */u
const TAB_INDENT = /^ *\t/u
const PLAIN_FORBIDDEN_START = /^[[\]{}&*!|>'"%@`,]/u
const MAPPING_INSIDE = /:(?:\s|$)/u
const DOUBLE_QUOTED = /^"(?<inner>.*)"$/u
const SINGLE_QUOTED = /^'(?<inner>.*)'$/u
const FOLDED = '>'
const STRIP = '-'
const KEEP = '+'
const NESTED = Symbol('nested')

export const FINDING_KIND = Object.freeze({
  description: 'description',
  frontmatter: 'frontmatter',
  length: 'length',
  lock: 'lock',
  name: 'name',
  parse: 'parse',
  trigger: 'trigger'
})

class FrontmatterError extends Error {
  constructor({ line, reason }) {
    super(reason)
    this.line = line
  }
}

const refuse = ({ line, reason }) => {
  throw new FrontmatterError({ line, reason })
}

const isBlank = ({ line }) => line.trim() === ''

const indentOf = ({ line }) => line.match(INDENT)[0].length

// Folds lines as YAML folds a block or a multi-line flow value: the lines
// of a paragraph joined by a space, and each blank line one line break.
const fold = ({ lines }) =>
  lines.reduce(
    (text, line, index) => {
      if (line === '')
        return { ...text, value: `${text.value}\n`, open: false }
      const joiner = text.open && index > 0 ? ' ' : ''
      return { open: true, value: `${text.value}${joiner}${line}` }
    },
    { open: false, value: '' }
  ).value

const chompOf = ({ chomp, lines, text }) => {
  if (chomp === STRIP) return text.replace(/\n+$/u, '')
  const body = text.replace(/\n+$/u, '')
  if (chomp === KEEP) {
    const trailing =
      lines.length - lines.findLastIndex((line) => line !== '') - 1
    return `${body}\n${'\n'.repeat(trailing)}`
  }
  return body === '' ? '' : `${body}\n`
}

const blockValue = ({ children, chomp, start, style }) => {
  const first = children.findIndex((line) => !isBlank({ line }))
  if (first === NOT_FOUND) return ''
  const indent = indentOf({ line: children[first] })
  const lines = children.map((line, index) => {
    if (isBlank({ line })) return ''
    if (indentOf({ line }) < indent) {
      refuse({
        line: start + index + FIRST_LINE,
        reason: 'a line of the block is indented less than its first line'
      })
    }
    return line.slice(indent)
  })
  const body = lines.slice(first)
  const text = style === FOLDED ? fold({ lines: body }) : body.join('\n')
  return chompOf({ chomp, lines: body, text })
}

const flowValue = ({ children, line, raw }) => {
  const text = fold({
    lines: [raw, ...children.map((child) => child.trim())]
  }).trim()
  const double = text.match(DOUBLE_QUOTED)
  if (double) {
    try {
      return JSON.parse(text)
    } catch {
      return refuse({
        line,
        reason: 'a double-quoted value holds an escape YAML does not read'
      })
    }
  }
  const single = text.match(SINGLE_QUOTED)
  if (single) return single.groups.inner.replaceAll("''", "'")
  const plain = text.replace(TRAILING_COMMENT, '')
  if (PLAIN_FORBIDDEN_START.test(plain)) {
    refuse({
      line,
      reason: `a plain value cannot start with ${plain[0]}; quote it`
    })
  }
  if (MAPPING_INSIDE.test(plain)) {
    refuse({
      line,
      reason:
        'a plain value holds ": ", which YAML reads as a nested key; use a block (>) or quotes'
    })
  }
  return plain
}

// Reads the lines between the fences into { key: value }, a value being a
// string, null, or NESTED for an indented mapping or list it does not read.
export const parseFrontmatter = ({ lines, offset = 0 }) => {
  const fields = {}
  let index = 0
  while (index < lines.length) {
    const line = lines[index]
    const number = offset + index + FIRST_LINE
    if (isBlank({ line }) || COMMENT_LINE.test(line)) {
      index += 1
      continue
    }
    const match = line.match(KEY_LINE)
    if (!match)
      refuse({
        line: number,
        reason: `cannot read "${line.trim()}" as a key: value line`
      })
    const { key } = match.groups
    if (Object.hasOwn(fields, key))
      refuse({ line: number, reason: `the key ${key} appears twice` })
    const raw = (match.groups.raw ?? '').trim()
    let end = index + 1
    while (
      end < lines.length &&
      (isBlank({ line: lines[end] }) || /^\s/u.test(lines[end]))
    ) {
      if (TAB_INDENT.test(lines[end])) {
        refuse({
          line: offset + end + FIRST_LINE,
          reason: 'a tab indents the line'
        })
      }
      end += 1
    }
    const children = lines.slice(index + 1, end)
    const block = raw.match(BLOCK_HEADER)
    if (block) {
      fields[key] = blockValue({
        children,
        chomp: block.groups.chomp,
        start: offset + index + 1,
        style: block.groups.style
      })
    } else if (raw === '' || raw.startsWith('#')) {
      fields[key] = children.some((child) => !isBlank({ line: child }))
        ? NESTED
        : null
    } else {
      fields[key] = flowValue({ children, line: number, raw })
    }
    index = end
  }
  return fields
}

const characters = ({ text }) => [...text].length

const formatCount = ({ count }) => count.toLocaleString('en-US')

const finding = ({ detail, kind, path }) => ({
  detail: `${path}: ${detail}`,
  kind,
  path
})

const readHead = ({ text }) => {
  const lines = text.split(LINE_BREAK)
  if (lines[0] !== FRONTMATTER_FENCE) return null
  const end = lines.indexOf(FRONTMATTER_FENCE, 1)
  return end === NOT_FOUND ? null : lines.slice(1, end)
}

const judgeDescription = ({ description, path, vendored }) => {
  if (description === undefined || description === null) {
    return [
      finding({
        detail: 'has no description',
        kind: FINDING_KIND.description,
        path
      })
    ]
  }
  if (typeof description !== 'string') {
    return [
      finding({
        detail: 'its description is a mapping or a list, not a text',
        kind: FINDING_KIND.description,
        path
      })
    ]
  }
  const count = characters({ text: description })
  return [
    ...(count > DESCRIPTION_LIMIT
      ? [
          finding({
            detail:
              `its description is ${formatCount({ count })} characters, past the ` +
              `${formatCount({ count: DESCRIPTION_LIMIT })} a runtime reads`,
            kind: FINDING_KIND.length,
            path
          })
        ]
      : []),
    ...(vendored
      ? []
      : TRIGGERS.filter((trigger) => !description.includes(trigger)).map(
          (trigger) =>
            finding({
              detail: `its description has no ${trigger}`,
              kind: FINDING_KIND.trigger,
              path
            })
        ))
  ]
}

const judgeSkill = ({ folder, path, text, vendored }) => {
  const head = readHead({ text })
  if (head === null) {
    return [
      finding({
        detail:
          'has no frontmatter between --- fences, so no runtime reads its name or its triggers',
        kind: FINDING_KIND.frontmatter,
        path
      })
    ]
  }
  let fields
  try {
    fields = parseFrontmatter({ lines: head, offset: 1 })
  } catch (error) {
    if (!(error instanceof FrontmatterError)) throw error
    return [
      {
        detail: `${path}:${error.line}: its frontmatter does not parse: ${error.message}`,
        kind: FINDING_KIND.parse,
        path
      }
    ]
  }
  return [
    ...(fields.name === folder
      ? []
      : [
          finding({
            detail: `its frontmatter name is \`${typeof fields.name === 'string' ? fields.name : ''}\`, not its folder ${folder}`,
            kind: FINDING_KIND.name,
            path
          })
        ]),
    ...judgeDescription({
      description: fields.description,
      path,
      vendored
    })
  ]
}

export const gate = defineGate({
  claims:
    `every ${SKILLS_ROOT}/*/${SKILL_FILE} has a frontmatter between --- ` +
    'fences that parses, a name that is its folder, and a description of ' +
    `at most ${formatCount({ count: DESCRIPTION_LIMIT })} characters once ` +
    'parsed that holds USE WHEN: and DO NOT USE:; a skill ' +
    `${LOCK_FILE} lists is vendored and gets the parse, name and length ` +
    'checks only.',
  id: 'verify-skill-frontmatter',
  notCovered:
    "whether a description's triggers are the right ones, or agree with the " +
    "router tables of AGENTS.md and the skill's own body, which review reads; " +
    'YAML a skill frontmatter does not use (anchors, tags, flow collections, ' +
    'a more-indented line inside a folded block), which the reader refuses ' +
    'or folds plainly; a folder under .claude/skills/ with no SKILL.md; and ' +
    'the skill folders of other runtimes.',
  run: ({ lock, skills }) => [
    ...(lock.problem === null
      ? []
      : [
          finding({
            detail: `does not parse, so no vendored skill can be told apart: ${lock.problem}`,
            kind: FINDING_KIND.lock,
            path: LOCK_FILE
          })
        ]),
    ...skills.flatMap(({ folder, path, text }) =>
      judgeSkill({
        folder,
        path,
        text,
        vendored: lock.vendored.includes(folder)
      })
    )
  ]
})

const readLock = ({ root }) => {
  const absolute = join(root, LOCK_FILE)
  if (!existsSync(absolute)) return { problem: null, vendored: [] }
  try {
    const parsed = JSON.parse(readFileSync(absolute, 'utf8'))
    return { problem: null, vendored: Object.keys(parsed.skills ?? {}) }
  } catch (error) {
    return { problem: error.message, vendored: [] }
  }
}

// Every folder of .claude/skills/ that holds a SKILL.md, with its text.
export const collectContext = ({ root }) => {
  const directory = join(root, SKILLS_ROOT)
  const folders = existsSync(directory)
    ? readdirSync(directory, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((folder) =>
          existsSync(join(directory, folder, SKILL_FILE))
        )
        .sort()
    : []
  return {
    lock: readLock({ root }),
    skills: folders.map((folder) => ({
      folder,
      path: `${SKILLS_ROOT}/${folder}/${SKILL_FILE}`,
      text: readFileSync(join(directory, folder, SKILL_FILE), 'utf8')
    }))
  }
}

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === NOT_FOUND
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

const main = () => {
  const context = collectContext({ root: readRoot() })
  const vendored = context.skills.filter(({ folder }) =>
    context.lock.vendored.includes(folder)
  ).length

  reportGate({
    context,
    denominator:
      `${context.skills.length} skill(s) under ${SKILLS_ROOT}, ${vendored} of ` +
      `them vendored and held to the parse, name and length checks only`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) ===
    resolve(HERE, 'verify-skill-frontmatter.mjs')
) {
  main()
}
