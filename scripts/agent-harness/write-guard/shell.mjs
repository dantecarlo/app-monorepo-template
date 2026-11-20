// ---------------------------------------------------------------------------
// shell — the write guard's judgement of one Bash command: its line
// continuations removed (continuations.mjs), read by the tokenizer, and
// walked command by command, carrying what one command sets to the next.
//
// A variable resolves only from an assignment earlier in the same command,
// since Bash calls share no shell state; `cd`, `pushd` and `popd` move the
// folder later relative paths resolve against; `for` and `select` make
// every later command that reads the loop variable judged once per item;
// `read` sets its names to SAFE. Substitutions, here-docs that expand,
// groups and the commands inside `$(( ))` are judged by the same rules.
// Each simple command goes to shell.commands.mjs.
//
// The result is one finding (target.mjs's LEVEL and the details its reason
// needs) or undefined. A command it cannot parse is one `unreadable`
// finding: a deny for a policed agent, opaque for anyone else. A target
// spelling paths.mjs cannot read throws, for decide to judge.
//
// Ported from the script walk of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs.
// ---------------------------------------------------------------------------

import { joinContinuations } from './continuations.mjs'
import { expand, known, splitArgs } from './expansion.mjs'
import { absolutePath, classify, TARGET_KIND } from './paths.mjs'
import { SAFE, UNKNOWN } from './scan.mjs'
import { commandName, judgeArgs } from './shell.commands.mjs'
import {
  changedDirectory,
  firstOfChecks,
  isPoliced,
  strongestOf,
  targetFinding
} from './shell.findings.mjs'
import { LEVEL } from './target.mjs'
import { createParser, KEYWORDS } from './tokenizer.mjs'

const LOOP_ITEMS_JUDGED = 32
const ASSIGNMENT = /^([A-Za-z_]\w*)\+?=/
const DECLARATIONS = new Set([
  'declare',
  'export',
  'local',
  'readonly',
  'typeset'
])
const READERS = new Set(['mapfile', 'read', 'readarray'])
const READ_VALUED = ['-p', '-d', '-n', '-N', '-t', '-u', '-a', '-C', '-c']
const SPLIT_OPENER =
  "a line continuation splits `$(`, `$'`, `$((` or `<<`; write the opener on one line"

const isAssignment = ({ word }) => {
  const part = word.parts[0]
  return (
    part !== undefined &&
    'lit' in part &&
    !part.quoted &&
    ASSIGNMENT.test(part.lit)
  )
}

const assign = ({ state, word }) => {
  const [first, ...others] = word.parts
  const name = ASSIGNMENT.exec(first.lit)?.[1] ?? ''
  const value = { ...first, lit: first.lit.replace(ASSIGNMENT, '') }
  state.vars.set(
    name,
    expand({ state, word: { parts: [value, ...others], raw: word.raw } })
  )
}

// Every command substitution a word runs, those inside `$(( ))` included.
const nestedVerdict = ({ state, word }) =>
  strongestOf({
    items: word.parts.flatMap((part) =>
      'sub' in part ? [part.sub] : (part.subs ?? [])
    ),
    judge: (script) =>
      judgeScript({
        script,
        state: { ...state, vars: new Map(state.vars) }
      })
  })

