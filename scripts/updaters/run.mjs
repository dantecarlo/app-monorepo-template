#!/usr/bin/env node
// ---------------------------------------------------------------------------
// pnpm updaters:run — runs every updater of .agents/contracts/updaters.json
// that runs where this run does, and turns each one that is out of date
// into one pull request (docs/harness.md section 3i).
//
// It refuses a registry `pnpm verify:updaters` refuses, before it runs
// anything. Then, for each updater whose `runsIn` holds `--where`:
//
//   1. It runs `<command> --check`, which writes nothing. Exit 0: current,
//      nothing more. Exit 1, or any other: failed, no pull request; the run
//      goes on to the next updater and exits 1.
//   2. Exit 2: out of date. On a working tree with no change, it starts
//      detached from `updates/<id>` as the remote holds it, with the
//      default branch (the one gh names) merged in, or from the default
//      branch when the remote holds no `updates/<id>` (branch.mjs), runs
//      `<command>`, then each `verify` command. An update that changes
//      nothing commits nothing. Otherwise it commits the change with a
//      Conventional Commit that carries no attribution, pushes it on top of
//      `updates/<id>` with no force option, so the branch is appended to and
//      never rewritten, and opens one pull request from it, or edits the
//      one already open. Then it returns to the ref it started on. A merge
//      that conflicts opens nothing: one line names the branch and the
//      conflict, the tree returns to its ref, the run goes on to the next
//      updater and exits 1.
//   3. A pull request whose updater declares `proposal: true`, or whose
//      diff touches a path the write guard's `ruleFor` classifies as a rule
//      file, is a draft labelled `rule-proposal`, and its body quotes the
//      LAW "A rule is not edited to fit the work": an updater proposes a
//      rule change, the owner decides it.
//   4. A failed update, verify command, git or gh step stops the run there,
//      commits nothing more and exits 1, and says where the tree is left,
//      for a person to read.
//
// It never merges, approves or enables auto-merge on a pull request, never
// pushes to the default branch, passes no force option (the rule-proposal
// label is made current by label.mjs), and hands git, gh and every updater
// the environment it was given, unchanged.
//
// `git`, `gh` and the shell are passed in, so its suite drives it with
// fakes; this file starts them only from `main`.
//
// Usage:
//   node scripts/updaters/run.mjs [--only <id>] [--where ci|local]
//                                 [--dry-run] [--root <directory>]
//
//   --only     runs the updater with that id alone
//   --where    where this run is: ci or local (the default); an updater
//              whose runsIn does not hold it is skipped
//   --dry-run  runs each check and prints what it would do for each
//              updater out of date; runs no git and no gh
//   --root     the repository to read and run in (the tests use it)
// ---------------------------------------------------------------------------

import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import {
  collectContext,
  gate,
  PLACES,
  ruleOfPath,
  UPDATERS_FILE
} from '../verify-updaters.mjs'
import { startUpdate } from './branch.mjs'
import { ensureLabel } from './label.mjs'
import {
  EXIT,
  firstLine,
  MergeConflict,
  must,
  StepFailed
} from './steps.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const DEFAULT_WHERE = 'local'
const BRANCH_PREFIX = 'updates/'
const DETACHED = 'HEAD'
const COMMIT_WIDTH = 100
const MAX_BUFFER = 64 * 1024 * 1024

export const RULE_PROPOSAL_LABEL = 'rule-proposal'
const LABEL_COLOR = 'b60205'
const LABEL_DESCRIPTION =
  'An updater proposes a rule change; the owner decides it'

// The LAW of AGENTS.md a rule proposal quotes, word for word.
const LAW = 'A rule is not edited to fit the work'
const LAW_TEXT =
  'They change only when the owner asks for that change, in words, as the request.'

const STATUS_ARGS = Object.freeze([
  'status',
  '--porcelain=v1',
  '-z',
  '--untracked-files=all'
])

// Every path of `git status --porcelain=v1 -z`: a rename or a copy names
// its new path, then its old one.
export const changedPaths = ({ porcelain }) => {
  const fields = porcelain.split('\0').filter((field) => field !== '')
  const paths = []
  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index]
    paths.push(field.slice(3))
    if (/[RC]/u.test(field.slice(0, 2))) {
      index += 1
      paths.push(fields[index])
    }
  }
  return paths
}

