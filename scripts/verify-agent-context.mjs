#!/usr/bin/env node
// ---------------------------------------------------------------------------
// verify-agent-context — every agent names the skill that grades it, and
// says what it may write.
//
// An agent is judged by the skill it runs: the procedure, the files and the
// report that skill states are what its output is held to. So every agent
// written in `.agents/agents/<name>.agent.md` has an entry in
// `.agents/agent-context.json` whose `gradedBy` names that skill:
//
//   - every agent has an entry, and every entry names an agent that exists;
//   - an entry is an object whose `gradedBy` is a non-empty list of names;
//   - each name is a skill: `.claude/skills/<name>/SKILL.md` exists;
//   - `writes` is true or false, read by the write guard
//     (scripts/agent-harness/write-guard/): false makes the agent read-only;
//   - `surface`, when present, sits beside `writes: true` and is a non-empty
//     list of repository-relative folders the writer is held to;
//   - an entry holds no other key, so a misspelled one cannot leave an agent
//     unguarded.
//
// The agents are read by the projector's own reader, and the skills are the
// folders the skill frontmatter gate judges, so this gate and those agree on
// what an agent and a skill are.
//
// `run` is pure: it decides on what `collectContext` gathers.
//
// Usage:
//   node scripts/verify-agent-context.mjs [--root <directory>]
// ---------------------------------------------------------------------------

import { AssertionError } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { readNeutralAgents } from './agent-harness/neutral-source.mjs'
import { defineGate, reportGate } from './gate/gate.mjs'
import { collectContext as collectSkills } from './verify-skill-frontmatter.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT_FLAG = '--root'
const NOT_FOUND = -1
const AGENTS_DIRECTORY = '.agents/agents'
const CONTEXT_FILE = '.agents/agent-context.json'
const SKILLS_ROOT = '.claude/skills'
const SKILL_FILE = 'SKILL.md'

export const FINDING_KIND = Object.freeze({
  shape: 'shape',
  stale: 'stale',
  undeclared: 'undeclared',
  undeclaredWrites: 'undeclared-writes',
  ungraded: 'ungraded',
  unknownKey: 'unknown-key',
  unknownSkill: 'unknown-skill',
  unreadable: 'unreadable'
})

// The keys an entry may hold. The write guard reads `writes` and `surface`,
// so a misspelled key would leave an agent unguarded with nothing to say so.
const ENTRY_KEYS = ['gradedBy', 'surface', 'writes']
// A surface folder is relative to the repository root: no leading slash or
// backslash, no drive letter, no `..` segment.
const LEAVES_REPOSITORY = /^[\\/]|^[a-zA-Z]:|(?:^|[\\/])\.\.(?:[\\/]|$)/u

const finding = ({ detail, kind, name }) => ({
  detail: `${name}: ${detail}`,
  kind,
  name
})

const isRecord = ({ value }) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isName = ({ value }) =>
  typeof value === 'string' && value.trim() !== ''

const judgeKeys = ({ entry, name }) =>
  Object.keys(entry)
    .filter((key) => !ENTRY_KEYS.includes(key))
    .map((key) =>
      finding({
        detail:
          `${key} is no key of an agent-context entry; the keys are ` +
          'gradedBy, surface and writes',
        kind: FINDING_KIND.unknownKey,
        name
      })
    )

const judgeWrites = ({ entry, name }) => {
  if (!Object.hasOwn(entry, 'writes')) {
    return [
      finding({
        detail:
          'says nothing of what it may write; add writes: true or ' +
          'writes: false',
        kind: FINDING_KIND.undeclaredWrites,
        name
      })
    ]
  }
  return typeof entry.writes === 'boolean'
    ? []
    : [
        finding({
          detail: 'writes must be true or false',
          kind: FINDING_KIND.shape,
          name
        })
      ]
}

const judgeSurface = ({ entry, name }) => {
  if (!Object.hasOwn(entry, 'surface')) return []
  const { surface } = entry
  if (entry.writes === false) {
    return [
      finding({
        detail:
          'a surface holds a writer to folders, and writes: false writes ' +
          'nowhere; drop surface or set writes: true',
        kind: FINDING_KIND.shape,
        name
      })
    ]
  }
  if (!Array.isArray(surface) || surface.length === 0) {
    return [
      finding({
        detail:
          'surface must be a non-empty list of repository-relative folders',
        kind: FINDING_KIND.shape,
        name
      })
    ]
  }
  return surface
    .filter(
      (folder) =>
        !isName({ value: folder }) || LEAVES_REPOSITORY.test(folder)
    )
    .map((folder) =>
      finding({
        detail:
          `surface folder ${JSON.stringify(folder)} must be relative to ` +
          'the repository root, with no ".." and no drive',
        kind: FINDING_KIND.shape,
        name
      })
    )
}

const judgeGradedBy = ({ entry, name, skills }) => {
  if (!Object.hasOwn(entry, 'gradedBy')) {
    return [
      finding({
        detail: 'names no skill that grades it; add gradedBy',
        kind: FINDING_KIND.ungraded,
        name
      })
    ]
  }
  const { gradedBy } = entry
  if (
    !Array.isArray(gradedBy) ||
    gradedBy.length === 0 ||
    !gradedBy.every((value) => isName({ value }))
  ) {
    return [
      finding({
        detail: 'gradedBy must be a non-empty list of skill names',
        kind: FINDING_KIND.shape,
        name
      })
    ]
  }
  return gradedBy
    .filter((skill) => !skills.includes(skill))
    .map((skill) =>
      finding({
        detail:
          `gradedBy names ${skill}, which is no skill: ` +
          `${SKILLS_ROOT}/${skill}/${SKILL_FILE} does not exist`,
        kind: FINDING_KIND.unknownSkill,
        name
      })
    )
}

