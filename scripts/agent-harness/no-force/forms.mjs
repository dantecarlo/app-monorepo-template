// ---------------------------------------------------------------------------
// forms — the option one simple command passes that forces or skips a
// check, read from its words (the program first, with any assignments
// before it), for the LAW "A check is never forced or skipped" (AGENTS.md):
//
//   - a long form on any tool, case-insensitive, with one dash or two:
//     `--force`, `--force-with-lease`, every `--force-*`, `-Force`, with or
//     without a value (`--force=x`, `-Force:$true`), and `--no-verify`. An
//     explicit off, `=false` or `:$false`, forces nothing. A prefix git
//     and getopt read as the option itself, from `--fo` and `--no-v` up
//     (`--forc`, `--no-verif`), and in PowerShell from `-Fo` up, which is
//     how PowerShell binds an abbreviated parameter;
//   - `taskkill /F` (`-F`, and the `//F` Git Bash needs), any case;
//   - git's short options that force or skip, by the letters each
//     subcommand of GIT_SHORT gives that meaning (`commit -n` is
//     `--no-verify`), in a cluster too (`-xfd`), and
//     `git switch --discard-changes`. A letter that takes a value ends its
//     cluster and takes the next word, so `git tag -mfix` and
//     `git tag -F notes.txt` pass; `--` ends git's options;
//   - a git setting that moves the hooks away: `core.hooksPath` through
//     `git -c` or `--config-env` on any subcommand, and every write form
//     of `git config` (a value, `--add`, `--replace-all`, `--unset`,
//     `set`, `unset`, and removing or renaming the `core` section);
//     reading it passes;
//   - `rm` with an `f` among its short options (`-f`, `-rf`);
//   - `HUSKY=0`, which skips every git hook, only where it sets the
//     environment: an assignment before a command or a wrapper's (`env`,
//     `sudo`), an `export` or `declare` argument, and PowerShell's
//     `$env:HUSKY = 0`, `${env:HUSKY} = 0` and `Set-Item env:HUSKY 0`;
//     PowerShell's .NET call is huskyCallForce's.
//
// A wrapper (`sudo`, `env`, `timeout`, ...) is read through to the command
// it runs, with the write guard's own reader of one. `--` ends the options
// of any program. The words of `rg`, `grep`, `git grep`, `echo`, `printf`,
// `Write-Output`, `Write-Host` and `Select-String` are text, never options,
// and those of `[[`, `[` and `test` the operands of a condition.
//
// The result is { option, program } or undefined.
// ---------------------------------------------------------------------------

import { commandName, unwrap } from '../write-guard/shell.commands.mjs'

/** The languages a command is read in. */
export const LANGUAGE = Object.freeze({
  bash: 'bash',
  powershell: 'powershell'
})

const LONG_FORCE = /^--?force(?:-[^\s=:]*)?(?:[=:](?<value>[\s\S]*))?$/iu
const LONG_OPTION =
  /^(?<dashes>--?)(?<name>[^\s=:]+)(?:[=:](?<value>[\s\S]*))?$/u
const OFF_VALUE = /^\$?false$/iu
const LONG_SKIP = /^--no-verify(?:=[\s\S]*)?$/iu
const DOUBLE_DASH = '--'
const SINGLE_DASH = '-'
// The refused long options an abbreviation stands for, from the shortest
// prefix read as one; `oneDash` also reads PowerShell's `-Fo`.
const ABBREVIATED = Object.freeze([
  { from: 'fo', name: 'force', oneDash: true },
  { from: 'no-v', name: 'no-verify', oneDash: false }
])
const HUSKY_OFF = 'HUSKY=0'
const POWERSHELL_HUSKY_OFF = /^\$(?:env:HUSKY|\{env:HUSKY\})=0$/iu
const ENV_ITEM = /^env:[\\/]?HUSKY$/iu
const ITEM_SETTERS = new Set(['new-item', 'ni', 'set-item', 'si'])
const OFF_TEXT = '0'
const SET_VARIABLE = /\]::SetEnvironmentVariable$/iu
const HUSKY_CALL = /^HUSKY,0(?:,|$)/iu
const ASSIGNMENT = /^[A-Za-z_]\w*\+?=/u
const DECLARATIONS = new Set([
  'declare',
  'export',
  'local',
  'readonly',
  'typeset'
])
const TASKKILL = 'taskkill'
const TASKKILL_FORCE = /^(?:\/{1,2}|-)f$/iu
const GIT = 'git'
const GIT_CONFIG = 'config'
const GIT_GREP = 'grep'
const END_OF_OPTIONS = '--'
// The runners whose first `--` forwards what follows as options.
const FORWARDING = new Set([
  'bun',
  'bunx',
  'npm',
  'npx',
  'pnpm',
  'pnpx',
  'yarn'
])
const SHORT_CLUSTER = /^-[^-]/u
const NOT_READ = new Set([
  '[',
  '[[',
  'echo',
  'grep',
  'printf',
  'rg',
  'select-string',
  'sls',
  'test',
  'write',
  'write-host',
  'write-output'
])