const wrap = ({ text }) =>
  text.split(' ').reduce((lines, word) => {
    const last = lines.at(-1)
    if (last === undefined) return [word]
    return `${last} ${word}`.length <= COMMIT_WIDTH
      ? [...lines.slice(0, -1), `${last} ${word}`]
      : [...lines, word]
  }, [])

const subjectOf = ({ entry }) => `chore(updates): run the ${entry.id} updater`

const verifiedBy = ({ entry, quote = (text) => text }) =>
  entry.verify.length === 0
    ? 'It declares no verify command.'
    : `Then ${entry.verify.map(quote).join(', ')} passed.`

const commitBodyOf = ({ branch, entry, start }) =>
  wrap({
    text:
      `pnpm updaters:run found ${entry.id} out of date and ran ${entry.command} ` +
      `on ${branch}, ${start.how}. ${verifiedBy({ entry })}`
  }).join('\n')

const reviewsOf = ({ stdout }) =>
  (stdout ?? '')
    .split(/\r?\n/u)
    .map((line) => /^review: (?<path>.+)$/u.exec(line.trim())?.groups.path)
    .filter((path) => path !== undefined)

const bullet = ({ text }) => `- \`${text}\``

const proposalSection = ({ rules }) => [
  '## Rule proposal',
  '',
  rules.length === 0
    ? `Its updater declares \`proposal: true\`, so this pull request opens as a draft labelled \`${RULE_PROPOSAL_LABEL}\`.`
    : `This change touches a rule path, so it opens as a draft labelled \`${RULE_PROPOSAL_LABEL}\`:`,
  ...(rules.length === 0
    ? []
    : ['', ...rules.map(({ path, rule }) => `${bullet({ text: path })}, ${rule.what}`)]),
  '',
  `> **${LAW} — LAW** (\`AGENTS.md\`)`,
  '>',
  `> ${LAW_TEXT}`,
  '',
  'The owner decides: approve the rule change in words, or close this pull request.',
  ''
]

const pullBodyOf = ({ base, branch, changed, entry, proposal, reviews, rules, start }) =>
  [
    `\`pnpm updaters:run\` found \`${entry.id}\` out of date (\`${entry.command} --check\` exited 2). ` +
      `It ran \`${entry.command}\` on \`${branch}\`, ${start.how}. ` +
      verifiedBy({ entry, quote: (text) => `\`${text}\`` }),
    '',
    '## Changed',
    '',
    ...changed.map((path) => bullet({ text: path })),
    '',
    ...(reviews.length === 0
      ? []
      : ['## Review', '', ...reviews.map((path) => bullet({ text: path })), '']),
    ...(proposal ? proposalSection({ rules }) : []),
    '---',
    '',
    'An updater opened this pull request. It never merges, approves or enables auto-merge: a ' +
      `person reviews and merges it. The next run merges \`${base}\` into \`${branch}\` and ` +
      'adds its commit on top, never rewriting it, so a commit pushed to it by hand stays.'
  ].join('\n')

const backArgs = ({ original }) =>
  original.branch === undefined
    ? ['checkout', '--detach', original.sha]
    : ['checkout', original.branch]

// Once per run, before the first branch moves: the tree has no change, the
// ref to return to, and the default branch.
const prepare = ({ env, gh, git }) => {
  const status = must({
    result: git({ args: [...STATUS_ARGS], env }),
    what: 'git status'
  })
  const dirty = changedPaths({ porcelain: status.stdout })
  if (dirty.length > 0) {
    throw new StepFailed(
      `the working tree has changes (${dirty.join(', ')}); commit or set them aside ` +
        'first, since an update switches branches'
    )
  }
  const head = must({
    result: git({ args: ['rev-parse', '--abbrev-ref', 'HEAD'], env }),
    what: 'git rev-parse --abbrev-ref HEAD'
  }).stdout.trim()
  if (head.startsWith(BRANCH_PREFIX)) {
    throw new StepFailed(
      `the run is on ${head}, a branch the updaters push to; switch to another branch first`
    )
  }
  const original =
    head === DETACHED
      ? {
          sha: must({
            result: git({ args: ['rev-parse', 'HEAD'], env }),
            what: 'git rev-parse HEAD'
          }).stdout.trim()
        }
      : { branch: head }
  const base = must({
    result: gh({
      args: [
        'repo',
        'view',
        '--json',
        'defaultBranchRef',
        '--jq',
        '.defaultBranchRef.name'
      ],
      env
    }),
    what: 'gh repo view'
  }).stdout.trim()
  if (base === '') throw new StepFailed('gh names no default branch')
  return { base, original }
}

