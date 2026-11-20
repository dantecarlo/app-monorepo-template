#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-instruction-entry. The gate ships with zero findings
// in the repository, so its cases are the only evidence it can go red at
// all: a detector never seen failing is indistinguishable from one that
// cannot.
//
// The cases drive the COLLECTOR over a throwaway tree in the OS temp
// directory, with the tree's own file list standing in for git's: which
// files the walk reaches (AGENTS.md, README.md, a CLAUDE.md that must not be
// there) is decided there. The checks then run the real `git ls-files` over
// a scratch repository, and the gate itself as a process over a planted
// violation, so the listing, the report and the exit code are each seen
// failing.
//
// Usage:
//   node --test scripts/verify-instruction-entry.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { gitFreeEnv } from './git-free-env.mjs'
import { withHookGitDir } from './hook-git-dir.mjs'
import {
  collectContext,
  FINDING_KIND,
  gate
} from './verify-instruction-entry.mjs'

const GATE = join(
  dirname(fileURLToPath(import.meta.url)),
  'verify-instruction-entry.mjs'
)
const FAILED = 1
const PASSED = 0

// A tree every session can start from. A case overrides one file, or
// removes it with `null`: each case differs from this by one thing.
const HEALTHY = {
  'AGENTS.md': '# AGENTS\n',
  'README.md': '# README\n\nSee [the router](AGENTS.md).\n',
  'docs/code-standards.md': '# Standards\n'
}

const treeOf = ({ overrides = {} }) =>
  Object.fromEntries(
    Object.entries({ ...HEALTHY, ...overrides }).filter(
      ([, text]) => text !== null
    )
  )

// Every file of a scratch tree, as git lists the files of a repository:
// paths relative to the root, with forward slashes.
const filesOf = ({ root }) =>
  readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) =>
      relative(root, join(entry.parentPath, entry.name)).replaceAll(
        '\\',
        '/'
      )
    )

const walk =
  ({ overrides } = {}) =>
  () =>
    withScratchTree({
      files: treeOf({ overrides }),
      prefix: 'instruction-entry-',
      use: ({ root }) =>
        collectContext({ listFiles: () => filesOf({ root }), root })
    })

const git = ({ args, root }) =>
  execFileSync('git', args, { cwd: root, env: gitFreeEnv() })

// The same tree as a git repository, read through the gate's own listing:
// `git ls-files --cached --others --exclude-standard` lists a staged file
// and one not added yet, and leaves out one a .gitignore ignores.
const walkGit = ({ overrides, staged = [] }) =>
  withScratchTree({
    files: treeOf({ overrides }),
    prefix: 'instruction-entry-git-',
    use: ({ root }) => {
      git({ args: ['init', '-q'], root })
      if (staged.length > 0) git({ args: ['add', '--', ...staged], root })
      return gate.run(collectContext({ root })).map(({ path }) => path)
    }
  })

// The environment with its search path, in any case, replaced by `path`, so
// that no git on the machine can start.
const PATH_KEY = /^path$/iu
const envWithPath = ({ path }) => ({
  ...Object.fromEntries(
    Object.entries(gitFreeEnv()).filter(([key]) => !PATH_KEY.test(key))
  ),
  PATH: path
})

// The gate over a scratch repository it cannot list, because no git is on
// its search path.
const runGateWithoutGit = () =>
  withScratchTree({
    files: treeOf({ overrides: {} }),
    prefix: 'instruction-entry-nogit-',
    use: ({ root }) => {
      git({ args: ['init', '-q'], root })
      return spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8',
        env: envWithPath({ path: root })
      })
    }
  })

// The gate as `pnpm verify:instruction-entry` runs it, over a scratch
// repository.
const runGate = ({ overrides }) =>
  withScratchTree({
    files: treeOf({ overrides }),
    prefix: 'instruction-entry-run-',
    use: ({ root }) => {
      git({ args: ['init', '-q'], root })
      return spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8',
        env: gitFreeEnv()
      })
    }
  })

