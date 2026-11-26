// ---------------------------------------------------------------------------
// scan — what every reader of the write guard's Bash judgement shares: the
// bounded loop each scanner runs, the error a reader throws on a command it
// cannot read, the body of `$'...'`, and the placeholders an expansion
// leaves in a path.
//
// Ported from Certifipago's .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

// A path segment whose text is unknown but holds no slash and no `..`: a
// loop item, `$$`, `$(date +%s)`, the name `mktemp` picks.
export const SAFE = '\u0001'
// Text that could be anything, so a path holding it cannot be judged.
export const UNKNOWN = '\u0002'

// The body of `$'...'`, from just after its opening quote.
export const ANSI_BODY = /((?:[^'\\]|\\[\s\S])*)'/y

const ANSI_SIMPLE = {
  '"': '"',
  "'": "'",
  '?': '?',
  E: '\u001b',
  '\\': '\\',
  a: '\u0007',
  b: '\b',
  e: '\u001b',
  f: '\f',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v'
}
const ANSI_ESCAPE =
  /\\(?:([abeEfnrtv\\'"?])|([0-7]{1,3})|x([0-9a-fA-F]{1,2})|u([0-9a-fA-F]{1,4})|U([0-9a-fA-F]{1,8})|c(.))/gsu
const HEX = 16
const OCTAL = 8
const MAX_CODE_POINT = 0x10ffff
const CONTROL_MASK = 0x1f

const fromCode = ({ code, whole }) =>
  code > MAX_CODE_POINT ? whole : String.fromCodePoint(code)

/** The text of `$'…'`, its escapes decoded as Bash decodes them. */
export const decodeAnsi = ({ text }) =>
  text.replace(
    ANSI_ESCAPE,
    (whole, simple, octal, hex, short, long, control) => {
      if (simple !== undefined) return ANSI_SIMPLE[simple]
      if (octal !== undefined) {
        return fromCode({ code: Number.parseInt(octal, OCTAL), whole })
      }
      const code = hex ?? short ?? long
      if (code !== undefined) {
        return fromCode({ code: Number.parseInt(code, HEX), whole })
      }
      return String.fromCodePoint(control.codePointAt(0) & CONTROL_MASK)
    }
  )

/**
 * Throws the error of a command the guard cannot read. `deep` marks one
 * past the nesting cap, which would cost more than the hook's timeout;
 * `bashRefuses` one bash raises on a lone line too, so that nothing on the
 * line runs (an unterminated quote or backtick, an unbalanced `)`).
 */
export const unreadable = ({ bashRefuses = false, deep = false, problem }) => {
  throw Object.assign(new Error(problem), {
    bashRefuses,
    deep,
    unreadable: true
  })
}

// Runs `step` until it returns false. Each step consumes at least one
// character, so `bound` steps always suffice: no input can loop the hook
// past its timeout.
export const repeat = ({ bound, step }) => {
  Iterator.from({ next: () => ({ done: false, value: 0 }) })
    .take(bound + 1)
    .some(() => !step())
}
