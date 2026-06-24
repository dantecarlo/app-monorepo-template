import react from '@vitejs/plugin-react'
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
  // @vitejs/plugin-react provides the automatic JSX runtime for Vitest 4 +
  // Vite 8. Next uses jsx: 'preserve' in tsconfig (for RSC); the plugin
  // handles transform for test files so Vitest's OXC transformer can process
  // .tsx correctly.
  plugins: [react()],
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
