import type { ISqlFile } from '#src/sqlFile.type'
import type { TEST_DB_TARGET } from '#src/testDbRun.constant'

/** Where test:db runs the pgTAP suites, or `off` for none. */
export type TestDbTargetType =
  (typeof TEST_DB_TARGET)[keyof typeof TEST_DB_TARGET]

/** How a run of the Supabase CLI ended. */
export interface ITestDbCliResult {
  /** Why the CLI could not start, when it could not. */
  error?: string
  /** Its exit status, or null when it did not exit on its own. */
  status: number | null
}

/** The files, folders and processes test:db reaches; the runner script wires Node's. */
export interface ITestDbIo {
  log: ({ line }: { line: string }) => void
  logError: ({ line }: { line: string }) => void
  /** The files of the package's migrations folder. */
  readMigrations: () => ISqlFile[]
  /** `config.testDbTarget` of the package's package.json, undefined when unset. */
  readTarget: () => unknown
  /** The files of the package's pgTAP folder. */
  readTests: () => ISqlFile[]
  removeBundle: ({ dir }: { dir: string }) => void
  /** Runs the Supabase CLI from the package's folder with these arguments. */
  runSupabase: ({ args }: { args: string[] }) => ITestDbCliResult
  /** Writes the bundled pgTAP files into a new folder and returns its path. */
  writeBundle: ({ files }: { files: ISqlFile[] }) => string
}

export interface IRunTestDbParams {
  /** Writes the bundle and names the command, running nothing. */
  dryRun: boolean
  io: ITestDbIo
}
