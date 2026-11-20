#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-skill-neutrality. Once no shipped skill names a
// downstream project the gate has no finding in the repository, so its
// cases are the only evidence it can go red at all.
//
// The cases hand the gate's `run` synthetic skills and a synthetic list of
// downstream projects, each differing from a neutral one by one thing; no
// real project is named here. The checks then run the gate as a process
// over a scratch tree in the OS temp directory, which `withScratchTree`
// removes, and over the repository itself.
//
// Usage:
//   node --test scripts/verify-skill-neutrality.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { gate } from './verify-skill-neutrality.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-skill-neutrality.mjs'
)
const FAILED = 1
const PASSED = 0
const SELF_VARIABLE = 'ATL_TEMPLATE_SELF'
const CONTRACT = '.agents/contracts/downstream-projects.json'
const LOCK = '.claude/skills-lock.json'
const SKILL = '.claude/skills/lint-copy/SKILL.md'
const TEMPLATE = '.claude/skills/lint-copy/report.template.md'
const NESTED = '.claude/skills/lint-copy/references/notes/example.md'
const SCRIPT = '.claude/skills/lint-copy/scripts/check.mjs'
const PRODUCT = 'Northwind'
const REPOSITORY = 'nw-ledger'
const OTHER = 'Tailspin'
const PROJECTS = [
  { names: [PRODUCT, REPOSITORY], project: PRODUCT },
  { names: [OTHER], project: OTHER }
]
const NEUTRAL = [
  '---',
  'name: lint-copy',
  'description: Lints the copy.',
  '---',
  '',
  '# Lint copy',
  '',
  'A project may, for example, keep its ids as `TASK-<slug>`.',
  ''
].join('\n')

const withLine = ({ line }) => `${NEUTRAL}${line}\n`

const read = ({ projects = PROJECTS } = {}) => ({
  absent: false,
  problem: null,
  projects
})

const skills =
  ({
    contract = read(),
    files = { [SKILL]: NEUTRAL },
    self = true
  } = {}) =>
  () => ({
    contract,
    files: Object.entries(files).map(([path, text]) => ({ path, text })),
    self
  })

const naming = ({ line, path = SKILL }) =>
  skills({ files: { [path]: withLine({ line }) } })

const declaring = ({ projects }) =>
  skills({ contract: read({ projects }) })

export const CASES = [
  {
    context: skills(),
    expected: 0,
    name: 'a skill that names no downstream project passes'
  },
  {
    context: naming({ line: `${PRODUCT}, for example, drives a board.` }),
    expected: 1,
    name: "a skill that names a downstream project's product is refused"
  },
  {
    context: naming({ line: `Clone ${REPOSITORY} and run it.` }),
    expected: 1,
    name: "a skill that names a downstream project's repository is refused"
  },
  {
    context: naming({ line: 'As northwind does, in lower case.' }),
    expected: 1,
    name: 'a name in another letter case is refused'
  },
  {
    context: naming({
      line: [
        `Read ${PRODUCT}'s layer.`,
        'Import `@northwind/core`.',
        'Ship `com.northwind.app`.'
      ].join('\n')
    }),
    expected: 3,
    name: 'a name in a possessive, a package scope or a bundle id is refused'
  },
  {
    context: naming({
      line: 'The northwindow and the nw-ledgers are other words.'
    }),
    expected: 0,
    name: 'a name inside a longer word is not a finding'
  },
  {
    context: naming({ line: `Its ${PRODUCT} board.`, path: TEMPLATE }),
    expected: 1,
    name: 'a template file of a skill that names a project is refused'
  },
  {
    context: naming({ line: `As in ${OTHER}.`, path: NESTED }),
    expected: 1,
    name: 'a file in a nested folder of a skill is judged'
  },
  {
    context: naming({ line: `// copied from ${OTHER}`, path: SCRIPT }),
    expected: 1,
    name: 'a script a skill ships is judged'
  },
  {
    context: naming({ line: `${PRODUCT} and ${OTHER} both do it.` }),
    expected: 2,
    name: 'every name on a line is a finding of its own'
  },
  {
    context: skills({
      contract: { absent: true, problem: null, projects: [] },
      self: true
    }),
    expected: 1,
    name: 'an absent list of downstream projects is refused in the template'
  },
  {
    context: skills({
      contract: { absent: true, problem: null, projects: [] },
      files: { [SKILL]: withLine({ line: `${PRODUCT} does it.` }) },
      self: false
    }),
    expected: 0,
    name: 'an absent list of downstream projects passes in a derived project'
  },
  {
    context: skills({
      contract: {
        absent: false,
        problem: 'Unexpected token',
        projects: []
      }
    }),
    expected: 1,
    name: 'a list of downstream projects that does not parse is refused'
  },
  {
    context: declaring({ projects: [] }),
    expected: 1,
    name: 'a list that declares no downstream project is refused'
  },
  {
    context: declaring({ projects: [{ names: [], project: PRODUCT }] }),
    expected: 1,
    name: 'a downstream project that declares no name is refused'
  },
  {
    context: declaring({
      projects: [{ names: ['  '], project: PRODUCT }]
    }),
    expected: 1,
    name: 'a downstream project that declares a blank name is refused'
  },
  {
    context: declaring({ projects: [{ names: [PRODUCT] }] }),
    expected: 1,
    name: 'a downstream project with no project name is refused'
  }
]

