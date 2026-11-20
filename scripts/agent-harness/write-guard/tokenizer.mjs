// ---------------------------------------------------------------------------
// tokenizer — the write guard's reader of a Bash command: a shell parser,
// not a pattern, so a redirect, a quote or a substitution is read as Bash
// reads it.
//
//   script  = [{ type: 'cmd', words, redirects, op } | { type: 'group', ... }]
//   word    = { parts, raw }   part = { lit, quoted } | { param, op, alt }
//                                   | { sub } | { safe, subs } | { process, sub }
//
// `op` is the operator FOLLOWING the item: `|` means it feeds the next one.
// A here-doc's body lands on its redirect once the line that opens it ends.
// What it cannot read throws scan.mjs's `unreadable` error; `deep` marks
// one past the nesting cap, which would cost more than the hook's timeout.
// `case` is read by tokenizer.case.mjs. Backslash-newlines are removed first,
// by continuations.mjs.
//
// Ported from the tokenizer of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import { ANSI_BODY, repeat, UNKNOWN, unreadable } from './scan.mjs'
import { CASE_START, createCaseReader } from './tokenizer.case.mjs'

export const KEYWORDS = new Set([
  '!',
  '{',
  '}',
  'do',
  'done',
  'elif',
  'else',
  'esac',
  'fi',
  'if',
  'then',
  'time',
  'until',
  'while'
])

