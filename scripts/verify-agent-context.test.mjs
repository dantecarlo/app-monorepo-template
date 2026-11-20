#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-agent-context. Once every agent names its grader the
// gate has no finding in the repository, so its cases are the only evidence
// it can go red at all.
//
// The cases hand the gate's `run` synthetic agents and entries, each
// differing from a healthy pair by one thing; every fixture keeps the agent
// it is not testing fully declared, so a count names the branch that fired.
// The checks then run the gate as a process over a scratch tree in the OS
// temp directory, which `withScratchTree` removes, and over the repository.
//
// Usage:
//   node --test scripts/verify-agent-context.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { FINDING_KIND, gate } from './verify-agent-context.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-agent-context.mjs'
)
const FAILED = 1
const PASSED = 0
const CONTEXT_FILE = '.agents/agent-context.json'
const SCOUT = 'scout'
const SCRIBE = 'scribe'
const SCOUTING = 'scouting'
const WRITING = 'writing'
const MISSING_SKILL = 'unknown-skill'

const DECLARED = {
  [SCOUT]: { gradedBy: [SCOUTING] },
  [SCRIBE]: { gradedBy: [WRITING] }
}

const context =
  ({
    agents = [SCOUT, SCRIBE],
    declared = DECLARED,
    problems = [],
    skills = [SCOUTING, WRITING]
  } = {}) =>
  () => ({ agents, declared, problems, skills })

const withScout = ({ entry }) => ({ ...DECLARED, [SCOUT]: entry })

export const CASES = [
  {
    context: context(),
    expected: 0,
    name: 'every agent declared with a gradedBy naming an existing skill passes'
  },
  {
    context: context({ declared: { [SCRIBE]: DECLARED[SCRIBE] } }),
    expected: 1,
    name: 'an agent with no entry in the agent context fires'
  },
  {
    context: context({ declared: withScout({ entry: {} }) }),
    expected: 1,
    name: 'an entry with no gradedBy fires'
  },
  {
    context: context({ declared: withScout({ entry: { gradedBy: [] } }) }),
    expected: 1,
    name: 'an empty gradedBy fires'
  },
  {
    context: context({
      declared: withScout({ entry: { gradedBy: SCOUTING } })
    }),
    expected: 1,
    name: 'a gradedBy that is a string, not a list, fires'
  },
  {
    context: context({
      declared: withScout({ entry: { gradedBy: [SCOUTING, ' '] } })
    }),
    expected: 1,
    name: 'a gradedBy holding a blank name fires'
  },
  {
    context: context({
      declared: withScout({
        entry: { gradedBy: [SCOUTING, MISSING_SKILL] }
      })
    }),
    expected: 1,
    name: 'a gradedBy naming a skill that does not exist fires once'
  },
  {
    context: context({ declared: withScout({ entry: [SCOUTING] }) }),
    expected: 1,
    name: 'an entry that is not an object fires'
  },
  {
    context: context({ agents: [SCRIBE] }),
    expected: 1,
    name: 'an entry for an agent that does not exist fires'
  },
  {
    context: context({
      declared: null,
      problems: [{ path: CONTEXT_FILE, reason: 'does not parse' }]
    }),
    expected: 1,
    name: 'an agent context that cannot be read fires once, not once per agent'
  }
]

const kindsOf = ({ findings }) => findings.map(({ kind }) => kind)

