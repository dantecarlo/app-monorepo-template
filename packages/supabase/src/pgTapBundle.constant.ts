// A migration file as the Supabase CLI reads it: `<version>_<name>.sql`. The CLI skips
// any other file of the migrations folder, in `db push` as here.
export const MIGRATION_FILE_PATTERN = /^(?<version>\d+)_(?<name>.*)\.sql$/u

// Whitespace and comments only, as they may come before a file's first statement or after
// its last one.
const COMMENTS_ONLY = String.raw`(?:\s|--[^\n]*(?:\n|$)|\/\*[\s\S]*?\*\/)*`

// A `begin` before any other statement, after comments only (group 1).
export const LEADING_BEGIN_PATTERN = new RegExp(
  String.raw`^(${COMMENTS_ONLY})begin(?:\s+(?:transaction|work))?\s*;`,
  'i'
)
// A `commit` after every other statement, before comments only (group 1).
export const TRAILING_COMMIT_PATTERN = new RegExp(
  String.raw`\b(?:commit|end)(?:\s+(?:transaction|work))?\s*;(${COMMENTS_ONLY})$`,
  'i'
)
// A `rollback` after every other statement, before comments only.
export const TRAILING_ROLLBACK_PATTERN = new RegExp(
  String.raw`\brollback(?:\s+(?:transaction|work))?\s*;${COMMENTS_ONLY}$`,
  'i'
)
export const KEEP_GROUP_ONE = '$1'

// The stems of the dollar-quote tags of the `do` block that applies the branch's
// migrations and of the migration texts inside it. A tag is `$<stem>$`, or
// `$<stem>_<n>$` with the smallest n that no migration text holds, so no text can end
// the quote around it or the block.
export const PRELUDE_TAG_STEM = 'test_db_branch_migrations'
export const MIGRATION_TAG_STEM = 'test_db_migration'
export const DOLLAR_QUOTE = '$'
export const TAG_COUNTER_SEPARATOR = '_'

// The table where the Supabase CLI records each migration it applied.
export const MIGRATION_LEDGER = 'supabase_migrations.schema_migrations'

export const SQL_LIST_SEPARATOR = ', '
export const LINE_BREAK = '\n'