const judgeEntry = ({ entry, name, skills }) => {
  if (!isRecord({ value: entry })) {
    return [
      finding({
        detail: `its entry in ${CONTEXT_FILE} must be an object`,
        kind: FINDING_KIND.shape,
        name
      })
    ]
  }
  return [
    ...judgeKeys({ entry, name }),
    ...judgeGradedBy({ entry, name, skills }),
    ...judgeWrites({ entry, name }),
    ...judgeSurface({ entry, name })
  ]
}

// What could not be read is reported alone: with no agent context, or no
// agent sources, every agent would also read as undeclared.
const judge = ({ agents, declared, problems, skills }) => {
  if (problems.length > 0) {
    return problems.map(({ path, reason }) =>
      finding({
        detail: reason,
        kind: FINDING_KIND.unreadable,
        name: path
      })
    )
  }
  const undeclared = agents
    .filter((name) => !Object.hasOwn(declared, name))
    .map((name) =>
      finding({
        detail:
          `has no entry in ${CONTEXT_FILE}, so it names no skill that ` +
          'grades it (gradedBy)',
        kind: FINDING_KIND.undeclared,
        name
      })
    )
  const stale = Object.keys(declared)
    .filter((name) => !agents.includes(name))
    .map((name) =>
      finding({
        detail: `has an entry in ${CONTEXT_FILE} but no source in ${AGENTS_DIRECTORY}/`,
        kind: FINDING_KIND.stale,
        name
      })
    )
  const graded = agents
    .filter((name) => Object.hasOwn(declared, name))
    .flatMap((name) => judgeEntry({ entry: declared[name], name, skills }))
  return [...undeclared, ...stale, ...graded]
}

export const gate = defineGate({
  claims:
    `every agent under ${AGENTS_DIRECTORY}/ has an entry in ${CONTEXT_FILE} ` +
    'whose gradedBy is a non-empty list of skill names, each a folder of ' +
    `${SKILLS_ROOT}/ holding a ${SKILL_FILE}, whose writes is true or ` +
    'false, whose surface, when present, is a non-empty list of ' +
    'repository-relative folders beside writes: true, and which holds no ' +
    'other key; and every entry names an agent that exists.',
  id: 'verify-agent-context',
  notCovered:
    'whether the skill an entry names is the RIGHT grader for the agent, ' +
    'which review reads; whether that skill has evals, or whether they were ' +
    'ever run with the agent as the executor, which no runner does yet; the ' +
    'binding documents a delegated agent must name; whether writes and ' +
    'surface are the right ones for the agent, which review reads; and ' +
    'whether a runtime enforces them, which the write guard does for the ' +
    'Claude Code file tools only (write-guard:test proves it).',
  run: judge
})

const readAgents = ({ root }) => {
  const directory = join(root, AGENTS_DIRECTORY)
  if (!existsSync(directory)) return { agents: [], problems: [] }
  try {
    return {
      agents: readNeutralAgents({ directory }).map(({ name }) => name),
      problems: []
    }
  } catch (error) {
    if (!(error instanceof AssertionError)) throw error
    return {
      agents: [],
      problems: [{ path: AGENTS_DIRECTORY, reason: error.message }]
    }
  }
}

const readDeclared = ({ root }) => {
  const absolute = join(root, CONTEXT_FILE)
  if (!existsSync(absolute)) {
    return {
      declared: null,
      problems: [
        {
          path: CONTEXT_FILE,
          reason: 'is missing, so no agent names the skill that grades it'
        }
      ]
    }
  }
  let parsed
  try {
    parsed = JSON.parse(readFileSync(absolute, 'utf8'))
  } catch (error) {
    return {
      declared: null,
      problems: [
        { path: CONTEXT_FILE, reason: `does not parse: ${error.message}` }
      ]
    }
  }
  const declared = parsed?.agents
  return declared !== null &&
    typeof declared === 'object' &&
    !Array.isArray(declared)
    ? { declared, problems: [] }
    : {
        declared: null,
        problems: [
          { path: CONTEXT_FILE, reason: 'holds no "agents" object' }
        ]
      }
}

// The agent names of the neutral sources, the entries of the agent context,
// the skill folders, and whatever of those could not be read.
export const collectContext = ({ root }) => {
  const sources = readAgents({ root })
  const file = readDeclared({ root })
  return {
    agents: sources.agents,
    declared: file.declared,
    problems: [...sources.problems, ...file.problems],
    skills: collectSkills({ root }).skills.map(({ folder }) => folder)
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
  reportGate({
    context,
    denominator:
      `${context.agents.length} agent(s) under ${AGENTS_DIRECTORY}, ` +
      `${context.skills.length} skill(s) under ${SKILLS_ROOT}`,
    gate
  })
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(HERE, 'verify-agent-context.mjs')
) {
  main()
}
