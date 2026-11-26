// ---------------------------------------------------------------------------
// inner — the commands a wrapper runs inside one simple command, for the
// no-force hook to judge as it judges the outer one, and the words the
// wrapper keeps as its own, which forms.mjs reads for its own options:
//
//   - `eval` and an inner shell's `-c` text (`sh`, `dash`, `zsh`, `bash -lc`),
//     read as Bash;
//   - PowerShell's `-Command` (`-c`, any prefix), the rest of its words, and
//     `-EncodedCommand` (`-e`, `-ec`), decoded; `powershell` with no
//     parameter before its words runs them as a command too; and
//     `Invoke-Expression` (`iex`), read as PowerShell;
//   - the command `find -exec`, `fd -x` and `xargs` run, read as words;
//   - the text `trap` runs on a signal (`trap 'rm -rf x' EXIT`), read as
//     Bash; `trap -` and `trap ''` run none.
//
// The shells and their `-c`, and the readers of find, fd and xargs, are the
// write guard's own (shell.programs.mjs, shell.commands.mjs), so both hooks
// read a wrapper the same way. A here-doc or a pipe fed to a shell is
// command.mjs's, since it needs the parsed command.
//
// The result is { inner, own }: `inner` a list of { language, text } or
// { words }, and `own` the words left to the wrapper.
// ---------------------------------------------------------------------------

import {
  commandName,
  fdCommand,
  findExecs,
  xargsCommand
} from '../write-guard/shell.commands.mjs'
import { COMMAND_FLAG, SHELLS } from '../write-guard/shell.programs.mjs'
import { commandOf, LANGUAGE } from './forms.mjs'

const EVAL = 'eval'
const FIND = 'find'
const FD = 'fd'
const XARGS = 'xargs'
const TRAP = 'trap'
const TRAP_RESET = '-'
const POWERSHELLS = new Set(['powershell', 'pwsh'])
const WINDOWS_POWERSHELL = 'powershell'
const EXPRESSIONS = new Set(['iex', 'invoke-expression'])
const SPACE = ' '
const END_OF_OPTIONS = '--'
const COMMAND_PARAMETER = 'command'
const ENCODED_PARAMETER = 'encodedcommand'
const FILE_PARAMETER = 'file'
// The shortest prefix of each parameter PowerShell reads as it: `-c` for
// -Command, `-en` for -EncodedCommand (`-e` and `-ec` are its aliases),
// `-f` for -File.
const PREFIX_FROM = Object.freeze({
  [COMMAND_PARAMETER]: 1,
  [ENCODED_PARAMETER]: 2,
  [FILE_PARAMETER]: 1
})
const ENCODED_ALIASES = new Set(['e', 'ec'])
// The parameters of powershell.exe that take the next word, which a
// command after them does not start at.
const POWERSHELL_VALUED = new Set([
  'config',
  'configurationname',
  'custompipename',
  'ep',
  'ex',
  'executionpolicy',
  'i',
  'if',
  'inputformat',
  'o',
  'of',
  'outputformat',
  'psconsolefile',
  'settings',
  'settingsfile',
  'v',
  'version',
  'w',
  'wd',
  'windowstyle',
  'workingdirectory'
])
const PARAMETER = /^[-/](?<name>[A-Za-z]+)$/u
const BASE64 = 'base64'
const UTF16 = 'utf16le'

const NONE = ({ words }) => ({ inner: [], own: words })

const texted = ({ words }) => words.map((text) => ({ text }))

const untexted = ({ args }) => args.map(({ text }) => text)

const parameterOf = ({ word }) =>
  PARAMETER.exec(word)?.groups.name.toLowerCase()

const isParameter = ({ name, parameter }) =>
  name !== undefined &&
  name.length >= PREFIX_FROM[parameter] &&
  parameter.startsWith(name)

const decoded = ({ text }) => Buffer.from(text, BASE64).toString(UTF16)

