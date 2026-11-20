import {
  BACKSLASH,
  BLOCK_COMMENT_CLOSE,
  BLOCK_COMMENT_OPEN,
  CLOSING_STATEMENT,
  DOLLAR_QUOTE,
  DOLLAR_QUOTE_TAG,
  DOLLAR_SIGN,
  ESCAPE_STRING_PREFIX,
  HORIZONTAL_SPACE,
  IDENTIFIER_CHARACTER,
  IDENTIFIER_QUOTE,
  KEEP_GROUP_ONE,
  LEADING_BEGIN_PATTERN,
  LINE_BREAK,
  LINE_COMMENT,
  LINE_COMMENT_END,
  MIGRATION_FILE_PATTERN,
  MIGRATION_LEDGER,
  MIGRATION_TAG_STEM,
  NEWLINE,
  NOT_LINE_BREAK,
  OPENING_STATEMENT,
  PARAMETER_DIGIT,
  PRELUDE_TAG_STEM,
  PSQL_META_COMMAND,
  SQL_LIST_SEPARATOR,
  STATEMENT_END,
  TAG_COUNTER_SEPARATOR,
  TRAILING_COMMIT_PATTERN,
  TRANSACTION_CONTROL,
  UNCLOSED
} from '#src/pgTapBundle.constant'
import type {
  IBranchMigration,
  IBranchMigrationsParams,
  IBundlePgTapFilesParams
} from '#src/pgTapBundle.type'
import { SQL_BLANK, SQL_QUOTE } from '#src/sqlCode.constant'
import type { ISqlFile } from '#src/sqlFile.type'

const FILE_LIST_SEPARATOR = ' and '

const withoutWrapper = ({ sql }: { sql: string }): string =>
  LEADING_BEGIN_PATTERN.test(sql) && TRAILING_COMMIT_PATTERN.test(sql)
    ? sql
        .replace(LEADING_BEGIN_PATTERN, KEEP_GROUP_ONE)
        .replace(TRAILING_COMMIT_PATTERN, KEEP_GROUP_ONE)
    : sql

// `$<stem>$`, or `$<stem>_<n>$` with the smallest n, that `fits` accepts.
const toDollarTag = ({
  attempt = 0,
  fits,
  stem
}: {
  attempt?: number
  fits: (tag: string) => boolean
  stem: string
}): string => {
  const suffix = attempt === 0 ? '' : `${TAG_COUNTER_SEPARATOR}${attempt}`
  const tag = `${DOLLAR_QUOTE}${stem}${suffix}${DOLLAR_QUOTE}`
  return fits(tag)
    ? tag
    : toDollarTag({ attempt: attempt + 1, fits, stem })
}

// Postgres ends a dollar-quoted text at the first `tag` after the opening one, so a text
// quoted with `tag` holds none, and none starts where its end meets the closing tag.
const closesAfter = ({
  tag,
  text
}: {
  tag: string
  text: string
}): boolean => `${text}${tag}`.indexOf(tag) === text.length

const toSqlLiteral = ({ text }: { text: string }): string =>
  `${SQL_QUOTE}${text.replaceAll(SQL_QUOTE, SQL_QUOTE + SQL_QUOTE)}${SQL_QUOTE}`

const toSqlTextArray = ({ items }: { items: string[] }): string =>
  `array[${items.join(SQL_LIST_SEPARATOR)}]::text[]`

// Throws, naming the files, when two migrations share a version: the ledger records one.
const assertUniqueVersions = ({
  branch
}: {
  branch: IBranchMigration[]
}): void => {
  for (const { version } of branch) {
    const sharing = branch.filter(
      (migration) => migration.version === version
    )
    if (sharing.length > 1) {
      throw new Error(
        `test:db ran nothing: ${sharing.map(({ file }) => file).join(FILE_LIST_SEPARATOR)} share version ${version}`
      )
    }
  }
}

/**
 * The checkout's migrations as the Supabase CLI applies them: in name order, the files
 * named `<version>_<name>.sql` only, each with the version and the name the ledger
 * records, and each without the `begin` and `commit` that wrap a whole file. A `commit`
 * left inside one stays, for Postgres to refuse. It throws, naming them, when two files
 * share a version.
 */