const runGate = ({ env = {}, files }) =>
  withScratchTree({
    files,
    prefix: 'skill-neutrality-run-',
    use: ({ root }) => {
      const inherited = { ...process.env }
      delete inherited[SELF_VARIABLE]
      return spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8',
        env: { ...inherited, ...env }
      })
    }
  })

const contractText = () => JSON.stringify({ projects: PROJECTS }, null, 2)

const checks = [
  {
    name: 'a finding names the file, the line, the name and its project',
    run: () => {
      const [finding] = gate.run(
        naming({ line: `Clone ${REPOSITORY} and run it.` })()
      )
      assert.equal(
        finding.detail,
        `${SKILL}:9: names ${REPOSITORY}, a name of the downstream ` +
          `project ${PRODUCT} (${CONTRACT}); a shipped skill describes ` +
          'the shape, never the project'
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
    name: 'the gate run over a vendored skill that names a project exits 1 and names it',
    run: () => {
      const result = runGate({
        files: {
          [CONTRACT]: contractText(),
          [LOCK]: JSON.stringify({
            skills: { 'lint-copy': {} },
            version: 1
          }),
          [SKILL]: NEUTRAL,
          [NESTED]: withLine({ line: `As ${OTHER} does.` })
        }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-skill-neutrality: 1 problem/u)
      assert.match(
        result.stderr,
        /lint-copy\/references\/notes\/example\.md:9: names Tailspin/u
      )
    }
  },
  {
    name: 'the gate run over a tree with no list exits 0 and says it forbade nothing',
    run: () => {
      const result = runGate({
        files: { [SKILL]: withLine({ line: `${PRODUCT} does it.` }) }
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-skill-neutrality: PASS/u)
      assert.match(result.stdout, /no downstream project declared/u)
    }
  },
  {
    name: 'the gate run with ATL_TEMPLATE_SELF=1 over a tree with no list exits 1',
    run: () => {
      const result = runGate({
        env: { [SELF_VARIABLE]: '1' },
        files: { [SKILL]: NEUTRAL }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(
        result.stderr,
        /downstream-projects\.json: is absent, so the gate forbids no name/u
      )
    }
  },
  {
    name: 'the gate run over a list that does not parse exits 1 and names it',
    run: () => {
      const result = runGate({
        files: { [CONTRACT]: '{ "projects": [', [SKILL]: NEUTRAL }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(
        result.stderr,
        /downstream-projects\.json: does not parse/u
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
      assert.match(result.stdout, /verify-skill-neutrality: PASS/u)
      assert.match(result.stdout, /\d+ file\(s\) under \.claude\/skills/u)
      assert.match(result.stdout, /NOT covered: /u)
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
