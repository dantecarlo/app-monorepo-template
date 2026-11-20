#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-router-coverage — every request resolves to a skill that ships,
// and every skill that ships has a request that resolves to it.
//
// The Router of AGENTS.md (its `## Router` section, one table per phase)
// is how an agent turns a request into a skill. A row that names a skill
// with no `.claude/skills/<name>/SKILL.md` sends the agent to nothing, and
// a skill no row names is never loaded for a request. So the gate fails:
//
//   - a dead row: a "Load skill" cell that names, in backticks, a skill
//     with no SKILL.md, or that names no skill at all;
//   - an unrouted skill: a skill under `.claude/skills/` that no "Load
//     skill" cell of the Router names;
//   - a "Validated by" cell that cites, in backticks, a script the root
//     package.json does not define, or that cites none and is not
//     `review`. Text outside the backticks explains the script and is not
//     read: `lint` (jsx-a11y) and `validate`, in that project pass;
//   - a Router table with no "Load skill" or no "Validated by" column, a
//     Router with no table, an AGENTS.md with no Router, and a package.json
//     that is missing or does not parse.
//
// A skill is what verify-skill-frontmatter reads as one, through its
// `collectContext`: a folder of `.claude/skills/` that holds a SKILL.md.
// The two gates therefore agree on what a skill is.
//
// `run` is pure: it decides on the texts `collectContext` gathers.
//
// Usage:
//   node scripts/verify-router-coverage.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'
import { collectContext as collectSkills } from './verify-skill-frontmatter.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const NOT_FOUND = -1
const FIRST_LINE = 1
const AGENTS_FILE = 'AGENTS.md'
const PACKAGE_FILE = 'package.json'
const SKILLS_ROOT = '.claude/skills'
const SKILL_FILE = 'SKILL.md'
const ROUTER_HEADING = /^## Router\b/u
const SECTION_HEADING = /^## /u
const PHASE_HEADING = /^### (?<phase>.+)$/u
const TABLE_LINE = /^\s*\|/u
const DELIMITER_CELL = /^:?-+:?$/u
const CELL_SEPARATOR = /(?<!\\)\|/u
const ESCAPED_PIPE = /\\\|/gu
const LINE_BREAK = /\r?\n/u
const CODE_SPAN = /`(?<name>[^`]+)`/gu
const LOAD_SKILL = 'Load skill'
const VALIDATED_BY = 'Validated by'
const NO_GATE = 'review'
const ROUTER_LABEL = 'Router'

export const FINDING_KIND = Object.freeze({
  agents: 'agents',
  dead: 'dead',
  package: 'package',
  router: 'router',
  script: 'script',
  table: 'table',
  unrouted: 'unrouted'
})

const finding = ({ detail, kind, path }) => ({
  detail: `${path}: ${detail}`,
  kind,
  path
})

const rowFinding = ({ detail, kind, line, phase }) => ({
  detail: `${AGENTS_FILE}:${line} (${phase}): ${detail}`,
  kind,
  line,
  path: AGENTS_FILE
})

const cellsOf = ({ line }) => {
  const trimmed = line
    .trim()
    .replace(/^\|/u, '')
    .replace(/(?<!\\)\|$/u, '')
  return trimmed
    .split(CELL_SEPARATOR)
    .map((cell) => cell.replaceAll(ESCAPED_PIPE, '|').trim())
}

const namesIn = ({ cell }) =>
  [...cell.matchAll(CODE_SPAN)].map((match) => match.groups.name.trim())

const isDelimiter = ({ cells }) =>
  cells.length > 0 && cells.every((cell) => DELIMITER_CELL.test(cell))

// The lines of the `## Router` section, from its heading to the next `## `
// heading, each with its 1-based line number; null when there is none.
const routerLines = ({ text }) => {
  const lines = text.split(LINE_BREAK)
  const start = lines.findIndex((line) => ROUTER_HEADING.test(line))
  if (start === NOT_FOUND) return null
  const next = lines.findIndex(
    (line, index) => index > start && SECTION_HEADING.test(line)
  )
  const end = next === NOT_FOUND ? lines.length : next
  return {
    heading: start + FIRST_LINE,
    lines: lines
      .slice(start + 1, end)
      .map((line, index) => ({ line, number: start + index + 2 }))
  }
}

