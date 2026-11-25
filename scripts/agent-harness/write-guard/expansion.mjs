// ---------------------------------------------------------------------------
// expansion — what a tokenized word expands to, as far as a path can need
// it, and the argument helpers every writer reads its options with.
//
// A variable resolves only from an assignment earlier in the same command,
// since Bash calls share no shell state; the scratch variables ($TEMP, $TMP,
// $TMPDIR) resolve to the OS temp dir, $HOME and `~` to the home folder, and
// the numbers the shell makes up ($$, $RANDOM, $(( ))) to SAFE, one segment
// that holds no slash and no `..`. Anything else is UNKNOWN, and its name is
// kept for the reason.
//
// `state` is { cwd, host, rootOf, vars }: the folder the command runs in (or
// null once a `cd` the guard cannot follow ran), the host of paths.mjs, the
// checkout `git rev-parse --show-toplevel` prints, and the variables set so
// far.
//
// Ported from the expansion and the argument helpers of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import { posix } from 'node:path'

import { MAX_BRACE_WORDS } from './braces.mjs'
import { hasGlob } from './globs.mjs'
import { SAFE, UNKNOWN } from './scan.mjs'

const SCRATCH_VARIABLES = new Set(['TEMP', 'TMP', 'TMPDIR'])
const SAFE_PARAMETERS = new Set([
  '!',
  '#',
  '$',
  '?',
  'BASHPID',
  'EPOCHREALTIME',
  'EPOCHSECONDS',
  'LINENO',
  'PPID',
  'RANDOM',
  'SECONDS',
  'UID'
])
// The device a process substitution hands its command.
const PROCESS_DEVICE = '/dev/fd/63'

export const known = ({ text }) => ({ text, unknown: [] })

const scratchOf = ({ state }) => state.host.scratchRoots?.[0] ?? UNKNOWN

const homeOf = ({ state }) => state.host.homeDir ?? UNKNOWN

// -- argument helpers ----------------------------------------------------------

const isOption = ({ arg }) => arg.text.startsWith('-') && arg.text !== '-'

/**
 * The options and the operands of `args`. `valued` lists the options that
 * take the next argument when no value is attached; `--` ends the options.
 */
export const splitArgs = ({ args, valued = [] }) => {
  const options = []
  const operands = []
  let skip = -1
  let ended = false
  for (const [k, arg] of args.entries()) {
    if (k <= skip) continue
    if (ended) operands.push(arg)
    else if (arg.text === '--') ended = true
    else if (!isOption({ arg })) operands.push(arg)
    else if (valued.includes(arg.text) && k + 1 < args.length) {
      options.push({ flag: arg.text, value: args[k + 1] })
      skip = k + 1
    } else {
      const eq = arg.text.indexOf('=')
      options.push(
        eq > 0 && arg.text.startsWith('--')
          ? {
              flag: arg.text.slice(0, eq),
              value: { ...arg, text: arg.text.slice(eq + 1) }
            }
          : { flag: arg.text }
      )
    }
  }
  return { operands, options }
}

export const optionValue = ({ flags, options }) =>
  options.find((option) => flags.includes(option.flag))?.value

export const hasFlag = ({ flags, options }) =>
  options.some((option) => flags.includes(option.flag))

export const literal = ({ text }) => ({ raw: text, text, unknown: [] })

export const operandsOf = ({ args, valued = [] }) =>
  splitArgs({ args, valued }).operands

// Short-option clusters (`-sSLo out`): each letter, and the value a letter
// in `valued` takes from the rest of the cluster or the next argument.
export const clusters = ({ args, valued }) => {
  const found = []
  let skip = -1
  for (const [k, arg] of args.entries()) {
    if (k <= skip || !/^-[A-Za-z]/.test(arg.text)) continue
    const letters = [...arg.text.slice(1)]
    const at = letters.findIndex((letter) => valued.includes(letter))
    letters
      .slice(0, at < 0 ? undefined : at)
      .forEach((letter) => found.push({ letter }))
    if (at >= 0) {
      const rest = arg.text.slice(at + 2)
      found.push({
        letter: letters[at],
        value: rest === '' ? args[k + 1] : { ...arg, text: rest }
      })
      if (rest === '') skip = k + 1
    }
  }
  return found
}

