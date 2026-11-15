#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for move-tests-into-blocks. Each test builds a throwaway git
// repository in the OS temp directory, runs the codemod as a process over it
// and reads the tree, the index and the rewritten files back, so the
// placement it borrows from verify-tests, the `git mv`, the rewrites and the
// report are each part of the verdict.
//
// Usage:
//   node --test scripts/move-tests-into-blocks.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { gitFreeEnv } from './git-free-env.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import {
  planMoves,
  rewriteCitations,
  rewriteSpecifiers
} from './move-tests-into-blocks.mjs'
import { collectContext } from './verify-tests.mjs'

const CODEMOD = join(
  dirname(fileURLToPath(import.meta.url)),
  'move-tests-into-blocks.mjs'
)
const PASSED = 0
const FAILED = 1

const WEB_MANIFEST = JSON.stringify({ name: '@app/web' })
const MOBILE_MANIFEST = JSON.stringify({
  dependencies: { 'expo-router': '*' },
  name: '@app/mobile'
})
const ALIAS_TSCONFIG = JSON.stringify({
  compilerOptions: { paths: { '@/*': ['./src/*'] } }
})

const BASE = {
  'apps/mobile/package.json': MOBILE_MANIFEST,
  'apps/web/package.json': WEB_MANIFEST,
  'apps/web/tsconfig.json': ALIAS_TSCONFIG
}

const STORE = 'apps/web/src/stores/auth.store.ts'
const STORE_TEST = 'apps/web/src/stores/auth.store.test.ts'
const STORE_MOVED = 'apps/web/src/stores/__tests__/auth.store.test.ts'

const git = ({ args, root }) =>
  spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: gitFreeEnv()
  })

const run = ({ args = [], root }) =>
  spawnSync(process.execPath, [CODEMOD, '--root', root, ...args], {
    encoding: 'utf8',
    env: gitFreeEnv()
  })

const IDENTITY = [
  '-c',
  'user.name=scratch',
  '-c',
  'user.email=scratch@example.invalid',
  '-c',
  'commit.gpgsign=false'
]

// A scratch repository holding `files`, every one of them committed.
const inRepository = ({ files, use }) =>
  withScratchTree({
    files: { ...BASE, ...files },
    prefix: 'move-tests-',
    use: ({ root }) => {
      git({ args: ['init', '--quiet'], root })
      git({ args: ['add', '--all'], root })
      git({
        args: [
          ...IDENTITY,
          'commit',
          '--quiet',
          '--no-verify',
          '-m',
          'base'
        ],
        root
      })
      return use({
        read: (path) => readFileSync(join(root, path), 'utf8'),
        root
      })
    }
  })

test('a test beside its unit moves into the __tests__/ of its folder with git mv', () => {
  inRepository({
    files: {
      [STORE]: 'export const s = 1\n',
      [STORE_TEST]: "test('s', () => {})\n"
    },
    use: ({ root }) => {
      const result = run({ root })
      assert.equal(result.status, PASSED, result.stderr)
      assert.equal(existsSync(join(root, STORE_TEST)), false)
      assert.equal(existsSync(join(root, STORE_MOVED)), true)
      const status = git({ args: ['status', '--porcelain'], root }).stdout
      assert.match(
        status,
        /^R {2}apps\/web\/src\/stores\/auth\.store\.test\.ts -> apps\/web\/src\/stores\/__tests__\/auth\.store\.test\.ts$/mu
      )
      assert.match(result.stdout, /moved 1 test\(s\)/u)
    }
  })
})

test('a moved test reaches its unit through the @/ alias its workspace maps onto src', () => {
  inRepository({
    files: {
      [STORE]: 'export const s = 1\n',
      [STORE_TEST]: [
        "import { s } from './auth.store'",
        "import type { T } from '../types/t.type'",
        "vi.mock('./auth.store', async () => ({ ...(await vi.importActual<typeof import('./auth.store')>('./auth.store')) }))",
        "import { other } from '@/lib/other'",
        "test('s', () => {})",
        ''
      ].join('\n'),
      'apps/web/src/types/t.type.ts': 'export type T = 1\n'
    },
    use: ({ read, root }) => {
      const result = run({ root })
      assert.equal(result.status, PASSED, result.stderr)
      assert.equal(
        read(STORE_MOVED),
        [
          "import { s } from '@/stores/auth.store'",
          "import type { T } from '@/types/t.type'",
          "vi.mock('@/stores/auth.store', async () => ({ ...(await vi.importActual<typeof import('@/stores/auth.store')>('@/stores/auth.store')) }))",
          "import { other } from '@/lib/other'",
          "test('s', () => {})",
          ''
        ].join('\n')
      )
      assert.match(
        result.stdout,
        /rewrote 5 specifier\(s\) in 1 test\(s\)/u
      )
      assert.match(
        result.stdout,
        /run the linter's autofix over the moved tests/u
      )
    }
  })
})

