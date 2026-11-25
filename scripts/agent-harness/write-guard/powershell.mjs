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
// streams and writes no file. A copy's or a move's source and destination
// are bound as PowerShell binds them: by a parameter's name, alias or any
// prefix, with the value after a `:` or next, else by position. A copy or a
// move into a folder (`.`, `..`, a final separator, or a folder on the
// disk) is also judged by the name the file gets there.
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
// A token: a run of quoted strings and other non-blank characters.
const TOKEN = /(?:"[^"]*"|'[^']*'|[^\s'"])+/gu
const QUOTED = /^(['"])(.*)\1$/su
const TRAILING_SEPARATORS = /[\\/]+$/u
const FOLDER_SPELLING = /^\.{1,2}$|[\\/]$/u

// -- the parameters of Copy-Item and Move-Item, as PowerShell binds them ----
const ROLE = Object.freeze({
  destination: 'destination',
  source: 'source',
  switch: 'switch',
  valued: 'valued'
})
// The cmdlets' own parameters and the common ones, by their full name.
const PARAMETERS = {
  confirm: ROLE.switch,
  container: ROLE.switch,
  credential: ROLE.valued,
  debug: ROLE.switch,
  destination: ROLE.destination,
  erroraction: ROLE.valued,
  errorvariable: ROLE.valued,
  exclude: ROLE.valued,
  filter: ROLE.valued,
  force: ROLE.switch,
  fromsession: ROLE.valued,
  include: ROLE.valued,
  informationaction: ROLE.valued,
  informationvariable: ROLE.valued,
  literalpath: ROLE.source,
  outbuffer: ROLE.valued,
  outvariable: ROLE.valued,
  passthru: ROLE.switch,
  path: ROLE.source,
  pipelinevariable: ROLE.valued,
  progressaction: ROLE.valued,
  recurse: ROLE.switch,
  tosession: ROLE.valued,
  usetransaction: ROLE.switch,
  verbose: ROLE.switch,
  warningaction: ROLE.valued,
  warningvariable: ROLE.valued,
  whatif: ROLE.switch
}
const PARAMETER_ALIASES = {
  cf: 'confirm',
  db: 'debug',
  ea: 'erroraction',
  ev: 'errorvariable',
  infa: 'informationaction',
  iv: 'informationvariable',
  lp: 'literalpath',
  ob: 'outbuffer',
  ov: 'outvariable',
  proga: 'progressaction',
  pspath: 'literalpath',
  pv: 'pipelinevariable',
  usetx: 'usetransaction',
  vb: 'verbose',
  wa: 'warningaction',
  wi: 'whatif',
  wv: 'warningvariable'
}
// `-Name`, `-Name:value` or `-Name:` with the value next.
const PARAMETER = /^-([A-Za-z]+)(?::(.*))?$/su
// Which role an ambiguous prefix is read as: one that could be
// -Destination is read as it, and one that could be a source as a source,
// so an ambiguous spelling is never read as a harmless one.
const PREFIX_ORDER = [
  ROLE.destination,
  ROLE.source,
  ROLE.valued,
  ROLE.switch
]

// The role of the parameter `name` binds to: its full name, an alias, or
// any prefix, as PowerShell matches them, case aside. An unknown name is
// read as a switch.
const roleOf = ({ name }) => {
  const lower = name.toLowerCase()
  const full = PARAMETER_ALIASES[lower] ?? lower
  if (Object.hasOwn(PARAMETERS, full)) return PARAMETERS[full]
  const roles = new Set(
    Object.entries(PARAMETERS)
      .filter(([parameter]) => parameter.startsWith(lower))
      .map(([, role]) => role)
  )
  return PREFIX_ORDER.find((role) => roles.has(role)) ?? ROLE.switch
}

const unquoted = ({ token }) => token.replace(QUOTED, '$2')

// The source and destination of one copy or move: -Path or -LiteralPath
// and -Destination by name, each bound by a prefix or an alias, with its
// value after a `:` or next; otherwise Path takes the first positional
// token and Destination the next one left.
const copyOf = ({ text }) => {
  const tokens = text.match(TOKEN) ?? []
  const positional = []
  const bound = {}
  for (let at = 0; at < tokens.length; at += 1) {
    const token = tokens[at]
    const parameter = PARAMETER.exec(token)
    if (parameter === null) {
      positional.push(token)
      continue
    }
    const [, name, attached] = parameter
    const role = roleOf({ name })
    // A switch takes no next token, unless its `:` leaves the value there.
    if (role === ROLE.switch) {
      if (attached === '') at += 1
      continue
    }
    const value = attached || tokens[at + 1]
    if (!attached) at += 1
    if (role !== ROLE.valued) bound[role] ??= value
  }
  const free = [...positional]
  const source = bound.source ?? free.shift()
  return { destination: bound.destination ?? free.shift(), source }
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