const openPull = ({ base, body, branch, env, gh, proposal, title }) => {
  const listed = must({
    result: gh({
      args: ['pr', 'list', '--head', branch, '--state', 'open', '--json', 'number'],
      env
    }),
    what: `gh pr list --head ${branch}`
  })
  const [open] = JSON.parse(listed.stdout || '[]')
  if (proposal) {
    ensureLabel({
      color: LABEL_COLOR,
      description: LABEL_DESCRIPTION,
      env,
      gh,
      name: RULE_PROPOSAL_LABEL
    })
  }
  if (open === undefined) {
    const created = must({
      result: gh({
        args: [
          'pr',
          'create',
          '--base',
          base,
          '--head',
          branch,
          '--title',
          title,
          '--body',
          body,
          ...(proposal ? ['--draft', '--label', RULE_PROPOSAL_LABEL] : [])
        ],
        env
      }),
      what: 'gh pr create'
    })
    return `opened ${created.stdout.trim()}`
  }
  must({
    result: gh({
      args: [
        'pr',
        'edit',
        String(open.number),
        '--title',
        title,
        '--body',
        body,
        ...(proposal ? ['--add-label', RULE_PROPOSAL_LABEL] : [])
      ],
      env
    }),
    what: `gh pr edit ${open.number}`
  })
  if (proposal) {
    must({
      result: gh({ args: ['pr', 'ready', String(open.number), '--undo'], env }),
      what: `gh pr ready ${open.number} --undo`
    })
  }
  return `updated pull request #${open.number}`
}

// One out-of-date updater, from the default branch to its pull request.
// Returns what it did; throws a StepFailed that says where the tree is.
const propose = ({ entry, env, gh, git, policy, session, sh }) => {
  const { base, original } = session
  const branch = `${BRANCH_PREFIX}${entry.id}`
  const start = startUpdate({
    back: backArgs({ original }),
    base,
    branch,
    env,
    git
  })
  const left =
    '; nothing was committed and no pull request opened; the tree is left detached where ' +
    `the update of ${branch} ran`
  const run = ({ command }) => {
    const result = sh({ command, env })
    if (result.status === EXIT.current) return result
    const why = firstLine({ text: result.stderr })
    throw new StepFailed(
      `\`${command}\` exited ${result.status}${why === '' ? '' : `: ${why}`}${left}`
    )
  }
  const update = run({ command: entry.command })
  const changed = changedPaths({
    porcelain: must({
      result: git({ args: [...STATUS_ARGS], env }),
      what: 'git status'
    }).stdout
  })
  if (changed.length === 0) {
    must({ result: git({ args: backArgs({ original }), env }), what: 'git checkout' })
    return `changed nothing against ${start.against}; no pull request`
  }
  entry.verify.forEach((command) => run({ command }))

  const rules = changed
    .map((path) => ({ path, rule: ruleOfPath({ path, policy }) }))
    .filter(({ rule }) => rule !== undefined)
  const proposal = entry.proposal === true || rules.length > 0
  const title = subjectOf({ entry })
  must({ result: git({ args: ['add', '--all'], env }), what: 'git add' })
  must({
    result: git({
      args: [
        'commit',
        '--message',
        title,
        '--message',
        commitBodyOf({ branch, entry, start })
      ],
      env
    }),
    what: 'git commit'
  })
  must({
    result: git({
      args: ['push', 'origin', `HEAD:refs/heads/${branch}`],
      env
    }),
    what: `git push origin ${branch}`
  })
  const done = openPull({
    base,
    body: pullBodyOf({
      base,
      branch,
      changed,
      entry,
      proposal,
      reviews: reviewsOf({ stdout: update.stdout }),
      rules,
      start
    }),
    branch,
    env,
    gh,
    proposal,
    title
  })
  must({ result: git({ args: backArgs({ original }), env }), what: 'git checkout' })
  return done
}

const planOf = ({ entry }) => {
  const branch = `${BRANCH_PREFIX}${entry.id}`
  const verify =
    entry.verify.length === 0 ? '' : `, then ${entry.verify.join(', ')}`
  const pull = entry.proposal
    ? `a draft labelled ${RULE_PROPOSAL_LABEL}`
    : `ready for review, or a draft labelled ${RULE_PROPOSAL_LABEL} if its diff touches a rule path`
  return (
    `updaters: [dry run] ${entry.id} would merge the default branch into ${branch}, or start ` +
    `it from the default branch, run ${entry.command}${verify}, commit "${subjectOf({ entry })}", ` +
    `push ${branch} without force and open or update one pull request, ${pull}`
  )
}

