#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-unicode-safety. The repository holds no invisible
// character, so the gate ships with zero findings there and its cases are
// the only evidence it can go red at all.
//
// The cases hand the gate's `run` synthetic files, one refused code point
// each, listed here rather than read from the gate so a range the gate gets
// wrong fails. The checks then run the gate as a process over a scratch git
// repository in the OS temp directory, which `withScratchTree` removes, so
// the listing, the binary skip, the report and the exit code are each seen,
// and over the repository itself.
//
// Every invisible character in this file is written as an escape, so the
// file itself passes the gate.
//
// Usage:
//   node --test scripts/verify-unicode-safety.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { gitFreeEnv } from './git-free-env.mjs'
import { gate } from './verify-unicode-safety.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-unicode-safety.mjs'
)
const FAILED = 1
const PASSED = 0
const HEX_RADIX = 16
const CODE_POINT_DIGITS = 4
const DOC = 'docs/notes.md'
const CATALOG = 'packages/i18n/src/locales/es.json'
const NESTED_CATALOG = 'packages/i18n/src/locales/web/home.json'
const I18N_SOURCE = 'packages/i18n/src/index.ts'
const OTHER_LOCALES = 'apps/web/src/locales/en.json'

// What F68 refuses, by kind.
const ZERO_WIDTH = [0x200b, 0x200c, 0x200d, 0x2060, 0xfeff]
const DIRECTION = [
  0x202a, 0x202b, 0x202c, 0x202d, 0x202e, 0x2066, 0x2067, 0x2068, 0x2069
]
const TAGS = [0xe0000, 0xe0001, 0xe0041, 0xe007f]
const FILLERS = [0x115f, 0x1160, 0x3164, 0xffa0]
const REFUSED = [...ZERO_WIDTH, ...DIRECTION, ...TAGS, ...FILLERS]

// Characters next to a refused range that stay allowed: a narrow no-break
// space just past the overrides, and the first code point past the tags.
const OUTSIDE = [0x202f, 0xe0080]

const JOINER = 0x200d
const ZERO_WIDTH_SPACE = 0x200b
const RIGHT_TO_LEFT_OVERRIDE = 0x202e
const BYTE_ORDER_MARK = 0xfeff
const NUL = '\u0000'

// A family emoji, built from three people and the joiners between them.
const FAMILY = ['\u{1F468}', '\u{1F469}', '\u{1F467}'].join(
  String.fromCodePoint(JOINER)
)

const charOf = ({ codePoint }) => String.fromCodePoint(codePoint)

const nameOf = ({ codePoint }) =>
  `U+${codePoint
    .toString(HEX_RADIX)
    .toUpperCase()
    .padStart(CODE_POINT_DIGITS, '0')}`

const lineWith = ({ codePoint }) =>
  `Run the setup${charOf({ codePoint })} script first.\n`

const filesOf =
  ({ files }) =>
  () => ({
    files: Object.entries(files).map(([path, text]) => ({ path, text }))
  })

export const CASES = [
  {
    context: filesOf({
      files: {
        [DOC]: '# Notes\n\nAccented letters stay: caf\u{E9}, \u{FC}ber.\n',
        'docs/cjk.md': '\u{6F22}\u{5B57} and \u{1F600}, with no joiner.\n'
      }
    }),
    expected: 0,
    name: 'text that holds only visible characters passes'
  },
  ...REFUSED.map((codePoint) => ({
    context: filesOf({ files: { [DOC]: lineWith({ codePoint }) } }),
    expected: 1,
    name: `a line that holds ${nameOf({ codePoint })} is refused`
  })),
  ...OUTSIDE.map((codePoint) => ({
    context: filesOf({ files: { [DOC]: lineWith({ codePoint }) } }),
    expected: 0,
    name: `a line that holds ${nameOf({ codePoint })}, outside every refused range, passes`
  })),
  {
    context: filesOf({ files: { [CATALOG]: `{ "family": "${FAMILY}" }\n` } }),
    expected: 0,
    name: 'the emoji joiner inside a translation catalog passes'
  },
  {
    context: filesOf({
      files: { [NESTED_CATALOG]: `{ "family": "${FAMILY}" }\n` }
    }),
    expected: 0,
    name: 'the emoji joiner in a folder under the translation catalogs passes'
  },
  {
    context: filesOf({
      files: { [CATALOG]: lineWith({ codePoint: ZERO_WIDTH_SPACE }) }
    }),
    expected: 1,
    name: 'a zero-width space inside a translation catalog is refused'
  },
  {
    context: filesOf({
      files: { [I18N_SOURCE]: `export const FAMILY = '${FAMILY}'\n` }
    }),
    expected: 2,
    name: 'the emoji joiner in the i18n package outside its catalogs is refused'
  },
  {
    context: filesOf({
      files: { [OTHER_LOCALES]: `{ "family": "${FAMILY}" }\n` }
    }),
    expected: 2,
    name: 'the emoji joiner in a locales folder of another package is refused'
  },
  {
    context: filesOf({
      files: {
        [DOC]: [
          lineWith({ codePoint: ZERO_WIDTH_SPACE }),
          lineWith({ codePoint: RIGHT_TO_LEFT_OVERRIDE }).repeat(2)
        ].join('')
      }
    }),
    expected: 3,
    name: 'every invisible character is a finding of its own'
  }
]