test('a moved test without an alias keeps a relative path one folder deeper', () => {
  inRepository({
    files: {
      'packages/tooling/src/process-tree.mjs': 'export const p = 1\n',
      'packages/tooling/src/process-tree.test.mjs':
        "import { p } from './process-tree.mjs'\nconst config = require('../package.json')\n"
    },
    use: ({ read, root }) => {
      const result = run({ root })
      assert.equal(result.status, PASSED, result.stderr)
      assert.equal(
        read('packages/tooling/src/__tests__/process-tree.test.mjs'),
        "import { p } from '../process-tree.mjs'\nconst config = require('../../package.json')\n"
      )
    }
  })
})

test('every citation of a moved path in the specs and docs follows it; archived changes stay', () => {
  const cited = `- **Test:** \`${STORE_TEST}\` › "s"\n- link [t](../../${STORE_TEST}), line \`${STORE_TEST}:3\`\n- other \`${STORE_TEST}x\`\n`
  inRepository({
    files: {
      [STORE]: 'export const s = 1\n',
      [STORE_TEST]: "test('s', () => {})\n",
      'docs/maps/global-map.md': cited,
      'openspec/changes/archive/2026-01-01-old/proposal.md': cited,
      'openspec/specs/apps/web/spec.md': cited
    },
    use: ({ read, root }) => {
      const result = run({ root })
      assert.equal(result.status, PASSED, result.stderr)
      const expected = `- **Test:** \`${STORE_MOVED}\` › "s"\n- link [t](../../${STORE_MOVED}), line \`${STORE_MOVED}:3\`\n- other \`${STORE_TEST}x\`\n`
      assert.equal(read('openspec/specs/apps/web/spec.md'), expected)
      assert.equal(read('docs/maps/global-map.md'), expected)
      assert.equal(
        read('openspec/changes/archive/2026-01-01-old/proposal.md'),
        cited
      )
      assert.match(result.stdout, /6 citation\(s\) in 2 doc\(s\)/u)
    }
  })
})

test('an Expo Router route test is renamed after its route as <route>.route', () => {
  inRepository({
    files: {
      'apps/mobile/src/app/__tests__/_layout.test.tsx':
        "test('l', () => {})\n",
      'apps/mobile/src/app/_layout.tsx': 'export default 1\n',
      'apps/mobile/src/app/login.test.tsx': "test('l', () => {})\n",
      'apps/mobile/src/app/login.tsx': 'export default 1\n'
    },
    use: ({ root }) => {
      const result = run({ root })
      assert.equal(result.status, PASSED, result.stderr)
      assert.ok(
        existsSync(
          join(root, 'apps/mobile/src/app/__tests__/layout.route.test.tsx')
        )
      )
      assert.ok(
        existsSync(
          join(root, 'apps/mobile/src/app/__tests__/login.route.test.tsx')
        )
      )
      assert.equal(
        existsSync(
          join(root, 'apps/mobile/src/app/__tests__/_layout.test.tsx')
        ),
        false
      )
    }
  })
})

test('a test in a higher __tests__/ moves down to the folder that holds its unit', () => {
  inRepository({
    files: {
      [STORE]: 'export const s = 1\n',
      'apps/web/src/__tests__/auth.store.test.ts': "test('s', () => {})\n"
    },
    use: ({ root }) => {
      const result = run({ root })
      assert.equal(result.status, PASSED, result.stderr)
      assert.ok(existsSync(join(root, STORE_MOVED)))
    }
  })
})