const asList = ({ value }) =>
  value === undefined ? [] : Array.isArray(value) ? value : [value]

/**
 * The options and operands of `args`, short ones read in clusters
 * (`-fsSLo out`, `-qO file`, `-qOfile`): `long` lists the long options and
 * `short` the letters that take a value. `value` and `has` look an option
 * up by its long spellings and its letters.
 */
export const parseOptions = ({ args, long = [], short = '' }) => {
  const options = []
  const letters = []
  const operands = []
  let ended = false
  for (let k = 0; k < args.length; k += 1) {
    const arg = args[k]
    const { text } = arg
    if (ended || text === '-' || !text.startsWith('-')) {
      operands.push(arg)
    } else if (text === '--') ended = true
    else if (text.startsWith('--')) {
      const eq = text.indexOf('=')
      if (eq > 0) {
        options.push({
          flag: text.slice(0, eq),
          value: { ...arg, text: text.slice(eq + 1) }
        })
      } else if (long.includes(text) && k + 1 < args.length) {
        options.push({ flag: text, value: args[k + 1] })
        k += 1
      } else options.push({ flag: text })
    } else {
      for (let c = 1; c < text.length; c += 1) {
        const letter = text[c]
        if (!short.includes(letter)) {
          letters.push({ letter })
          continue
        }
        const rest = text.slice(c + 1)
        if (rest !== '') {
          letters.push({ letter, value: { ...arg, text: rest } })
        } else if (k + 1 < args.length) {
          letters.push({ letter, value: args[k + 1] })
          k += 1
        } else letters.push({ letter })
        break
      }
    }
  }
  const values = ({ long: names, short: chars }) => [
    ...options
      .filter(
        ({ flag, value }) =>
          value && asList({ value: names }).includes(flag)
      )
      .map(({ value }) => value),
    ...letters
      .filter(
        ({ letter, value }) =>
          value && asList({ value: chars }).includes(letter)
      )
      .map(({ value }) => value)
  ]
  return {
    has: ({ long: names, short: chars }) =>
      options.some(({ flag }) =>
        asList({ value: names }).includes(flag)
      ) ||
      letters.some(({ letter }) =>
        asList({ value: chars }).includes(letter)
      ),
    letters,
    operands,
    options,
    value: (lookup) => values(lookup)[0],
    values
  }
}

// The path `mktemp` creates: below `-p`, after a template's folder, or in
// the OS temp dir.
export const mktempTarget = ({ args, state }) => {
  const { operands, options } = splitArgs({
    args,
    valued: ['-p', '--tmpdir']
  })
  const dir = optionValue({ flags: ['-p', '--tmpdir'], options })
  if (dir && dir.text !== '') return `${dir.text}/${SAFE}`
  const template = operands[0]?.text
  if (template?.includes('/')) return template.replace(/X+$/, SAFE)
  return `${scratchOf({ state })}/${SAFE}`
}

// -- expansion -------------------------------------------------------------------

const parameterValue = ({ part, state }) => {
  const value = state.vars.get(part.param)
  if (/^:?[-=]$/.test(part.op) && !value) {
    return part.alt.includes('$')
      ? { text: UNKNOWN, unknown: [`\${${part.param}}`] }
      : known({ text: part.alt })
  }
  if (!['', '%', '%%', '-', ':-', '=', ':='].includes(part.op)) {
    return { text: UNKNOWN, unknown: [`\${${part.param}${part.op}…}`] }
  }
  if (value) return value
  if (SCRATCH_VARIABLES.has(part.param)) {
    return known({ text: scratchOf({ state }) })
  }
  if (SAFE_PARAMETERS.has(part.param)) return known({ text: SAFE })
  if (part.param === 'HOME') return known({ text: homeOf({ state }) })
  if (part.param === 'PWD' && state.cwd !== null) {
    return known({ text: state.cwd })
  }
  return { text: UNKNOWN, unknown: [`$${part.param}`] }
}