const runGate = ({ files }) =>
  withScratchTree({
    files,
    prefix: 'agent-context-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

const agentSource = ({ name }) =>
  [
    '---',
    `name: ${name}`,
    'description: >',
    `  The ${name} agent.`,
    'tools: Read, Grep',
    'model: sonnet',
    '---',
    '',
    `# ${name}`,
    ''
  ].join('\n')

const skillSource = ({ name }) =>
  [
    '---',
    `name: ${name}`,
    'description: >',
    `  USE WHEN: "${name}". DO NOT USE: other work.`,
    '---',
    '',
    `# ${name}`,
    ''
  ].join('\n')

const tree = ({ declared }) => ({
  [`.agents/agents/${SCOUT}.agent.md`]: agentSource({ name: SCOUT }),
  [`.claude/skills/${SCOUTING}/SKILL.md`]: skillSource({ name: SCOUTING }),
  ...(declared === undefined
    ? {}
    : { [CONTEXT_FILE]: JSON.stringify({ agents: declared }) })
})

const checks = [
  {
    name: 'each branch reports its own kind, and a stale entry is not graded',
    run: () => {
      assert.deepEqual(
        kindsOf({
          findings: gate.run(
            context({
              agents: [SCRIBE],
              declared: withScout({ entry: { gradedBy: [MISSING_SKILL] } })
            })()
          )
        }),
        [FINDING_KIND.stale]
      )
      assert.deepEqual(
        kindsOf({
          findings: gate.run(
            context({
              declared: withScout({ entry: { gradedBy: [MISSING_SKILL] } })
            })()
          )
        }),
        [FINDING_KIND.unknownSkill]
      )
      assert.deepEqual(
        kindsOf({
          findings: gate.run(
            context({
              declared: null,
              problems: [{ path: CONTEXT_FILE, reason: 'does not parse' }]
            })()
          )
        }),
        [FINDING_KIND.unreadable]
      )
      assert.deepEqual(
        kindsOf({
          findings: gate.run(
            context({ declared: { [SCRIBE]: DECLARED[SCRIBE] } })()
          )
        }),
        [FINDING_KIND.undeclared]
      )
      assert.deepEqual(
        kindsOf({
          findings: gate.run(
            context({ declared: withScout({ entry: {} }) })()
          )
        }),
        [FINDING_KIND.ungraded]
      )
      assert.deepEqual(
        kindsOf({
          findings: gate.run(
            context({ declared: withScout({ entry: { gradedBy: [] } }) })()
          )
        }),
        [FINDING_KIND.shape]
      )
    }
  },
  {
    name: 'a finding names the agent and the skill that does not exist',
    run: () => {
      const [finding] = gate.run(
        context({
          declared: withScout({ entry: { gradedBy: [MISSING_SKILL] } })
        })()
      )
      assert.match(
        finding.detail,
        /^scout: gradedBy names unknown-skill, which is no skill: \.claude\/skills\/unknown-skill\/SKILL\.md does not exist$/u
      )
    }
  },
  {
    name: 'an undeclared agent is told it names no skill that grades it',
    run: () => {
      const [finding] = gate.run(
        context({ declared: { [SCRIBE]: DECLARED[SCRIBE] } })()
      )
      assert.match(
        finding.detail,
        /^scout: has no entry in \.agents\/agent-context\.json, so it names no skill that grades it \(gradedBy\)$/u
      )
    }
  },
  {
    name: 'the cases fail against a gate that finds nothing',
    run: () => {
      const failures = runCases({
        cases: CASES,
        gate: blindGate({ gate })
      })
      assert.ok(failures.length > 0, 'every case passed a blinded gate')
    }
  },
  {
    name: 'the gate run over a tree whose agent names a missing skill exits 1 and names it',
    run: () => {
      const result = runGate({
        files: tree({
          declared: { [SCOUT]: { gradedBy: [MISSING_SKILL] } }
        })
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-agent-context: 1 problem/u)
      assert.match(result.stderr, /scout: gradedBy names unknown-skill/u)
    }
  },
  {
    name: 'the gate run over a tree with no agent context exits 1 and names the file',
    run: () => {
      const result = runGate({ files: tree({}) })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-agent-context: 1 problem/u)
      assert.match(
        result.stderr,
        /\.agents\/agent-context\.json: is missing, so no agent names the skill that grades it/u
      )
    }
  },
  {
    name: 'the gate run over a tree whose agent context does not parse exits 1 and names the file',
    run: () => {
      const result = runGate({
        files: { ...tree({}), [CONTEXT_FILE]: '{ "agents": ' }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-agent-context: 1 problem/u)
      assert.match(
        result.stderr,
        /\.agents\/agent-context\.json: does not parse: /u
      )
    }
  },
  {
    name: 'the gate run over a tree with no agents object exits 1 and names the file',
    run: () => {
      const result = runGate({
        files: { ...tree({}), [CONTEXT_FILE]: '{ "graders": {} }' }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(
        result.stderr,
        /\.agents\/agent-context\.json: holds no "agents" object/u
      )
    }
  },
  {
    name: 'the gate run over a tree whose agent source does not parse exits 1 and names the source',
    run: () => {
      const result = runGate({
        files: {
          ...tree({ declared: { [SCOUT]: { gradedBy: [SCOUTING] } } }),
          [`.agents/agents/${SCOUT}.agent.md`]: '# no frontmatter\n'
        }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-agent-context: 1 problem/u)
      assert.match(
        result.stderr,
        /\.agents\/agents: .*scout\.agent\.md: must open with a --- frontmatter block/u
      )
    }
  },
  {
    name: 'the gate run over a healthy tree exits 0 and states what it judged',
    run: () => {
      const result = runGate({
        files: tree({ declared: { [SCOUT]: { gradedBy: [SCOUTING] } } })
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(
        result.stdout,
        /verify-agent-context: PASS — 1 agent\(s\) under \.agents\/agents, 1 skill\(s\) under \.claude\/skills\./u
      )
    }
  },
  {
    name: 'the gate exits 0 over the repository and states what it judged',
    run: () => {
      const result = spawnSync(process.execPath, [GATE], {
        encoding: 'utf8'
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-agent-context: PASS/u)
      assert.match(result.stdout, /\d+ agent\(s\) under \.agents\/agents/u)
      assert.match(result.stdout, /NOT covered: /u)
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
