#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-skill-neutrality — no shipped skill names a downstream project.
//
// A project made from this template receives its skills on sync, and its
// core-purity gate refuses a first-party skill that names a product. A
// template skill that names one, as an example or as the source of a rule,
// is refused there, so the template must describe the shape and never the
// project. The names come from one declared list,
// .agents/contracts/downstream-projects.json, never from this file: a new
// downstream project is one entry there.
//
// Every file under .claude/skills/ is read, not only SKILL.md: a template,
// a reference and a script ship with the skill, and a vendored skill ships
// too. A name matches as a whole word in any letter case, so a product name
// also catches the package scope (@name/), the slug and the bundle id
// (com.name.app) built from it, and a name inside a longer word does not.
//
// The list names donor products, so it is template-maintainer material that
// never ships. A derived project finds it absent and the gate forbids
// nothing, saying so in its denominator; the template, run with
// ATL_TEMPLATE_SELF=1, is refused without it, since a gate that forbids
// nothing reports the same green as one that found nothing.
//
// `run` is pure: it decides on the files `collectContext` gathers.
//
// Usage:
//   node scripts/verify-skill-neutrality.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineGate, reportGate } from './gate/gate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const NOT_FOUND = -1
const FIRST_LINE = 1
const LINE_BREAK = /\r?\n/u
const SKILLS_ROOT = '.claude/skills'
const CONTRACT = '.agents/contracts/downstream-projects.json'
const SELF_VARIABLE = 'ATL_TEMPLATE_SELF'
const SELF_VALUE = '1'
// A whole word: no letter, digit or underscore on either side, in any
// script, so `@name/`, `name's` and `com.name.app` match and `names` does
// not.
const WORD_START = '(?<![\\p{L}\\p{N}_])'
const WORD_END = '(?![\\p{L}\\p{N}_])'

const isText = ({ value }) =>
  typeof value === 'string' && value.trim() !== ''

const contractFinding = ({ detail }) => ({
  detail: `${CONTRACT}: ${detail}`,
  path: CONTRACT
})

// What is wrong with the declared list, each problem a finding: a list
// that declares nothing, or a project with no name to forbid, would let
// the gate pass while it forbids less than it claims.
const contractProblems = ({ projects }) => {
  if (!Array.isArray(projects) || projects.length === 0) {
    return [
      contractFinding({
        detail:
          'declares no downstream project, so the gate forbids no name'
      })
    ]
  }
  return projects.flatMap((entry, index) => {
    const label = isText({ value: entry?.project })
      ? entry.project
      : `project ${index + FIRST_LINE}`
    const names = entry?.names
    return [
      ...(isText({ value: entry?.project })
        ? []
        : [contractFinding({ detail: `${label} has no project name` })]),
      ...(Array.isArray(names) && names.length > 0
        ? names
            .filter((value) => !isText({ value }))
            .map(() =>
              contractFinding({
                detail: `${label} declares a name that is not a non-blank text`
              })
            )
        : [contractFinding({ detail: `${label} declares no name` })])
    ]
  })
}

// Every declared name a project can be told by, with its pattern.
const namesOf = ({ projects }) =>
  (Array.isArray(projects) ? projects : []).flatMap((entry) =>
    (Array.isArray(entry?.names) ? entry.names : [])
      .filter((value) => isText({ value }))
      .map((name) => ({
        name,
        pattern: new RegExp(
          `${WORD_START}${RegExp.escape(name)}${WORD_END}`,
          'iu'
        ),
        project: isText({ value: entry?.project }) ? entry.project : name
      }))
  )

const judgeFile = ({ names, path, text }) =>
  text.split(LINE_BREAK).flatMap((line, index) =>
    names
      .filter(({ pattern }) => pattern.test(line))
      .map(({ name, project }) => ({
        detail:
          `${path}:${index + FIRST_LINE}: names ${name}, a name of the ` +
          `downstream project ${project} (${CONTRACT}); a shipped skill ` +
          'describes the shape, never the project',
        line: index + FIRST_LINE,
        name,
        path
      }))
  )

export const gate = defineGate({
  claims:
    `no file under ${SKILLS_ROOT}/, SKILL.md or any other, vendored or ` +
    'not, names a name of a downstream project that ' +
    `${CONTRACT} declares, matched as a whole word in any letter case; ` +
    'the list itself parses, declares at least one project, and gives ' +
    'each a project name and at least one non-blank name; in the template ' +
    `(${SELF_VARIABLE}=${SELF_VALUE}) the list must exist.`,
  id: 'verify-skill-neutrality',
  notCovered:
    "a project's name spelled another way (split by a space or a hyphen, " +
    "abbreviated, or in another script), a downstream project's domain " +
    'vocabulary, and the description of a project without its name, which ' +
    'review reads; a downstream project the list does not declare; a ' +
    'binary file, read as UTF-8 text; and every file outside ' +
    `${SKILLS_ROOT}/, the skill registry and the skill folders of other ` +
    'runtimes included.',
  run: ({ contract, files, self }) => {
    if (contract.absent) {
      return self
        ? [
            contractFinding({
              detail:
                'is absent, so the gate forbids no name; the template ' +
                'declares every downstream project there'
            })
          ]
        : []
    }
    if (contract.problem !== null) {
      return [
        contractFinding({ detail: `does not parse: ${contract.problem}` })
      ]
    }
    const names = namesOf({ projects: contract.projects })
    return [
      ...contractProblems({ projects: contract.projects }),
      ...files.flatMap(({ path, text }) =>
        judgeFile({ names, path, text })
      )
    ]
  }
})

const readContract = ({ root }) => {
  const absolute = join(root, CONTRACT)
  if (!existsSync(absolute)) {
    return { absent: true, problem: null, projects: [] }
  }
  try {
    const parsed = JSON.parse(readFileSync(absolute, 'utf8'))
    return { absent: false, problem: null, projects: parsed?.projects }
  } catch (error) {
    return { absent: false, problem: error.message, projects: [] }
  }
}

// Every file under `directory`, depth first and in name order, with its
// repository path.
const walk = ({ directory, prefix }) =>
  readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = `${prefix}/${entry.name}`
      const full = join(directory, entry.name)
      if (entry.isDirectory())
        return walk({ directory: full, prefix: path })
      return entry.isFile()
        ? [{ path, text: readFileSync(full, 'utf8') }]
        : []
    })

// The declared list, every file of every skill, and whether this is the
// template itself.
export const collectContext = ({ root, self }) => {
  const directory = join(root, SKILLS_ROOT)
  return {
    contract: readContract({ root }),
    files: existsSync(directory)
      ? walk({ directory, prefix: SKILLS_ROOT })
      : [],
    self
  }
}

const readRoot = () => {
  const index = process.argv.indexOf(ROOT_FLAG)
  return index === NOT_FOUND
    ? resolve(HERE, '..')
    : resolve(process.argv[index + 1])
}

const declaredOf = ({ contract }) => {
  if (contract.absent) {
    return `no downstream project declared, since ${CONTRACT} is absent`
  }
  const projects = Array.isArray(contract.projects)
    ? contract.projects
    : []
  const names = namesOf({ projects }).length
  return (
    `against ${names} name(s) of ${projects.length} downstream ` +
    `project(s) that ${CONTRACT} declares`
  )
}

const main = () => {
  const context = collectContext({
    root: readRoot(),
    self: process.env[SELF_VARIABLE] === SELF_VALUE
  })

  reportGate({
    context,
    denominator:
      `${context.files.length} file(s) under ${SKILLS_ROOT}, ` +
      declaredOf({ contract: context.contract }),
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-skill-neutrality.mjs')
) {
  main()
}