const GLOB_SPECIAL = /[*?[\\]/gu
const escapeGlob = ({ text }) => text.replace(GLOB_SPECIAL, '\\$&')
const NUL = '\u0000'
const beforeNul = ({ text }) => {
  const at = text.indexOf(NUL)
  return at < 0 ? text : text.slice(0, at)
}

// One part as a path, with the pattern Bash would glob it as: only an
// unquoted literal keeps its wildcards.
const partValue = ({ index, part, state }) => {
  if ('lit' in part) {
    const home = index === 0 && !part.quoted && /^~(?=\/|$)/.test(part.lit)
    const text = home ? homeOf({ state }) + part.lit.slice(1) : part.lit
    return {
      ...known({ text }),
      pattern: home
        ? escapeGlob({ text: homeOf({ state }) }) + part.lit.slice(1)
        : part.quoted
          ? escapeGlob({ text })
          : text
    }
  }
  const value = part.overflow
    ? {
        text: UNKNOWN,
        unknown: [
          `a brace expansion of more than ${MAX_BRACE_WORDS} words`
        ]
      }
    : 'safe' in part
      ? known({ text: SAFE })
      : 'param' in part
        ? parameterValue({ part, state })
        : part.process
          ? known({ text: PROCESS_DEVICE })
          : substitutionValue({ script: part.sub, state })
  return { ...value, pattern: escapeGlob({ text: value.text }) }
}

/**
 * The word as a path: `{ raw, text, unknown, glob }`, where `unknown`
 * names what the text depends on and the command never sets, and `glob`
 * holds the pattern Bash would expand it as, when it holds a wildcard. A
 * word ends at its first NUL, as Bash reads it.
 */
export const expand = ({ state, word }) => {
  const values = word.parts.map((part, index) =>
    partValue({ index, part, state })
  )
  const text = beforeNul({
    text: values.map((value) => value.text).join('')
  })
  const pattern = beforeNul({
    text: values.map((value) => value.pattern).join('')
  })
  return {
    ...(hasGlob({ pattern }) && !text.includes(UNKNOWN)
      ? { glob: { pattern } }
      : {}),
    raw: word.raw,
    text,
    unknown: values.flatMap((value) => value.unknown)
  }
}

// What a `$(...)` prints, as far as a path can need it. Anything not named
// below counts as one path segment: after a scratch folder it stays there,
// and at the start of a path it resolves against the current folder. Only a
// `..` in its output could walk out, which an accidental command does not
// produce.
const substitutionValue = ({ script, state }) => {
  if (script.length !== 1 || script[0].type !== 'cmd') {
    return known({ text: SAFE })
  }
  const args = script[0].words.map((word) => expand({ state, word }))
  const [name, ...rest] = args.map(({ text }) => text)
  const last = args.at(-1) ?? known({ text: '' })
  if (name === 'mktemp') {
    return known({ text: mktempTarget({ args: args.slice(1), state }) })
  }
  if (name === 'pwd') return known({ text: state.cwd ?? SAFE })
  if (name === 'git' && rest.includes('--show-toplevel')) {
    return known({ text: state.rootOf() ?? UNKNOWN })
  }
  if (
    ['cygpath', 'readlink', 'realpath'].includes(name) &&
    rest.length > 0
  ) {
    return last
  }
  if (name === 'dirname' && rest.length > 0) {
    return {
      text: posix.dirname(last.text.replaceAll('\\', '/')),
      unknown: last.unknown
    }
  }
  if (name === 'echo' && rest.length > 0) {
    return {
      text: rest.join(' '),
      unknown: args.slice(1).flatMap((arg) => arg.unknown)
    }
  }
  return known({ text: SAFE })
}
