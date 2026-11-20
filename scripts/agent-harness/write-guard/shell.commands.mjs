// ---------------------------------------------------------------------------
// shell.commands — the findings of one simple Bash command, its words
// already expanded: the files it writes (writers*.mjs), each judged as a
// target (target.mjs), and the programs whose writes the guard does not
// read, which a read-only agent is refused and which are opaque for anyone
// else (decide then asks only when the command names a rule path).
//
// A wrapper (`timeout`, `env`, `sudo`, ...) is read through to the command
// it runs; `find -exec`, `fd -x` and `xargs` run their inner command on the
// paths they find; `git -C` moves the folder git runs in. A surface agent
// is held to its surface for the commands that write its own files
// (SURFACE_WRITERS), redirects, find, and `git add` and `git commit`; its
// other programs are its workflow, as in the donor. The programs whose
// writes the guard does not read are shell.programs.mjs's, and what the
// parts share is shell.findings.mjs's.
//
// Ported from the judging half of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import { optionValue, splitArgs } from './expansion.mjs'
import { SAFE, UNKNOWN } from './scan.mjs'
import {
  changedDirectory,
  firstOfChecks,
  isPoliced,
  isReadOnly,
  isSurface,
  opaqueLevel,
  strongestOf,
  targetFinding
} from './shell.findings.mjs'
import { programVerdict } from './shell.programs.mjs'
import { FINDING_KIND, LEVEL } from './target.mjs'
import { CWD, FILE_WRITERS, SURFACE_WRITERS } from './writers.mjs'
import {
  gitFileTargets,
  gitTreeTargets,
  gitWrite
} from './writers.git.mjs'

const MAX_WRAPPERS = 8

const WRAPPERS = {
  builtin: [],
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

const BRACES = /{[^}]*}/g

// Runs a command with `{}` standing for the files find, fd or xargs feed it.
const innerCommand = ({ args, placeholder, state }) =>
  judgeArgs({
    args: args.map((arg) =>
      /\{[^}]*\}/.test(arg.text)
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

const findVerdict = ({ args, state }) => {
  const firstExpression = args.findIndex(({ text }) => /^[-(!]/.test(text))
  const starts =
    firstExpression < 0 ? args : args.slice(0, firstExpression)
  const roots = starts.length > 0 ? starts : [CWD]
  const placeholder = below({ root: roots[0] })
  const contained = isPoliced({ state })
  const checks = []
  let skip = -1
  for (const [k, arg] of args.entries()) {
    if (k <= skip) continue
    if (arg.text === '-delete') {
      checks.push(() =>
        strongestOf({
          items: roots,
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
    } else if (/^-(?:exec|execdir|ok|okdir)$/.test(arg.text)) {
      const end = args.findIndex(
        (one, j) => j > k && (one.text === ';' || one.text === '+')
      )
      skip = end < 0 ? args.length : end
      const inner = args.slice(k + 1, end < 0 ? undefined : end)
      checks.push(() => innerCommand({ args: inner, placeholder, state }))
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

// `fd [PATTERN] [PATH...] -x CMD`: like xargs, a command naming no `{}`
// gets the found path appended.
const fdVerdict = ({ args, state }) => {
  const at = args.findIndex(({ text }) =>
    ['-x', '--exec', '-X', '--exec-batch'].includes(text)
  )
  if (at < 0) return undefined
  const { operands, options } = splitArgs({
    args: args.slice(0, at),
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
  const inner = args.slice(at + 1).filter(({ text }) => text !== ';')
  const named = inner.some(({ text }) => /\{[^}]*\}/.test(text))
  return innerCommand({
    args: named ? inner : [...inner, placeholder],
    placeholder,
    state
  })
}

const XARGS_VALUED =
  /^-[nPLsdEa]$|^--(?:max-args|max-procs|delimiter|arg-file)$/

const xargsVerdict = ({ args, state }) => {
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
  const inner = args.slice(start)
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

const GIT_VALUED = new Set([
  '--config-env',
  '--git-dir',
  '--namespace',
  '--work-tree',
  '-c'
])

const COMMIT_VALUED = [
  '--author',
  '--cleanup',
  '--date',
  '--file',
  '--fixup',
  '--message',
  '--squash',
  '--template',
  '-C',
  '-F',
  '-c',
  '-m',
  '-t'
]

// A surface agent stages and commits only its own files.
const surfaceGitVerdict = ({ rest, state, sub }) => {
  const texts = rest.map(({ text }) => text)
  const outside = ({ shape }) => ({
    kind: FINDING_KIND.surface,
    level: LEVEL.deny,
    shape
  })
  const judge =
    ({ via }) =>
    (target) =>
      targetFinding({ contained: true, state, target, via })
  if (sub === 'add') {
    const { operands } = splitArgs({ args: rest, valued: ['--chmod'] })
    // With no pathspec, `-A`, `-u` and `.` alike stage the whole tree.
    if (
      operands.length === 0 ||
      texts.some((text) => text.startsWith('--pathspec-from-file'))
    ) {
      return outside({ shape: `git add ${texts.join(' ')}`.trim() })
    }
    return strongestOf({
      items: operands,
      judge: judge({ via: 'git add' })
    })
  }
  if (sub === 'commit') {
    if (
      texts.some((text) => /^-[a-zA-Z]*a[a-zA-Z]*$|^--all$/.test(text))
    ) {
      return outside({ shape: 'git commit -a' })
    }
    return strongestOf({
      items: splitArgs({ args: rest, valued: COMMIT_VALUED }).operands,
      judge: judge({ via: 'git commit' })
    })
  }
  return undefined
}

const gitVerdict = ({ args, state }) => {
  let skip = -1
  let at = args.length
  let cwd = state.cwd
  for (const [k, arg] of args.entries()) {
    if (k <= skip) continue
    if (!arg.text.startsWith('-')) {
      at = k
      break
    }
    if (arg.text === '-C' && args[k + 1]) {
      cwd = changedDirectory({
        cwd,
        host: state.host,
        text: args[k + 1].text
      })
      skip = k + 1
    } else if (GIT_VALUED.has(arg.text)) skip = k + 1
  }
  const sub = args[at]?.text
  const rest = args.slice(at + 1)
  const scoped = { ...state, cwd }
  return firstOfChecks({
    checks: [
      () => {
        const changing = isReadOnly({ state })
          ? gitWrite({ rest, sub })
          : undefined
        return changing === undefined
          ? undefined
          : { kind: 'git', level: LEVEL.deny, shape: `git ${changing}` }
      },
      () =>
        isSurface({ state })
          ? surfaceGitVerdict({ rest, state: scoped, sub })
          : undefined,
      () =>
        strongestOf({
          items: gitTreeTargets({ rest, sub }),
          judge: (target) =>
            targetFinding({
              contained: false,
              state: scoped,
              target,
              via: `git ${sub}`
            })
        }),
      () =>
        strongestOf({
          items: gitFileTargets({ rest, sub }),
          judge: (target) =>
            targetFinding({
              contained: isReadOnly({ state }),
              state: scoped,
              target,
              via: `git ${sub} -o`
            })
        })
    ]
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