// git's own options before the subcommand that take the next word.
const GIT_GLOBAL_VALUED = new Set([
  '-C',
  '-c',
  '--config-env',
  '--git-dir',
  '--namespace',
  '--super-prefix',
  '--work-tree'
])
const CONFIG_SETTING = '-c'
const CONFIG_ENV = '--config-env'
const HOOKS_PATH = /^core\.hookspath(?:=|$)/iu
const HOOKS_KEY = /^core\.hookspath$/iu
const CORE_SECTION = /^core$/iu

// `git config`: the options that take the next word, the ones that only
// read, the ones that write the key they name, and the ones that write a
// whole section; and the same verbs as subcommands (`git config set`).
const CONFIG_VALUED = new Set([
  '--blob',
  '--comment',
  '--default',
  '--file',
  '--type',
  '--url',
  '--value',
  '-f'
])
const CONFIG_READS = new Set([
  '--get',
  '--get-all',
  '--get-color',
  '--get-colorbool',
  '--get-regexp',
  '--get-urlmatch',
  '--list',
  '-l',
  'get',
  'list'
])
const CONFIG_KEY_WRITES = new Set([
  '--add',
  '--replace-all',
  '--unset',
  '--unset-all',
  'set',
  'unset'
])
const CONFIG_SECTION_WRITES = new Set([
  '--remove-section',
  '--rename-section',
  'remove-section',
  'rename-section'
])
const CONFIG_VERBS = new Set([
  'edit',
  'get',
  'list',
  'remove-section',
  'rename-section',
  'set',
  'unset'
])

// Per subcommand: the short letters that force or skip, the short letters
// that take a value, the long options that take the next word, and the
// long options that force.
const GIT_SHORT = Object.freeze({
  add: { force: 'f' },
  branch: { force: 'fDMC', valued: 'u' },
  checkout: { force: 'fB', valued: 'b' },
  clean: { force: 'f', longValued: ['--exclude'], valued: 'e' },
  commit: {
    force: 'n',
    longValued: [
      '--author',
      '--date',
      '--file',
      '--fixup',
      '--message',
      '--reedit-message',
      '--reuse-message',
      '--squash',
      '--template',
      '--trailer'
    ],
    valued: 'CFcmt'
  },
  fetch: { force: 'f', longValued: ['--server-option'], valued: 'jo' },
  mv: { force: 'f' },
  push: { force: 'f', longValued: ['--push-option'], valued: 'o' },
  rm: { force: 'f' },
  switch: { force: 'fC', long: ['--discard-changes'], valued: 'c' },
  tag: {
    force: 'f',
    longValued: ['--file', '--local-user', '--message'],
    valued: 'Fmu'
  },
  worktree: { force: 'f', longValued: ['--reason'], valued: 'bB' }
})

// Programs other than git whose short letters force, read as git's are.
const PROGRAM_SHORT = Object.freeze({ rm: { force: 'f' } })

const isOff = ({ value }) => value !== undefined && OFF_VALUE.test(value)

const isAbbreviated = ({ language, word }) => {
  const match = LONG_OPTION.exec(word)
  if (match === null || isOff({ value: match.groups.value })) return false
  const { dashes, name } = match.groups
  const lower = name.toLowerCase()
  return ABBREVIATED.some(
    (option) =>
      (dashes === DOUBLE_DASH ||
        (dashes === SINGLE_DASH &&
          option.oneDash &&
          language === LANGUAGE.powershell)) &&
      lower.length >= option.from.length &&
      option.name.startsWith(lower)
  )
}

