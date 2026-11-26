// ---------------------------------------------------------------------------
// bash — the option a Bash command passes that forces or skips a check, for
// the LAW "A check is never forced or skipped" (AGENTS.md). The command is
// read as the write guard
// reads it: its line continuations removed (continuations.mjs) and parsed
// by its tokenizer (tokenizer.mjs), never matched as text. Every simple
// command is judged by forms.mjs: those of a list, a pipeline, a group, a
// compound command (`if`, `for`, `case`, a function body) and every
// substitution (`$( )`, backticks, `<( )`, `$(( ))`), which Bash runs
// wherever it stands, inside double quotes too.
//
// Not read as commands: a word whose quoted span holds several words (a
// commit message), a here-doc's body, a variable's value and the words of
// `echo`, `printf`, `grep` and `rg`. A command the tokenizer cannot read is
// let through: Bash refuses most of them itself, and the write guard judges
// the rest.
// ---------------------------------------------------------------------------

import { joinContinuations } from '../write-guard/continuations.mjs'
import { createParser, KEYWORDS } from '../write-guard/tokenizer.mjs'
import { forceOf } from './forms.mjs'

// What a part the hook cannot know (a variable, a substitution) reads as,
// so it never completes an option.
const UNKNOWN_PART = '\u0000'
const TIME = 'time'
const TIME_POSIX = '-p'

const textOf = ({ word }) =>
  word.parts
    .map((part) => ('lit' in part ? part.lit : UNKNOWN_PART))
    .join('')

// Where a command's words start: past its keywords and `time -p`. The
// assignments before it stay, for forms.mjs to read (`HUSKY=0`).
const commandWords = ({ words }) => {
  let at = 0
  while (at < words.length && KEYWORDS.has(words[at].raw)) {
    at +=
      words[at].raw === TIME && words[at + 1]?.raw === TIME_POSIX ? 2 : 1
  }
  return words.slice(at)
}

// The scripts a word runs: its substitutions, those inside `$(( ))` too.
const scriptsOf = ({ word }) =>
  word.parts.flatMap((part) =>
    'sub' in part ? [part.sub] : (part.subs ?? [])
  )

const firstFound = ({ items, read }) => {
  for (const item of items) {
    const found = read(item)
    if (found !== undefined) return found
  }
  return undefined
}

const wordsOfItem = ({ item }) => [
  ...(item.words ?? []),
  ...item.redirects.flatMap(({ target }) =>
    target === undefined ? [] : [target]
  )
]

const scriptForce = ({ script }) =>
  firstFound({
    items: script,
    read: (item) =>
      firstFound({
        items: [
          ...wordsOfItem({ item }).flatMap((word) => scriptsOf({ word })),
          ...(item.type === 'group' ? [item.script] : [])
        ],
        read: (inner) => scriptForce({ script: inner })
      }) ??
      (item.type === 'cmd'
        ? forceOf({
            words: commandWords({ words: item.words }).map((word) =>
              textOf({ word })
            )
          })
        : undefined)
  })

const parsed = ({ command }) => {
  const joined = joinContinuations({ source: command })
  if (joined.split) return undefined
  try {
    return createParser({ source: joined.text }).parseAll()
  } catch (error) {
    if (error?.unreadable) return undefined
    throw error
  }
}

/** The force option the Bash `command` passes, or undefined. */
export const bashForce = ({ command }) => {
  const script = parsed({ command })
  return script === undefined ? undefined : scriptForce({ script })
}
