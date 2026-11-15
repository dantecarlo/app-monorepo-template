import { describe, expect, test } from 'vitest'

import { toSqlCode } from '@/sqlCode.helper'

describe('toSqlCode', () => {
  test('blanks line and block comments', () => {
    const code = toSqlCode({
      sql: 'select 1; -- public.later\n/* public.later */ select 2;'
    })

    expect(code).not.toContain('public.later')
    expect(code).toContain('select 1;')
    expect(code).toContain('select 2;')
  })

  test('blanks a string literal, doubled quotes included', () => {
    const code = toSqlCode({
      sql: "comment on table public.t is 'it''s about public.later'; select 3;"
    })

    expect(code).not.toContain('public.later')
    expect(code).toContain('comment on table public.t is')
    expect(code).toContain('select 3;')
  })

  test('keeps a dollar-quoted body, and the strings inside it', () => {
    const code = toSqlCode({
      sql: "do $$ begin execute 'alter table public.kept owner to postgres'; end $$;"
    })

    expect(code).toBe(
      "do $$ begin execute 'alter table public.kept owner to postgres'; end $$;"
    )
  })

  test('blanks the comments inside a dollar-quoted body', () => {
    const code = toSqlCode({
      sql: 'create function f() returns int as $fn$\n  -- public.later\n  select 1\n$fn$;'
    })

    expect(code).not.toContain('public.later')
    expect(code).toContain('$fn$')
    expect(code).toContain('select 1')
  })
})
