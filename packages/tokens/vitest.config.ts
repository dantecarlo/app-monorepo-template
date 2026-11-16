import { packageTestBase } from '@app/tooling/vitest-package-base'
import { defineConfig, mergeConfig } from 'vitest/config'

export default mergeConfig(
  packageTestBase({ packageDir: __dirname }),
  defineConfig({
    test: {
      // A test sits in the __tests__/ of its unit's folder: in src/, in
      // scripts/ for the generator, or, for a unit at the package root, in
      // the root __tests__/.
      include: [
        'src/**/__tests__/*.test.ts',
        'scripts/__tests__/*.test.ts',
        '__tests__/*.test.ts'
      ]
    }
  })
)
