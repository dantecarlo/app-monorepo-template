// ---------------------------------------------------------------------------
// readers — the programs the guard knows only read, and the finding for a
// program it knows nothing about, so the guard fails closed on a writer it
// has never met (`dos2unix`, a project binary, an editor).
//
// A read-only agent is refused an unknown program when an argument names a
// path outside the OS temp dir: a word with a separator, a glob, a word
// built from what the guard cannot see, or the name of something that
// exists. Anyone else gets an opaque finding carrying the program's words,
// and decide asks only when one of them names a rule path. A value attached
// to a short option (`-oAGENTS.md`) counts as a word only when it is a rule
// path, which a read-only agent is refused as it is. The readers are
// the donor's workflow commands: the text tools, git's and pnpm's read forms
// (judged elsewhere), and the shell's own builtins.
// ---------------------------------------------------------------------------

import { hasGlob } from './globs.mjs'
import {
  absolutePath,
  cachedClassify,
  isDeadline,
  TARGET_KIND
} from './paths.mjs'
import { ACTOR_KIND } from './policy.mjs'
import { UNKNOWN } from './scan.mjs'
import { FINDING_KIND, LEVEL, ruleOf } from './target.mjs'

export const READERS = new Set([
  ':',
  '[',
  '[[',
  'alias',
  'basename',
  'bat',
  'cat',
  'cksum',
  'cmp',
  'column',
  'comm',
  'cut',
  'cygpath',
  'date',
  'df',
  'diff',
  'dir',
  'dirname',
  'du',
  'echo',
  'egrep',
  'exit',
  'expand',
  'false',
  'fgrep',
  'file',
  'fmt',
  'fold',
  'getconf',
  'grep',
  'hash',
  'head',
  'help',
  'hexdump',
  'hostname',
  'id',
  'jobs',
  'join',
  'jq',
  'kill',
  'less',
  'locale',
  'ls',
  'man',
  'md5sum',
  'more',
  'nl',
  'nproc',
  'od',
  'paste',
  'ping',
  'printenv',
  'printf',
  'ps',
  'pwd',
  'readlink',
  'realpath',
  'return',
  'rev',
  'rg',
  'sdiff',
  'seq',
  'set',
  'sha1sum',
  'sha256sum',
  'sha512sum',
  'shasum',
  'shift',
  'sleep',
  'sort',
  'stat',
  'strings',
  'tac',
  'tail',
  'test',
  'tr',
  'trap',
  'tree',
  'true',
  'type',
  'uname',
  'unexpand',
  'uniq',
  'unset',
  'uptime',
  'wait',
  'wc',
  'where',
  'whereis',
  'which',
  'whoami',
  'yes'
])

const SEPARATORS = /[\\/]/u
const LONG_VALUE = /^--[^=]+=(.*)$/su

/**
 * The words of an argument list that may name a path: every operand, and
 * the value of a `--option=value`; a bare option names none.
 */
export const pathWordsOf = ({ args }) =>
  args.flatMap((arg) => {
    const value = LONG_VALUE.exec(arg.text)
    if (value) return [{ ...arg, text: value[1] }]
    return arg.text.startsWith('-') ? [] : [arg]
  })

// `-oFILE`: a short option with its value attached.
const ATTACHED = /^-[A-Za-z](.+)$/su

// The values attached to short options (`-oAGENTS.md`) that are rule
// paths. Only a rule path counts, so `-Wall` and `-O2` stay options.
const attachedRules = ({ rest, state }) =>
  rest.flatMap((arg) => {
    const value = ATTACHED.exec(arg.text)?.[1]
    if (value === undefined || value.includes(UNKNOWN)) return []
    try {
      const rule = ruleOf({
        holds: true,
        policy: state.policy,
        where: cachedClassify({
          cwd: state.cwd ?? undefined,
          host: state.host,
          text: value
        })
      })
      return rule === undefined ? [] : [{ ...arg, text: value }]
    } catch (error) {
      if (isDeadline({ error })) throw error
      // A value that is no path the guard can read names no rule.
      return []
    }
  })

// Whether a read-only agent's unknown program would write outside scratch
// through `word`.
const namesOutside = ({ state, word }) => {
  const { text } = word
  if (text.includes(UNKNOWN) || hasGlob({ pattern: text })) return true
  const { cwd, host } = state
  try {
    const named =
      SEPARATORS.test(text) ||
      host.exists?.({
        path: absolutePath({ cwd: cwd ?? undefined, host, text })
      }) === true
    if (!named) return false
    const { kind } = cachedClassify({ cwd: cwd ?? undefined, host, text })
    return kind === TARGET_KIND.repo || kind === TARGET_KIND.outside
  } catch (error) {
    if (isDeadline({ error })) throw error
    // A word that is no path the guard can read, a URL among them.
    return false
  }
}

/**
 * The finding for a program the guard knows nothing about: `args` its
 * expanded words, `rest` those after its name.
 */
export const unknownProgramVerdict = ({ args, rest, state }) => {
  const shape = args[0].raw
  const attached = attachedRules({ rest, state })
  if (state.actor.kind !== ACTOR_KIND.readOnly) {
    return {
      kind: FINDING_KIND.program,
      level: LEVEL.opaque,
      shape,
      words: [...rest, ...attached].map(({ text }) => text)
    }
  }
  // A rule path is never scratch, so an attached one is refused as it is.
  const named =
    attached[0] ??
    pathWordsOf({ args: rest }).find((word) =>
      namesOutside({ state, word })
    )
  return named === undefined
    ? undefined
    : {
        kind: FINDING_KIND.program,
        level: LEVEL.deny,
        shape,
        token: named.raw
      }
}
