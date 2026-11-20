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

// The first redirection to a file outside quotes, as written: `>`, `>>`,
// `2>`, `*>`.
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
      if (command[i + (append ? 2 : 1)] !== '&') {
        const stream = STREAM.test(command[i - 1] ?? '')
          ? command[i - 1]
          : ''
        return `${stream}>${append ? '>' : ''}`
      }
    }
  }
  return undefined
}

/** The write `command` holds, as written, or undefined. */
export const writeOf = ({ command }) =>
  CMDLET.exec(command)?.[1] ?? redirectOf({ command })

const POLICED = [ACTOR_KIND.readOnly, ACTOR_KIND.surface]

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
  const named = namedRule({ cwd, host, policy, text: command })
  return named === undefined
    ? undefined
    : { kind: 'powershell', level: LEVEL.ask, named, write }
}