export const CASES = [
  {
    context: walk(),
    expected: 0,
    name: 'a tree with AGENTS.md, README.md and no CLAUDE.md passes'
  },
  {
    context: walk({ overrides: { 'AGENTS.md': null } }),
    expected: 1,
    name: 'a missing AGENTS.md is caught, not skipped'
  },
  {
    context: walk({ overrides: { 'README.md': null } }),
    expected: 1,
    name: 'a missing README.md is caught, not skipped'
  },
  {
    context: walk({ overrides: { 'CLAUDE.md': '# CLAUDE\n' } }),
    expected: 1,
    name: 'a CLAUDE.md at the root is refused: Claude Code would read it instead of AGENTS.md'
  },
  {
    context: walk({
      overrides: { 'CLAUDE.md': '# CLAUDE\n\n@AGENTS.md\n' }
    }),
    expected: 1,
    name: 'a CLAUDE.md that imports AGENTS.md is still refused'
  },
  {
    context: walk({ overrides: { '.claude/CLAUDE.md': '# CLAUDE\n' } }),
    expected: 1,
    name: 'a .claude/CLAUDE.md is refused'
  },
  {
    context: walk({ overrides: { 'CLAUDE.local.md': '# Mine\n' } }),
    expected: 1,
    name: 'a CLAUDE.local.md is refused'
  },
  {
    context: walk({ overrides: { 'apps/web/CLAUDE.md': '# Web\n' } }),
    expected: 1,
    name: 'a CLAUDE.md in a subfolder is refused'
  },
  {
    context: walk({ overrides: { 'docs/claude.md': '# Lower\n' } }),
    expected: 1,
    name: 'a lower-case claude.md is refused, as a case-insensitive disk finds it'
  },
  {
    context: walk({
      overrides: { 'apps/mobile/Claude.Local.MD': '# Mixed\n' }
    }),
    expected: 1,
    name: 'a mixed-case Claude.Local.MD is refused'
  },
  {
    context: walk({
      overrides: {
        'CLAUDE.local.md': '# Mine\n',
        'CLAUDE.md': '# CLAUDE\n'
      }
    }),
    expected: 2,
    name: 'every instruction file that blocks AGENTS.md is named on its own'
  },
  {
    context: walk({
      overrides: {
        'CLAUDE.md.bak': 'old\n',
        'docs/CLAUDE.md.bak': 'old\n',
        'docs/only-claude.md': '# Notes\n'
      }
    }),
    expected: 0,
    name: 'a file whose name only contains CLAUDE.md stays silent'
  }
]

const checks = [
  {
    name: 'a finding names the file and says why it blocks AGENTS.md',
    run: () => {
      const [finding] = gate.run(
        walk({ overrides: { 'CLAUDE.md': '' } })()
      )
      assert.equal(finding.kind, FINDING_KIND.blocking)
      assert.equal(finding.path, 'CLAUDE.md')
      assert.match(finding.detail, /^CLAUDE\.md is in the repository/u)
      assert.match(finding.detail, /reads this file and not AGENTS\.md/u)
    }
  },
  {
    name: 'a missing root file is named as missing',
    run: () => {
      const [finding] = gate.run(
        walk({ overrides: { 'AGENTS.md': null } })()
      )
      assert.equal(finding.kind, FINDING_KIND.missing)
      assert.equal(finding.path, 'AGENTS.md')
      assert.match(finding.detail, /^AGENTS\.md is not there/u)
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
    name: 'the default listing is git: a CLAUDE.md not yet added is refused',
    run: () =>
      assert.deepEqual(
        walkGit({ overrides: { 'CLAUDE.md': '# CLAUDE\n' } }),
        ['CLAUDE.md']
      )
  },
  {
    name: 'the default listing is git: a staged .claude/CLAUDE.md is refused',
    run: () =>
      assert.deepEqual(
        walkGit({
          overrides: { '.claude/CLAUDE.md': '# CLAUDE\n' },
          staged: ['.claude/CLAUDE.md']
        }),
        ['.claude/CLAUDE.md']
      )
  },
  {
    name: 'the default listing is git: a CLAUDE.local.md a .gitignore ignores is not seen',
    run: () =>
      assert.deepEqual(
        walkGit({
          overrides: {
            '.gitignore': 'CLAUDE.local.md\n',
            'CLAUDE.local.md': '# Mine\n'
          }
        }),
        []
      )
  },
  {
    name: 'the gate run over a planted CLAUDE.md exits 1 and names it',
    run: () => {
      const result = runGate({ overrides: { 'CLAUDE.md': '# CLAUDE\n' } })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-instruction-entry: 1 problem/u)
      assert.match(result.stderr, /CLAUDE\.md is in the repository/u)
    }
  },
  {
    name: "END TO END: under a hook's GIT_DIR, the gate lists the scratch repository and the hook's repository is left alone",
    run: () => {
      const { decoyWritten, result } = withHookGitDir({
        use: () => runGate({ overrides: { 'CLAUDE.md': '# CLAUDE\n' } })
      })
      assert.equal(decoyWritten, false)
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /CLAUDE\.md is in the repository/u)
    }
  },
  {
    name: 'the gate run over a healthy repository exits 0',
    run: () => {
      const result = runGate({ overrides: {} })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-instruction-entry: PASS/u)
    }
  },
  {
    name: 'the gate with no git on its path names the cause',
    run: () => {
      const result = runGateWithoutGit()
      assert.notEqual(result.status, PASSED, result.stdout)
      assert.match(
        result.stderr,
        /verify-instruction-entry cannot run git/u
      )
      assert.match(result.stderr, /ENOENT/u)
      assert.doesNotMatch(result.stderr, /undefined/u)
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