test('a test it cannot place is listed, left where it is, and the run exits 1', () => {
  const parity = 'apps/web/src/lib/__tests__/parity.test.ts'
  inRepository({
    files: {
      'apps/web/src/lib/other.ts': 'export const o = 1\n',
      [parity]: "test('p', () => {})\n"
    },
    use: ({ root }) => {
      const result = run({ root })
      assert.equal(result.status, FAILED)
      assert.ok(existsSync(join(root, parity)))
      assert.match(result.stdout, /cannot place 1 test\(s\)/u)
      assert.match(result.stdout, /parity\.test\.ts names no unit/u)
    }
  })
})

test('a second run moves nothing and exits 0', () => {
  inRepository({
    files: {
      [STORE]: 'export const s = 1\n',
      [STORE_TEST]: "import { s } from './auth.store'\n"
    },
    use: ({ read, root }) => {
      run({ root })
      const moved = read(STORE_MOVED)
      const status = git({ args: ['status', '--porcelain'], root }).stdout
      const again = run({ root })
      assert.equal(again.status, PASSED, again.stderr)
      assert.match(again.stdout, /nothing to move/u)
      assert.equal(read(STORE_MOVED), moved)
      assert.equal(
        git({ args: ['status', '--porcelain'], root }).stdout,
        status
      )
    }
  })
})

test('--dry-run prints the plan and changes nothing', () => {
  inRepository({
    files: {
      [STORE]: 'export const s = 1\n',
      [STORE_TEST]: "import { s } from './auth.store'\n"
    },
    use: ({ root }) => {
      const result = run({ args: ['--dry-run'], root })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(
        result.stdout,
        new RegExp(`would move ${STORE_TEST} → ${STORE_MOVED}`, 'u')
      )
      assert.ok(existsSync(join(root, STORE_TEST)))
      assert.equal(existsSync(join(root, STORE_MOVED)), false)
    }
  })
})

test('a moved test that builds paths from its own folder is named for review', () => {
  inRepository({
    files: {
      [STORE]: 'export const s = 1\n',
      [STORE_TEST]: "const here = join(import.meta.dirname, '..')\n"
    },
    use: ({ root }) => {
      const result = run({ root })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(
        result.stdout,
        /review 1 moved test\(s\) that build a path from their own folder/u
      )
      assert.match(
        result.stdout,
        /apps\/web\/src\/stores\/__tests__\/auth\.store\.test\.ts/u
      )
    }
  })
})

test('a destination that already exists is not overwritten', () => {
  inRepository({
    files: {
      [STORE]: 'export const s = 1\n',
      [STORE_MOVED]: "test('kept', () => {})\n",
      [STORE_TEST]: "test('beside', () => {})\n"
    },
    use: ({ read, root }) => {
      const result = run({ root })
      assert.equal(result.status, FAILED)
      assert.equal(read(STORE_MOVED), "test('kept', () => {})\n")
      assert.ok(existsSync(join(root, STORE_TEST)))
      assert.match(result.stdout, /already exists/u)
    }
  })
})

test('a frozen exception is neither moved nor listed', () => {
  withScratchTree({
    files: {
      ...BASE,
      [STORE]: 'export const s = 1\n',
      [STORE_TEST]: "test('s', () => {})\n"
    },
    prefix: 'move-tests-plan-',
    use: ({ root }) => {
      const context = collectContext({
        frozen: [{ path: STORE_TEST, reason: 'cannot move yet' }],
        root
      })
      assert.deepEqual(planMoves({ context }), { moves: [], unplaced: [] })
    }
  })
})

test('rewriteSpecifiers leaves bare and alias specifiers alone', () => {
  const text =
    "import x from 'vitest'\nimport y from '@/a/b'\nimport z from '#src/c'\n"
  assert.deepEqual(
    rewriteSpecifiers({
      alias: null,
      from: 'apps/web/src/a/x.test.ts',
      text,
      to: 'apps/web/src/a/__tests__/x.test.ts'
    }),
    { count: 0, text }
  )
})

test('rewriteCitations replaces a path only where it is the whole path', () => {
  const moves = [{ from: 'a/b.test.ts', to: 'a/__tests__/b.test.ts' }]
  assert.deepEqual(
    rewriteCitations({
      moves,
      text: '`a/b.test.ts` x/a/b.test.ts a/b.test.tsx ../a/b.test.ts.'
    }),
    {
      count: 2,
      text: '`a/__tests__/b.test.ts` x/a/b.test.ts a/b.test.tsx ../a/__tests__/b.test.ts.'
    }
  )
})
