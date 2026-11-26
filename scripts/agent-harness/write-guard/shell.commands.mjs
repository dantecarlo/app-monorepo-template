// ---------------------------------------------------------------------------
// shell.commands — the findings of one simple Bash command, its words
// already expanded: the files it writes (writers*.mjs), each judged as a
// target (target.mjs), and the programs whose writes the guard does not
// read, which a read-only agent is refused and which are opaque for anyone
// else (decide then asks only when the command names a rule path).
//
// A wrapper (`timeout`, `env`, `sudo`, ...) is read through to the command
// it runs; `find -exec`, `fd -x` and `xargs` run their inner command on the
// paths they find. A surface agent is held to its surface for the commands
// that write its own files (SURFACE_WRITERS), redirects and find; its other
// programs are its workflow, as in the donor. git is shell.git.mjs's, the
// programs whose writes the guard does not read are shell.programs.mjs's, a
// program it does not know is readers.mjs's, and what the parts share is
// shell.findings.mjs's.
//
// Ported from the judging half of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import { optionValue, splitArgs } from './expansion.mjs'
import { GLOB_MODE } from './globs.mjs'
import { READERS, unknownProgramVerdict } from './readers.mjs'
import { SAFE, UNKNOWN } from './scan.mjs'
import {
  firstOfChecks,
  isPoliced,
  isReadOnly,
  isSurface,
  opaqueLevel,
  strongestOf,
  targetFinding
} from './shell.findings.mjs'
import { gitVerdict } from './shell.git.mjs'
import { isKnownProgram, programVerdict } from './shell.programs.mjs'
import { FINDING_KIND } from './target.mjs'
import { CWD } from './writers.folders.mjs'
import { FILE_WRITERS, SURFACE_WRITERS } from './writers.mjs'

const MAX_WRAPPERS = 8

const WRAPPERS = {
  builtin: [],
  busybox: [],
  caffeinate: [],
  chronic: [],
  command: [],
  env: ['-u', '-C', '--unset', '--chdir'],
  exec: ['-a'],
  ionice: ['-c', '-n'],
  nice: ['-n'],
  nohup: [],
  stdbuf: ['-i', '-o', '-e'],
  sudo: ['-u', '-g'],
  time: [],
  timeout: ['-s', '-k', '--signal', '--kill-after'],
  watch: ['-n', '--interval'],
  toybox: [],
  winpty: []
}

/** The bare name a command is read by: no folder, no extension, lower case. */
export const commandName = ({ arg }) =>
  arg.text
    .replace(/^.*[\\/]/, '')
    .replace(/\.(?:exe|cmd|bat)$/i, '')
    .toLowerCase()

/** The command a wrapper runs, after its own options. */
export const unwrap = ({ args, depth = 0 }) => {
  const name = args.length > 0 ? commandName({ arg: args[0] }) : ''
  const valued = WRAPPERS[name]
  if (!valued || depth >= MAX_WRAPPERS) return args
  if (name === 'command' && ['-v', '-V'].includes(args[1]?.text ?? '')) {
    return []
  }
  let skip = 0
  let start = args.length
  for (const [k, arg] of args.entries()) {
    if (k <= skip) continue
    if (valued.includes(arg.text)) skip = k + 1
    else if (
      !arg.text.startsWith('-') &&
      !(name === 'env' && /^\w+=/.test(arg.text))
    ) {
      start = k
      break
    }
  }
  // `timeout 60 cmd`: the duration is timeout's own operand.
  const command = name === 'timeout' ? start + 1 : start
  return unwrap({ args: args.slice(command), depth: depth + 1 })
}

const BRACES = /\{[^}]*\}/g

// Runs a command with `{}` standing for the files find, fd or xargs feed it;
// a `{}` alone becomes the placeholder itself, a pattern find's names give.
const innerCommand = ({ args, placeholder, state }) =>
  judgeArgs({
    args: args.map((arg) =>
      arg.text === '{}'
        ? { ...placeholder, raw: arg.raw }
        : /\{[^}]*\}/.test(arg.text)
          ? {
              ...arg,
              text: arg.text.replace(BRACES, placeholder.text),
              unknown: [...arg.unknown, ...placeholder.unknown]
            }
          : arg
    ),
    command: { redirects: [], words: [] },
    producer: undefined,
    state
  })

