import { packageTestBase } from '@app/tooling/vitest-package-base'
import { defineConfig, mergeConfig } from 'vitest/config'

export default mergeConfig(
  packageTestBase({ packageDir: __dirname }),
  defineConfig({
    test: {
      include: ['src/**/*.test.ts']
    }
  })
)
