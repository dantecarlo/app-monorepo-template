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

/**
 * Throws the error of a command the guard cannot read. `deep` marks one
 * past the nesting cap, which would cost more than the hook's timeout.
 */
export const unreadable = ({ deep = false, problem }) => {
  throw Object.assign(new Error(problem), { deep, unreadable: true })
}

// Runs `step` until it returns false. Each step consumes at least one
// character, so `bound` steps always suffice: no input can loop the hook
// past its timeout.
export const repeat = ({ bound, step }) => {
  Iterator.from({ next: () => ({ done: false, value: 0 }) })
    .take(bound + 1)
    .some(() => !step())
}
