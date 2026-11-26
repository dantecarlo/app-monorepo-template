import { packageTestBase } from '@app/tooling/vitest-package-base'
import { defineConfig, mergeConfig } from 'vitest/config'

export default mergeConfig(
  packageTestBase({ packageDir: __dirname }),
  defineConfig({
    test: {
      // A test sits in the __tests__/ of its unit's folder: in src/, in the
      // root __tests__/ for a unit at the package root, and in
      // supabase/tests/__tests__/ for the folder of pgTAP suites, a unit of
      // its own.
      include: [
        'src/**/__tests__/*.test.ts',
        '__tests__/*.test.ts',
        'supabase/tests/__tests__/*.test.ts'
      ]
    }
  })
)
