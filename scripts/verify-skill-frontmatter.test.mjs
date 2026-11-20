#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-skill-frontmatter. Once every skill carries its
// frontmatter the gate has no finding in the repository, so its cases are
// the only evidence it can go red at all.
//
// The cases hand the gate's `run` synthetic skills, each differing from a
// healthy one by one thing. The checks then run the gate as a process over
// a scratch tree in the OS temp directory, which `withScratchTree` removes,
// and over the repository itself.
//
// Usage:
//   node --test scripts/verify-skill-frontmatter.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { gate } from './verify-skill-frontmatter.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-skill-frontmatter.mjs'
)
const FAILED = 1
const PASSED = 0
const LIMIT = 1024
const FOLDER = 'lint-copy'
const VENDORED = 'diagram-kit'
const LOCK = '.claude/skills-lock.json'
const TRIGGERS = [
  '  USE WHEN: "lint the copy", "check the copy".',
  '  DO NOT USE: writing new copy (use `copy-write`).'
]
const BODY = ['', '# Lint copy', '', 'The procedure.', '']

const skillText = ({ head, name = FOLDER }) =>
  ['---', `name: ${name}`, ...head, '---', ...BODY].join('\n')

const folded = ({
  lines = ['  Lints the copy of a screen.'],
  style = '>'
}) => [`description: ${style}`, ...lines, ...TRIGGERS]

// A description of exactly `length` characters once parsed: a `>-` block
// keeps no line break, a `>` block keeps one.
const sized = ({ length, style = '>-' }) => {
  const kept = style === '>' ? 1 : 0
  const triggers = 'USE WHEN: "lint". DO NOT USE: other work.'
  const filler = 'x'.repeat(length - kept - triggers.length - 1)
  return [`description: ${style}`, `  ${filler} ${triggers}`]
}

const skills =
  ({ entries, vendored = [] }) =>
  () => ({
    lock: { problem: null, vendored },
    skills: entries.map(({ folder = FOLDER, text }) => ({
      folder,
      path: `.claude/skills/${folder}/SKILL.md`,
      text
    }))
  })

const one = ({ head, name, vendored }) =>
  skills({ entries: [{ text: skillText({ head, name }) }], vendored })

export const CASES = [
  {
    context: one({ head: folded({}) }),
    expected: 0,
    name: 'a skill with a folded description holding both triggers passes'
  },
  {
    context: one({ head: folded({ style: '|' }) }),
    expected: 0,
    name: 'a literal description passes'
  },
  {
    context: one({
      head: [
        'description: "Lints the copy. USE WHEN: \\"lint\\". DO NOT USE: other work."'
      ]
    }),
    expected: 0,
    name: 'a double-quoted description passes'
  },
  {
    context: one({
      head: [
        "description: 'Lints the copy. USE WHEN: ''lint''. DO NOT USE: other work.'"
      ]
    }),
    expected: 0,
    name: 'a single-quoted description passes'
  },
  {
    context: one({
      head: [
        ...folded({}),
        'license: MIT',
        'metadata:',
        '  author: someone',
        '  version: "1.0"'
      ]
    }),
    expected: 0,
    name: 'a skill with a nested metadata mapping passes'
  },
  {
    context: skills({
      entries: [
        { text: skillText({ head: folded({}) }).replaceAll('\n', '\r\n') }
      ]
    }),
    expected: 0,
    name: 'a skill checked out with CRLF line endings passes'
  },
  {
    context: skills({ entries: [{ text: BODY.join('\n') }] }),
    expected: 1,
    name: 'a skill with no frontmatter is refused'
  },
  {
    context: skills({
      entries: [
        { text: ['---', `name: ${FOLDER}`, ...folded({})].join('\n') }
      ]
    }),
    expected: 1,
    name: 'a frontmatter that is never closed is refused'
  },
  {
    context: one({ head: [...folded({}), 'this line is no key'] }),
    expected: 1,
    name: 'a frontmatter line that is not a key is refused'
  },
  {
    context: one({
      head: [
        'description: Lints copy. USE WHEN: "lint". DO NOT USE: other work.'
      ]
    }),
    expected: 1,
    name: 'a plain description holding a colon and a space does not parse'
  },
  {
    context: one({ head: [...folded({}), `name: ${FOLDER}`] }),
    expected: 1,
    name: 'a frontmatter that repeats a key is refused'
  },
  {
    context: one({ head: folded({}), name: 'lint' }),
    expected: 1,
    name: 'a skill whose name is not its folder is refused'
  },
  {
    context: skills({
      entries: [
        { text: ['---', ...folded({}), '---', ...BODY].join('\n') }
      ]
    }),
    expected: 1,
    name: 'a skill with no name is refused'
  },
  {
    context: one({ head: ['license: MIT'] }),
    expected: 1,
    name: 'a skill with no description is refused'
  },
  {
    context: one({ head: ['description:', '  text: not a string'] }),
    expected: 1,
    name: 'a description that is a mapping is refused'
  },
  {
    context: one({ head: sized({ length: LIMIT }) }),
    expected: 0,
    name: 'a description of 1,024 characters passes'
  },
  {
    context: one({ head: sized({ length: LIMIT + 1 }) }),
    expected: 1,
    name: 'a description of 1,025 characters is refused'
  },
  {
    context: one({ head: sized({ length: LIMIT + 1, style: '>' }) }),
    expected: 1,
    name: 'the line break a folded description keeps is counted'
  },
  {
    context: one({
      head: ['description: >', '  Lints the copy.', TRIGGERS[1]]
    }),
    expected: 1,
    name: 'a description with no USE WHEN: is refused'
  },
  {
    context: one({
      head: ['description: >', '  Lints the copy.', TRIGGERS[0]]
    }),
    expected: 1,
    name: 'a description with no DO NOT USE: is refused'
  },
  {
    context: one({
      head: [
        'description: >',
        '  Lints the copy.',
        TRIGGERS[0],
        '  DO NOT USE for new copy.'
      ]
    }),
    expected: 1,
    name: 'a DO NOT USE without its colon is refused'
  },
  {
    context: one({ head: ['description: >', '  Lints the copy.'] }),
    expected: 2,
    name: 'a description with neither trigger is refused for each'
  },
  {
    context: skills({
      entries: [
        {
          folder: VENDORED,
          text: skillText({
            head: ['description: Draws diagrams from a plain request.'],
            name: VENDORED
          })
        }
      ],
      vendored: [VENDORED]
    }),
    expected: 0,
    name: 'a vendored skill keeps its upstream triggers'
  },
  {
    context: skills({
      entries: [
        {
          folder: VENDORED,
          text: skillText({
            head: ['description: Draws diagrams.'],
            name: 'diagrams'
          })
        }
      ],
      vendored: [VENDORED]
    }),
    expected: 1,
    name: 'a vendored skill whose name is not its folder is refused'
  },
  {
    context: skills({
      entries: [
        {
          folder: VENDORED,
          text: skillText({
            head: sized({ length: LIMIT + 1 }),
            name: VENDORED
          })
        }
      ],
      vendored: [VENDORED]
    }),
    expected: 1,
    name: 'a vendored skill past 1,024 characters is refused'
  },
  {
    context: () => ({
      ...skills({
        entries: [{ text: skillText({ head: folded({}) }) }]
      })(),
      lock: { problem: 'Unexpected token', vendored: [] }
    }),
    expected: 1,
    name: 'a skills lock that does not parse is refused'
  }
]

