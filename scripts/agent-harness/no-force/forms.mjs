// ---------------------------------------------------------------------------
// forms — the force option one simple command passes, read from its words
// (the program first), for the LAW "A force option is never used"
// (AGENTS.md). Three forms:
//
//   - a long form on any tool, case-insensitive, with one dash or two:
//     `--force`, `--force-with-lease`, every `--force-*`, `-Force`, with or
//     without a value (`--force=x`, `-Force:$true`). An explicit off,
//     `=false` or `:$false`, forces nothing;
//   - `taskkill /F` (`-F`, and the `//F` Git Bash needs), any case;
//   - git's short force options, by the letters each subcommand of
//     GIT_SHORT_FORCE gives that meaning, in a cluster too (`-xfd`), and
//     `git switch --discard-changes`. A letter that takes a value ends its
//     cluster and takes the next word, so `git tag -mfix` and
//     `git tag -F notes.txt` pass; `--` ends git's options.
//
// A wrapper (`sudo`, `env`, `timeout`, ...) is read through to the command
// it runs, with the write guard's own reader of one. The words of `rg`,
// `grep`, `echo` and `printf` are text, never options of a force.
//
// The result is { option, program } or undefined.
// ---------------------------------------------------------------------------

import { commandName, unwrap } from '../write-guard/shell.commands.mjs'

const LONG_FORCE = /^--?force(?:-[^\s=:]*)?(?:[=:](?<value>[\s\S]*))?$/iu
const OFF_VALUE = /^\$?false$/iu
const TASKKILL = 'taskkill'
const TASKKILL_FORCE = /^(?:\/{1,2}|-)f$/iu
const GIT = 'git'
const END_OF_OPTIONS = '--'
const SHORT_CLUSTER = /^-[^-]/u
const NOT_READ = new Set(['echo', 'grep', 'printf', 'rg'])

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

// Per subcommand: the short letters that force, the short letters that
// take a value, the long options that take the next word, and the long
// options that force.
const GIT_SHORT_FORCE = Object.freeze({
  add: { force: 'f' },
  branch: { force: 'fDMC', valued: 'u' },
  checkout: { force: 'fB', valued: 'b' },
  clean: { force: 'f', longValued: ['--exclude'], valued: 'e' },
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

const isLongForce = ({ word }) => {
  const match = LONG_FORCE.exec(word)
  if (match === null) return false
  const value = match.groups?.value
  return value === undefined || !OFF_VALUE.test(value)
}

const longForce = ({ args }) => args.find((word) => isLongForce({ word }))

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

// git's subcommand, past its own options, and the words after it.
const gitSubcommand = ({ args }) => {
  for (let at = 0; at < args.length; at += 1) {
    const word = args[at]
    if (GIT_GLOBAL_VALUED.has(word)) {
      at += 1
    } else if (!word.startsWith('-')) {
      return { rest: args.slice(at + 1), subcommand: word }
    }
  }
  return undefined
}

const gitForce = ({ args }) => {
  const found = gitSubcommand({ args })
  const table = GIT_SHORT_FORCE[found?.subcommand ?? '']
  if (table === undefined) return undefined
  const option = subcommandForce({ args: found.rest, table })
  return option === undefined
    ? undefined
    : { option, program: `${GIT} ${found.subcommand}` }
}

const programOf = ({ name, args }) => {
  if (name !== GIT) return name
  const found = gitSubcommand({ args })
  return found === undefined ? name : `${GIT} ${found.subcommand}`
}

/** The force option the command `words` passes, or undefined. */
export const forceOf = ({ words }) => {
  const [program, ...args] = unwrap({
    args: words.map((text) => ({ text }))
  }).map(({ text }) => text)
  if (program === undefined) return undefined
  const name = commandName({ arg: { text: program } })
  if (NOT_READ.has(name)) return undefined
  if (name === GIT) {
    const short = gitForce({ args })
    if (short !== undefined) return short
  }
  if (name === TASKKILL) {
    const option = args.find((word) => TASKKILL_FORCE.test(word))
    if (option !== undefined) return { option, program: TASKKILL }
  }
  const option = longForce({ args })
  return option === undefined
    ? undefined
    : { option, program: programOf({ args, name }) }
}