// Every table of the Router, with the phase heading above it: its header
// cells, the line of its header, and its body rows.
const routerTables = ({ lines }) => {
  const tables = []
  let phase = ROUTER_LABEL
  let current = null
  lines.forEach(({ line, number }) => {
    const heading = line.match(PHASE_HEADING)
    if (heading) phase = heading.groups.phase.trim()
    if (!TABLE_LINE.test(line)) {
      current = null
      return
    }
    const cells = cellsOf({ line })
    if (current === null) {
      current = { header: cells, line: number, phase, rows: [] }
      tables.push(current)
      return
    }
    if (current.rows.length === 0 && isDelimiter({ cells })) return
    current.rows.push({ cells, line: number })
  })
  return tables
}

// Reads the Router of AGENTS.md into its rows, or the one problem that
// stops it from being read.
export const readRouter = ({ text }) => {
  if (text === null) {
    return {
      problem: finding({
        detail: 'is not there, so no Router can be read',
        kind: FINDING_KIND.agents,
        path: AGENTS_FILE
      })
    }
  }
  const section = routerLines({ text })
  if (section === null) {
    return {
      problem: finding({
        detail:
          'has no ## Router section, so no request resolves to a skill',
        kind: FINDING_KIND.router,
        path: AGENTS_FILE
      })
    }
  }
  const tables = routerTables({ lines: section.lines })
  if (tables.length === 0) {
    return {
      problem: finding({
        detail: `${section.heading}: its ## Router section holds no table`,
        kind: FINDING_KIND.router,
        path: AGENTS_FILE
      })
    }
  }
  return { problem: null, tables }
}

const judgeTable = ({ table }) =>
  [LOAD_SKILL, VALIDATED_BY]
    .filter((column) => !table.header.includes(column))
    .map((column) =>
      rowFinding({
        detail: `a Router table with no ${column} column, so its rows cannot be judged`,
        kind: FINDING_KIND.table,
        line: table.line,
        phase: table.phase
      })
    )

const judgeSkills = ({ cell, line, phase, skills }) => {
  const names = namesIn({ cell })
  if (names.length === 0) {
    return [
      rowFinding({
        detail: `its ${LOAD_SKILL} cell names no skill in backticks, so the row routes to nothing`,
        kind: FINDING_KIND.dead,
        line,
        phase
      })
    ]
  }
  return names
    .filter((name) => !skills.includes(name))
    .map((name) =>
      rowFinding({
        detail: `${LOAD_SKILL} names \`${name}\`, which has no ${SKILLS_ROOT}/${name}/${SKILL_FILE}, so the row routes to nothing`,
        kind: FINDING_KIND.dead,
        line,
        phase
      })
    )
}

const judgeScripts = ({ cell, line, packageJson, phase }) => {
  const names = namesIn({ cell })
  if (names.length === 0) {
    return cell === NO_GATE
      ? []
      : [
          rowFinding({
            detail: `its ${VALIDATED_BY} cell "${cell}" names no script in backticks and is not ${NO_GATE}`,
            kind: FINDING_KIND.script,
            line,
            phase
          })
        ]
  }
  if (packageJson.problem !== null) return []
  return names
    .filter((name) => !packageJson.scripts.includes(name))
    .map((name) =>
      rowFinding({
        detail: `${VALIDATED_BY} names \`${name}\`, which ${PACKAGE_FILE} defines no script for`,
        kind: FINDING_KIND.script,
        line,
        phase
      })
    )
}

const judgeRows = ({ packageJson, skills, table }) => {
  const skillColumn = table.header.indexOf(LOAD_SKILL)
  const scriptColumn = table.header.indexOf(VALIDATED_BY)
  return table.rows.flatMap(({ cells, line }) => [
    ...(skillColumn === NOT_FOUND
      ? []
      : judgeSkills({
          cell: cells[skillColumn] ?? '',
          line,
          phase: table.phase,
          skills
        })),
    ...(scriptColumn === NOT_FOUND
      ? []
      : judgeScripts({
          cell: cells[scriptColumn] ?? '',
          line,
          packageJson,
          phase: table.phase
        }))
  ])
}

