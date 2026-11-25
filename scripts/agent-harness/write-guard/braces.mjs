// ---------------------------------------------------------------------------
// braces — Bash's brace expansion, done before a command's words are
// judged, as Bash does it before any other expansion: `AGENTS.md{,.bak}` is
// two words, `AGENTS.md` and `AGENTS.md.bak`. A list (`{a,b}`), a sequence
// of numbers or letters (`{1..3}`, `{a..c}`, `{1..9..2}`, `{01..03}`) and
// nesting are read; a brace inside quotes is text, and so is one with no
// comma and no sequence (`{a}`, `{}`).
//
// Only braces inside one unquoted literal part are read. Past
// MAX_BRACE_WORDS words the word cannot be read, and the judge treats it as
// one built from what it cannot see.
// ---------------------------------------------------------------------------

export const MAX_BRACE_WORDS = 256

const NUMBERS = /^(-?\d+)\.\.(-?\d+)(?:\.\.(-?\d+))?$/u
const LETTERS = /^([a-zA-Z])\.\.([a-zA-Z])(?:\.\.(-?\d+))?$/u
const ZERO_PADDED = /^-?0\d/u

// The items of a sequence, or undefined when it holds more than the bound.
const sequenceOf = ({ body }) => {
  const numbers = NUMBERS.exec(body)
  const letters = numbers ? null : LETTERS.exec(body)
  const match = numbers ?? letters
  if (!match) return undefined
  const [from, to] = numbers
    ? [Number(match[1]), Number(match[2])]
    : [match[1].codePointAt(0), match[2].codePointAt(0)]
  const step = Math.abs(Number(match[3] ?? 1)) || 1
  const count = Math.floor(Math.abs(to - from) / step) + 1
  if (count > MAX_BRACE_WORDS) return { overflow: true }
  const width =
    numbers && (ZERO_PADDED.test(match[1]) || ZERO_PADDED.test(match[2]))
      ? Math.max(match[1].length, match[2].length)
      : 0
  const sign = to >= from ? 1 : -1
  return {
    items: Array.from({ length: count }, (_, n) => {
      const value = from + sign * n * step
      return numbers
        ? String(value).padStart(width, '0')
        : String.fromCodePoint(value)
    })
  }
}

// The first brace group of `text` that expands: where it starts and ends,
// and its items (or overflow).
const groupOf = ({ text }) => {
  for (
    let open = text.indexOf('{');
    open >= 0;
    open = text.indexOf('{', open + 1)
  ) {
    let depth = 0
    const commas = []
    for (let i = open; i < text.length; i += 1) {
      const c = text[i]
      if (c === '{') depth += 1
      else if (c === ',' && depth === 1) commas.push(i)
      else if (c === '}') {
        depth -= 1
        if (depth > 0) continue
        const body = text.slice(open + 1, i)
        if (commas.length > 0) {
          const cuts = [open, ...commas, i]
          const items = cuts
            .slice(0, -1)
            .map((cut, k) => text.slice(cut + 1, cuts[k + 1]))
          return { end: i, items, start: open }
        }
        const sequence = sequenceOf({ body })
        if (sequence !== undefined)
          return { end: i, start: open, ...sequence }
        break
      }
    }
  }
  return undefined
}

const expandable = ({ part }) =>
  'lit' in part && part.quoted !== true && part.lit.includes('{')

/**
 * The words `word` expands to, `{ words }`, or `{ overflow: true }` past
 * MAX_BRACE_WORDS. A word with nothing to expand is itself.
 */
export const braceExpand = ({ word }) => {
  const done = []
  const pending = [word]
  while (pending.length > 0) {
    const next = pending.pop()
    const at = next.parts.findIndex(
      (part) =>
        expandable({ part }) && groupOf({ text: part.lit }) !== undefined
    )
    if (at < 0) {
      done.push(next)
      continue
    }
    const { lit } = next.parts[at]
    const group = groupOf({ text: lit })
    if (group.overflow) return { overflow: true }
    const head = lit.slice(0, group.start)
    const tail = lit.slice(group.end + 1)
    const expanded = group.items.map((item) => ({
      parts: next.parts.map((part, k) =>
        k === at ? { lit: `${head}${item}${tail}`, quoted: false } : part
      ),
      raw: next.raw
    }))
    if (done.length + pending.length + expanded.length > MAX_BRACE_WORDS) {
      return { overflow: true }
    }
    pending.push(...expanded.reverse())
  }
  // `{AGENTS.md,}` leaves an empty word, which Bash drops: only an unquoted
  // part can be empty this way, so a word holding a quoted part stays.
  return {
    words: done.filter(
      (next) =>
        next === word ||
        !next.parts.every(
          (part) =>
            'lit' in part && part.quoted !== true && part.lit === ''
        )
    )
  }
}