const isLongForce = ({ language, word }) => {
  if (LONG_SKIP.test(word)) return true
  const match = LONG_FORCE.exec(word)
  if (match !== null) return !isOff({ value: match.groups?.value })
  return isAbbreviated({ language, word })
}

// The options of `args`: every word before a `--` that ends them. A runner
// that forwards (`pnpm run x -- --force`, `npx -- git push --force`) hands
// the words after its first `--` to the script or the command it runs, as
// options, so only a second `--` ends them.
const optionsOf = ({ args, name }) => {
  const first = args.indexOf(END_OF_OPTIONS)
  const words =
    FORWARDING.has(name) && first >= 0 ? args.toSpliced(first, 1) : args
  const end = words.indexOf(END_OF_OPTIONS)
  return end < 0 ? words : words.slice(0, end)
}

const longForce = ({ args, language, name }) =>
  optionsOf({ args, name }).find((word) => isLongForce({ language, word }))

const withoutAssignments = ({ words }) => {
  const start = words.findIndex((word) => !ASSIGNMENT.test(word))
  return start < 0 ? [] : words.slice(start)
}

/**
 * The command the `words` of one simple command run, past the assignments
 * and wrappers before it, and `at`, the index where it starts.
 */
export const commandOf = ({ words }) => {
  const command = unwrap({
    args: withoutAssignments({ words }).map((text) => ({ text }))
  }).map(({ text }) => text)
  return { at: words.length - command.length, command }
}

// The assignments that set the environment of the command `words` run:
// those before it or a wrapper (`env`), and the arguments of `export`.
const environmentOf = ({ at, command, words }) => {
  const declared =
    command.length > 0 &&
    DECLARATIONS.has(commandName({ arg: { text: command[0] } }))
      ? command.slice(1)
      : []
  return [...words.slice(0, at), ...declared].filter((word) =>
    ASSIGNMENT.test(word)
  )
}

// Whether a PowerShell statement sets HUSKY=0: `$env:HUSKY = 0`, or an
// item cmdlet on `env:HUSKY` with the value 0.
const powershellSkipsHooks = ({ args, name, words }) =>
  POWERSHELL_HUSKY_OFF.test(words.join('')) ||
  (ITEM_SETTERS.has(name) &&
    args.some((word) => ENV_ITEM.test(word)) &&
    args.includes(OFF_TEXT))

// What one short cluster says: `force` when a forcing letter comes before
// any letter that takes a value, and `takesNext` when it ends on one.
const readCluster = ({ table, word }) => {
  const letters = word.slice(1)
  for (const [at, letter] of [...letters].entries()) {
    if (table.force.includes(letter)) return { force: true }
    if ((table.valued ?? '').includes(letter)) {
      return { force: false, takesNext: at === letters.length - 1 }
    }
  }
  return { force: false, takesNext: false }
}

// The option of `table` that forces among `args`, or undefined.
const subcommandForce = ({ args, table }) => {
  for (let at = 0; at < args.length; at += 1) {
    const word = args[at]
    if (word === END_OF_OPTIONS) return undefined
    if ((table.long ?? []).includes(word)) return word
    if ((table.longValued ?? []).includes(word)) {
      at += 1
    } else if (SHORT_CLUSTER.test(word)) {
      const cluster = readCluster({ table, word })
      if (cluster.force) return word
      if (cluster.takesNext) at += 1
    }
  }
  return undefined
}

// A global option that points `core.hooksPath` elsewhere, as typed.
const hooksSetting = ({ value, word }) => {
  if (word === CONFIG_SETTING || word === CONFIG_ENV) {
    return HOOKS_PATH.test(value ?? '') ? `${word} ${value}` : undefined
  }
  return word.startsWith(`${CONFIG_ENV}=`) &&
    HOOKS_PATH.test(word.slice(CONFIG_ENV.length + 1))
    ? word
    : undefined
}

// git's subcommand, past its own options, the words after it, and `hooks`,
// a global option among them that moves the hooks away.
const gitSubcommand = ({ args }) => {
  let hooks
  for (let at = 0; at < args.length; at += 1) {
    const word = args[at]
    hooks ??= hooksSetting({ value: args[at + 1], word })
    if (GIT_GLOBAL_VALUED.has(word)) {
      at += 1
    } else if (!word.startsWith('-')) {
      return { hooks, rest: args.slice(at + 1), subcommand: word }
    }
  }
  return { hooks, rest: [], subcommand: undefined }
}

