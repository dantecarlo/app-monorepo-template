// ---------------------------------------------------------------------------
// bash — the script a Bash command runs, read as the write guard reads it:
// its line continuations removed (continuations.mjs) and parsed by its
// tokenizer (tokenizer.mjs), never matched as text. command.mjs judges it.
//
// Bash runs a command one complete line at a time, so every whole line
// before one it cannot parse has run when it stops: `bash -c $'touch m\n
// echo "x'` creates `m`. A command the tokenizer cannot parse is therefore
// read as the longest prefix of its whole lines that parses, and one line
// it cannot parse on its own is no script at all, since Bash refuses the
// whole line. Nesting past the tokenizer's cap is unreadable, which the
// hook refuses, and so is a command whose prefixes cost more than
// PARSE_BUDGET characters to try, since a hook that runs past its timeout
// lets the call through.
// ---------------------------------------------------------------------------

import { joinContinuations } from '../write-guard/continuations.mjs'
import { createParser } from '../write-guard/tokenizer.mjs'

const NEWLINE = '\n'
const SPLIT_OPENER = 'a line continuation splits an opener'
// The characters the prefixes tried may hold in all, about a second of
// parsing: a 1,000-line command cut by an early unclosed quote fits.
export const PARSE_BUDGET = 20_000_000
const TOO_LONG =
  'a command too long to read past a line bash cannot parse'

const parseText = ({ text }) => {
  const joined = joinContinuations({ source: text })
  if (joined.split) return { deep: false, problem: SPLIT_OPENER }
  try {
    return { script: createParser({ source: joined.text }).parseAll() }
  } catch (error) {
    if (!error?.unreadable) throw error
    return { deep: error.deep === true, problem: String(error.message) }
  }
}

/**
 * The script Bash runs for `command`: { script } for what it runs, or
 * { unreadable } when the tokenizer gives up on its nesting.
 */
export const bashScript = ({ command }) => {
  const whole = parseText({ text: command })
  if (whole.script !== undefined) return { script: whole.script }
  if (whole.deep) return { unreadable: whole.problem }
  const lines = command.split(NEWLINE)
  let spent = 0
  for (let end = lines.length - 1; end > 0; end -= 1) {
    const text = lines.slice(0, end).join(NEWLINE)
    spent += text.length
    if (spent > PARSE_BUDGET) return { unreadable: TOO_LONG }
    const prefix = parseText({ text })
    if (prefix.script !== undefined) return { script: prefix.script }
    if (prefix.deep) return { unreadable: prefix.problem }
  }
  return { script: [] }
}
