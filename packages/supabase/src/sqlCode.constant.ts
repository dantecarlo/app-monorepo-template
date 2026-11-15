// The lexical tokens of SQL that are not code: a dollar-quoted body (tag in group 1, body in
// group 2), a line comment, a block comment and a single-quoted string literal. One pattern,
// so whichever token starts first in the text wins, as it does for the Postgres lexer.
export const SQL_NON_CODE_TOKEN_PATTERN =
  /\$([A-Za-z_][A-Za-z0-9_]*)?\$([\s\S]*?)\$\1\$|--[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^']|'')*'/g

export const SQL_DOLLAR = '$'
export const SQL_QUOTE = "'"
export const SQL_EMPTY_STRING = "''"
export const SQL_BLANK = ' '