// The key or section a `git config` call writes that holds
// `core.hooksPath`, as typed, or undefined when it only reads.
const configHooks = ({ args }) => {
  const options = []
  const operands = []
  for (let at = 0; at < args.length; at += 1) {
    const word = args[at]
    if (CONFIG_VALUED.has(word)) at += 1
    else if (word.startsWith('-')) options.push(word)
    else operands.push(word)
  }
  const verb = CONFIG_VERBS.has(operands[0]) ? operands[0] : undefined
  const named = verb === undefined ? operands : operands.slice(1)
  const verbs = [...options, ...(verb === undefined ? [] : [verb])]
  if (verbs.some((word) => CONFIG_READS.has(word))) return undefined
  if (verbs.some((word) => CONFIG_SECTION_WRITES.has(word))) {
    return CORE_SECTION.test(named[0] ?? '') ? named[0] : undefined
  }
  const writes =
    verbs.some((word) => CONFIG_KEY_WRITES.has(word)) || named.length > 1
  return writes && HOOKS_KEY.test(named[0] ?? '') ? named[0] : undefined
}

const programOf = ({ args, name }) => {
  if (name !== GIT) return name
  const { subcommand } = gitSubcommand({ args })
  return subcommand === undefined ? name : `${GIT} ${subcommand}`
}

/** The name a reason gives the command `words` run (`git push`, `npm`). */
export const programLabel = ({ words }) => {
  const { command } = commandOf({ words })
  if (command.length === 0) return words[0] ?? ''
  return programOf({
    args: command.slice(1),
    name: commandName({ arg: { text: command[0] } })
  })
}

// What git itself is told that forces, skips or moves the hooks away.
const gitForce = ({ args }) => {
  const found = gitSubcommand({ args })
  const program = programOf({ args, name: GIT })
  if (found.hooks !== undefined) return { option: found.hooks, program }
  if (found.subcommand === GIT_CONFIG) {
    const key = configHooks({ args: found.rest })
    return key === undefined ? undefined : { option: key, program }
  }
  if (found.subcommand === GIT_GREP) return { text: true }
  const table = GIT_SHORT[found.subcommand ?? '']
  if (table === undefined) return undefined
  const option = subcommandForce({ args: found.rest, table })
  return option === undefined ? undefined : { option, program }
}

/**
 * The option the command `words` pass that forces or skips, or undefined;
 * `language` is the one they were read in.
 */
export const forceOf = ({ language = LANGUAGE.bash, words }) => {
  const { at, command } = commandOf({ words })
  const environment = environmentOf({ at, command, words })
  const [program, ...args] = command
  if (program === undefined) {
    return environment.includes(HUSKY_OFF)
      ? { option: HUSKY_OFF, program: words[0] }
      : undefined
  }
  const name = commandName({ arg: { text: program } })
  const label = () => programOf({ args, name })
  if (
    environment.includes(HUSKY_OFF) ||
    (language === LANGUAGE.powershell &&
      powershellSkipsHooks({ args, name, words: command }))
  ) {
    return { option: HUSKY_OFF, program: label() }
  }
  if (NOT_READ.has(name)) return undefined
  if (Object.hasOwn(PROGRAM_SHORT, name)) {
    const option = subcommandForce({ args, table: PROGRAM_SHORT[name] })
    if (option !== undefined) return { option, program: name }
  }
  if (name === GIT) {
    const found = gitForce({ args })
    if (found?.text) return undefined
    if (found !== undefined) return found
  }
  if (name === TASKKILL) {
    const option = args.find((word) => TASKKILL_FORCE.test(word))
    if (option !== undefined) return { option, program: TASKKILL }
  }
  const option = longForce({ args, language, name })
  return option === undefined ? undefined : { option, program: label() }
}

/**
 * The HUSKY=0 a PowerShell .NET call sets: `call`, the statement that
 * ends on `[Environment]::SetEnvironmentVariable`, and `args`, the words
 * of the parenthesis after it (`'HUSKY','0'`). Undefined for any other.
 */
export const huskyCallForce = ({ args, call }) => {
  const method = call.at(-1) ?? ''
  return SET_VARIABLE.test(method) && HUSKY_CALL.test(args.join(''))
    ? {
        option: HUSKY_OFF,
        program: commandName({ arg: { text: method } })
      }
    : undefined
}
