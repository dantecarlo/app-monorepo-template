import { describe, expect, test } from 'vitest'

import {
  buildBranchMigrationsPrelude,
  bundlePgTapFiles,
  toBranchMigrations
} from '@/pgTapBundle.helper'
import { MIGRATION_FILES, PGTAP_FILES } from '@/test/sqlFiles'

const BASE = {
  name: '0001_base.sql',
  sql: 'create table public.t (id int);'
}
const SECOND = {
  name: '0002_second.sql',
  sql: 'create index t_id on public.t (id);'
}
const THIRD = {
  name: '0003_third_part.sql',
  sql: 'alter table public.t add column note text;'
}
const QUOTED = {
  name: '0004_quoted.sql',
  sql: "create function public.f() returns text language sql as $test_db_branch_migrations$ select 'it''s' $test_db_branch_migrations$;\ndo $test_db_migration$ begin end $test_db_migration$;"
}
const TAG_EDGE = {
  name: '0005_tag_edge.sql',
  sql: 'select 1; -- $test_db_migration_1'
}
const PGTAP = {
  name: 'rls.test.sql',
  sql: "-- rls.test.sql\n-- Concern: a suite.\n\nbegin;\n\nselect plan(1);\nselect ok(true, 'holds');\nselect * from finish();\n\nrollback;\n"
}

const LEDGER_READ = /supabase_migrations\.schema_migrations as ledger/g
const LEDGER_GUARD = 'if has_ledger then'
const OPENS_IF = /^if\b.*\bthen$/
const CLOSES_IF = 'end if;'

// The prelude's lines outside every `if has_ledger then` block, the block's
// nested ifs included: one statement per line, as the prelude writes them.
const withoutLedgerGuards = ({ prelude }: { prelude: string }): string => {
  const kept: string[] = []
  let depth = 0
  for (const line of prelude.split('\n')) {
    const code = line.trim()
    if (depth === 0 && code !== LEDGER_GUARD) {
      kept.push(line)
    } else if (depth === 0 || OPENS_IF.test(code)) {
      depth += 1
    } else if (code === CLOSES_IF) {
      depth -= 1
    }
  }
  return kept.join('\n')
}

const indexOf = ({
  fragment,
  text
}: {
  fragment: string
  text: string
}) => {
  const index = text.indexOf(fragment)
  expect(index, fragment).toBeGreaterThan(-1)
  return index
}

describe('toBranchMigrations', () => {
  test('lists the migrations in name order, with the version and the name the Supabase CLI records', () => {
    expect(
      toBranchMigrations({ migrations: [THIRD, BASE, SECOND] })
    ).toEqual([
      {
        file: '0001_base.sql',
        name: 'base',
        sql: BASE.sql,
        version: '0001'
      },
      {
        file: '0002_second.sql',
        name: 'second',
        sql: SECOND.sql,
        version: '0002'
      },
      {
        file: '0003_third_part.sql',
        name: 'third_part',
        sql: THIRD.sql,
        version: '0003'
      }
    ])
  })

  test('drops the begin and commit that wrap a whole migration, and keeps a commit inside it', () => {
    const wrapped = {
      name: '0002_wrapped.sql',
      sql: '-- header\nBEGIN;\nselect 1;\ncommit;\nselect 2;\nCOMMIT;\n-- end of file\n'
    }

    expect(
      toBranchMigrations({ migrations: [wrapped] }).map(({ sql }) => sql)
    ).toEqual([
      '-- header\n\nselect 1;\ncommit;\nselect 2;\n\n-- end of file\n'
    ])
  })

  test('keeps the text of a migration that only begins or only commits', () => {
    const migrations = [
      { name: '0002_begins.sql', sql: 'begin;\nselect 1;' },
      { name: '0003_commits.sql', sql: 'select 1;\ncommit;' }
    ]

    expect(
      toBranchMigrations({ migrations }).map(({ sql }) => sql)
    ).toEqual(['begin;\nselect 1;', 'select 1;\ncommit;'])
  })

  test('refuses two migrations with the same version, naming both', () => {
    const twin = { name: '0001_twin.sql', sql: 'select 1;' }

    expect(() =>
      toBranchMigrations({ migrations: [SECOND, twin, BASE] })
    ).toThrow(
      'test:db ran nothing: 0001_base.sql and 0001_twin.sql share version 0001'
    )
  })

  test('leaves out a file the Supabase CLI does not read as a migration', () => {
    const notMigrations = [
      { name: 'seed.sql', sql: 'select 1;' },
      { name: 'v2_named.sql', sql: 'select 2;' }
    ]

    expect(
      toBranchMigrations({ migrations: [...notMigrations, BASE] }).map(
        ({ file }) => file
      )
    ).toEqual(['0001_base.sql'])
  })
})

