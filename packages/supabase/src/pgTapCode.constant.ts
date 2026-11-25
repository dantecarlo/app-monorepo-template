// The tokens of a pgTAP file that are not code, read as the Postgres lexer reads them
// (src/backend/parser/scan.l): a `--` comment ends at `\n` or `\r`; `/* */` comments nest;
// a double-quoted identifier doubles its `"`; a string doubles its `'`, and an escape
// string (`E'...'`, the `E` starting a token) also escapes with a backslash; a dollar
// quote's tag is letters, digits, `_` and non-ASCII characters, never starting with a
// digit, and a `$` right after an identifier character belongs to the identifier.
export const LINE_COMMENT = '--'
export const LINE_COMMENT_END = /[\r\n]/
// A string continues past whitespace that holds a newline, `--` comments included before
// and after it, into the next `'`, in the same mode (scan.l `quotecontinue`).
export const NEWLINE = /^[\r\n]$/
export const HORIZONTAL_SPACE = /^[ \t\f\v]$/
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

// Every character of a token but its line breaks, which both views keep.
export const NOT_LINE_BREAK = /[^\r\n]/g
