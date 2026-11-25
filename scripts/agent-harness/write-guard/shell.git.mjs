// ---------------------------------------------------------------------------
// shell.git — the findings of one git call: `-C` moves the folder it runs
// in; a read-only agent is refused every git write (writers.git.mjs's
// gitWrite); a surface agent stages and commits only its own files and is
// refused a subcommand that rewrites the tree and names a rule path, which
// anyone else is asked about; the pathspecs of checkout, restore, rm, mv and
// clean, and the file archive -o, diff --output and format-patch write, are
// judged as targets.
//
// Ported from the git half of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs; the tree-rewrite ask is new.
// ---------------------------------------------------------------------------

import { splitArgs } from './expansion.mjs'
import { namedRule } from './mentions.mjs'
import {
  changedDirectory,
  firstOfChecks,
  isReadOnly,
  isSurface,
  strongestOf,
  targetFinding
} from './shell.findings.mjs'
import { FINDING_KIND, LEVEL } from './target.mjs'
import {
  gitFileTargets,
  gitTreeTargets,
  gitWrite,
  rewritesTree
} from './writers.git.mjs'

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

// A git subcommand that rewrites the working tree and names a rule path:
// asked of anyone the guard does not police, refused to a surface agent. A
// read-only agent is refused every git write already.
const treeRewriteVerdict = ({ rest, state, sub }) => {
  if (isReadOnly({ state }) || !rewritesTree({ rest, sub }))
    return undefined
  const named = namedRule({
    cwd: state.cwd ?? undefined,
    host: state.host,
    policy: state.policy,
    text: rest.map(({ text }) => text).join(' ')
  })
  if (named?.rule === undefined) return undefined
  return {
    kind: FINDING_KIND.rule,
    level: isSurface({ state }) ? LEVEL.deny : LEVEL.ask,
    rule: named.rule,
    shape: `git ${sub} ${named.token}`
  }
}

export const gitVerdict = ({ args, state }) => {
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
      () => treeRewriteVerdict({ rest, state: scoped, sub }),
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
