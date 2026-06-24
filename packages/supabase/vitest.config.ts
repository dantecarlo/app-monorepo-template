import { resolve } from 'node:path'

import { defineConfig } from 'vitest/config'

const CORE_SRC = resolve(__dirname, '../core/src')

export default defineConfig({
  resolve: {
    alias: [
      // Core-internal @/ paths must be resolved against core/src, not this
      // package's src. Listed before the catch-all '@' entry so first-match wins.
      { find: '@app/core', replacement: CORE_SRC },
      { find: '@/errors', replacement: resolve(CORE_SRC, 'errors') },
      { find: '@/ports', replacement: resolve(CORE_SRC, 'ports') },
      { find: '@/utils', replacement: resolve(CORE_SRC, 'utils') },
      { find: '@', replacement: resolve(__dirname, 'src') }
    ]
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts']
  }
})
