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

/**
 * The word as a path: `{ raw, text, unknown }`, where `unknown` names what
 * the text depends on and the command never sets.
 */
export const expand = ({ state, word }) => {
  const values = word.parts.map((part, index) => {
    if ('lit' in part) {
      return known({
        text:
          index === 0 && !part.quoted && /^~(?=\/|$)/.test(part.lit)
            ? homeOf({ state }) + part.lit.slice(1)
            : part.lit
      })
    }
    if ('safe' in part) return known({ text: SAFE })
    if ('param' in part) return parameterValue({ part, state })
    if (part.process) return known({ text: PROCESS_DEVICE })
    return substitutionValue({ script: part.sub, state })
  })
  return {
    raw: word.raw,
    text: values.map((value) => value.text).join(''),
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
