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
export const KEEP_GROUP_ONE = '$1'

// A pgTAP file's first and last statements, read from its top-level code.
export const OPENING_STATEMENT = /^begin(?:\s+(?:transaction|work))?$/i
export const CLOSING_STATEMENT = /^rollback(?:\s+(?:transaction|work))?$/i
export const STATEMENT_END = ';'
// Every character of a token but its line breaks, which the top-level code keeps.
export const NOT_LINE_BREAK = /[^\r\n]/g

// The tokens of a pgTAP file that are not code, read as the Postgres lexer reads them
// (src/backend/parser/scan.l): a `--` comment ends at `\n` or `\r`; `/* */` comments nest;
// a double-quoted identifier doubles its `"`; a string doubles its `'`, and an escape
// string (`E'...'`, the `E` starting a token) also escapes with a backslash; a dollar
// quote's tag is letters, digits, `_` and non-ASCII characters, never starting with a
// digit, and a `$` right after an identifier character belongs to the identifier.
export const LINE_COMMENT = '--'
export const LINE_COMMENT_END = /[\r\n]/
export const BLOCK_COMMENT_OPEN = '/*'
export const BLOCK_COMMENT_CLOSE = '*/'
export const IDENTIFIER_QUOTE = '"'
export const ESCAPE_STRING_PREFIX = /^[Ee]$/
export const BACKSLASH = '\\'
export const IDENTIFIER_CHARACTER = /^(?:[A-Za-z0-9_$]|\P{ASCII})$/u
export const DOLLAR_QUOTE_TAG =
  /^\$(?:(?:[A-Za-z_]|\P{ASCII})(?:[A-Za-z0-9_]|\P{ASCII})*)?\$/u
// A `$` before a digit is a positional parameter (`$1`), not a dollar quote.
export const PARAMETER_DIGIT = /^[0-9]$/
export const DOLLAR_SIGN = /\$/g
export const UNCLOSED = -1
// psql reads a backslash outside quotes as a meta-command (`\i`, `\set`, `\gexec`).
export const PSQL_META_COMMAND = '\\'

// The statements that would end, split or reshape the transaction that holds the
// migrations, most specific first. A savepoint, its release and `rollback to` a savepoint
// keep that transaction, so they stay allowed.
export const TRANSACTION_CONTROL = [
  { name: 'commit prepared', pattern: /^commit\s+prepared\b/i },
  { name: 'rollback prepared', pattern: /^rollback\s+prepared\b/i },
  { name: 'prepare transaction', pattern: /^prepare\s+transaction\b/i },
  { name: 'start transaction', pattern: /^start\s+transaction\b/i },
  { name: 'set transaction', pattern: /^set\s+transaction\b/i },
  { name: 'commit', pattern: /^commit\b/i },
  { name: 'end', pattern: /^end\b/i },
  { name: 'abort', pattern: /^abort\b/i },
  { name: 'begin', pattern: /^begin\b/i },
  {
    name: 'rollback',
    pattern: /^rollback\b(?!(?:\s+(?:transaction|work))?\s+to\b)/i
  }
]

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
