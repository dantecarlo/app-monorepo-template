import type { ISqlFile } from '#src/sqlFile.type'

/** A migration of the checkout, as the Supabase CLI reads its file name. */
export interface IBranchMigration {
  /** The file name, such as `0014_profile_avatar.sql`. */
  file: string
  /** The name the ledger records, such as `profile_avatar`. */
  name: string
  /** The file's text, without a `begin` and a `commit` that wrap all of it. */
  sql: string
  /** The version the ledger records, such as `0014`. */
  version: string
}

export interface IBranchMigrationsParams {
  /** The files of the migrations folder. */
  migrations: ISqlFile[]
}

export interface IBundlePgTapFilesParams extends IBranchMigrationsParams {
  /** The pgTAP files of the tests folder. */
  tests: ISqlFile[]
}