export const toBranchMigrations = ({
  migrations
}: IBranchMigrationsParams): IBranchMigration[] => {
  const branch = [...migrations]
    .sort((left, right) =>
      left.name < right.name ? -1 : Number(left.name > right.name)
    )
    .flatMap(({ name: file, sql }) => {
      const groups = MIGRATION_FILE_PATTERN.exec(file)?.groups
      return groups
        ? [
            {
              file,
              name: groups.name,
              sql: withoutWrapper({ sql }),
              version: groups.version
            }
          ]
        : []
    })
  assertUniqueVersions({ branch })
  return branch
}

/**
 * The `do` block that applies, inside the transaction it runs in, every migration of the
 * checkout whose version the database's ledger lacks, in name order, each through a
 * PL/pgSQL `execute`, where Postgres refuses a statement that would end the transaction.
 * It raises before applying any when the ledger holds a file's version under another
 * name or under none, raises naming the first migration that fails, notes the versions the ledger holds
 * that the checkout has no file for, and applies every migration when there is no ledger.
 * Each text is dollar-quoted with a tag no migration holds, so none can end its quote or
 * the block.
 */
export const buildBranchMigrationsPrelude = ({
  migrations
}: IBranchMigrationsParams): string => {
  const branch = toBranchMigrations({ migrations })
  const texts = branch.map(({ sql }) => sql)
  const migrationTag = toDollarTag({
    fits: (tag) => texts.every((text) => closesAfter({ tag, text })),
    stem: MIGRATION_TAG_STEM
  })
  const literals = ({
    pick
  }: {
    pick: (migration: IBranchMigration) => string
  }): string =>
    toSqlTextArray({
      items: branch.map((migration) =>
        toSqlLiteral({ text: pick(migration) })
      )
    })
  const bodies = toSqlTextArray({
    items: texts.map((text) => `${migrationTag}${text}${migrationTag}`)
  })

  const body = `
declare
  migration_files constant text[] := ${literals({ pick: ({ file }) => file })};
  migration_versions constant text[] := ${literals({ pick: ({ version }) => version })};
  migration_names constant text[] := ${literals({ pick: ({ name }) => name })};
  migration_bodies constant text[] := ${bodies};
  has_ledger constant boolean := to_regclass('${MIGRATION_LEDGER}') is not null;
  conflicts text;
  database_only text;
begin
  if has_ledger then
    select string_agg(format('%s: the database holds version %s as %L', checkout.file_name, checkout.migration_version, ledger.name), '; ' order by checkout.file_name)
      into conflicts
      from unnest(migration_files, migration_versions, migration_names) as checkout(file_name, migration_version, migration_name)
      join ${MIGRATION_LEDGER} as ledger on ledger.version = checkout.migration_version
      where ledger.name is distinct from checkout.migration_name;
    if conflicts is not null then
      raise exception 'test:db applied no migration: %', conflicts;
    end if;
    select string_agg(ledger.version || '_' || coalesce(ledger.name, ''), ', ' order by ledger.version)
      into database_only
      from ${MIGRATION_LEDGER} as ledger
      where not ledger.version = any(migration_versions);
    if database_only is not null then
      raise notice 'test:db: the database holds migrations this checkout has no file for: %', database_only;
    end if;
  end if;
  for migration_index in 1 .. coalesce(array_length(migration_files, 1), 0) loop
    if has_ledger then
      if exists (select from ${MIGRATION_LEDGER} as ledger where ledger.version = migration_versions[migration_index]) then
        continue;
      end if;
    end if;
    raise notice 'test:db: applying % inside the rolled-back transaction', migration_files[migration_index];
    begin
      execute migration_bodies[migration_index];
    exception when others then
      raise exception 'migration % failed inside the rolled-back transaction: %', migration_files[migration_index], sqlerrm using errcode = sqlstate;
    end;
  end loop;
end
`
  const preludeTag = toDollarTag({
    fits: (tag) => !body.includes(tag),
    stem: PRELUDE_TAG_STEM
  })

  return `-- test:db: the checkout's migrations that this database's ledger lacks, applied inside
-- this file's transaction and rolled back with it (packages/supabase/docs/database.md).
do ${preludeTag}${body}${preludeTag};`
}

