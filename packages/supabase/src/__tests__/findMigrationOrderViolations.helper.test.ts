import { describe, expect, test } from 'vitest'

import { findMigrationOrderViolations } from '@/findMigrationOrderViolations.helper'
import { MIGRATION_FILES } from '@/test/sqlFiles'

const TABLE_FIRST = {
  name: '0001_reader.sql',
  sql: 'create function public.reader() returns bigint language sql as $$\n  select count(*) from public.later_table\n$$;'
}
const TABLE_SECOND = {
  name: '0002_table.sql',
  sql: 'create table if not exists public.later_table (id int);'
}

describe('findMigrationOrderViolations', () => {
  test('reports a table a migration names before the migration that creates it', () => {
    expect(
      findMigrationOrderViolations({
        migrations: [TABLE_FIRST, TABLE_SECOND]
      })
    ).toEqual([
      {
        createdIn: '0002_table.sql',
        migration: '0001_reader.sql',
        name: 'public.later_table'
      }
    ])
  })

  test('reports a type a later migration creates inside a do block', () => {
    expect(
      findMigrationOrderViolations({
        migrations: [
          {
            name: '0001_table.sql',
            sql: 'create table public.t (status public.later_status);'
          },
          {
            name: '0002_enum.sql',
            sql: "do $$\nbegin\n  create type public.later_status as enum ('a');\nend\n$$;"
          }
        ]
      })
    ).toEqual([
      {
        createdIn: '0002_enum.sql',
        migration: '0001_table.sql',
        name: 'public.later_status'
      }
    ])
  })

  test('reports a function a later migration creates', () => {
    expect(
      findMigrationOrderViolations({
        migrations: [
          {
            name: '0001_grant.sql',
            sql: 'grant execute on function public.later_fn() to authenticated;'
          },
          {
            name: '0002_fn.sql',
            sql: 'create or replace function public.later_fn() returns int language sql as $$ select 1 $$;'
          }
        ]
      })
    ).toEqual([
      {
        createdIn: '0002_fn.sql',
        migration: '0001_grant.sql',
        name: 'public.later_fn'
      }
    ])
  })

  test('reads the migrations in name order, whatever order they come in', () => {
    expect(
      findMigrationOrderViolations({
        migrations: [TABLE_SECOND, TABLE_FIRST]
      })
    ).toEqual(
      findMigrationOrderViolations({
        migrations: [TABLE_FIRST, TABLE_SECOND]
      })
    )
    expect(
      findMigrationOrderViolations({
        migrations: [TABLE_SECOND, TABLE_FIRST]
      })
    ).toHaveLength(1)
  })

  test('ignores a name in a comment or a string literal', () => {
    expect(
      findMigrationOrderViolations({
        migrations: [
          {
            name: '0001_notes.sql',
            sql: "-- public.later_table comes later\ncomment on schema public is 'see public.later_table';"
          },
          TABLE_SECOND
        ]
      })
    ).toEqual([])
  })

  test('accepts an object the same or an earlier migration creates', () => {
    expect(
      findMigrationOrderViolations({
        migrations: [
          TABLE_SECOND,
          {
            name: '0003_reader.sql',
            sql: 'create function public.reader() returns bigint language sql as $$\n  select count(*) from public.later_table\n$$;\ngrant execute on function public.reader() to authenticated;'
          }
        ]
      })
    ).toEqual([])
  })
})

describe('the package migrations', () => {
  test('the migrations name no public object that only a later migration creates', () => {
    expect(MIGRATION_FILES.map(({ name }) => name)).toContain(
      '0001_extensions.sql'
    )
    expect(
      findMigrationOrderViolations({ migrations: MIGRATION_FILES })
    ).toEqual([])
  })
})