describe('buildBranchMigrationsPrelude', () => {
  test('lists every migration of the checkout, each text dollar-quoted with a tag none of them can end', () => {
    const prelude = buildBranchMigrationsPrelude({
      migrations: [TAG_EDGE, QUOTED, BASE]
    })
    const quote = '$test_db_migration_2$'
    const block = '$test_db_branch_migrations_1$'

    expect(prelude).toContain(
      "migration_files constant text[] := array['0001_base.sql', '0004_quoted.sql', '0005_tag_edge.sql']::text[];"
    )
    expect(prelude).toContain(
      "migration_versions constant text[] := array['0001', '0004', '0005']::text[];"
    )
    expect(prelude).toContain(
      "migration_names constant text[] := array['base', 'quoted', 'tag_edge']::text[];"
    )
    expect(prelude).toContain(
      `migration_bodies constant text[] := array[${quote}${BASE.sql}${quote}, ${quote}${QUOTED.sql}${quote}, ${quote}${TAG_EDGE.sql}${quote}]::text[];`
    )
    expect(prelude).toMatch(/^do \$test_db_branch_migrations_1\$$/m)
    expect(prelude.split(block)).toHaveLength(3)
    expect(prelude.endsWith(`${block};`)).toBe(true)
  })

  test('stops on a version the database holds under another name before it applies any migration', () => {
    const prelude = buildBranchMigrationsPrelude({ migrations: [BASE] })

    const conflictCheck = indexOf({
      fragment:
        'join supabase_migrations.schema_migrations as ledger on ledger.version = checkout.migration_version',
      text: prelude
    })
    expect(prelude).toContain(
      "format('%s: the database holds version %s as %L', checkout.file_name, checkout.migration_version, ledger.name)"
    )
    const raise = indexOf({
      fragment:
        "raise exception 'test:db applied no migration: %', conflicts;",
      text: prelude
    })
    const firstExecute = indexOf({ fragment: 'execute ', text: prelude })
    expect(conflictCheck).toBeLessThan(raise)
    expect(raise).toBeLessThan(firstExecute)
  })

  test('treats a ledger row with no name as a conflict', () => {
    const prelude = buildBranchMigrationsPrelude({ migrations: [BASE] })

    expect(prelude).toContain(
      'where ledger.name is distinct from checkout.migration_name;'
    )
    expect(prelude).not.toContain('ledger.name <> ')
  })

  test("applies a migration only when the database's ledger lacks its version", () => {
    const prelude = buildBranchMigrationsPrelude({
      migrations: [BASE, SECOND]
    })

    const loop = indexOf({
      fragment:
        'for migration_index in 1 .. coalesce(array_length(migration_files, 1), 0) loop',
      text: prelude
    })
    const skip = indexOf({
      fragment:
        'if exists (select from supabase_migrations.schema_migrations as ledger where ledger.version = migration_versions[migration_index]) then\n        continue;',
      text: prelude
    })
    const apply = indexOf({
      fragment: 'execute migration_bodies[migration_index];',
      text: prelude
    })
    expect(loop).toBeLessThan(skip)
    expect(skip).toBeLessThan(apply)
    expect(prelude).toContain(
      "raise notice 'test:db: the database holds migrations this checkout has no file for: %', database_only;"
    )
  })

  test('runs each migration through a PL/pgSQL execute and names the one that fails', () => {
    const prelude = buildBranchMigrationsPrelude({ migrations: [BASE] })

    expect(prelude).toMatch(/^do \$test_db_branch_migrations\$$/m)
    const apply = indexOf({
      fragment:
        '    begin\n      execute migration_bodies[migration_index];\n    exception when others then\n',
      text: prelude
    })
    const named = indexOf({
      fragment:
        "raise exception 'migration % failed inside the rolled-back transaction: %', migration_files[migration_index], sqlerrm using errcode = sqlstate;",
      text: prelude
    })
    expect(apply).toBeLessThan(named)
    expect(prelude).not.toMatch(/\b(?:commit|rollback)\b/i)
  })

  test('applies every migration when the database has no migration ledger', () => {
    const prelude = buildBranchMigrationsPrelude({ migrations: [BASE] })

    expect(prelude).toContain(
      "has_ledger constant boolean := to_regclass('supabase_migrations.schema_migrations') is not null;"
    )
    expect(prelude.match(LEDGER_READ)).toHaveLength(3)
    expect(withoutLedgerGuards({ prelude })).not.toMatch(LEDGER_READ)
  })
})

