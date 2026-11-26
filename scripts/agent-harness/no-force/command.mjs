// ---------------------------------------------------------------------------
// command — the force or skip a Bash or PowerShell command passes, for the
// LAW "A check is never forced or skipped" (AGENTS.md). bash.mjs and
// powershell.mjs read the command; this judges what they read:
//
//   - every simple command, by forms.mjs: those of a list, a pipeline, a
//     group, a function body, a compound command and every substitution
//     (`$( )`, backticks, `<( )`, `$(( ))`), which Bash runs wherever it
//     stands, inside double quotes too; in PowerShell every statement of
//     a script block, a group and a subexpression;
//   - a failure swallowed by `|| true` or `|| :` (any path to `true`);
//   - the command a wrapper runs inside one (inner.mjs: `eval`, `sh -c`,
//     `pwsh -Command`, `Invoke-Expression`, `find -exec`, `fd -x`,
//     `xargs`), and a here-doc, a here-string or a pipe of `cat`, `echo`
//     or `printf` fed to a shell (the write guard's stdinCode), judged in
//     its own language as the outer one is;
//   - PowerShell's `[Environment]::SetEnvironmentVariable('HUSKY','0')`.
//
// A command nested deeper than MAX_NESTING levels of commands inside
// commands, or past the tokenizer's own cap, is { unreadable }, which the
// hook refuses: reading on would cost more than the hook's timeout, and
// letting it through would let a force hide at the bottom.
//
// Not read as commands: a word whose quoted span holds several words (a
// commit message), a here-doc's body unless a shell reads it, a variable's
// value, and the words forms.mjs reads as text.
// ---------------------------------------------------------------------------

import { stdinCode } from '../write-guard/inline-code.mjs'
import { commandName } from '../write-guard/shell.commands.mjs'
import { SHELLS } from '../write-guard/shell.programs.mjs'
import { commandStart } from '../write-guard/tokenizer.mjs'
import { bashScript } from './bash.mjs'
import {
  forceOf,
  huskyCallForce,
  LANGUAGE,
  programLabel
} from './forms.mjs'
import { innerOf } from './inner.mjs'
import { readStatements } from './powershell.mjs'

/** How many levels of commands inside commands the hook reads. */
export const MAX_NESTING = 16

const TOO_DEEP = {
  unreadable: `commands nested deeper than ${MAX_NESTING} levels`
}

// What a part the hook cannot know (a variable, a substitution) reads as,
// so it never completes an option.
const UNKNOWN_PART = '\u0000'
const OR = '||'
const PIPES = new Set(['|', '|&'])
const SUCCEEDS = new Set([':', 'true'])

const firstFound = ({ items, read }) => {
  for (const item of items) {
    const found = read(item)
    if (found !== undefined) return found
  }
  return undefined
}

const textOf = ({ word }) =>
  word.parts
    .map((part) => ('lit' in part ? part.lit : UNKNOWN_PART))
    .join('')

// The words of a tokenizer command that are its own, as texts.
const ownTexts = ({ item }) =>
  item.words
    .slice(commandStart({ words: item.words }))
    .map((word) => textOf({ word }))

// The scripts a word runs: its substitutions, those inside `$(( ))` too.
const scriptsOf = ({ word }) =>
  word.parts.flatMap((part) =>
    'sub' in part ? [part.sub] : (part.subs ?? [])
  )

const wordsOfItem = ({ item }) => [
  ...(item.words ?? []),
  ...item.redirects.flatMap(({ target }) =>
    target === undefined ? [] : [target]
  )
]

/** The force or skip the `command`, read in `language`, passes. */
export const commandForce = ({ command, depth = 0, language }) =>
  language === LANGUAGE.powershell
    ? powershellForce({ command, depth })
    : bashForce({ command, depth })

// One simple command's own words, then each command a wrapper in it runs.
const wordsForce = ({ depth, language, words }) => {
  if (depth > MAX_NESTING) return TOO_DEEP
  const { inner, own } = innerOf({ words })
  return (
    forceOf({ language, words: own }) ??
    firstFound({
      items: inner,
      read: (one) =>
        one.words === undefined
          ? commandForce({
              command: one.text,
              depth: depth + 1,
              language: one.language
            })
          : wordsForce({ depth: depth + 1, language, words: one.words })
    })
  )
}

// `cmd || true`: the failure of `previous` is swallowed by the command
// whose own words are `texts`.
const swallowed = ({ previous, texts }) => {
  if (previous?.op !== OR || texts.length === 0) return undefined
  if (!SUCCEEDS.has(commandName({ arg: { text: texts[0] } }))) {
    return undefined
  }
  return {
    option: `${OR} ${texts[0]}`,
    program:
      previous.type === 'cmd'
        ? programLabel({ words: ownTexts({ item: previous }) })
        : 'a group'
  }
}

// The text a shell reads from its stdin: a here-doc, a here-string, or
// what `cat`, `echo` or `printf` pipe into it.
const fedForce = ({ depth, item, previous, texts }) => {
  const name =
    texts.length > 0 ? commandName({ arg: { text: texts[0] } }) : ''
  if (!SHELLS.has(name) || texts.slice(1).some((t) => !t.startsWith('-'))) {
    return undefined
  }
  const fed = stdinCode({
    command: item,
    producer: PIPES.has(previous?.op ?? '') ? previous : undefined
  })
  return typeof fed?.text === 'string'
    ? bashForce({ command: fed.text, depth: depth + 1 })
    : undefined
}

const scriptForce = ({ depth, script }) => {
  if (depth > MAX_NESTING) return TOO_DEEP
  return firstFound({
    items: [...script.entries()],
    read: ([at, item]) => {
      const previous = script[at - 1]
      const nested = firstFound({
        items: [
          ...wordsOfItem({ item }).flatMap((word) => scriptsOf({ word })),
          ...(item.type === 'group' ? [item.script] : [])
        ],
        read: (inner) => scriptForce({ depth: depth + 1, script: inner })
      })
      if (nested !== undefined || item.type !== 'cmd') return nested
      const texts = ownTexts({ item })
      return (
        wordsForce({ depth, language: LANGUAGE.bash, words: texts }) ??
        swallowed({ previous, texts }) ??
        fedForce({ depth, item, previous, texts })
      )
    }
  })
}

/** The force or skip the Bash `command` passes, or undefined. */
export const bashForce = ({ command, depth = 0 }) => {
  if (depth > MAX_NESTING) return TOO_DEEP
  const read = bashScript({ command })
  return read.script === undefined
    ? { unreadable: read.unreadable }
    : scriptForce({ depth, script: read.script })
}

/** The force or skip the PowerShell `command` passes, or undefined. */
export const powershellForce = ({ command, depth = 0 }) => {
  const read = readStatements({ command })
  if (depth + read.depth > MAX_NESTING) return TOO_DEEP
  return firstFound({
    items: [...read.statements.entries()],
    read: ([at, words]) =>
      wordsForce({ depth, language: LANGUAGE.powershell, words }) ??
      huskyCallForce({ args: read.statements[at + 1] ?? [], call: words })
  })
}
