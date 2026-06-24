import path from 'path'
import { defineConfig } from 'vitest/config'

// ---------------------------------------------------------------------------
// Mobile test config.
//
// IMPORTANT — environment is 'happy-dom' and the include glob covers BOTH
// .ts and .tsx. A previous iteration used `environment: 'node'` with a
// `.test.ts`-only glob, which silently dropped every component render test
// (.tsx) from collection. Do NOT regress to that: a node env cannot render
// React components and a .ts-only glob hides .tsx files entirely.
// ---------------------------------------------------------------------------

const PACKAGES = path.resolve(__dirname, '../../packages')

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app/core': path.resolve(PACKAGES, 'core/src'),
      '@app/i18n': path.resolve(PACKAGES, 'i18n/src'),
      '@app/supabase': path.resolve(PACKAGES, 'supabase/src'),
      '@app/tokens': path.resolve(PACKAGES, 'tokens/src'),
      'react-native': path.resolve(
        __dirname,
        './src/test/mocks/react-native.ts'
      ),
      'react-native-svg': path.resolve(
        __dirname,
        './src/test/mocks/react-native-svg.ts'
      )
    }
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts']
  }
})
