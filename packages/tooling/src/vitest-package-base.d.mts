import type { ITestSequence } from './vitest-sequence.mjs'

export interface IPackageTestBase {
  resolve: { alias: Record<string, string> }
  test: {
    clearMocks: boolean
    coverage: {
      exclude: string[]
      provider: 'v8'
      reporter: string[]
      reportsDirectory: string
    }
    environment: 'node'
    globals: boolean
    sequence: ITestSequence
  }
}

export declare const packageTestBase: (params: {
  packageDir: string
}) => IPackageTestBase