const runGate = ({ files }) =>
  withScratchTree({
    files,
    prefix: 'skill-frontmatter-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

const lockOf = ({ names }) =>
  JSON.stringify({
    skills: Object.fromEntries(
      names.map((name) => [name, { license: 'MIT' }])
    ),
    version: 1
  })

const checks = [
  {
    name: 'a finding names the file and the length it found',
    run: () => {
      const [finding] = gate.run(
        one({ head: sized({ length: LIMIT + 1 }) })()
      )
      assert.match(
        finding.detail,
        /^\.claude\/skills\/lint-copy\/SKILL\.md: its description is 1,025 characters/u
      )
    }
  },
  {
    name: 'a finding names the line that does not parse',
    run: () => {
      const [finding] = gate.run(
        one({ head: [...folded({}), 'this line is no key'] })()
      )
      assert.match(finding.detail, /SKILL\.md:7: /u)
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
    name: 'the gate run over a tree with a skill missing DO NOT USE: exits 1 and names it',
    run: () => {
      const result = runGate({
        files: {
          [`.claude/skills/${FOLDER}/SKILL.md`]: skillText({
            head: ['description: >', '  Lints the copy.', TRIGGERS[0]]
          }),
          [`.claude/skills/${VENDORED}/SKILL.md`]: skillText({
            head: ['description: Draws diagrams.'],
            name: VENDORED
          }),
          [LOCK]: lockOf({ names: [VENDORED] })
        }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-skill-frontmatter: 1 problem/u)
      assert.match(result.stderr, /lint-copy\/SKILL\.md: .*DO NOT USE:/u)
    }
  },
  {
    name: 'the gate run over a tree with no skills lock judges every skill fully',
    run: () => {
      const result = runGate({
        files: {
          [`.claude/skills/${VENDORED}/SKILL.md`]: skillText({
            head: ['description: Draws diagrams.'],
            name: VENDORED
          })
        }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-skill-frontmatter: 2 problem/u)
    }
  },
  {
    name: 'the gate exits 0 over the repository and states what it judged',
    run: () => {
      const result = spawnSync(process.execPath, [GATE], {
        encoding: 'utf8'
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-skill-frontmatter: PASS/u)
      assert.match(result.stdout, /\d+ skill\(s\) under \.claude\/skills/u)
      assert.match(result.stdout, /NOT covered: /u)
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
