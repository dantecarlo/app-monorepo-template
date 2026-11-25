import { describe, expect, test } from 'vitest'

import { SQL_NON_CODE_TOKEN_PATTERN } from '@/sqlCode.constant'
import { toSqlCode } from '@/sqlCode.helper'

const BACKSLASH = '\\'
const CARRIAGE_RETURN = '\r'

describe('toSqlCode', () => {
  test('reads the forms the pgTAP check reads on its own exactly as before', () => {
    expect(SQL_NON_CODE_TOKEN_PATTERN.source).toBe(
      String.raw`\$([A-Za-z_][A-Za-z0-9_]*)?\$([\s\S]*?)\$\1\$|--[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^']|'')*'`
    )
    expect(
      [
        `select E'it${BACKSLASH}'s'; commit; select ok(true, 'x');`,
        'select 1 as "a--b"; commit;',
        `select 1 as "it's"; commit; select ok(true, 'x');`,
        'select 1 as a$b$; commit; select 1 as c$b$;',
        `select 1; -- note${CARRIAGE_RETURN}commit;`,
        "select $\u00e9$ ' $\u00e9$; commit;"
      ].map((sql) => toSqlCode({ sql }))
    ).toEqual([
      "select E''s''x');",
      'select 1 as "a ',
      `select 1 as "it''x');`,
      'select 1 as a$b$; commit; select 1 as c$b$;',
      'select 1;  ',
      "select $\u00e9$ ' $\u00e9$; commit;"
    ])
  })

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