describe('bundlePgTapFiles', () => {
  test("puts the migrations inside each pgTAP file's transaction, right after its begin", () => {
    const prelude = buildBranchMigrationsPrelude({ migrations: [BASE] })

    expect(
      bundlePgTapFiles({ migrations: [BASE], tests: [PGTAP] })
    ).toEqual([
      {
        name: 'rls.test.sql',
        sql: `-- rls.test.sql\n-- Concern: a suite.\n\nbegin;\n\n${prelude}\n\nselect plan(1);\nselect ok(true, 'holds');\nselect * from finish();\n\nrollback;\n`
      }
    ])
  })

  test('refuses a pgTAP file that does not open with begin, naming it', () => {
    const outside = {
      name: 'outside.test.sql',
      sql: 'select plan(1);\nrollback;\n'
    }

    expect(() =>
      bundlePgTapFiles({ migrations: [BASE], tests: [PGTAP, outside] })
    ).toThrow(
      'test:db ran nothing: outside.test.sql does not open with begin;, so the migrations would run outside its transaction'
    )
  })

  test('refuses a pgTAP file that does not end with rollback, naming it', () => {
    const committed = {
      name: 'committed.test.sql',
      sql: 'begin;\nselect plan(1);\ncommit;\n'
    }

    expect(() =>
      bundlePgTapFiles({ migrations: [BASE], tests: [committed, PGTAP] })
    ).toThrow(
      'test:db ran nothing: committed.test.sql does not end with rollback;, so the migrations it applies would persist'
    )
  })

  test('refuses a pgTAP file whose rollback is only in a trailing comment, naming it', () => {
    const commented = {
      name: 'commented.test.sql',
      sql: 'begin;\nselect plan(1);\ncommit; -- rollback;\n'
    }
    expect(() =>
      bundlePgTapFiles({ migrations: [BASE], tests: [commented] })
    ).toThrow('commented.test.sql')
    expect(() =>
      bundlePgTapFiles({
        migrations: [BASE],
        tests: [
          { ...commented, sql: commented.sql.replaceAll('\n', '\r\n') }
        ]
      })
    ).toThrow(
      'test:db ran nothing: commented.test.sql does not end with rollback;, so the migrations it applies would persist'
    )
  })

  test.each([
    'begin;\nselect 1;\ncommit;\nbegin;\nselect 2;\nrollback;\n',
    'begin;\nselect 1;\nend;\nbegin;\nrollback;\n'
  ])(
    'refuses a pgTAP file that ends its transaction before its last rollback, naming it: %s',
    (sql) => {
      expect(() =>
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [{ name: 'split.test.sql', sql }]
        })
      ).toThrow('split.test.sql')
    }
  )

  test.each([
    {
      sql: 'begin;\nselect 1;\nCOMMIT;\nrollback;\n',
      statement: 'commit'
    },
    { sql: 'begin;\nend transaction;\nrollback;\n', statement: 'end' },
    { sql: 'begin;\nabort;\nrollback;\n', statement: 'abort' },
    {
      sql: 'begin;\nrollback;\nselect 1;\nrollback;\n',
      statement: 'rollback'
    },
    { sql: 'begin;\nbegin;\nrollback;\n', statement: 'begin' },
    {
      sql: 'begin;\nstart transaction;\nrollback;\n',
      statement: 'start transaction'
    },
    {
      sql: "begin;\nprepare transaction 'x';\nrollback;\n",
      statement: 'prepare transaction'
    },
    {
      sql: "begin;\ncommit prepared 'x';\nrollback;\n",
      statement: 'commit prepared'
    },
    {
      sql: 'begin;\nset transaction read write;\nrollback;\n',
      statement: 'set transaction'
    }
  ])(
    'refuses $statement between the first begin and the last rollback, naming the file',
    ({ sql, statement }) => {
      expect(() =>
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [{ name: 'control.test.sql', sql }]
        })
      ).toThrow(
        `test:db ran nothing: control.test.sql runs ${statement} inside its transaction, where only its first begin; and its last rollback; may control it`
      )
    }
  )

  test('keeps savepoints, and transaction words inside comments, strings and bodies', () => {
    const quiet = {
      name: 'quiet.test.sql',
      sql: "-- begin; commit;\nbegin;\nsavepoint before_write;\nselect 'commit;';\ndo $$ begin perform 1; end $$;\n/* end; */\nrollback to savepoint before_write;\nrelease savepoint before_write;\nrollback;\n-- commit;\n"
    }

    expect(
      bundlePgTapFiles({ migrations: [BASE], tests: [quiet] }).map(
        ({ name }) => name
      )
    ).toEqual(['quiet.test.sql'])
  })

  test.each(['\\i other.sql', '\\set answer 42', 'select 1 \\gexec'])(
    'refuses a pgTAP file with a psql meta-command, naming it: %s',
    (command) => {
      expect(() =>
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [
            {
              name: 'meta.test.sql',
              sql: `begin;\n${command}\nrollback;\n`
            }
          ]
        })
      ).toThrow(
        'test:db ran nothing: meta.test.sql holds a psql meta-command, which can run SQL test:db cannot check'
      )
    }
  )

  test.each([
    'begin isolation level serializable;\nselect 1;\nrollback;\n',
    'start transaction;\nselect 1;\nrollback;\n'
  ])(
    'refuses any opening other than a plain begin, naming the file: %s',
    (sql) => {
      expect(() =>
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [{ name: 'opening.test.sql', sql }]
        })
      ).toThrow(
        'test:db ran nothing: opening.test.sql does not open with begin;, so the migrations would run outside its transaction'
      )
    }
  )

  test.each([
    "begin;\nselect E'it\\'s'; commit;\nselect ok(true, 'x');\nrollback;\n",
    'begin;\nselect 1 as "a--b"; commit;\nselect 1;\nrollback;\n',
    `begin;\nselect 1 as "it's"; commit;\nselect ok(true, 'x');\nrollback;\n`,
    'begin;\nselect 1 as "a/*b"; commit;\nselect 1 as "c*/d";\nrollback;\n',
    'begin;\nselect 1 as a$b$; commit;\nselect 1 as c$b$;\nrollback;\n',
    'begin;\nselect 1; -- note\rcommit;\nrollback;\n',
    "begin;\nselect $\u00e9$ ' $\u00e9$; commit;\nselect ok(true, 'x');\nrollback;\n"
  ])(
    'refuses a commit hidden from a masker that misreads Postgres, naming the file: %s',
    (sql) => {
      expect(() =>
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [{ name: 'hidden.test.sql', sql }]
        })
      ).toThrow(
        'test:db ran nothing: hidden.test.sql runs commit inside its transaction, where only its first begin; and its last rollback; may control it'
      )
    }
  )

  test.each([
    "begin;\nselect E'a'\n'\\' '; commit; -- '\nselect 1;\nrollback;\n",
    "begin;\nselect plan(1);\nselect is(E'a'\n'\\' ', 'a'' ', 'desc'); commit; -- '\nselect * from finish();\nrollback;\n",
    "begin;\nselect E'a'\n-- note\n'\\' '; commit; -- '\nselect 1;\nrollback;\n",
    "begin;\nselect E'a' -- note\n'\\' '; commit; -- '\nselect 1;\nrollback;\n"
  ])(
    'refuses a commit after an escape string continued past a newline, naming the file: %s',
    (sql) => {
      expect(() =>
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [{ name: 'continued.test.sql', sql }]
        })
      ).toThrow(
        'test:db ran nothing: continued.test.sql runs commit inside its transaction, where only its first begin; and its last rollback; may control it'
      )
    }
  )

  test.each([
    "begin;\nselect E'a' '\\' '; commit; -- '\nselect 1;\nrollback;\n",
    "begin;\nselect ok(true, 'a'\n'b');\nrollback;\n",
    "begin;\nselect ok(true, 'a' -- note\r\n  'b');\nrollback;\n"
  ])(
    'continues a string only past whitespace that holds a newline, as Postgres does: %s',
    (sql) => {
      expect(
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [{ name: 'joined.test.sql', sql }]
        }).map(({ name }) => name)
      ).toEqual(['joined.test.sql'])
    }
  )

  test.each([
    "begin;\nselect 'never closed;\nrollback;\n",
    "begin;\nselect E'never closed\\';\nrollback;\n",
    'begin;\nselect 1 as "never closed;\nrollback;\n',
    'begin;\nselect $body$ never closed;\nrollback;\n',
    'begin;\n/* outer /* inner */ still open;\nrollback;\n',
    'begin;\nselect $ 1;\nrollback;\n'
  ])(
    'refuses a quote, a dollar sign or a comment it cannot pair, naming the file: %s',
    (sql) => {
      expect(() =>
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [{ name: 'unpaired.test.sql', sql }]
        })
      ).toThrow(
        'test:db ran nothing: unpaired.test.sql holds a quote, a dollar sign or a comment test:db cannot pair, so it cannot tell its statements apart'
      )
    }
  )

  test.each([
    'begin;\n/* outer /* inner */ commit; */\nselect 1;\nrollback;\n',
    "begin;\nselect E'it\\'s', 'it''s', \"a--b\", \"x\"\"y\", a$b$, $1, $\u00e9$ ; $\u00e9$;\nselect 1; -- done\r\nrollback;\n"
  ])(
    'reads what Postgres reads as one token, nested comments included: %s',
    (sql) => {
      expect(
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [{ name: 'quoted.test.sql', sql }]
        }).map(({ name }) => name)
      ).toEqual(['quoted.test.sql'])
    }
  )

  test('bundles every pgTAP file of the package', () => {
    const bundle = bundlePgTapFiles({
      migrations: MIGRATION_FILES,
      tests: PGTAP_FILES
    })

    expect(bundle.map(({ name }) => name)).toEqual(
      PGTAP_FILES.map(({ name }) => name)
    )
    expect(
      toBranchMigrations({ migrations: MIGRATION_FILES }).map(
        ({ file }) => file
      )
    ).toEqual(MIGRATION_FILES.map(({ name }) => name))
  })
})
