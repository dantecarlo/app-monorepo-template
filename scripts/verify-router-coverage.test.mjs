#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-router-coverage. Once every skill has its row and
// every row its skill, the gate has no finding in the repository, so its
// cases are the only evidence it can go red at all.
//
// The cases hand the gate's `run` a synthetic AGENTS.md, the skill folders
// and the package.json scripts, each differing from a healthy router by
// one thing. The checks then run the gate as a process over a scratch tree
// in the OS temp directory, which `withScratchTree` removes, and over the
// repository itself.
//
// Usage:
//   node --test scripts/verify-router-coverage.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { gate } from './verify-router-coverage.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-router-coverage.mjs'
)
const FAILED = 1
const PASSED = 0
const SKILL = 'lint-copy'
const OTHER = 'copy-write'
const GONE = 'retired'
const SCRIPTS = ['lint', 'validate', 'verify:tests']
const HEADER = '| If the task means… | Load skill | Validated by |'
const DELIMITER = '| --- | --- | --- |'

const row = ({ skill = `\`${SKILL}\``, validated = 'review' }) =>
  `| lint the **copy** of a screen | ${skill} | ${validated} |`

const otherRow = row({ skill: `\`${OTHER}\``, validated: '`lint`' })

// An AGENTS.md whose Router holds two phase tables, the first with `rows`,
// followed by a section of its own that may hold `after`.
const agentsText = ({
  after = [],
  header = HEADER,
  router = true,
  rows = [row({})]
}) =>
  [
    '# AGENTS.md',
    '',
    '## Quick orientation',
    '',
    '- A note.',
    '',
    ...(router
      ? [
          '## Router — natural language → skill → gate',
          '',
          'Resolve the task to a skill from these tables.',
          '',
          '### define',
          '',
          header,
          DELIMITER,
          ...rows,
          '',
          '### build',
          '',
          HEADER,
          DELIMITER,
          otherRow,
          '',
          '---',
          ''
        ]
      : []),
    '## Conventions',
    '',
    '- Arrow functions only.',
    ...after,
    ''
  ].join('\n')

const context =
  ({
    agents = agentsText({}),
    problem = null,
    scripts = SCRIPTS,
    skills = [OTHER, SKILL]
  }) =>
  () => ({
    agents,
    packageJson: { problem, scripts },
    skills
  })

const routed = ({ rows }) => context({ agents: agentsText({ rows }) })

export const CASES = [
  {
    context: context({}),
    expected: 0,
    name: 'a router whose every row names a shipped skill and every skill has a row passes'
  },
  {
    context: routed({
      rows: [row({ validated: '`verify:tests` · `lint`' })]
    }),
    expected: 0,
    name: 'a Validated by cell naming two defined scripts passes'
  },
  {
    context: routed({ rows: [row({ validated: '`lint` (jsx-a11y)' })] }),
    expected: 0,
    name: 'a Validated by cell that explains its script in parentheses passes'
  },
  {
    context: routed({
      rows: [row({ validated: '`validate`, in that project' })]
    }),
    expected: 0,
    name: 'a Validated by cell that explains its script after a comma passes'
  },
  {
    context: routed({
      rows: [`| lint the copy \\| of a screen | \`${SKILL}\` | review |`]
    }),
    expected: 0,
    name: 'an escaped pipe inside a cell does not split it'
  },
  {
    context: context({
      agents: agentsText({}).replaceAll('\n', '\r\n')
    }),
    expected: 0,
    name: 'an AGENTS.md checked out with CRLF line endings passes'
  },
  {
    context: routed({ rows: [row({}), row({ skill: `\`${GONE}\`` })] }),
    expected: 1,
    name: 'a row whose skill has no SKILL.md is a dead row'
  },
  {
    context: routed({ rows: [row({}), row({ skill: SKILL })] }),
    expected: 1,
    name: 'a Load skill cell that names no skill in backticks is a dead row'
  },
  {
    context: context({ skills: [GONE, OTHER, SKILL] }),
    expected: 1,
    name: 'a skill with no router row is unrouted'
  },
  {
    context: context({
      agents: agentsText({
        after: ['', HEADER, DELIMITER, row({ skill: `\`${GONE}\`` })],
        rows: [row({ skill: `\`${OTHER}\`` })]
      })
    }),
    expected: 1,
    name: 'a table outside the Router section routes no skill and is not judged'
  },
  {
    context: routed({ rows: [row({ validated: '`verify:gone`' })] }),
    expected: 1,
    name: 'a Validated by script that package.json does not define is refused'
  },
  {
    context: routed({
      rows: [row({ validated: '`lint` · `verify:gone`' })]
    }),
    expected: 1,
    name: 'every script of a Validated by cell is checked'
  },
  {
    context: routed({ rows: [row({ validated: 'verify:tests' })] }),
    expected: 1,
    name: 'a Validated by cell that names no script in backticks and is not review is refused'
  },
  {
    context: routed({ rows: [row({ validated: '' })] }),
    expected: 1,
    name: 'an empty Validated by cell is refused'
  },
  {
    context: context({
      agents: agentsText({
        header: '| If the task means… | Load skill | Checked by |'
      })
    }),
    expected: 1,
    name: 'a Router table with no Validated by column is refused'
  },
  {
    context: context({
      agents: agentsText({
        header: '| If the task means… | Skill | Validated by |'
      })
    }),
    expected: 2,
    name: 'a Router table with no Load skill column is refused, and its skills go unrouted'
  },
  {
    context: context({ agents: agentsText({ router: false }) }),
    expected: 1,
    name: 'an AGENTS.md with no Router section is refused once, not once per skill'
  },
  {
    context: context({
      agents: [
        '# AGENTS.md',
        '',
        '## Router — natural language → skill → gate',
        '',
        'Prose and no table.',
        '',
        '## Conventions',
        ''
      ].join('\n')
    }),
    expected: 1,
    name: 'a Router section with no table is refused once'
  },
  {
    context: context({ agents: null }),
    expected: 1,
    name: 'a repository with no AGENTS.md is refused once'
  },
  {
    context: context({
      agents: agentsText({ rows: [row({ validated: '`verify:gone`' })] }),
      problem: 'Unexpected token',
      scripts: []
    }),
    expected: 1,
    name: 'a package.json that does not parse is refused, and no script is judged against it'
  }
]

