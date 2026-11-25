import { describe, expect, test } from 'vitest'

import { bundlePgTapFiles } from '@/pgTapBundle.helper'
import { toPgTapCode } from '@/pgTapCode.helper'

const BASE = {
  name: '0001_base.sql',
  sql: 'create table public.t (id int);'
}

const SQL =
  "select 'a;b', E'c\\'d', \"e;f\", $t$ g; set_config $t$; -- h;\n/* i /* j; */ k; */ select 1;\n"

describe('toPgTapCode', () => {
  test('blanks every comment, string, quoted identifier and dollar body, keeping each offset', () => {
    const pgTap = toPgTapCode({ sql: SQL })

    expect(pgTap?.code).toHaveLength(SQL.length)
    expect(pgTap?.code.indexOf('\n')).toBe(SQL.indexOf('\n'))
    expect(pgTap?.code.replace(/ +/g, ' ')).toBe(
      'select , E , , ; \n select 1;\n'
    )
  })

  test('keeps the quoted identifiers and dollar bodies in the view a mention is searched in', () => {
    const pgTap = toPgTapCode({ sql: SQL })

    expect(pgTap?.searchable).toHaveLength(SQL.length)
    expect(pgTap?.searchable).toContain('"e;f"')
    expect(pgTap?.searchable).toContain('$t$ g; set_config $t$')
    expect(pgTap?.searchable).not.toContain("'a;b'")
    expect(pgTap?.searchable).not.toContain('-- h;')
    expect(pgTap?.searchable).not.toContain('i /* j')
  })

  test('reads nothing when a token never closes or a $ pairs with nothing', () => {
    expect(toPgTapCode({ sql: "select 'open;\n" })).toBeNull()
    expect(toPgTapCode({ sql: 'select $ 1;\n' })).toBeNull()
  })
})

// The bundle's check, read through its public interface, over the forms a simpler
// reader misreads.
describe('bundlePgTapFiles over what the reader splits', () => {
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
    "select U&\"s\\0065t_config\"('a', 'b', true);",
    'select 1 as U&"standard!005fconforming_strings" UESCAPE \'!\';',
    'select 1 as u&"plain";'
  ])(
    'refuses any U&"..." identifier, whose escapes could spell a refused name, naming the file: %s',
    (statement) => {
      expect(() =>
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [
            {
              name: 'escaped.test.sql',
              sql: `begin;\n${statement}\nrollback;\n`
            }
          ]
        })
      ).toThrow(
        'test:db ran nothing: escaped.test.sql quotes an identifier with U&"...", whose escapes could spell a name test:db refuses'
      )
    }
  )

  test.each([
    "select U&'d\\0061ta';",
    'select ok(true, \'U&"set_config"\');',
    '-- U&"set_config"\nselect 1;',
    'select 1 as "U&x";'
  ])(
    'keeps U& in a string, a comment, a U& string or inside a quoted identifier: %s',
    (statement) => {
      expect(
        bundlePgTapFiles({
          migrations: [BASE],
          tests: [
            {
              name: 'unescaped.test.sql',
              sql: `begin;\n${statement}\nrollback;\n`
            }
          ]
        }).map(({ name }) => name)
      ).toEqual(['unescaped.test.sql'])
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
})
