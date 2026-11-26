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

import {
  ANSI_BODY,
  decodeAnsi,
  repeat,
  UNKNOWN,
  unreadable
} from './scan.mjs'
import { CASE_START, createCaseReader } from './tokenizer.case.mjs'

export const KEYWORDS = new Set([
  '!',
  '{',
  '}',
  'coproc',
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

const FUNCTION = 'function'
const COPROC = 'coproc'
const GROUP_OPEN = '{'
const TIME = 'time'
const TIME_POSIX = '-p'

/**
 * Where a simple command's own words start: past the keywords before it,
 * the `-p` of `time -p`, the name `coproc NAME { … }` gives its group, and
 * the `function NAME` that opens a function body, so the body's first
 * command is read as the command.
 */
export const commandStart = ({ words }) => {
  let at = 0
  while (at < words.length) {
    const raw = words[at].raw
    if (raw === FUNCTION) {
      at += 2
    } else if (raw === COPROC && words[at + 2]?.raw === GROUP_OPEN) {
      at += 2
    } else if (KEYWORDS.has(raw)) {
      at += raw === TIME && words[at + 1]?.raw === TIME_POSIX ? 2 : 1
    } else {
      return at
    }
  }
  return words.length
}

// The words before `(` that make it a function's `name()`: one name, or
// `function` and a name.
const isFunctionName = ({ words }) =>
  words.length === 1 ||
  (words.length === 2 && words[0].raw === FUNCTION)

const ARITHMETIC_COMMAND = '(('
const FOR = 'for'
const CONDITION_OPEN = '[['
const CONDITION_CLOSE = ']]'
const REGEX_MATCH = '=~'
const CONDITION_OPERATORS = new Set(['&&', '||'])
const CONDITION_SINGLES = new Set(['(', ')', '<', '>'])
// The text before `(` that opens an extended glob: `!( @( *( +( ?(`.
const EXTGLOB_OPENER = /[!@*+?]$/u

// Whether `((` after `words` starts an arithmetic command: where a command
// starts (past its keywords), or after `for`.
const startsArithmetic = ({ words }) => {
  const at = commandStart({ words })
  return (
    at === words.length || (at === words.length - 1 && words[at].raw === FOR)
  )
}

// Whether the command `words` begin is inside a `[[ … ]]` not yet closed.
const inCondition = ({ words }) =>
  words[commandStart({ words })]?.raw === CONDITION_OPEN &&
  !words.some((word) => word.raw === CONDITION_CLOSE)

// An operator of a condition, kept as a word of its own.
const operatorWord = ({ text }) => ({
  parts: [{ lit: text, quoted: true }],
  raw: text
})

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
    if (!match) {
      return unreadable({
        bashRefuses: true,
        problem: 'an unterminated backtick'
      })
    }
    i = BACKTICK_BODY.lastIndex
    const inner = match[1].replace(/\\([`\\$])/g, '$1')
    return {
      sub: createParser({ depth: level, source: inner }).parseAll()
    }
  }

  // An arithmetic expression from `from` to the `))` that closes it, at
  // depth 0 of its own parentheses: a `$(...)`, a backtick or a nested
  // `$((` inside it still runs, and `subs` keeps those for the judge. On
  // `closed`, the cursor is past the `))`.
  const scanArithmetic = ({ from }) => {
    const subs = []
    let nested = 0
    let j = from
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
    if (closed) i = j + 2
    return { closed, subs }
  }

  // `$(( ... ))` evaluates to a number; its substitutions still run.
  const parseArithmetic = () => {
    const { closed, subs } = scanArithmetic({
      from: i + ARITHMETIC_OPEN.length
    })
    if (!closed) unreadable({ problem: 'an unterminated $((' })
    return { safe: true, subs }
  }

  // `((…))` where a command starts, `for ((…;…;…))` among them: arithmetic,
  // read as a group of the substitutions it runs. A `((` that closes no
  // `))` is two subshells, as bash reads `((cd a); ls)`, and undefined.
  const parseArithmeticCommand = ({ redirects }) => {
    const start = i
    let found
    try {
      found = scanArithmetic({ from: i + ARITHMETIC_COMMAND.length })
    } catch (error) {
      if (!error?.unreadable) throw error
      found = { closed: false }
    }
    if (!found.closed) {
      i = start
      return undefined
    }
    return { op: '', redirects, script: found.subs.flat(), type: 'group' }
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
      if (!match) {
        unreadable({ bashRefuses: true, problem: 'an unterminated quote' })
      }
      parts.push({
        lit: decodeAnsi({ text: match?.[1] ?? '' }),
        quoted: true
      })
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
    if (!closed) {
      unreadable({ bashRefuses: true, problem: 'an unterminated quote' })
    }
    flush()
  }

  // The `(…)` of an extended glob at the cursor, nested ones included.
  const extglobGroup = () => {
    const start = i
    let depth = 0
    repeat({
      bound: s.length,
      step: () => {
        if (i >= s.length) return false
        const c = s[i]
        if (c === '`' || (c === '$' && s[i + 1] === '(')) {
          unreadable({ problem: 'a substitution inside an extended glob' })
        }
        if (c === '(') depth += 1
        if (c === ')') depth -= 1
        i += 1
        return depth > 0
      }
    })
    if (depth > 0) unreadable({ problem: 'an unterminated extended glob' })
    return s.slice(start, i)
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
        if (c === '(' && EXTGLOB_OPENER.test(text)) {
          // An extended glob, `!(a|b)`: kept in its word as a literal.
          text += extglobGroup()
        } else if (c === '(' && /^[A-Za-z_]\w*\+?=$/.test(text)) {
          // An array assignment, `a=(1 2)`: kept as one opaque literal.
          const end = s.indexOf(')', i)
          if (end < 0) unreadable({ problem: 'an unterminated array' })
          text += s.slice(i, end + 1)
          i = end + 1
        } else if (WORD_END.test(c)) {
          return false
        } else if (c === '\\') {
          // An escaped character is quoted: `\*` is no glob, `\~` no home.
          if (s[i + 1] !== '\n' && s[i + 1] !== undefined) {
            flush()
            parts.push({ lit: s[i + 1], quoted: true })
          }
          i += 2
        } else if (c === "'") {
          const end = s.indexOf("'", i + 1)
          if (end < 0) {
            unreadable({ bashRefuses: true, problem: 'an unterminated quote' })
          }
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

  // The regex after `=~` in `[[ … ]]`: its parentheses and `|` are its
  // own, and so is a blank inside its parentheses. Quotes are read as in a
  // word; a substitution inside it is not, and is unreadable.
  const parseRegex = () => {
    const start = i
    let depth = 0
    repeat({
      bound: s.length,
      step: () => {
        if (i >= s.length) return false
        const c = s[i]
        if (depth === 0 && (/\s/u.test(c) || c === ')' || c === ';')) {
          return false
        }
        if (c === '`' || (c === '$' && s[i + 1] === '(')) {
          unreadable({ problem: 'a substitution inside a regex' })
        }
        if (c === '\\') {
          i += 2
        } else if (c === "'" || c === '"') {
          const end = s.indexOf(c, i + 1)
          if (end < 0) {
            unreadable({ bashRefuses: true, problem: 'an unterminated quote' })
          }
          i = end + 1
        } else {
          if (c === '(') depth += 1
          if (c === ')') depth -= 1
          i += 1
        }
        return true
      }
    })
    if (depth > 0) unreadable({ problem: 'an unterminated regex' })
    const raw = s.slice(start, i)
    return { parts: [{ lit: raw, quoted: true }], raw }
  }

  const parseParenthesis = ({ redirects, words }) => {
    if (isFunctionName({ words }) && s[i + 1] === ')') {
      // `name()` or `function name()`: a function definition; its body
      // follows as commands.
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
        const condition = inCondition({ words })
        if (atComment()) skipComment()
        else if (condition && CONDITION_OPERATORS.has(s.slice(i, i + 2))) {
          words.push(operatorWord({ text: s.slice(i, i + 2) }))
          i += 2
        } else if (condition && words.at(-1)?.raw === REGEX_MATCH) {
          words.push(parseRegex())
        } else if (condition && CONDITION_SINGLES.has(c)) {
          words.push(operatorWord({ text: c }))
          i += 1
        } else if ('\n;|)'.includes(c) || (c === '&' && s[i + 1] !== '>')) {
          return false
        } else if (
          c === '(' &&
          s[i + 1] === '(' &&
          redirects.length === 0 &&
          startsArithmetic({ words })
        ) {
          group = parseArithmeticCommand({ redirects })
          if (group === undefined) {
            group = parseParenthesis({ redirects, words })
          }
          return false
        } else if (c === '(') {
          group = parseParenthesis({ redirects, words })
          return false
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
          if (closer !== ')') {
            unreadable({ bashRefuses: true, problem: 'an unbalanced )' })
          }
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