const runGate = ({ files }) =>
  withScratchTree({
    files,
    prefix: 'router-coverage-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

const skillFile = ({ name }) => ({
  [`.claude/skills/${name}/SKILL.md`]: [
    '---',
    `name: ${name}`,
    'description: >-',
    `  Does ${name}. USE WHEN: "${name}". DO NOT USE: other work.`,
    '---',
    '',
    `# ${name}`,
    ''
  ].join('\n')
})

const packageFile = ({ scripts = SCRIPTS }) => ({
  'package.json': JSON.stringify({
    scripts: Object.fromEntries(
      scripts.map((name) => [name, `echo ${name}`])
    )
  })
})

const checks = [
  {
    name: 'a dead row names its line, its phase and the missing skill',
    run: () => {
      const [finding] = gate.run(
        routed({ rows: [row({}), row({ skill: `\`${GONE}\`` })] })()
      )
      assert.match(
        finding.detail,
        /^AGENTS\.md:16 \(define\): .*`retired`.*\.claude\/skills\/retired\/SKILL\.md/u
      )
    }
  },
  {
    name: 'an unrouted skill names its SKILL.md',
    run: () => {
      const [finding] = gate.run(
        context({ skills: [GONE, OTHER, SKILL] })()
      )
      assert.match(
        finding.detail,
        /^\.claude\/skills\/retired\/SKILL\.md: .*no row/u
      )
    }
  },
  {
    name: 'an undefined script names its line and the script',
    run: () => {
      const [finding] = gate.run(
        routed({ rows: [row({ validated: '`verify:gone`' })] })()
      )
      assert.match(
        finding.detail,
        /^AGENTS\.md:15 \(define\): .*`verify:gone`.*package\.json/u
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
    name: 'the gate run over a tree with a dead row, an unrouted skill and an undefined script exits 1 and names each',
    run: () => {
      const result = runGate({
        files: {
          'AGENTS.md': agentsText({
            rows: [
              row({ validated: '`verify:gone`' }),
              row({ skill: `\`${GONE}\`` })
            ]
          }),
          ...packageFile({}),
          ...skillFile({ name: SKILL }),
          ...skillFile({ name: OTHER }),
          ...skillFile({ name: 'unrouted' })
        }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-router-coverage: 3 problem/u)
      assert.match(result.stderr, /`verify:gone`/u)
      assert.match(result.stderr, /`retired`/u)
      assert.match(result.stderr, /skills\/unrouted\/SKILL\.md/u)
    }
  },
  {
    name: 'a folder under .claude/skills with no SKILL.md is no skill, as verify-skill-frontmatter reads it, and needs no row',
    run: () => {
      const result = runGate({
        files: {
          '.claude/skills/drafts/notes.md': '# Notes\n',
          'AGENTS.md': agentsText({}),
          ...packageFile({}),
          ...skillFile({ name: SKILL }),
          ...skillFile({ name: OTHER })
        }
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-router-coverage: PASS/u)
      assert.match(result.stdout, /2 skill\(s\)/u)
    }
  },
  {
    name: 'the gate run over a tree with no package.json refuses it',
    run: () => {
      const result = runGate({
        files: {
          'AGENTS.md': agentsText({}),
          ...skillFile({ name: SKILL }),
          ...skillFile({ name: OTHER })
        }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /package\.json/u)
    }
  },
  {
    name: 'the gate exits 0 over the repository and states what it judged',
    run: () => {
      const result = spawnSync(process.execPath, [GATE], {
        encoding: 'utf8'
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-router-coverage: PASS/u)
      assert.match(
        result.stdout,
        /\d+ skill\(s\) under \.claude\/skills, \d+ Router row\(s\) of AGENTS\.md/u
      )
      assert.match(result.stdout, /NOT covered: /u)
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