const git = ({ args, root }) =>
  execFileSync('git', args, { cwd: root, env: gitFreeEnv() })

// The gate as `pnpm verify:unicode-safety` runs it, over a scratch
// repository whose `staged` files are added and whose other files are left
// untracked.
const runGate = ({ files, staged = Object.keys(files) }) =>
  withScratchTree({
    files,
    prefix: 'unicode-safety-run-',
    use: ({ root }) => {
      git({ args: ['init', '-q'], root })
      git({ args: ['add', '--', ...staged], root })
      return spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8',
        env: gitFreeEnv()
      })
    }
  })

// The environment with its search path, in any case, replaced by `path`.
const PATH_KEY = /^path$/iu
const envWithPath = ({ path }) => ({
  ...Object.fromEntries(
    Object.entries(gitFreeEnv()).filter(([key]) => !PATH_KEY.test(key))
  ),
  PATH: path
})

// The gate over a scratch tree that is no repository, or, with `noGit`, a
// repository the gate cannot list because no git is on its search path.
const runGateWithout = ({ noGit = false }) =>
  withScratchTree({
    files: { [DOC]: '# Notes\n' },
    prefix: 'unicode-safety-nogit-',
    use: ({ root }) => {
      if (noGit) git({ args: ['init', '-q'], root })
      return spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8',
        env: noGit ? envWithPath({ path: root }) : gitFreeEnv()
      })
    }
  })

const checks = [
  {
    name: 'a finding names the file, the line, the column and the code point',
    run: () => {
      const text = [
        '# Notes',
        `a\u{1F600}b${charOf({ codePoint: RIGHT_TO_LEFT_OVERRIDE })}c`
      ].join('\r\n')
      const [finding] = gate.run(filesOf({ files: { [DOC]: text } })())
      assert.match(finding.detail, /^docs\/notes\.md:2:4: U\+202E\b/u)
    }
  },
  {
    name: 'a tag character is named by its full code point',
    run: () => {
      const [finding] = gate.run(
        filesOf({ files: { [DOC]: lineWith({ codePoint: 0xe0041 }) } })()
      )
      assert.match(finding.detail, /^docs\/notes\.md:1:14: U\+E0041\b/u)
    }
  },
  {
    name: 'the cases fail against a gate that finds nothing',
    run: () => {
      const failures = runCases({ cases: CASES, gate: blindGate({ gate }) })
      assert.ok(failures.length > 0, 'every case passed a blinded gate')
    }
  },
  {
    name: 'the gate run over a tracked file with an override exits 1 and names it',
    run: () => {
      const result = runGate({
        files: {
          'README.md': '# Readme\n',
          [DOC]: lineWith({ codePoint: RIGHT_TO_LEFT_OVERRIDE })
        }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-unicode-safety: 1 problem/u)
      assert.match(result.stderr, /docs\/notes\.md:1:14: U\+202E\b/u)
    }
  },
  {
    name: 'the gate run over a file that opens with a byte order mark exits 1 and names it',
    run: () => {
      const result = runGate({
        files: { [DOC]: `${charOf({ codePoint: BYTE_ORDER_MARK })}# Notes\n` }
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /docs\/notes\.md:1:1: U\+FEFF\b/u)
    }
  },
  {
    name: 'the gate skips a tracked file that holds a NUL byte',
    run: () => {
      const result = runGate({
        files: {
          'assets/blob.bin': `${NUL}${lineWith({ codePoint: ZERO_WIDTH_SPACE })}`,
          [DOC]: '# Notes\n'
        }
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /1 tracked text file\(s\)/u)
      assert.match(result.stdout, /1 binary file\(s\)/u)
    }
  },
  {
    name: 'the gate with no git on its path names the cause',
    run: () => {
      const result = runGateWithout({ noGit: true })
      assert.notEqual(result.status, PASSED, result.stdout)
      assert.match(result.stderr, /verify-unicode-safety cannot run git/u)
      assert.match(result.stderr, /ENOENT/u)
      assert.doesNotMatch(result.stderr, /undefined/u)
    }
  },
  {
    name: 'the gate over a folder that is no repository names what git said',
    run: () => {
      const result = runGateWithout({})
      assert.notEqual(result.status, PASSED, result.stdout)
      assert.match(result.stderr, /verify-unicode-safety lists the tracked/u)
      assert.match(result.stderr, /not a git repository/iu)
    }
  },
  {
    name: 'the gate judges tracked files and leaves an untracked one alone',
    run: () => {
      const result = runGate({
        files: {
          [DOC]: '# Notes\n',
          'scratch.md': lineWith({ codePoint: ZERO_WIDTH_SPACE })
        },
        staged: [DOC]
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-unicode-safety: PASS/u)
    }
  },
  {
    name: 'the gate exits 0 over the repository and states what it judged',
    run: () => {
      const result = spawnSync(process.execPath, [GATE], {
        encoding: 'utf8',
        env: gitFreeEnv()
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-unicode-safety: PASS/u)
      assert.match(result.stdout, /\d+ tracked text file\(s\)/u)
      assert.match(result.stdout, /NOT covered: /u)
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