// The command a powershell or pwsh call runs, among its `rest`: the index
// of the word that ends its own words and the command's text.
const powershellCommand = ({ name, rest }) => {
  for (let at = 0; at < rest.length; at += 1) {
    const parameter = parameterOf({ word: rest[at] })
    if (isParameter({ name: parameter, parameter: FILE_PARAMETER })) {
      return undefined
    }
    if (isParameter({ name: parameter, parameter: COMMAND_PARAMETER })) {
      return { end: at + 1, text: rest.slice(at + 1).join(SPACE) }
    }
    if (
      ENCODED_ALIASES.has(parameter) ||
      isParameter({ name: parameter, parameter: ENCODED_PARAMETER })
    ) {
      return rest[at + 1] === undefined
        ? undefined
        : { end: at + 1, text: decoded({ text: rest[at + 1] }) }
    }
    if (POWERSHELL_VALUED.has(parameter)) {
      at += 1
    } else if (parameter === undefined) {
      // powershell.exe runs its words as a command; pwsh runs a file.
      return name === WINDOWS_POWERSHELL
        ? { end: at, text: rest.slice(at).join(SPACE) }
        : undefined
    }
  }
  return undefined
}

// The pieces of a wrapper's words: those it keeps, by index in `words`,
// and the commands it runs.
const split = ({ inner, keep, words }) => ({
  inner,
  own: words.filter((_, at) => keep({ at }))
})

/** The commands the simple command `words` runs inside it. */
export const innerOf = ({ words }) => {
  const { at, command } = commandOf({ words })
  if (command.length === 0) return NONE({ words })
  const name = commandName({ arg: { text: command[0] } })
  const rest = command.slice(1)
  const head = at + 1
  const upTo = ({ end }) => words.slice(0, head + end)
  if (name === EVAL) {
    return rest.length === 0
      ? NONE({ words })
      : {
          inner: [{ language: LANGUAGE.bash, text: rest.join(SPACE) }],
          own: upTo({ end: 0 })
        }
  }
  if (EXPRESSIONS.has(name)) {
    const start = isParameter({
      name: parameterOf({ word: rest[0] ?? '' }),
      parameter: COMMAND_PARAMETER
    })
      ? 1
      : 0
    return rest.length === start
      ? NONE({ words })
      : {
          inner: [
            {
              language: LANGUAGE.powershell,
              text: rest.slice(start).join(SPACE)
            }
          ],
          own: upTo({ end: start })
        }
  }
  if (SHELLS.has(name)) {
    const flag = rest.findIndex((word) => COMMAND_FLAG.test(word))
    return flag < 0 || rest[flag + 1] === undefined
      ? NONE({ words })
      : {
          inner: [{ language: LANGUAGE.bash, text: rest[flag + 1] }],
          own: upTo({ end: flag + 1 })
        }
  }
  if (POWERSHELLS.has(name)) {
    const found = powershellCommand({ name, rest })
    return found === undefined || found.text === ''
      ? NONE({ words })
      : {
          inner: [{ language: LANGUAGE.powershell, text: found.text }],
          own: upTo({ end: found.end })
        }
  }
  if (name === TRAP) {
    const start = rest[0] === END_OF_OPTIONS ? 1 : 0
    const text = rest[start]
    return text === undefined ||
      text === '' ||
      text === TRAP_RESET ||
      (start === 0 && text.startsWith('-')) ||
      rest.length === start + 1
      ? NONE({ words })
      : {
          inner: [{ language: LANGUAGE.bash, text }],
          own: words.filter((_, at) => at !== head + start)
        }
  }
  if (name === FIND) {
    const execs = findExecs({ args: texted({ words: rest }) })
    if (execs.length === 0) return NONE({ words })
    return split({
      inner: execs.map(({ inner }) => ({ words: untexted({ args: inner }) })),
      keep: ({ at: index }) =>
        !execs.some(
          ({ from, to }) => index > head + from && index < head + to
        ),
      words
    })
  }
  if (name === FD) {
    const exec = fdCommand({ args: texted({ words: rest }) })
    return exec === undefined
      ? NONE({ words })
      : {
          inner: [{ words: untexted({ args: exec.inner }) }],
          own: upTo({ end: exec.at + 1 })
        }
  }
  if (name === XARGS) {
    const { inner, start } = xargsCommand({ args: texted({ words: rest }) })
    return inner.length === 0
      ? NONE({ words })
      : {
          inner: [{ words: untexted({ args: inner }) }],
          own: upTo({ end: start })
        }
  }
  return NONE({ words })
}
