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
// streams and writes no file. A copy or a move into a folder (`.`, `..`, a
// final separator, or a folder on the disk) is also judged by the name the
// file gets there.
// ---------------------------------------------------------------------------

import { namedRule } from './mentions.mjs'
import { absolutePath } from './paths.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { LEVEL } from './target.mjs'
import { lastSegmentOf } from './writers.folders.mjs'

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

// -- a copy or a move, by its destination -----------------------------------
const COPIES = new Set(['copy', 'copy-item', 'cp', 'cpi'])
const MOVES = new Set(['mi', 'move', 'move-item', 'mv'])
const CMDLETS_ANYWHERE = new RegExp(CMDLET.source, 'giu')
const STATEMENT_END = /[;|\n]/u
const TOKEN = /"[^"]*"|'[^']*'|\S+/gu
const DESTINATION = /^-destination(?::(.*))?$/iu
// Copy-Item's and Move-Item's parameters that take the next token as their
// value.
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
const QUOTED = /^(['"])(.*)\1$/su
const TRAILING_SEPARATORS = /[\\/]+$/u
const FOLDER_SPELLING = /^\.{1,2}$|[\\/]$/u

const unquoted = ({ token }) => token.replace(QUOTED, '$2')

// The source and destination of one copy or move: -Path or -LiteralPath,
// or the first positional token; -Destination's value, or the next
// positional token.
const copyOf = ({ text }) => {
  const tokens = text.match(TOKEN) ?? []
  const positional = []
  let source
  let destination
  for (let at = 0; at < tokens.length; at += 1) {
    const token = tokens[at]
    const named = DESTINATION.exec(token)
    const flag = token.toLowerCase()
    if (named) {
      destination = named[1] ?? tokens[at + 1]
      if (named[1] === undefined) at += 1
    } else if (COPY_VALUED.has(flag)) {
      if (SOURCES.has(flag)) source = tokens[at + 1]
      at += 1
    } else if (!token.startsWith('-')) positional.push(token)
  }
  const sourceNamed = source !== undefined
  return {
    destination: destination ?? positional[sourceNamed ? 0 : 1],
    source: source ?? positional[0]
  }
}

const isDirectory = ({ cwd, host, text }) => {
  try {
    return (
      host.isDirectory?.({ path: absolutePath({ cwd, host, text }) }) ===
      true
    )
  } catch {
    return false
  }
}

// What a copy or move into a folder writes: the source's name in it, when
// the destination is `.`, `..`, ends in a separator or is a folder on the
// disk.
const intoFolder = ({ copy, cwd, host }) => {
  if (copy.source === undefined || copy.destination === undefined)
    return []
  const folder = unquoted({ token: copy.destination })
  if (
    !FOLDER_SPELLING.test(folder) &&
    !isDirectory({ cwd, host, text: folder })
  ) {
    return []
  }
  const name = lastSegmentOf({ text: unquoted({ token: copy.source }) })
  return name === '' || FOLDER_SPELLING.test(name)
    ? []
    : [`${folder.replace(TRAILING_SEPARATORS, '')}/${name}`]
}

/**
 * The text whose rule paths make `command` a write of one: the whole
 * command, or, when every write it holds is a copy, only what the copies
 * write to, since a copy of a rule file elsewhere edits none. A copy or a
 * move into a folder adds the name the file gets there.
 */
const scannedText = ({ command, cwd, host }) => {
  const writes = [...command.matchAll(CMDLETS_ANYWHERE)]
  const copies = writes.flatMap((match) => {
    const cmdlet = match[1].toLowerCase()
    if (!COPIES.has(cmdlet) && !MOVES.has(cmdlet)) return []
    const rest = command.slice(match.index + match[0].length)
    const end = rest.search(STATEMENT_END)
    return [copyOf({ text: end < 0 ? rest : rest.slice(0, end) })]
  })
  const into = copies.flatMap((copy) => intoFolder({ copy, cwd, host }))
  const copiesOnly =
    writes.length > 0 &&
    writes.every((match) => COPIES.has(match[1].toLowerCase())) &&
    redirectOf({ command }) === undefined
  if (!copiesOnly) return [command, ...into].join(' ')
  return [
    ...copies
      .map(({ destination }) => destination)
      .filter((destination) => destination !== undefined),
    ...into
  ].join(' ')
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
    text: scannedText({ command, cwd: cwd ?? undefined, host })
  })
  return named === undefined
    ? undefined
    : { kind: 'powershell', level: LEVEL.ask, named, write }
}
