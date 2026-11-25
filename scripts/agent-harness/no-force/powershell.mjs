// ---------------------------------------------------------------------------
// powershell — the force option a PowerShell command passes, for the LAW
// "A force option is never used" (AGENTS.md). The write guard does not
// parse PowerShell, so this is a small reader of its own: the statements of
// a command, each the texts of its words, then forms.mjs on each one.
//
// A statement ends at `;`, `|`, `&` (and `&&`, `||`, the call operator) and
// a line end; a script block, a group or a subexpression (`{ }`, `( )`,
// `$( )`, `@( )`, `@{ }`) holds statements of its own, after which the
// outer statement goes on. A single-quoted string doubles its quote (`''`),
// a double-quoted one escapes with a backtick and doubles its quote too,
// and its `$( )` is read as statements. A backtick escapes outside quotes,
// and before a line end continues the line. `#` starts a comment at a
// word's start and `<# #>` is a block comment. A here-string's body
// (`@' '@`, `@" "@`) is text. A redirection's stream (`2>`, `*>&1`) is no
// word.
//
// Not read: a parameter abbreviated (`-Fo`), a splatted hashtable
// (`@{ Force = $true }`) and a variable's value.
// ---------------------------------------------------------------------------

import { forceOf } from './forms.mjs'

// What a part the hook cannot know (a here-string, a subexpression inside
// a string) reads as, so it never completes an option.
const UNKNOWN_PART = '\u0000'
const BLANKS = new Set([' ', '\t', '\r'])
const SEPARATORS = new Set([';', '|', '&', '\n'])
const OPENERS = new Set(['(', '{'])
const CLOSERS = new Set([')', '}'])
const PREFIXED_OPENERS = new Set(['$', '@'])
const STREAM = /^[\d*]$/u
const DIGIT = /^\d$/u
const HERE_STRING_OPEN = /@(['"])[ \t]*\r?\n/uy
const QUOTES = new Set(["'", '"'])

const lineEnd = ({ from, source }) => {
  const at = source.indexOf('\n', from)
  return at < 0 ? source.length : at
}

const blockCommentEnd = ({ from, source }) => {
  const at = source.indexOf('#>', from + 2)
  return at < 0 ? source.length : at + 2
}

// Where the here-string opened at `from` ends, or undefined when `from`
// opens none.
const hereStringEnd = ({ from, source }) => {
  HERE_STRING_OPEN.lastIndex = from
  const open = HERE_STRING_OPEN.exec(source)
  if (open === null) return undefined
  const closer = `\n${open[1]}@`
  const at = source.indexOf(closer, HERE_STRING_OPEN.lastIndex - 1)
  return at < 0 ? source.length : at + closer.length
}

const readSingle = ({ from, source }) => {
  let text = ''
  let at = from + 1
  while (at < source.length) {
    if (source[at] === "'") {
      if (source[at + 1] !== "'") return { end: at + 1, text }
      text += "'"
      at += 2
    } else {
      text += source[at]
      at += 1
    }
  }
  return { end: at, text }
}

// The `)` that closes the `(` at `from`, past the quotes inside.
const matchingParen = ({ from, source }) => {
  let depth = 0
  let at = from
  while (at < source.length) {
    const c = source[at]
    if (QUOTES.has(c)) {
      const close = source.indexOf(c, at + 1)
      at = close < 0 ? source.length : close + 1
    } else {
      if (c === '(') depth += 1
      if (c === ')') {
        depth -= 1
        if (depth === 0) return at
      }
      at += 1
    }
  }
  return source.length
}

const readDouble = ({ from, read, source }) => {
  let text = ''
  let at = from + 1
  const nested = []
  while (at < source.length) {
    const c = source[at]
    if (c === '`') {
      text += source[at + 1] ?? ''
      at += 2
    } else if (c === '"') {
      if (source[at + 1] !== '"') return { end: at + 1, nested, text }
      text += '"'
      at += 2
    } else if (c === '$' && source[at + 1] === '(') {
      const close = matchingParen({ from: at + 1, source })
      nested.push(...read({ command: source.slice(at + 2, close) }))
      text += UNKNOWN_PART
      at = close + 1
    } else {
      text += c
      at += 1
    }
  }
  return { end: at, nested, text }
}

// The cursor past a redirection operator at `from`: `>`, `>>` and a merge
// into another stream, `>&1`.
const redirectEnd = ({ from, source }) => {
  let at = from + 1
  if (source[at] === '>') at += 1
  if (source[at] === '&' && DIGIT.test(source[at + 1] ?? '')) at += 2
  return at
}

/** The statements of the PowerShell `command`, each its words' texts. */
export const statementsOf = ({ command }) => {
  const source = command
  const statements = []
  const outer = []
  let current = []
  let word = null
  const start = () => {
    current = []
    statements.push(current)
  }
  const endWord = () => {
    if (word !== null) current.push(word)
    word = null
  }
  const append = ({ text }) => {
    word = (word ?? '') + text
  }
  const open = () => {
    endWord()
    outer.push(current)
    start()
  }
  const close = () => {
    endWord()
    if (outer.length > 0) current = outer.pop()
    else start()
  }
  statements.push(current)
  let at = 0
  while (at < source.length) {
    const c = source[at]
    const next = source[at + 1]
    const hereEnd =
      c === '@' && word === null
        ? hereStringEnd({ from: at, source })
        : undefined
    if (BLANKS.has(c)) {
      endWord()
      at += 1
    } else if (c === '`') {
      if (next === '\r' && source[at + 2] === '\n') at += 3
      else {
        if (next !== '\n' && next !== undefined) append({ text: next })
        at += 2
      }
    } else if (c === '#' && word === null) {
      at = lineEnd({ from: at, source })
    } else if (c === '<' && next === '#') {
      endWord()
      at = blockCommentEnd({ from: at, source })
    } else if (hereEnd !== undefined) {
      append({ text: UNKNOWN_PART })
      at = hereEnd
    } else if (c === "'") {
      const read = readSingle({ from: at, source })
      append({ text: read.text })
      at = read.end
    } else if (c === '"') {
      const read = readDouble({ from: at, read: statementsOf, source })
      append({ text: read.text })
      statements.push(...read.nested)
      at = read.end
    } else if (c === '$' && next === '{') {
      const brace = source.indexOf('}', at)
      const end = brace < 0 ? source.length : brace + 1
      append({ text: source.slice(at, end) })
      at = end
    } else if (PREFIXED_OPENERS.has(c) && OPENERS.has(next)) {
      open()
      at += 2
    } else if (OPENERS.has(c)) {
      open()
      at += 1
    } else if (CLOSERS.has(c)) {
      close()
      at += 1
    } else if (SEPARATORS.has(c)) {
      endWord()
      start()
      at += 1
    } else if (c === '>') {
      if (word !== null && STREAM.test(word)) word = null
      endWord()
      at = redirectEnd({ from: at, source })
    } else {
      append({ text: c })
      at += 1
    }
  }
  endWord()
  return statements.filter((words) => words.length > 0)
}

/** The force option the PowerShell `command` passes, or undefined. */
export const powershellForce = ({ command }) => {
  for (const words of statementsOf({ command })) {
    const found = forceOf({ words })
    if (found !== undefined) return found
  }
  return undefined
}
