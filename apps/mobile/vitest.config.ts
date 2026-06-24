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
    alias: [
      // Core-internal @/ paths resolve against core/src, not mobile/src.
      // Listed before the '@' catch-all so first-match wins.
      {
        find: '@app/core',
        replacement: path.resolve(PACKAGES, 'core/src')
      },
      {
        find: '@app/i18n',
        replacement: path.resolve(PACKAGES, 'i18n/src')
      },
      {
        find: '@app/supabase',
        replacement: path.resolve(PACKAGES, 'supabase/src')
      },
      {
        find: '@app/tokens',
        replacement: path.resolve(PACKAGES, 'tokens/src')
      },
      {
        find: '@/errors',
        replacement: path.resolve(PACKAGES, 'core/src/errors')
      },
      {
        find: '@/ports',
        replacement: path.resolve(PACKAGES, 'core/src/ports')
      },
      {
        find: '@/utils',
        replacement: path.resolve(PACKAGES, 'core/src/utils')
      },
      { find: '@', replacement: path.resolve(__dirname, './src') },
      {
        find: 'expo-blur',
        replacement: path.resolve(
          __dirname,
          './src/test/mocks/expo-blur.ts'
        )
      },
      {
        find: 'expo-linear-gradient',
        replacement: path.resolve(
          __dirname,
          './src/test/mocks/expo-linear-gradient.ts'
        )
      },
      {
        find: 'react-native',
        replacement: path.resolve(
          __dirname,
          './src/test/mocks/react-native.ts'
        )
      },
      {
        find: 'react-native-svg',
        replacement: path.resolve(
          __dirname,
          './src/test/mocks/react-native-svg.ts'
        )
      }
    ]
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test/setup.ts']
  }
})
