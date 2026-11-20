import { bundlePgTapFiles } from '#src/pgTapBundle.helper'
import type { ISqlFile } from '#src/sqlFile.type'
import {
  ARGUMENT_SEPARATOR,
  DEFAULT_TEST_DB_TARGET,
  EXIT_FAILURE,
  EXIT_SUCCESS,
  LAST_LIST_SEPARATOR,
  LIST_SEPARATOR,
  SUPABASE_COMMAND,
  SUPABASE_TEST_DB_ARGS,
  TEST_DB_TARGET,
  TEST_DB_TARGET_FLAG,
  TEST_DB_TARGET_SETTING
} from '#src/testDbRun.constant'
import type {
  IRunTestDbParams,
  ITestDbIo,
  TestDbTargetType
} from '#src/testDbRun.type'

const TARGETS: readonly string[] = Object.values(TEST_DB_TARGET)

const isTestDbTarget = (value: unknown): value is TestDbTargetType =>
  typeof value === 'string' && TARGETS.includes(value)

const listTargets = (): string =>
  `${TARGETS.slice(0, -1).join(LIST_SEPARATOR)}${LAST_LIST_SEPARATOR}${TARGETS.at(-1)}`

const messageOf = ({ error }: { error: unknown }): string =>
  error instanceof Error ? error.message : String(error)

// The bundled pgTAP files, or null once the reason they cannot be bundled is logged.
const bundleOrNull = ({ io }: { io: ITestDbIo }): ISqlFile[] | null => {
  try {
    return bundlePgTapFiles({
      migrations: io.readMigrations(),
      tests: io.readTests()
    })
  } catch (error) {
    io.logError({ line: messageOf({ error }) })
    return null
  }
}

/**
 * test:db: reads the target from `config.testDbTarget` (linked when unset), bundles the
 * pgTAP files with the checkout's migrations (`bundlePgTapFiles`) and runs
 * `supabase test db --linked` or `--local` over the bundle, removing it afterwards, and
 * returns the CLI's exit status. `off` runs nothing and returns 0; an unknown target, a
 * pgTAP file that cannot be bundled or a CLI that cannot start runs nothing more and
 * returns 1. A dry run writes the bundle, names it and the command, and runs nothing.
 */
export const runTestDb = ({ dryRun, io }: IRunTestDbParams): number => {
  const configured = io.readTarget()
  const target =
    configured === undefined ? DEFAULT_TEST_DB_TARGET : configured
  if (!isTestDbTarget(target)) {
    io.logError({
      line: `test:db ran nothing: ${TEST_DB_TARGET_SETTING} is ${JSON.stringify(target)}; it takes ${listTargets()}`
    })
    return EXIT_FAILURE
  }
  if (target === TEST_DB_TARGET.OFF) {
    io.log({
      line: `test:db: no database test runs: ${TEST_DB_TARGET_SETTING} is ${target}`
    })
    return EXIT_SUCCESS
  }

  const files = bundleOrNull({ io })
  if (files === null) return EXIT_FAILURE

  const dir = io.writeBundle({ files })
  const args = [...SUPABASE_TEST_DB_ARGS, TEST_DB_TARGET_FLAG[target], dir]
  const command = `${[SUPABASE_COMMAND, ...args].join(ARGUMENT_SEPARATOR)} (target ${target})`
  if (dryRun) {
    io.log({
      line: `test:db: dry run, nothing ran; it would run ${command}, and the bundle stays in ${dir}`
    })
    return EXIT_SUCCESS
  }

  io.log({ line: `test:db: ${command}` })
  try {
    const { error, status } = io.runSupabase({ args })
    if (error !== undefined) {
      io.logError({
        line: `test:db: the Supabase CLI could not start: ${error}`
      })
      return EXIT_FAILURE
    }
    return status ?? EXIT_FAILURE
  } finally {
    io.removeBundle({ dir })
  }
}