const heredocVerdict = ({ redirect, state }) => {
  const body = redirect.heredoc?.body ?? ''
  if (!redirect.heredoc?.expand || !/[$`]/.test(body)) return undefined
  try {
    const parts = createParser({ source: body }).parseExpanding()
    return nestedVerdict({ state, word: { parts, raw: '' } })
  } catch (error) {
    // A body the tokenizer cannot read is data, as Bash prints it.
    if (error?.unreadable) return undefined
    throw error
  }
}

const isWritingRedirect = ({ redirect }) =>
  redirect.target !== undefined &&
  !['<', '<<<', 'dup'].includes(redirect.op)

const redirectVerdict = ({ redirects, state }) =>
  strongestOf({
    items: redirects.filter((redirect) => isWritingRedirect({ redirect })),
    judge: (redirect) =>
      targetFinding({
        contained: isPoliced({ state }),
        state,
        target: expand({ state, word: redirect.target }),
        via: `${redirect.fd ?? ''}${redirect.op}`
      })
  })

const changeDirectory = ({ args, name, state }) => {
  const target = args.find(
    ({ text }) => !text.startsWith('-') || text === '-'
  )
  if (name === 'popd' || target?.text === '-') {
    state.cwd = null
    return
  }
  const text = target ? target.text : (state.host.homeDir ?? UNKNOWN)
  state.cwd = changedDirectory({ cwd: state.cwd, host: state.host, text })
}

const targetsOf = ({ command }) => [
  ...command.words,
  ...command.redirects.flatMap((redirect) =>
    redirect.target ? [redirect.target] : []
  )
]

// The loop variable a command reads whose items are all known.
const loopVariable = ({ command, state }) =>
  targetsOf({ command })
    .flatMap((word) => word.parts)
    .map((part) => ('param' in part ? part.param : undefined))
    .find((name) => name !== undefined && state.vars.get(name)?.items)

// What the command itself does, once its substitutions are judged.
const ownVerdict = ({ command, producer, state }) => {
  const start = command.words.findIndex((word) => !KEYWORDS.has(word.raw))
  const words = start < 0 ? [] : command.words.slice(start)
  const head = words[0]?.raw
  if (head === undefined || head === 'case' || head === 'function') {
    return undefined
  }
  if (head === 'for' || head === 'select') {
    // `for g in a b c`: each later command using $g is judged per item.
    const [, , keyword, ...list] = words
    const values =
      keyword?.raw === 'in'
        ? list.map((word) => expand({ state, word }))
        : []
    const items = values.every((value) => value.unknown.length === 0)
      ? values.map((value) => value.text)
      : undefined
    if (words[1]) {
      state.vars.set(words[1].raw, { items, text: SAFE, unknown: [] })
    }
    return undefined
  }
  const first = words.findIndex((word) => !isAssignment({ word }))
  const declaring = DECLARATIONS.has(words[first]?.raw ?? '')
  if (first < 0 || declaring) {
    words
      .slice(declaring ? first + 1 : 0)
      .filter((word) => isAssignment({ word }))
      .forEach((word) => assign({ state, word }))
    return undefined
  }
  const args = words.slice(first).map((word) => expand({ state, word }))
  const name = commandName({ arg: args[0] })
  if (name === 'cd' || name === 'pushd' || name === 'popd') {
    changeDirectory({ args: args.slice(1), name, state })
    return undefined
  }
  if (READERS.has(name)) {
    splitArgs({
      args: args.slice(1),
      valued: READ_VALUED
    }).operands.forEach((operand) =>
      state.vars.set(operand.text, known({ text: SAFE }))
    )
    return undefined
  }
  return judgeArgs({ args, command, producer, state })
}

const judgeOnce = ({ command, producer, state }) =>
  firstOfChecks({
    checks: [
      () =>
        strongestOf({
          items: targetsOf({ command }),
          judge: (word) => nestedVerdict({ state, word })
        }),
      () =>
        strongestOf({
          items: command.redirects,
          judge: (redirect) => heredocVerdict({ redirect, state })
        }),
      () => redirectVerdict({ redirects: command.redirects, state }),
      () => ownVerdict({ command, producer, state })
    ]
  })

const judgeCommand = ({ command, producer, state }) => {
  const looped = loopVariable({ command, state })
  if (looped === undefined) return judgeOnce({ command, producer, state })
  const loop = state.vars.get(looped)
  const found = strongestOf({
    items: loop.items.slice(0, LOOP_ITEMS_JUDGED),
    judge: (item) => {
      const vars = new Map(state.vars)
      vars.set(looped, known({ text: item }))
      return judgeOnce({ command, producer, state: { ...state, vars } })
    }
  })
  if (found?.level === LEVEL.deny || loop.items.length === 0) return found
  // Once more on the real state, already judged above, so that an
  // assignment or a `cd` in the loop body persists.
  state.vars.set(looped, known({ text: loop.items[0] }))
  judgeOnce({ command, producer, state })
  state.vars.set(looped, loop)
  return found
}

const judgeScript = ({ script, state }) =>
  strongestOf({
    items: [...script.entries()],
    judge: ([k, item]) => {
      const previous = script[k - 1]
      const producer =
        previous?.type === 'cmd' && ['|', '|&'].includes(previous.op)
          ? previous
          : undefined
      if (item.type === 'cmd') {
        return judgeCommand({ command: item, producer, state })
      }
      return firstOfChecks({
        checks: [
          () =>
            judgeScript({
              script: item.script,
              state: { ...state, vars: new Map(state.vars) }
            }),
          () => redirectVerdict({ redirects: item.redirects, state })
        ]
      })
    }
  })

const parsed = ({ source }) => {
  const joined = joinContinuations({ source })
  if (joined.split) return { deep: false, problem: SPLIT_OPENER }
  try {
    return {
      script: createParser({ source: joined.text }).parseAll()
    }
  } catch (error) {
    if (!error?.unreadable) throw error
    return { deep: error.deep === true, problem: String(error.message) }
  }
}

const judgeSource = ({ source, state }) => {
  const { deep, problem, script } = parsed({ source })
  if (script) return judgeScript({ script, state })
  return {
    deep,
    kind: 'unreadable',
    level: isPoliced({ state }) ? LEVEL.deny : LEVEL.opaque,
    problem
  }
}

/**
 * The finding for the Bash `command` run in `cwd` (the payload's, or the
 * checkout the hook runs from) by `actor`, or undefined.
 */
export const judgeBash = ({ actor, command, cwd, host, policy }) => {
  const start = absolutePath({ host, text: cwd ?? host.ownRoot })
  let root
  const state = {
    actor,
    cwd: start,
    host,
    policy,
    // The checkout `git rev-parse --show-toplevel` prints.
    rootOf: () => {
      if (root === undefined) {
        const where = classify({ host, text: start })
        root = where.kind === TARGET_KIND.repo ? where.root : null
      }
      return root ?? undefined
    },
    vars: new Map()
  }
  // A command inline code starts: judged in the folder it runs from, with
  // no variables, as a Bash call of its own.
  state.judgeText = ({ command: text }) =>
    judgeSource({
      source: text,
      state: { ...state, vars: new Map() }
    })
  return judgeSource({ source: command, state })
}
