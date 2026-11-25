// ---------------------------------------------------------------------------
// powershell — the write guard's reading of Claude Code's PowerShell tool.
// The guard does not parse PowerShell, so a policed agent (read-only or held
// to a surface) is refused the tool, as the donor refuses it, and told to
// run the command through Bash. Anyone else is asked only when the command
// holds a write, a write cmdlet, one of its aliases or a redirection to a
// file, and also names a rule path (mentions.mjs); otherwise nothing.
//
// The write cmdlets are Set-Content, Out-File, Add-Content, New-Item,
// Copy-Item, Move-Item, Remove-Item, Rename-Item, Clear-Content and
// Tee-Object, by name, module-qualified, or by alias. A redirection is a
// `>` outside quotes, with its stream (`2>`, `*>`) and `>>`; `2>&1` merges
// streams and writes no file.
// ---------------------------------------------------------------------------

import { namedRule } from './mentions.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { LEVEL } from './target.mjs'

const CMDLETS = [
  'Set-Content',
  'Out-File',
  'Add-Content',
  'New-Item',
  'Copy-Item',
  'Move-Item',
  'Remove-Item',
  'Rename-Item',
  'Clear-Content',
  'Tee-Object'
]
// Their aliases in Windows PowerShell and PowerShell 7, `md` and `mkdir`
// (New-Item -ItemType Directory) included.
const ALIASES = [
  'sc',
  'ac',
  'clc',
  'ni',
  'md',
  'mkdir',
  'cp',
  'copy',
  'cpi',
  'mv',
  'move',
  'mi',
  'rm',
  'del',
  'erase',
  'rd',
  'rmdir',
  'ri',
  'ren',
  'rni',
  'tee'
]

export const WRITE_CMDLETS = Object.freeze([...CMDLETS, ...ALIASES])

const escaped = ({ text }) => text.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')

// A cmdlet where a command can start: at the start, after a blank, a `;`,
// a `|`, a bracket, `&` or `=`, and before a blank, the end or a closer.
const CMDLET = new RegExp(
  `(?:^|[\\s;|({&=])(?:Microsoft\\.PowerShell\\.(?:Management|Utility)\\\\)?(${WRITE_CMDLETS.map(
    (text) => escaped({ text })
  ).join('|')})(?=$|[\\s;|)}])`,
  'iu'
)
const SINGLE = "'"
const DOUBLE = '"'
const ESCAPE = '`'
const STREAM = /^[\d*]$/u
const NULL_TARGET = /^\s*\$null\b/iu

// The first redirection to a file outside quotes, as written: `>`, `>>`,
// `2>`, `*>`. A redirect to `$null` discards its stream and writes no file.
const redirectOf = ({ command }) => {
  let quote = ''
  for (let i = 0; i < command.length; i += 1) {
    const c = command[i]
    if (quote === SINGLE) {
      if (c === SINGLE) quote = ''
    } else if (quote === DOUBLE) {
      if (c === ESCAPE) i += 1
      else if (c === DOUBLE) quote = ''
    } else if (c === SINGLE || c === DOUBLE) quote = c
    else if (c === ESCAPE) i += 1
    else if (c === '>') {
      const append = command[i + 1] === '>'
      const after = i + (append ? 2 : 1)
      const discards = NULL_TARGET.test(command.slice(after))
      if (command[after] !== '&' && !discards) {
        const stream = STREAM.test(command[i - 1] ?? '')
          ? command[i - 1]
          : ''
        return `${stream}>${append ? '>' : ''}`
      }
      if (append) i += 1
    }
  }
  return undefined
}

/** The write `command` holds, as written, or undefined. */
export const writeOf = ({ command }) =>
  CMDLET.exec(command)?.[1] ?? redirectOf({ command })

const POLICED = [ACTOR_KIND.readOnly, ACTOR_KIND.surface]

// -- a copy, by its destination ---------------------------------------------
const COPIES = new Set(['copy', 'copy-item', 'cp', 'cpi'])
const CMDLETS_ANYWHERE = new RegExp(CMDLET.source, 'giu')
const STATEMENT_END = /[;|\n]/u
const TOKEN = /"[^"]*"|'[^']*'|\S+/gu
const DESTINATION = /^-destination(?::(.*))?$/iu
// Copy-Item's parameters that take the next token as their value.
const COPY_VALUED = new Set([
  '-credential',
  '-exclude',
  '-filter',
  '-fromsession',
  '-include',
  '-literalpath',
  '-path',
  '-tosession'
])
const SOURCES = new Set(['-literalpath', '-path'])

// The destination one copy writes: -Destination's value, or the second
// positional token, or the first when -Path names the source.
const destinationOf = ({ text }) => {
  const tokens = text.match(TOKEN) ?? []
  const positional = []
  let source = false
  for (let at = 0; at < tokens.length; at += 1) {
    const token = tokens[at]
    const named = DESTINATION.exec(token)
    if (named) return named[1] ?? tokens[at + 1]
    const flag = token.toLowerCase()
    if (COPY_VALUED.has(flag)) {
      source = source || SOURCES.has(flag)
      at += 1
    } else if (!token.startsWith('-')) positional.push(token)
  }
  return source ? positional[0] : positional[1]
}

/**
 * The text whose rule paths make `command` a write of one: the whole
 * command, or, when every write it holds is a copy, only what the copies
 * write to, since a copy of a rule file elsewhere edits none.
 */
const scannedText = ({ command }) => {
  const writes = [...command.matchAll(CMDLETS_ANYWHERE)]
  const copiesOnly =
    writes.length > 0 &&
    writes.every((match) => COPIES.has(match[1].toLowerCase())) &&
    redirectOf({ command }) === undefined
  if (!copiesOnly) return command
  return writes
    .map((match) => {
      const rest = command.slice(match.index + match[0].length)
      const end = rest.search(STATEMENT_END)
      return destinationOf({ text: end < 0 ? rest : rest.slice(0, end) })
    })
    .filter((destination) => destination !== undefined)
    .join(' ')
}

/**
 * The finding for one PowerShell call: a deny for a policed agent; for
 * anyone else, an ask when it writes and names a rule path, carrying the
 * write and the named rule, and undefined otherwise.
 */
export const judgePowerShell = ({ actor, command, cwd, host, policy }) => {
  if (POLICED.includes(actor.kind)) {
    return { kind: 'powershell', level: LEVEL.deny }
  }
  const write = writeOf({ command })
  if (write === undefined) return undefined
  const named = namedRule({
    cwd,
    host,
    policy,
    text: scannedText({ command })
  })
  return named === undefined
    ? undefined
    : { kind: 'powershell', level: LEVEL.ask, named, write }
}
