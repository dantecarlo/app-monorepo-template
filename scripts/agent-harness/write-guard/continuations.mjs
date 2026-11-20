// ---------------------------------------------------------------------------
// continuations — removes every backslash-newline Bash removes before it
// reads a command: outside single quotes, `$'...'`, comments and quoted
// here-doc bodies. The tokenizer then reads `tou\<newline>ch` as touch and
// `$\<newline>(` as a substitution, as Bash runs them.
//
// A continuation that splits an opener (`$(`, `$'`, `$((` or `<<`) is not
// read: `split` records it, and the guard treats the command as one it
// cannot read.
//
// Ported from `joinContinuations` of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import { ANSI_BODY, repeat } from './scan.mjs'

// A here-doc opener: `<<` or `<<-`, never `<<<`, and the delimiter word.
const HEREDOC_OPEN =
  /<<(-?)[ \t]*((?:[^\s;&|<>()'"\\]|\\.|'[^']*'|"(?:[^"\\]|\\.)*")+)/y

const CONTINUATION = '\\\n'
// The longest opener prefix a continuation can split: the `$(` of `$((`.
const OPENER_PREFIX_CHARS = 2

const endsContinued = ({ line }) => /(?:^|[^\\])(?:\\\\)*\\$/.test(line)

// The lines of one here-doc body, from `at` up to and including its
// delimiter line. An unquoted body drops its line continuations before the
// delimiter is compared, as Bash reads it; a quoted body is kept byte for
// byte.
const heredocBody = ({ at, doc, source }) => {
  const out = []
  let i = at
  repeat({
    bound: source.length,
    step: () => {
      if (i >= source.length) return false
      let newline = source.indexOf('\n', i)
      let line = source.slice(i, newline < 0 ? source.length : newline)
      repeat({
        bound: source.length,
        step: () => {
          if (
            doc.quoted ||
            newline < 0 ||
            !endsContinued({ line: line.replace(/\r$/, '') })
          ) {
            return false
          }
          const next = source.indexOf('\n', newline + 1)
          line =
            line.replace(/\r?$/, '').slice(0, -1) +
            source.slice(newline + 1, next < 0 ? source.length : next)
          newline = next
          return true
        }
      })
      i = newline < 0 ? source.length : newline + 1
      out.push(line + (newline < 0 ? '' : '\n'))
      const bare = line.replace(/\r$/, '')
      return (
        (doc.strip ? bare.replace(/^\t+/, '') : bare) !== doc.delimiter
      )
    }
  })
  return { end: i, text: out.join('') }
}

/**
 * The command with its line continuations removed, `text`, and `split`,
 * true when a continuation splits an opener.
 */
export const joinContinuations = ({ source }) => {
  let out = ''
  let i = 0
  const pending = []
  // One frame per nesting level. `code` is a command context, where quotes
  // open and comments start; `"` is a double-quoted span, which a `$(` or a
  // backtick leaves for a new code frame, since quotes start over inside a
  // substitution. `closer` names what ends a code frame opened inside
  // another context, and `depth` counts its own parentheses.
  const frames = [{ closer: null, depth: 0, kind: 'code' }]
  const top = () => frames.at(-1)
  const copy = (stop) => {
    out += source.slice(i, stop)
    i = stop
    return true
  }
  const openSubstitution = () => {
    const tick = source[i] === '`'
    frames.push({ closer: tick ? '`' : ')', depth: 0, kind: 'code' })
    return copy(i + (tick ? 1 : 2))
  }
  const inDouble = () => {
    const c = source[i]
    if (c === '"') {
      frames.pop()
      return copy(i + 1)
    }
    if ((c === '$' && source[i + 1] === '(') || c === '`') {
      return openSubstitution()
    }
    return copy(i + 1)
  }
  const inCode = () => {
    const c = source[i]
    const frame = top()
    if (c === "'") {
      const end = source.indexOf("'", i + 1)
      return copy(end < 0 ? source.length : end + 1)
    }
    if (c === '$' && source[i + 1] === "'") {
      ANSI_BODY.lastIndex = i + 2
      const match = ANSI_BODY.exec(source)
      return copy(match ? ANSI_BODY.lastIndex : source.length)
    }
    if (c === '"') {
      frames.push({ closer: null, depth: 0, kind: '"' })
      return copy(i + 1)
    }
    if (c === '`' && frame.closer === '`') {
      frames.pop()
      return copy(i + 1)
    }
    if ((c === '$' && source[i + 1] === '(') || c === '`') {
      return openSubstitution()
    }
    if (c === '(') frame.depth += 1
    if (c === ')') {
      if (frame.depth > 0) frame.depth -= 1
      else if (frame.closer === ')') frames.pop()
    }
    if (c === '#' && (i === 0 || /[\s;&|()]/.test(source[i - 1]))) {
      const newline = source.indexOf('\n', i)
      return copy(newline < 0 ? source.length : newline)
    }
    if (c === '<' && source[i + 1] === '<' && source[i + 2] !== '<') {
      HEREDOC_OPEN.lastIndex = i
      const match = HEREDOC_OPEN.exec(source)
      if (match) {
        pending.push({
          delimiter: match[2].replace(/\\(.)|['"]/g, '$1'),
          quoted: /['"\\]/.test(match[2]),
          strip: match[1] === '-'
        })
        return copy(HEREDOC_OPEN.lastIndex)
      }
    }
    copy(i + 1)
    if (c === '\n') {
      for (const doc of pending.splice(0)) {
        const body = heredocBody({ at: i, doc, source })
        out += body.text
        i = body.end
      }
    }
    return true
  }
  // A continuation inside `$(`, `$'`, `$((` or `<<` is not read: `split`
  // records it, and the caller refuses the command.
  let split = false
  const nextAfterJoins = (at) =>
    source.slice(at).replace(/^(?:\\\n)+/, '')[0] ?? ''
  const splitsOpener = () => {
    const next = nextAfterJoins(i + CONTINUATION.length)
    const tail = out.slice(-OPENER_PREFIX_CHARS)
    const last = tail.at(-1)
    const before = tail.length === OPENER_PREFIX_CHARS ? tail[0] : ''
    return (
      (last === '$' && (next === '(' || next === "'")) ||
      (last === '<' && next === '<') ||
      (before === '$' && last === '(' && next === '(')
    )
  }
  repeat({
    bound: source.length,
    step: () => {
      if (i >= source.length) return false
      if (source[i] === '\\') {
        if (source[i + 1] === '\n') split = split || splitsOpener()
        else out += source.slice(i, i + 2)
        i += 2
        return true
      }
      return top().kind === '"' ? inDouble() : inCode()
    }
  })
  return { split, text: out }
}
