import path from 'path'
import { defineConfig } from 'vitest/config'

// ---------------------------------------------------------------------------
// Web test config.
//
// - environment 'happy-dom' so React component render tests work (.tsx).
// - include both .ts and .tsx so component render tests are collectable.
//   (A node-only env + a .ts-only glob would silently skip every .tsx test —
//   do NOT do that here.)
// - setup file extends expect() with vitest-axe matchers and wires the MSW
//   server lifecycle.
// ---------------------------------------------------------------------------

const PACKAGES = path.resolve(__dirname, '../../packages')

export default defineConfig({
  // Use the automatic JSX runtime so .tsx render tests don't need an explicit
  // `import React`. Next uses jsx: 'preserve' in tsconfig, which Vitest's
  // esbuild does not honour, so set it here.
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  resolve: {
    // Array form (not object) so alias precedence is explicit: the
    // @app/supabase/server subpath must be matched BEFORE the bare
    // @app/supabase alias, mirroring the package's exports map.
    alias: [
      {
        find: '@app/core',
        replacement: path.resolve(PACKAGES, 'core/src')
      },
      {
        find: '@app/i18n',
        replacement: path.resolve(PACKAGES, 'i18n/src')
      },
      {
        find: '@app/supabase/server',
        replacement: path.resolve(
          PACKAGES,
          'supabase/src/server.adapter.ts'
        )
      },
      {
        find: '@app/supabase',
        replacement: path.resolve(PACKAGES, 'supabase/src')
      },
      {
        find: '@app/tokens',
        replacement: path.resolve(PACKAGES, 'tokens/src')
      },
      { find: '@', replacement: path.resolve(__dirname, './src') }
    ]
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts']
  }
})
