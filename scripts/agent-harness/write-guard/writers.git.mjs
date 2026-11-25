// ---------------------------------------------------------------------------
// writers.git — what a git subcommand writes. `gitWrite` names the
// subcommand when it changes the tree, the index, the history or the
// branches, and is undefined when it reads; a read-only agent is refused
// every such write. `gitFileTargets` lists the file a subcommand writes
// when told to (`archive -o`, `--output` of diff and diff-files, -index
// and -tree, log, show, whatchanged and range-diff, `format-patch`,
// `bundle create`). `gitTreeTargets` lists
// the working-tree files a subcommand rewrites from its pathspecs
// (`checkout`, `restore`, `rm`, `mv`, `clean`) and the files and folders
// other writes make (`merge-file`, `config --file`, `init`, `clone`,
// `worktree add`), so anyone is asked before one of them is a rule file.
//
// Ported from the git half of Certifipago's
// .claude/scripts/enforce-agent-writes.mjs; `gitTreeTargets` is new, for
// the rule-file ask the donor does not make.
// ---------------------------------------------------------------------------

import { optionValue, splitArgs } from './expansion.mjs'
import { CWD, nameOf, under } from './writers.folders.mjs'

const GIT_READS = new Set([
  'annotate',
  'blame',
  'cat-file',
  'check-attr',
  'check-ignore',
  'check-ref-format',
  'cherry',
  'count-objects',
  'describe',
  'diff-files',
  'diff-index',
  'diff-tree',
  'difftool',
  'fetch',
  'for-each-ref',
  'fsck',
  'grep',
  'hash-object',
  'help',
  'log',
  'ls-files',
  'ls-remote',
  'ls-tree',
  'merge-base',
  'merge-tree',
  'name-rev',
  'range-diff',
  'rev-list',
  'rev-parse',
  'shortlog',
  'show',
  'show-branch',
  'show-ref',
  'status',
  'var',
  'verify-commit',
  'verify-tag',
  'version',
  'whatchanged'
])
// These write only the file they are told to, which gitFileTargets judges.
const GIT_FILE_WRITERS = new Set(['archive', 'diff', 'format-patch'])
const SUBCOMMAND_READS = {
  bisect: ['log', 'view', 'visualize'],
  bundle: ['create', 'verify', 'list-heads'],
  notes: ['list', 'show'],
  'sparse-checkout': ['list'],
  stash: ['list', 'show'],
  submodule: ['status', 'summary'],
  worktree: ['list']
}
const BRANCH_LISTING =
  /^(?:-[alrv]+|--(?:list|all|remotes|contains|no-contains|merged|no-merged|points-at|show-current|format|sort|column|verbose)(?:=.*)?)$/
const BRANCH_WRITING =
  /^(?:-[dDmMcCfu]|--(?:delete|move|copy|force|set-upstream-to|unset-upstream|edit-description|track)(?:=.*)?)$/
const TAG_WRITING = /^-[dafsum]$|^--(?:delete|annotate|force|sign|message)/
const TAG_LISTING = /^-[lnv]|^--(?:list|contains|merged|points-at|verify)/
const CONFIG_READING =
  /^--(?:get|list|show-origin|get-all|get-regexp|get-urlmatch|get-color)|^-l$/
const CONFIG_WRITING =
  /^--(?:unset|add|replace-all|rename-section|remove-section|edit)|^-e$/
// The config options whose value is the next argument, so it is not read
// as a key or a value.
const CONFIG_VALUED = [
  '--blob',
  '--comment',
  '--default',
  '--file',
  '--type',
  '-f'
]

/**
 * Undefined when the git subcommand `sub` reads; otherwise the subcommand
 * it is, with its own subcommand where it has one (`stash pop`).
 */
export const gitWrite = ({ rest, sub }) => {
  const texts = rest.map(({ text }) => text)
  const positional = texts.filter((text) => !text.startsWith('-'))
  if (
    sub === undefined ||
    GIT_READS.has(sub) ||
    GIT_FILE_WRITERS.has(sub)
  ) {
    return undefined
  }
  if (sub in SUBCOMMAND_READS) {
    return SUBCOMMAND_READS[sub].includes(positional[0])
      ? undefined
      : `${sub} ${positional[0] ?? ''}`.trim()
  }
  if (sub === 'reflog') {
    return ['expire', 'delete'].includes(positional[0]) ? sub : undefined
  }
  if (sub === 'remote') {
    return positional.length === 0 ||
      ['show', 'get-url'].includes(positional[0])
      ? undefined
      : `remote ${positional[0]}`
  }
  if (sub === 'symbolic-ref') {
    return positional.length < 2 && !texts.includes('-d') ? undefined : sub
  }
  if (sub === 'branch') {
    if (texts.some((text) => BRANCH_WRITING.test(text))) return sub
    return positional.length === 0 ||
      texts.some((text) => BRANCH_LISTING.test(text))
      ? undefined
      : sub
  }
  if (sub === 'tag') {
    if (texts.some((text) => TAG_WRITING.test(text))) return sub
    return positional.length === 0 ||
      texts.some((text) => TAG_LISTING.test(text))
      ? undefined
      : sub
  }
  if (sub === 'config') {
    const { operands } = splitArgs({ args: rest, valued: CONFIG_VALUED })
    if (['get', 'list'].includes(operands[0]?.text)) return undefined
    if (texts.some((text) => CONFIG_READING.test(text))) return undefined
    if (texts.some((text) => CONFIG_WRITING.test(text))) return sub
    return operands.length <= 1 ? undefined : sub
  }
  return sub
}

// The subcommands whose `-o` or `--output` names the one file they write.
const OUTPUT_WRITERS = new Set([
  'archive',
  'diff',
  'diff-files',
  'diff-index',
  'diff-tree',
  'log',
  'range-diff',
  'show',
  'whatchanged'
])

