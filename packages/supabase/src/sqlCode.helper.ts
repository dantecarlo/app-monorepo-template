import {
  SQL_BLANK,
  SQL_DOLLAR,
  SQL_EMPTY_STRING,
  SQL_NON_CODE_TOKEN_PATTERN,
  SQL_QUOTE
} from '#src/sqlCode.constant'

interface IToSqlCodeParams {
  /** Keep string literals: true inside a dollar-quoted body, where a string is often SQL. */
  keepStrings?: boolean
  sql: string
}

/**
 * The SQL with its comments blanked and, outside dollar-quoted bodies, its string literals
 * emptied, so a name in a comment or in prose such as `comment on ... is '...'` is not read
 * as code. A dollar-quoted body (a function or a do block) is code: it is kept, its own
 * comments blanked and its strings kept.
 */
export const toSqlCode = ({
  keepStrings = false,
  sql
}: IToSqlCodeParams): string =>
  sql.replace(
    SQL_NON_CODE_TOKEN_PATTERN,
    // A replacer gets the token, then each group (undefined when it took no part).
    (...match: (string | undefined)[]) => {
      const [token = '', tag, body] = match
      if (body !== undefined) {
        const delimiter = `${SQL_DOLLAR}${tag ?? ''}${SQL_DOLLAR}`
        return `${delimiter}${toSqlCode({ keepStrings: true, sql: body })}${delimiter}`
      }
      if (token.startsWith(SQL_QUOTE)) {
        return keepStrings ? token : SQL_EMPTY_STRING
      }
      return SQL_BLANK
    }
  )
