// ---------------------------------------------------------------------------
// The cases of the ESLint config itself, run by ./index.test.mjs through
// `registerEslintConfigCases`: which frameworks each app declares, read by
// scripts/eslint-config.detect.mjs from its package.json (SEAM-10).
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { readAppFrameworks } from '../scripts/eslint-config.detect.mjs'
import { withScratchTree } from '../scripts/gate/scratch.mjs'

const SCRATCH_PREFIX = 'eslint-config-'

const manifest = (fields) => JSON.stringify({ private: true, ...fields })

const registerDetectionCases = () => {
  test('a framework declared in any dependency field counts, and a folder with no package.json is no app', () => {
    assert.deepEqual(
      withScratchTree({
        files: {
          'apps/admin/package.json': manifest({
            devDependencies: { next: '1' },
            peerDependencies: { react: '1' }
          }),
          'apps/kiosk/package.json': manifest({
            optionalDependencies: { expo: '1' }
          }),
          'apps/notes/README.md': 'A folder with no package.json.',
          'apps/plain/package.json': manifest({
            dependencies: { zod: '1' }
          })
        },
        prefix: SCRATCH_PREFIX,
        use: ({ root }) => readAppFrameworks({ root })
      }),
      { expo: ['apps/kiosk'], next: ['apps/admin'], react: ['apps/admin'] }
    )
  })
}

export const registerEslintConfigCases = () => {
  registerDetectionCases()
}
