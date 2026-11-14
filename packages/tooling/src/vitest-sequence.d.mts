export declare const SEED_ENV_VAR: 'VITEST_SEQUENCE_SEED'

export interface ISeedChoice {
  seed: number
  source: string
}

export interface ITestSequence {
  seed: number
  shuffle: true
}

export declare const seedFromCommitSha: (params: { sha: string }) => number

export declare const resolveSeed: (params: {
  env: Record<string, string | undefined>
  sha: string
}) => ISeedChoice

export declare const replayNotice: (
  params: ISeedChoice & { workspace: string }
) => string

export declare const workspaceName: (params: {
  packageDir: string
}) => string

export declare const readCommitSha: () => string

export declare const testSequence: (params: {
  packageDir: string
}) => ITestSequence
