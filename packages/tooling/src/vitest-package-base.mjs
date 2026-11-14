// ---------------------------------------------------------------------------
// vitest-package-base — the test config every `packages/*` workspace starts
// from.
//
// A package's vitest.config.ts is
// `mergeConfig(packageTestBase({ packageDir: __dirname }), defineConfig({...}))`
// and the `defineConfig` half holds only what that package differs in: the
// `include` glob of its test files, and the coverage `include` / `exclude` and
// thresholds that follow it. `mergeConfig` concatenates arrays and merges
// objects, so a package adds to the base and never restates it.
//
// The base carries what every package shares: the node environment, vitest
// globals, the `@` alias onto the package's own `src`, the v8 coverage
// provider with its reporters and output directory, `clearMocks`, and the
// shuffled `sequence` (vitest-sequence.mjs).
// ---------------------------------------------------------------------------

import { resolve } from 'node:path'

import { testSequence } from './vitest-sequence.mjs'

export const packageTestBase = ({ packageDir }) => ({
  resolve: {
    alias: {
      '@': resolve(packageDir, 'src')
    }
  },
  test: {
    // Drops every spy's call history between tests, so an assertion on how
    // many times a module-level vi.fn ran reads only its own test. It leaves
    // implementations in place — the *Once queue and any mockReturnValue set
    // inside a test survive, and a suite that queues one owns clearing it.
    clearMocks: true,
    coverage: {
      exclude: ['src/**/index.ts'],
      provider: 'v8',
      reporter: ['text-summary', 'json-summary', 'lcov'],
      reportsDirectory: './coverage'
    },
    environment: 'node',
    globals: true,
    sequence: testSequence({ packageDir })
  }
})