// Where `git archive -o`, `git diff --output` and friends write.
export const gitFileTargets = ({ rest, sub }) => {
  const { operands, options } = splitArgs({
    args: rest,
    valued: ['-o', '--output']
  })
  const output = optionValue({
    flags: ['-o', '--output', '--output-directory'],
    options
  })
  if (OUTPUT_WRITERS.has(sub)) return output ? [output] : []
  if (sub === 'format-patch') return [output ?? CWD]
  if (sub === 'bundle' && operands[0]?.text === 'create') {
    return operands.slice(1, 2)
  }
  return []
}

// The options of the tree writers that take the next argument, so that
// value is not read as a pathspec.
const TREE_VALUED = [
  '-b',
  '-B',
  '--orphan',
  '-s',
  '--source',
  '--conflict',
  '--pathspec-from-file',
  '-e',
  '--exclude'
]
// The flags that keep a tree writer to the index, so it rewrites no file.
const INDEX_ONLY = {
  restore: ['--staged', '-S'],
  rm: ['--cached']
}
const WORKTREE_TOO = ['--worktree', '-W']
const TREE_WRITERS = new Set(['checkout', 'clean', 'mv', 'restore', 'rm'])

const CLONE_VALUED = [
  '--branch',
  '--bundle-uri',
  '--config',
  '--depth',
  '--filter',
  '--jobs',
  '--origin',
  '--ref-format',
  '--reference',
  '--reference-if-able',
  '--separate-git-dir',
  '--server-option',
  '--shallow-exclude',
  '--shallow-since',
  '--template',
  '--upload-pack',
  '-b',
  '-c',
  '-j',
  '-o',
  '-u'
]
const INIT_VALUED = [
  '--initial-branch',
  '--object-format',
  '--ref-format',
  '--separate-git-dir',
  '--template',
  '-b'
]
const GIT_SUFFIX = /\.git$/u

// The files and folders the other git writes make: the file merge-file
// merges into unless it prints, the file config --file writes, the
// repository init and clone make (clone's folder is named after the
// repository when none is given), and the worktree add or move makes and
// remove deletes.
const MADE = {
  clone: ({ rest }) => {
    const [repo, dir] = splitArgs({
      args: rest,
      valued: CLONE_VALUED
    }).operands
    if (dir !== undefined || repo === undefined) return dir ? [dir] : []
    const name = nameOf({ path: repo }).replace(GIT_SUFFIX, '')
    return name === '' ? [] : [under({ dir: CWD, name })]
  },
  config: ({ rest }) => {
    const { options } = splitArgs({ args: rest, valued: CONFIG_VALUED })
    const file = optionValue({ flags: ['--file', '-f'], options })
    return file && gitWrite({ rest, sub: 'config' }) !== undefined
      ? [file]
      : []
  },
  init: ({ rest }) =>
    splitArgs({ args: rest, valued: INIT_VALUED }).operands.slice(0, 1),
  'merge-file': ({ rest }) => {
    const { operands, options } = splitArgs({ args: rest, valued: ['-L'] })
    return options.some(({ flag }) => ['-p', '--stdout'].includes(flag))
      ? []
      : operands.slice(0, 1)
  },
  worktree: ({ rest }) => {
    const [verb, ...operands] = splitArgs({
      args: rest,
      valued: ['-B', '-b', '--reason']
    }).operands
    if (verb?.text === 'move') return operands.slice(1, 2)
    return ['add', 'remove'].includes(verb?.text)
      ? operands.slice(0, 1)
      : []
  }
}

/**
 * The working-tree files `git <sub>` rewrites from the pathspecs it names:
 * every operand of checkout, restore, rm, mv and clean, unless the call
 * keeps to the index; and what MADE reads for the other writes.
 */
export const gitTreeTargets = ({ rest, sub }) => {
  if (Object.hasOwn(MADE, sub)) return MADE[sub]({ rest })
  if (!TREE_WRITERS.has(sub)) return []
  const texts = rest.map(({ text }) => text)
  const indexOnly =
    texts.some((text) => (INDEX_ONLY[sub] ?? []).includes(text)) &&
    !texts.some((text) => WORKTREE_TOO.includes(text))
  return indexOnly
    ? []
    : splitArgs({ args: rest, valued: TREE_VALUED }).operands
}

// The subcommands that rewrite working-tree files, with the flags that keep
// one to the index or to a dry run.
const TREE_REWRITERS = new Set([
  'am',
  'apply',
  'checkout',
  'checkout-index',
  'cherry-pick',
  'clean',
  'merge',
  'mv',
  'pull',
  'read-tree',
  'rebase',
  'reset',
  'restore',
  'revert',
  'rm',
  'sparse-checkout',
  'stash',
  'submodule',
  'switch'
])
const TREE_ONLY_WITH = { reset: ['--hard', '--merge', '--keep'] }
const TREE_NEVER_WITH = {
  apply: ['--cached', '--check', '--numstat', '--stat', '--summary']
}

/**
 * Whether `git <sub>` rewrites working-tree files, so that one it names
 * may be a rule file: a git write (gitWrite) that is no index, history or
 * branch change alone.
 */
export const rewritesTree = ({ rest, sub }) => {
  if (gitWrite({ rest, sub }) === undefined || !TREE_REWRITERS.has(sub)) {
    return false
  }
  const texts = rest.map(({ text }) => text)
  const needs = TREE_ONLY_WITH[sub]
  if (needs !== undefined && !texts.some((text) => needs.includes(text))) {
    return false
  }
  const never = TREE_NEVER_WITH[sub] ?? []
  return !texts.some((text) => never.includes(text))
}
