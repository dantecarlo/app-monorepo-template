import { testSequence } from '@app/tooling/vitest-sequence'
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
  // vitest v4 uses oxc (not esbuild) for transforms. Explicit JSX config
  // ensures React automatic runtime is used for .tsx files under the
  // happy-dom environment — equivalent to esbuild.jsx = 'automatic' in
  // older vitest versions.
  oxc: {
    jsx: { importSource: 'react', runtime: 'automatic' }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@app/core': path.resolve(PACKAGES, 'core/src'),
      '@app/i18n': path.resolve(PACKAGES, 'i18n/src'),
      '@app/supabase': path.resolve(PACKAGES, 'supabase/src'),
      '@app/tokens': path.resolve(PACKAGES, 'tokens/src'),
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        './src/test/mocks/async-storage.ts'
      ),
      '@sentry/react-native': path.resolve(
        __dirname,
        './src/test/mocks/sentry-react-native.ts'
      ),
      'expo-blur': path.resolve(
        __dirname,
        './src/test/mocks/expo-blur.ts'
      ),
      'expo-linear-gradient': path.resolve(
        __dirname,
        './src/test/mocks/expo-linear-gradient.ts'
      ),
      'expo-localization': path.resolve(
        __dirname,
        './src/test/mocks/expo-localization.ts'
      ),
      nativewind: path.resolve(
        __dirname,
        './src/test/mocks/nativewind.ts'
      ),
      'posthog-react-native': path.resolve(
        __dirname,
        './src/test/mocks/posthog-react-native.ts'
      ),
      'react-native': path.resolve(
        __dirname,
        './src/test/mocks/react-native.ts'
      ),
      'react-native-safe-area-context': path.resolve(
        __dirname,
        './src/test/mocks/react-native-safe-area-context.ts'
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
    // A test sits in the __tests__/ of its unit's folder, in src/ or, for a
    // unit at the app root such as a config file, in the root __tests__/.
    include: [
      'src/**/__tests__/*.test.{ts,tsx}',
      '__tests__/*.test.{ts,tsx}'
    ],
    sequence: testSequence({ packageDir: __dirname }),
    setupFiles: ['./src/test/setup.ts']
  }
})