export const runUpdaters = ({
  context,
  dryRun = false,
  env = process.env,
  gh,
  git,
  only,
  print = console.log,
  sh,
  warn = console.error,
  where = DEFAULT_WHERE
}) => {
  if (!PLACES.includes(where)) {
    warn(`updaters: --where must be one of ${PLACES.join(', ')}, not "${where}"`)
    return { code: EXIT.failed }
  }
  const findings = gate.run(context)
  if (findings.length > 0) {
    warn(
      `updaters: ${UPDATERS_FILE} has ${findings.length} problem(s), so no updater ran (pnpm verify:updaters):`
    )
    findings.forEach(({ detail }) => warn(`  ${detail}`))
    return { code: EXIT.failed }
  }
  const { updaters } = context.registry
  if (only !== undefined && !updaters.some(({ id }) => id === only)) {
    warn(
      `updaters: no updater of ${UPDATERS_FILE} has the id "${only}"; it holds ` +
        updaters.map(({ id }) => id).join(', ')
    )
    return { code: EXIT.failed }
  }

  const tally = { current: 0, failed: 0, outdated: 0, skipped: 0 }
  let session = null
  for (const entry of updaters.filter(
    ({ id }) => only === undefined || id === only
  )) {
    if (!entry.runsIn.includes(where)) {
      tally.skipped += 1
      print(`updaters: ${entry.id} runs in ${entry.runsIn.join(', ')}, not ${where}; skipped`)
      continue
    }
    const check = sh({ command: `${entry.command} --check`, env })
    if (check.status === EXIT.current) {
      tally.current += 1
      print(`updaters: ${entry.id} is current`)
      continue
    }
    if (check.status !== EXIT.outdated) {
      tally.failed += 1
      warn(
        `updaters: ${entry.id} failed its check (\`${entry.command} --check\` exited ` +
          `${check.status ?? 'without a status'}); no pull request opened`
      )
      continue
    }
    tally.outdated += 1
    print(`updaters: ${entry.id} is out of date`)
    if (dryRun) {
      print(planOf({ entry }))
      continue
    }
    try {
      session ??= prepare({ env, gh, git })
      print(
        `updaters: ${entry.id} ${propose({ entry, env, gh, git, policy: context.policy, session, sh })}`
      )
    } catch (error) {
      if (!(error instanceof StepFailed)) throw error
      tally.failed += 1
      warn(`updaters: ${entry.id}: ${error.message}`)
      // A conflict leaves the tree on its ref, so the next updater can run.
      if (error instanceof MergeConflict) continue
      warn('updaters: the run stopped there; no other updater ran')
      break
    }
  }

  print(
    `updaters: ${tally.current} current, ${tally.outdated} out of date, ${tally.failed} failed, ` +
      `${tally.skipped} skipped, where ${where}`
  )
  if (dryRun) print('updaters: dry run; no git or gh command ran')
  return { code: tally.failed > 0 ? EXIT.failed : EXIT.current }
}

const readOptions = () =>
  parseArgs({
    options: {
      'dry-run': { default: false, type: 'boolean' },
      only: { type: 'string' },
      root: { default: REPO_ROOT, type: 'string' },
      where: { default: DEFAULT_WHERE, type: 'string' }
    },
    strict: true
  }).values

const main = () => {
  const options = readOptions()
  const root = resolve(options.root)
  const spawn = ({ args, command, env, shell }) => {
    const result = spawnSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      env,
      maxBuffer: MAX_BUFFER,
      shell
    })
    return {
      status: result.error ? null : result.status,
      stderr: result.error ? result.error.message : result.stderr,
      stdout: result.stdout ?? ''
    }
  }
  const { code } = runUpdaters({
    context: collectContext({ root }),
    dryRun: options['dry-run'],
    gh: ({ args, env }) => spawn({ args, command: 'gh', env, shell: false }),
    git: ({ args, env }) => spawn({ args, command: 'git', env, shell: false }),
    only: options.only,
    // The updater's own output goes to the log as it would from a terminal.
    sh: ({ command, env }) => {
      const result = spawn({ args: [], command, env, shell: true })
      process.stdout.write(result.stdout)
      process.stderr.write(result.stderr)
      return result
    },
    where: options.where
  })
  process.exitCode = code
}

if (import.meta.main) main()