const routedSkills = ({ tables }) =>
  tables.flatMap((table) => {
    const column = table.header.indexOf(LOAD_SKILL)
    return column === NOT_FOUND
      ? []
      : table.rows.flatMap(({ cells }) =>
          namesIn({ cell: cells[column] ?? '' })
        )
  })

const judgeRouter = ({ packageJson, skills, tables }) => {
  const routed = routedSkills({ tables })
  return [
    ...tables.flatMap((table) => [
      ...judgeTable({ table }),
      ...judgeRows({ packageJson, skills, table })
    ]),
    ...skills
      .filter((skill) => !routed.includes(skill))
      .map((skill) =>
        finding({
          detail: `has no row in the ${ROUTER_LABEL} of ${AGENTS_FILE}, so no request resolves to it`,
          kind: FINDING_KIND.unrouted,
          path: `${SKILLS_ROOT}/${skill}/${SKILL_FILE}`
        })
      )
  ]
}

export const gate = defineGate({
  claims:
    `every "${LOAD_SKILL}" cell of the ${ROUTER_LABEL} tables of ` +
    `${AGENTS_FILE} names, in backticks, a skill that has a ` +
    `${SKILLS_ROOT}/<name>/${SKILL_FILE}; every such skill, as ` +
    'verify-skill-frontmatter reads them, is named by one; every ' +
    `"${VALIDATED_BY}" cell is ${NO_GATE} or cites, in backticks, only ` +
    `scripts the root ${PACKAGE_FILE} defines; and every ${ROUTER_LABEL} ` +
    `table has both columns.`,
  id: 'verify-router-coverage',
  notCovered:
    'whether a row routes the right requests to its skill, or names the ' +
    'right script to validate it, which review reads; the router prose ' +
    'outside the tables, and any table after the next ## heading; a ' +
    'script of a workspace package.json, which a cell cannot cite; the ' +
    'skill folders of other runtimes; and how an /init prune removes the ' +
    'row of a skill it drops, which Stage 6 of docs/INIT_AND_HARNESS_PLAN.md ' +
    'owns: until it lands, a prune that drops a skill such as sdd or ' +
    'archify leaves its row dead, and this gate fails loudly on it, which ' +
    'is the point.',
  run: ({ agents, packageJson, skills }) => {
    const router = readRouter({ text: agents })
    return [
      ...(packageJson.problem === null
        ? []
        : [
            finding({
              detail: `${packageJson.problem}, so no ${VALIDATED_BY} script can be checked`,
              kind: FINDING_KIND.package,
              path: PACKAGE_FILE
            })
          ]),
      ...(router.problem === null
        ? judgeRouter({ packageJson, skills, tables: router.tables })
        : [router.problem])
    ]
  }
})

const readOptional = ({ path }) =>
  existsSync(path) ? readFileSync(path, 'utf8') : null

const readPackage = ({ root }) => {
  const text = readOptional({ path: join(root, PACKAGE_FILE) })
  if (text === null) return { problem: 'is not there', scripts: [] }
  try {
    return {
      problem: null,
      scripts: Object.keys(JSON.parse(text).scripts ?? {})
    }
  } catch (error) {
    return { problem: `does not parse: ${error.message}`, scripts: [] }
  }
}

// AGENTS.md, the root package.json scripts and the skill folders, read the
// way verify-skill-frontmatter reads them.
export const collectContext = ({ root }) => ({
  agents: readOptional({ path: join(root, AGENTS_FILE) }),
  packageJson: readPackage({ root }),
  skills: collectSkills({ root }).skills.map(({ folder }) => folder)
})

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === NOT_FOUND
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

const main = () => {
  const context = collectContext({ root: readRoot() })
  const router = readRouter({ text: context.agents })
  const rows =
    router.problem === null
      ? router.tables.reduce(
          (count, { rows: body }) => count + body.length,
          0
        )
      : 0

  reportGate({
    context,
    denominator:
      `${context.skills.length} skill(s) under ${SKILLS_ROOT}, ${rows} ` +
      `${ROUTER_LABEL} row(s) of ${AGENTS_FILE}, and ` +
      `${context.packageJson.scripts.length} ${PACKAGE_FILE} script(s)`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-router-coverage.mjs')
) {
  main()
}
