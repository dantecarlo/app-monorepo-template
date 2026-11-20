import {
  BACKSLASH,
  BLOCK_COMMENT_CLOSE,
  BLOCK_COMMENT_OPEN,
  DOLLAR_QUOTE_TAG,
  DOLLAR_SIGN,
  ESCAPE_STRING_PREFIX,
  HORIZONTAL_SPACE,
  IDENTIFIER_CHARACTER,
  IDENTIFIER_QUOTE,
  LINE_COMMENT,
  LINE_COMMENT_END,
  NEWLINE,
  NOT_LINE_BREAK,
  PARAMETER_DIGIT,
  UNCLOSED
} from '#src/pgTapCode.constant'
import type { IPgTapCode } from '#src/pgTapCode.type'
import { SQL_BLANK, SQL_DOLLAR, SQL_QUOTE } from '#src/sqlCode.constant'

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
    character === SQL_DOLLAR &&
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

/**
 * A pgTAP file split as the Postgres lexer splits it, in two views as long as the file,
 * line breaks kept, so each offset still points at the same character: `code` with every
 * comment, string, quoted identifier and dollar-quoted body blanked to spaces, and
 * `searchable` with only the comments and strings blanked. Null when a token never closes
 * or a `$` pairs with nothing, since then the statements cannot be told apart.
 */
export const toPgTapCode = ({
  sql
}: {
  sql: string
}): IPgTapCode | null => {
  let code = ''
  let searchable = ''
  let index = 0
  while (index < sql.length) {
    const end = nonCodeEnd({ index, sql })
    if (end === UNCLOSED) return null
    if (end === index) {
      code += sql[index]
      searchable += sql[index]
      index += 1
    } else {
      const token = sql.slice(index, end)
      const blank = token.replace(NOT_LINE_BREAK, SQL_BLANK)
      const isCode =
        token.startsWith(IDENTIFIER_QUOTE) || token.startsWith(SQL_DOLLAR)
      code += blank
      searchable += isCode ? token : blank
      index = end
    }
  }
  return hasStrayDollar({ code, sql }) ? null : { code, searchable }
}