const below = ({ root }) => ({ ...root, text: `${root.text}/${SAFE}` })

const FIND_NAMES = /^-i?name$/u
const FIND_PATHS = /^-i?(?:path|wholename)$/u
const TRAILING_SLASHES = /\/+$/u
const BACKSLASHES = /\\/gu
const WILDCARDS = /[*?[]/gu

// A find root as the literal head of a pattern: its own separators read as
// `/`, and its wildcards escaped, since find reads the root literally.
const rootPattern = ({ root }) =>
  root.text
    .replace(BACKSLASHES, '/')
    .replace(WILDCARDS, '\\$&')
    .replace(TRAILING_SLASHES, '')

// The files find matches below each root, as patterns the guard judges
// without the disk: `<root>/**/<name>` for -name, the path for -path.
const findPatterns = ({ args, roots }) =>
  args.flatMap((arg, at) => {
    const value = args[at + 1]
    if (value === undefined) return []
    if (FIND_NAMES.test(arg.text)) {
      return roots.map((root) => ({
        glob: {
          disk: false,
          mode: GLOB_MODE.findName,
          pattern: `${rootPattern({ root })}/**/${value.text}`
        },
        raw: `${root.raw} -name ${value.raw}`,
        text: value.text,
        unknown: [...root.unknown, ...value.unknown]
      }))
    }
    return FIND_PATHS.test(arg.text)
      ? [
          {
            glob: {
              disk: false,
              mode: GLOB_MODE.findPath,
              pattern: value.text
            },
            raw: `-path ${value.raw}`,
            text: value.text,
            unknown: value.unknown
          }
        ]
      : []
  })

const FIND_EXEC = /^-(?:exec|execdir|ok|okdir)$/u
const FIND_EXEC_ENDS = new Set([';', '+'])

/**
 * The commands find's `-exec`, `-execdir`, `-ok` and `-okdir` run, among
 * find's `args` ({ text }): each its words, and `from` and `to`, the
 * index of its action and of the `;` or `+` that ends it (args.length
 * when none does).
 */
export const findExecs = ({ args }) => {
  const execs = []
  for (let from = 0; from < args.length; from += 1) {
    if (FIND_EXEC.test(args[from].text)) {
      const end = args.findIndex(
        (one, at) => at > from && FIND_EXEC_ENDS.has(one.text)
      )
      const to = end < 0 ? args.length : end
      execs.push({ from, inner: args.slice(from + 1, to), to })
      from = to
    }
  }
  return execs
}

const findVerdict = ({ args, state }) => {
  const firstExpression = args.findIndex(({ text }) => /^[-(!]/.test(text))
  const starts =
    firstExpression < 0 ? args : args.slice(0, firstExpression)
  const roots = starts.length > 0 ? starts : [CWD]
  const patterns = findPatterns({ args, roots })
  const placeholder = patterns[0] ?? below({ root: roots[0] })
  const contained = isPoliced({ state })
  const checks = []
  const execs = new Map(
    findExecs({ args }).map((exec) => [exec.from, exec])
  )
  let skip = -1
  for (const [k, arg] of args.entries()) {
    if (k <= skip) continue
    const exec = execs.get(k)
    if (exec !== undefined) {
      skip = exec.to
      checks.push(() =>
        innerCommand({ args: exec.inner, placeholder, state })
      )
    } else if (arg.text === '-delete') {
      checks.push(() =>
        strongestOf({
          items: [...roots, ...patterns],
          judge: (target) =>
            targetFinding({
              contained,
              state,
              target,
              via: 'find -delete in'
            })
        })
      )
    } else if (
      /^-(?:fprint0?|fprintf|fls)$/.test(arg.text) &&
      args[k + 1]
    ) {
      checks.push(() =>
        targetFinding({
          contained,
          state,
          target: args[k + 1],
          via: arg.text
        })
      )
    }
  }
  return firstOfChecks({ checks })
}

const FD_VALUED = [
  '--base-directory',
  '--batch-size',
  '--changed-before',
  '--changed-within',
  '--color',
  '--exact-depth',
  '--exclude',
  '--extension',
  '--ignore-file',
  '--max-depth',
  '--max-results',
  '--min-depth',
  '--owner',
  '--path-separator',
  '--search-path',
  '--size',
  '--threads',
  '--type',
  '-E',
  '-S',
  '-c',
  '-d',
  '-e',
  '-j',
  '-o',
  '-t'
]

const FD_EXEC = new Set(['-x', '--exec', '-X', '--exec-batch'])

/**
 * The command `fd [PATTERN] [PATH...] -x CMD` runs, among fd's `args`
 * ({ text }): `at`, the index of its `-x`, and `inner`, its words; or
 * undefined when fd runs none.
 */
export const fdCommand = ({ args }) => {
  const at = args.findIndex(({ text }) => FD_EXEC.has(text))
  return at < 0
    ? undefined
    : {
        at,
        inner: args.slice(at + 1).filter(({ text }) => text !== ';')
      }
}

// `fd [PATTERN] [PATH...] -x CMD`: like xargs, a command naming no `{}`
// gets the found path appended.
const fdVerdict = ({ args, state }) => {
  const exec = fdCommand({ args })
  if (exec === undefined) return undefined
  const { operands, options } = splitArgs({
    args: args.slice(0, exec.at),
    valued: FD_VALUED
  })
  const root =
    optionValue({
      flags: ['--search-path', '--base-directory'],
      options
    }) ??
    operands[1] ??
    CWD
  const placeholder = below({ root })
  const { inner } = exec
  const named = inner.some(({ text }) => /\{[^}]*\}/.test(text))
  return innerCommand({
    args: named ? inner : [...inner, placeholder],
    placeholder,
    state
  })
}

const XARGS_VALUED =
  /^-[nPLsdEa]$|^--(?:max-args|max-procs|delimiter|arg-file)$/

/**
 * The command xargs runs, among its `args` ({ text }): `start`, the index
 * where it begins, `inner`, its words, and `replace`, the string `-I`
 * names for each input, when one does.
 */
export const xargsCommand = ({ args }) => {
  let skip = -1
  let start = args.length
  let replace
  for (const [k, arg] of args.entries()) {
    if (k <= skip) continue
    const text = arg.text
    if (!text.startsWith('-')) {
      start = k
      break
    }
    if (text === '-I') {
      replace = args[k + 1]?.text
      skip = k + 1
    } else if (/^-I.|^--replace=/.test(text)) {
      replace = text.replace(/^-I|^--replace=/, '')
    } else if (text === '-i' || text === '--replace') replace = '{}'
    else if (XARGS_VALUED.test(text)) skip = k + 1
  }
  return { inner: args.slice(start), replace, start }
}

const xargsVerdict = ({ args, state }) => {
  const { inner, replace } = xargsCommand({ args })
  if (inner.length === 0) return undefined
  const input = {
    raw: '<input>',
    text: UNKNOWN,
    unknown: ['the paths xargs reads from its input']
  }
  return judgeArgs({
    args:
      replace === undefined
        ? [...inner, input]
        : inner.map((arg) => (arg.text.includes(replace) ? input : arg)),
    command: { redirects: [], words: [] },
    producer: undefined,
    state
  })
}

/** The findings of one command's arguments: what it writes and runs. */
export const judgeArgs = ({ args: wrapped, command, producer, state }) => {
  const args = unwrap({ args: wrapped })
  if (args.length === 0) return undefined
  if (args[0].unknown.length > 0) {
    return {
      kind: FINDING_KIND.variable,
      level: opaqueLevel({ state }),
      names: args[0].unknown,
      shape: args[0].raw
    }
  }
  const name = commandName({ arg: args[0] })
  const rest = args.slice(1)
  if (name === 'xargs') return xargsVerdict({ args: rest, state })
  if (name === 'find') return findVerdict({ args: rest, state })
  if (name === 'fd') return fdVerdict({ args: rest, state })
  if (name === 'git') return gitVerdict({ args: rest, state })
  const writer = FILE_WRITERS[name]
  const known =
    writer !== undefined || READERS.has(name) || isKnownProgram({ name })
  if (!known) return unknownProgramVerdict({ args, rest, state })
  const contained =
    isReadOnly({ state }) ||
    (isSurface({ state }) && SURFACE_WRITERS.has(name))
  return firstOfChecks({
    checks: [
      () =>
        writer === undefined
          ? undefined
          : strongestOf({
              items: writer({ args: rest, state }),
              judge: (target) =>
                targetFinding({ contained, state, target, via: name })
            }),
      () => programVerdict({ args, command, name, producer, rest, state })
    ]
  })
}