const isIdentifierCharacter = ({
  character
}: {
  character: string | undefined
}): boolean =>
  character !== undefined && IDENTIFIER_CHARACTER.test(character)

const lineCommentEnd = ({
  sql,
  start
}: {
  sql: string
  start: number
}): number => {
  const length = sql.slice(start).search(LINE_COMMENT_END)
  return length === -1 ? sql.length : start + length
}

const blockCommentEnd = ({
  sql,
  start
}: {
  sql: string
  start: number
}): number => {
  let depth = 0
  let index = start
  while (index < sql.length) {
    const pair = sql.slice(index, index + BLOCK_COMMENT_OPEN.length)
    if (pair === BLOCK_COMMENT_OPEN) {
      depth += 1
      index += pair.length
    } else if (pair === BLOCK_COMMENT_CLOSE) {
      depth -= 1
      index += pair.length
      if (depth === 0) return index
    } else {
      index += 1
    }
  }
  return UNCLOSED
}

// The offset of the `'` that continues a string closed just before `start`: past spaces,
// tabs, form feeds, vertical tabs, newlines and `--` comments, with at least one newline,
// as scan.l's `quotecontinue` reads it; -1 when the string ends there.
const continuationQuote = ({
  sql,
  start
}: {
  sql: string
  start: number
}): number => {
  let crossedNewline = false
  let index = start
  while (index < sql.length) {
    const character = sql[index]
    if (character === SQL_QUOTE) return crossedNewline ? index : -1
    if (NEWLINE.test(character)) {
      crossedNewline = true
      index += 1
    } else if (HORIZONTAL_SPACE.test(character)) {
      index += 1
    } else if (sql.startsWith(LINE_COMMENT, index)) {
      index = lineCommentEnd({ sql, start: index })
    } else {
      return -1
    }
  }
  return -1
}

const quotedEnd = ({
  backslashEscapes,
  quote,
  sql,
  start
}: {
  backslashEscapes: boolean
  quote: string
  sql: string
  start: number
}): number => {
  let index = start + quote.length
  while (index < sql.length) {
    const character = sql[index]
    if (backslashEscapes && character === BACKSLASH) {
      index += 2
    } else if (character !== quote) {
      index += 1
    } else if (sql[index + 1] === quote) {
      index += 2
    } else {
      const continued =
        quote === SQL_QUOTE
          ? continuationQuote({ sql, start: index + quote.length })
          : -1
      if (continued === -1) return index + quote.length
      index = continued + quote.length
    }
  }
  return UNCLOSED
}

const dollarQuoteEnd = ({
  sql,
  start
}: {
  sql: string
  start: number
}): number => {
  const tag = DOLLAR_QUOTE_TAG.exec(sql.slice(start))?.[0]
  if (tag === undefined) return start
  const close = sql.indexOf(tag, start + tag.length)
  return close === -1 ? UNCLOSED : close + tag.length
}

// The offset just past the token that is not code starting at `index`: `index` itself
// when none starts there, and UNCLOSED when one starts and never ends.
const nonCodeEnd = ({
  index,
  sql
}: {
  index: number
  sql: string
}): number => {
  const character = sql[index]
  const pair = sql.slice(index, index + LINE_COMMENT.length)
  if (pair === LINE_COMMENT) return lineCommentEnd({ sql, start: index })
  if (pair === BLOCK_COMMENT_OPEN)
    return blockCommentEnd({ sql, start: index })
  if (character === SQL_QUOTE) {
    const prefix = sql[index - 1] ?? ''
    return quotedEnd({
      backslashEscapes:
        ESCAPE_STRING_PREFIX.test(prefix) &&
        !isIdentifierCharacter({ character: sql[index - 2] }),
      quote: SQL_QUOTE,
      sql,
      start: index
    })
  }
  if (character === IDENTIFIER_QUOTE) {
    return quotedEnd({
      backslashEscapes: false,
      quote: IDENTIFIER_QUOTE,
      sql,
      start: index
    })
  }
  if (
    character === DOLLAR_QUOTE &&
    !isIdentifierCharacter({ character: sql[index - 1] })
  ) {
    return dollarQuoteEnd({ sql, start: index })
  }
  return index
}