const WORD_END = /[\s;&|<>()]/
const BLANKS = /(?:[ \t\r]|\\\n)*/y
const PLAIN_WORD = /[^\s;&|<>()\\'"$`]+/y
const PLAIN_DOUBLE = /[^"\\$`]+/y
const BACKTICK_BODY = /((?:[^`\\]|\\[\s\S])*)`/y
const REDIRECT = /(\d*)(&>>|&>|>>|>\||>&|<<<|<<-|<<|<>|<&|>|<)/y
const DUP_TARGET = /(?:\d+|-)(?=[\s;&|)]|$)/y
const ARITHMETIC_OPEN = '$(('
const MAX_NESTING = 32
const BRACED =
  /^([A-Za-z_]\w*|\d+|[@*#?$!-])(?:(:?[-=+?]|%%?|##?|\/\/?|\^\^?|,,?|:)([\s\S]*))?$/

export const createParser = ({ depth = 0, source }) => {
  const s = source
  const pending = []
  let i = 0
  let level = depth

  const sticky = ({ pattern }) => {
    pattern.lastIndex = i
    const match = pattern.exec(s)
    if (match) i = pattern.lastIndex
    return match
  }

  const skipBlanks = () => {
    sticky({ pattern: BLANKS })
  }

  const skipComment = () => {
    const newline = s.indexOf('\n', i)
    i = newline < 0 ? s.length : newline
  }

  const atComment = () =>
    s[i] === '#' && (i === 0 || /[\s;&|()]/.test(s[i - 1]))

  const readHeredocs = () => {
    for (const doc of pending.splice(0)) {
      const lines = []
      let closed = false
      repeat({
        bound: s.length,
        step: () => {
          if (i >= s.length) return false
          const newline = s.indexOf('\n', i)
          const end = newline < 0 ? s.length : newline
          const line = s.slice(i, end).replace(/\r$/, '')
          i = end + 1
          closed =
            (doc.strip ? line.replace(/^\t+/, '') : line) === doc.delimiter
          if (!closed) lines.push(line)
          return !closed
        }
      })
      if (!closed) unreadable({ problem: 'an unterminated here-doc' })
      doc.heredoc.body = lines.join('\n')
    }
  }

  const parseBacktick = () => {
    BACKTICK_BODY.lastIndex = i + 1
    const match = BACKTICK_BODY.exec(s)
    if (!match) return unreadable({ problem: 'an unterminated backtick' })
    i = BACKTICK_BODY.lastIndex
    const inner = match[1].replace(/\\([`\\$])/g, '$1')
    return {
      sub: createParser({ depth: level, source: inner }).parseAll()
    }
  }

  // `$(( ... ))` evaluates to a number, but a `$(...)`, a backtick or a
  // nested `$((` inside it still runs: `subs` keeps those for the judge.
  const parseArithmetic = () => {
    const subs = []
    let nested = 0
    let j = i + ARITHMETIC_OPEN.length
    let closed = false
    repeat({
      bound: s.length,
      step: () => {
        if (j >= s.length) return false
        if (s[j] === '$' && s[j + 1] === '(') {
          i = j
          if (s.startsWith(ARITHMETIC_OPEN, j)) {
            subs.push(...parseArithmetic().subs)
          } else {
            i += 2
            subs.push(parseList({ closer: ')' }))
          }
          j = i
          return true
        }
        if (s[j] === '`') {
          i = j
          subs.push(parseBacktick().sub)
          j = i
          return true
        }
        if (s[j] === ')' && nested === 0) {
          closed = s[j + 1] === ')'
          return false
        }
        if (s[j] === '(') nested += 1
        if (s[j] === ')') nested -= 1
        j += 1
        return true
      }
    })
    if (!closed) unreadable({ problem: 'an unterminated $((' })
    i = j + 2
    return { safe: true, subs }
  }

  const parseBraced = () => {
    const end = s.indexOf('}', i + 2)
    if (end < 0) unreadable({ problem: 'an unterminated ${' })
    const inner = s.slice(i + 2, end)
    i = end + 1
    const match = BRACED.exec(inner)
    return match
      ? { alt: match[3] ?? '', op: match[2] ?? '', param: match[1] }
      : { alt: '', op: '?', param: UNKNOWN }
  }

  const parseDollar = ({ parts, quoted }) => {
    const next = s[i + 1]
    if (s.startsWith(ARITHMETIC_OPEN, i)) {
      parts.push(parseArithmetic())
    } else if (next === '(') {
      i += 2
      parts.push({ sub: parseList({ closer: ')' }) })
    } else if (next === '{') {
      parts.push(parseBraced())
    } else if (next === "'" && !quoted) {
      ANSI_BODY.lastIndex = i + 2
      const match = ANSI_BODY.exec(s)
      if (!match) unreadable({ problem: 'an unterminated quote' })
      parts.push({ lit: match?.[1] ?? '', quoted: true })
      i = ANSI_BODY.lastIndex
    } else {
      const name = /^(?:[A-Za-z_]\w*|[\d@*#?$!-])/.exec(s.slice(i + 1))
      if (name) {
        parts.push({ alt: '', op: '', param: name[0] })
        i += 1 + name[0].length
      } else {
        parts.push({ lit: '$', quoted })
        i += 1
      }
    }
  }

  // Inside double quotes, or a whole here-doc body when `toEnd` is set.
  const parseDouble = ({ parts, toEnd }) => {
    let text = ''
    let closed = toEnd
    const flush = () => {
      parts.push({ lit: text, quoted: true })
      text = ''
    }
    repeat({
      bound: s.length,
      step: () => {
        if (i >= s.length) return false
        const c = s[i]
        if (c === '"' && !toEnd) {
          i += 1
          closed = true
          return false
        }
        if (c === '\\') {
          const next = s[i + 1] ?? ''
          text += '$`"\\\n'.includes(next)
            ? next.replace('\n', '')
            : c + next
          i += 2
        } else if (c === '$') {
          flush()
          parseDollar({ parts, quoted: true })
        } else if (c === '`') {
          flush()
          parts.push(parseBacktick())
        } else {
          text += sticky({ pattern: PLAIN_DOUBLE })?.[0] ?? ''
        }
        return true
      }
    })
    if (!closed) unreadable({ problem: 'an unterminated quote' })
    flush()
  }

  const parseWord = () => {
    const start = i
    const parts = []
    let text = ''
    const flush = () => {
      if (text !== '') parts.push({ lit: text, quoted: false })
      text = ''
    }
    repeat({
      bound: s.length,
      step: () => {
        if (i >= s.length) return false
        const c = s[i]
        if (c === '(' && /^[A-Za-z_]\w*\+?=$/.test(text)) {
          // An array assignment, `a=(1 2)`: kept as one opaque literal.
          const end = s.indexOf(')', i)
          if (end < 0) unreadable({ problem: 'an unterminated array' })
          text += s.slice(i, end + 1)
          i = end + 1
        } else if (WORD_END.test(c)) {
          return false
        } else if (c === '\\') {
          if (s[i + 1] !== '\n') text += s[i + 1] ?? ''
          i += 2
        } else if (c === "'") {
          const end = s.indexOf("'", i + 1)
          if (end < 0) unreadable({ problem: 'an unterminated quote' })
          flush()
          parts.push({ lit: s.slice(i + 1, end), quoted: true })
          i = end + 1
        } else if (c === '"') {
          flush()
          i += 1
          parseDouble({ parts, toEnd: false })
        } else if (c === '$') {
          flush()
          parseDollar({ parts, quoted: false })
        } else if (c === '`') {
          flush()
          parts.push(parseBacktick())
        } else {
          text += sticky({ pattern: PLAIN_WORD })?.[0] ?? ''
        }
        return true
      }
    })
    flush()
    return { parts, raw: s.slice(start, i) }
  }

  const processSubstitution = () => {
    if (!((s[i] === '<' || s[i] === '>') && s[i + 1] === '(')) {
      return undefined
    }
    const start = i
    i += 2
    const sub = parseList({ closer: ')' })
    return { parts: [{ process: true, sub }], raw: s.slice(start, i) }
  }

  const parseRedirect = () => {
    if ((s[i] === '<' || s[i] === '>') && s[i + 1] === '(')
      return undefined
    const match = sticky({ pattern: REDIRECT })
    if (!match) return undefined
    const [, fd, op] = match
    skipBlanks()
    if (op === '<<' || op === '<<-') {
      const delimiter = parseWord()
      const heredoc = { body: '', expand: !/["'\\]/.test(delimiter.raw) }
      pending.push({
        delimiter: delimiter.parts.map((part) => part.lit ?? '').join(''),
        heredoc,
        strip: op === '<<-'
      })
      return { fd, heredoc, op }
    }
    if ((op === '>&' || op === '<&') && sticky({ pattern: DUP_TARGET })) {
      return { fd, op: 'dup' }
    }
    const target = processSubstitution() ?? parseWord()
    if (target.parts.length === 0) {
      unreadable({ problem: `a ${op} with no target` })
    }
    return { fd, op: op === '>&' ? '&>' : op, target }
  }

  const parseParenthesis = ({ redirects, words }) => {
    if (words.length === 1 && s[i + 1] === ')') {
      // `name()`: a function definition; its body follows as commands.
      i += 2
      return { op: '', redirects, type: 'cmd', words: [] }
    }
    // A subshell may follow `do`, `then` or `!`; anything else is not shell
    // syntax (bash refuses an unquoted `app/(group)/x.tsx` too).
    if (
      words.some((word) => !KEYWORDS.has(word.raw)) ||
      redirects.length > 0
    ) {
      unreadable({ problem: 'an unexpected parenthesis' })
    }
    i += 1
    return {
      op: '',
      redirects,
      script: parseList({ closer: ')' }),
      type: 'group'
    }
  }

  const parseCommand = () => {
    const words = []
    const redirects = []
    let group
    repeat({
      bound: s.length,
      step: () => {
        skipBlanks()
        if (i >= s.length) return false
        const c = s[i]
        const before = i
        if (atComment()) skipComment()
        else if ('\n;|)'.includes(c) || (c === '&' && s[i + 1] !== '>')) {
          return false
        } else if (c === '(') {
          group = parseParenthesis({ redirects, words })
          return false
        } else if (words[0]?.raw === '[[' && (c === '<' || c === '>')) {
          i += 1
        } else {
          const redirect = parseRedirect()
          if (redirect) redirects.push(redirect)
          else words.push(processSubstitution() ?? parseWord())
        }
        if (i === before) unreadable({ problem: `an unexpected ${c}` })
        return true
      }
    })
    return group ?? { op: '', redirects, type: 'cmd', words }
  }

  // `closer` is '' at the top, ')' inside `$(` or `(`, and 'case' inside an
  // arm, which ends at `;;` (consumed) or at `esac` (left for the case
  // reader).
  const parseList = ({ closer }) => {
    const items = []
    let closed = false
    level += 1
    if (level > MAX_NESTING) {
      unreadable({
        deep: true,
        problem: `substitutions or groups nested deeper than ${MAX_NESTING}`
      })
    }
    const follow = ({ op }) => {
      const last = items.at(-1)
      if (last) last.op = op
    }
    repeat({
      bound: s.length,
      step: () => {
        skipBlanks()
        if (i >= s.length) return false
        const c = s[i]
        const two = s.slice(i, i + 2)
        if (c === ')') {
          if (closer !== ')') unreadable({ problem: 'an unbalanced )' })
          i += 1
          closed = true
          return false
        }
        if (closer === 'case' && cases.atArmEnd()) {
          closed = true
          return false
        }
        if (c === '\n') {
          i += 1
          follow({ op: ';' })
          readHeredocs()
        } else if (atComment()) skipComment()
        else if (c === ';') {
          i += two === ';;' ? 2 : 1
          follow({ op: ';' })
        } else if (two === '&&' || two === '||' || two === '|&') {
          i += 2
          follow({ op: two })
        } else if (c === '|' || (c === '&' && s[i + 1] !== '>')) {
          i += 1
          follow({ op: c })
        } else if (sticky({ pattern: CASE_START })) {
          items.push(cases.parseCase())
        } else {
          const before = i
          items.push(parseCommand())
          if (i === before) unreadable({ problem: `an unexpected ${c}` })
        }
        return true
      }
    })
    if (closer && !closed) {
      unreadable({
        problem:
          closer === 'case'
            ? 'an unterminated case'
            : 'an unterminated $( or ('
      })
    }
    level -= 1
    return items
  }

  // What the case reader sees of this parser: the cursor and the readers
  // it shares.
  const cases = createCaseReader({
    cursor: {
      atComment,
      get at() {
        return i
      },
      set at(value) {
        i = value
      },
      parseList,
      parseWord,
      readHeredocs,
      skipBlanks,
      skipComment,
      source: s,
      sticky
    }
  })

  const parseAll = () => {
    const script = parseList({ closer: '' })
    if (pending.length > 0)
      unreadable({ problem: 'an unterminated here-doc' })
    return script
  }

  const parseExpanding = () => {
    const parts = []
    parseDouble({ parts, toEnd: true })
    return parts
  }

  return { parseAll, parseExpanding }
}