// A `$` left in the code that is neither inside an identifier nor a positional parameter.
const hasStrayDollar = ({
  code,
  sql
}: {
  code: string
  sql: string
}): boolean =>
  [...code.matchAll(DOLLAR_SIGN)].some(
    ({ index = 0 }) =>
      !isIdentifierCharacter({ character: sql[index - 1] }) &&
      !PARAMETER_DIGIT.test(sql[index + 1] ?? '')
  )

// The file's top-level code: every comment, string, quoted identifier and dollar-quoted
// body blanked to spaces with its line breaks kept, so each offset still points at the
// same character; null when a token never closes or a `$` pairs with nothing, since then
// the statements cannot be told apart.
const toTopLevelCode = ({ sql }: { sql: string }): string | null => {
  let code = ''
  let index = 0
  while (index < sql.length) {
    const end = nonCodeEnd({ index, sql })
    if (end === UNCLOSED) return null
    if (end === index) {
      code += sql[index]
      index += 1
    } else {
      code += sql.slice(index, end).replace(NOT_LINE_BREAK, SQL_BLANK)
      index = end
    }
  }
  return hasStrayDollar({ code, sql }) ? null : code
}

// The offset just past a pgTAP file's opening `begin;`. It throws, naming the file, when
// the file holds a psql meta-command, does not open with a plain `begin;`, does not end
// with `rollback;`, or controls its transaction anywhere in between.
const toOpeningEnd = ({ name, sql }: ISqlFile): number => {
  const refuse = ({ reason }: { reason: string }): Error =>
    new Error(`test:db ran nothing: ${name} ${reason}`)
  const code = toTopLevelCode({ sql })
  if (code === null) {
    throw refuse({
      reason:
        'holds a quote, a dollar sign or a comment test:db cannot pair, so it cannot tell its statements apart'
    })
  }
  if (code.includes(PSQL_META_COMMAND)) {
    throw refuse({
      reason:
        'holds a psql meta-command, which can run SQL test:db cannot check'
    })
  }

  const statements = code
    .split(STATEMENT_END)
    .map((statement) => statement.trim())
  // The text after the last `;`, which a file that ends with `rollback;` leaves blank.
  const trailing = statements.pop()
  const [opening = '', ...rest] = statements
  if (!OPENING_STATEMENT.test(opening)) {
    throw refuse({
      reason:
        'does not open with begin;, so the migrations would run outside its transaction'
    })
  }
  const closing = rest.pop() ?? ''
  if (trailing !== '' || !CLOSING_STATEMENT.test(closing)) {
    throw refuse({
      reason:
        'does not end with rollback;, so the migrations it applies would persist'
    })
  }
  for (const statement of rest) {
    const control = TRANSACTION_CONTROL.find(({ pattern }) =>
      pattern.test(statement)
    )
    if (control) {
      throw refuse({
        reason: `runs ${control.name} inside its transaction, where only its first begin; and its last rollback; may control it`
      })
    }
  }
  return code.indexOf(STATEMENT_END) + 1
}

/**
 * Every pgTAP file with the block of `buildBranchMigrationsPrelude` right after its
 * opening `begin;`, so the file's `rollback;` takes the migrations with it. Read with its
 * comments, strings and dollar-quoted bodies blanked, a file must open with a plain
 * `begin;`, end with `rollback;`, hold no other statement that controls the transaction
 * (a savepoint excepted) and no psql meta-command; it throws, naming the file, otherwise.
 */
export const bundlePgTapFiles = ({
  migrations,
  tests
}: IBundlePgTapFilesParams): ISqlFile[] => {
  const prelude = buildBranchMigrationsPrelude({ migrations })

  return tests.map(({ name, sql }) => {
    const openingEnd = toOpeningEnd({ name, sql })
    return {
      name,
      sql: `${sql.slice(0, openingEnd)}${LINE_BREAK}${LINE_BREAK}${prelude}${sql.slice(openingEnd)}`
    }
  })
}
