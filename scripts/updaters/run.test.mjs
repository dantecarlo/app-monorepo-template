#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for `pnpm updaters:run`. Every case drives the runner with fake
// `git`, `gh` and shell functions over a small fake repository: the shell
// answers each updater's check, update and verify commands as the case
// scripts them, `git status` reports what the update wrote, and `gh pr list`
// the pull requests the case keeps open. Each fake records every call, so a
// case asserts the calls in the order they were made. The registry is a
// synthetic one, judged under the write guard's real policy, so a rule path
// is one the guard itself would ask about.
//
// No case starts git, gh or an updater: the last two cases read every call
// the suite recorded and prove none merges a pull request, approves,
// enables auto-merge, pushes the default branch, sets ATL_WRITE_GUARD or
// passes a force option, which the no-force hook's own reader (forms.mjs)
// judges, or a `+` refspec. Two process cases run
// the runner over a scratch tree in the OS temp directory, which
// `withScratchTree` removes, on paths that start nothing.
//
// Usage:
//   node --test scripts/updaters/run.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { forceOf } from '../agent-harness/no-force/forms.mjs'
import { POLICY_FILE } from '../agent-harness/write-guard/policy.mjs'
import { withScratchTree } from '../gate/scratch.mjs'
import { UPDATERS_FILE } from '../verify-updaters.mjs'
import { RULE_PROPOSAL_LABEL, runUpdaters } from './run.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '../..')
const RUNNER = join(HERE, 'run.mjs')
const POLICY_TEXT = readFileSync(join(REPO_ROOT, POLICY_FILE), 'utf8')
const POLICY = JSON.parse(POLICY_TEXT)

const PASSED = 0
const FAILED = 1
const OUTDATED = 2
const BASE = 'main'
const LAW = 'A rule is not edited to fit the work'
const LAW_TEXT =
  'They change only when the owner asks for that change, in words, as the request.'
const BODY = '<body>'

// What the runner hands every child: an environment with no ATL_WRITE_GUARD.
const ENV = Object.freeze({ PATH: '/usr/bin' })

const SCRIPTS = {
  'mcp:docs': 'node scripts/update-mcp-docs.mjs',
  'skills:sync': 'node scripts/skills-sync.mjs',
  'verify:mcp-docs': 'node scripts/verify-mcp-docs.mjs',
  'verify:skills': 'node scripts/verify-skills.mjs'
}

const MCP_DOCS = {
  command: 'pnpm mcp:docs',
  id: 'mcp-docs',
  network: ['registry.npmjs.org'],
  proposal: false,
  runsIn: ['ci'],
  secrets: [],
  verify: ['pnpm verify:mcp-docs'],
  writes: ['docs/mcp.md']
}

const SKILLS = {
  command: 'pnpm skills:sync',
  id: 'skills',
  network: ['github.com'],
  proposal: true,
  runsIn: ['ci', 'local'],
  secrets: [],
  verify: ['pnpm verify:skills'],
  writes: ['.claude/skills-lock.json']
}

const contextOf = ({ updaters = [MCP_DOCS] } = {}) => ({
  policy: POLICY,
  registry: { updaters },
  scripts: SCRIPTS
})

const STATUS_ARGS = ['status', '--porcelain=v1', '-z', '--untracked-files=all']

// Every call any case made, read by the last case.
const everyCall = []

const porcelainOf = ({ paths }) =>
  paths.map((path) => ` M ${path}\0`).join('')

/**
 * A fake repository and the three tools that reach it. `checks` maps an
 * updater's command to its check's exit code; `updates` maps it to what
 * its update writes, its exit code and its stdout; `verifies` maps a
 * verify command to its exit code; `pulls` are the numbers of the open pull
 * requests from updates/<id>, by id; `remote` the ids whose updates/<id>
 * the remote holds; `conflicts` the paths a merge conflicts in; `labels`
 * the labels `gh label list` returns.
 */
const fakeOf = ({
  branch = BASE,
  checks = {},
  conflicts = [],
  dirty = [],
  labels = [],
  pulls = {},
  remote = [],
  updates = {},
  verifies = {}
} = {}) => {
  const calls = []
  const state = { changes: [...dirty] }
  const ok = (stdout = '') => ({ status: PASSED, stderr: '', stdout })
  const record = ({ call, env }) => {
    calls.push(call)
    everyCall.push({ ...call, env })
  }
  const sh = ({ command, env }) => {
    record({ call: { command, tool: 'sh' }, env })
    if (command.endsWith(' --check')) {
      const status = checks[command.replace(/ --check$/u, '')] ?? PASSED
      return { status, stderr: '', stdout: '' }
    }
    if (Object.hasOwn(updates, command)) {
      const { status = PASSED, stdout = '', writes = [] } = updates[command]
      state.changes = [...state.changes, ...writes]
      return { status, stderr: status === PASSED ? '' : 'it broke', stdout }
    }
    const status = verifies[command] ?? PASSED
    return { status, stderr: status === PASSED ? '' : 'drift', stdout: '' }
  }
  const git = ({ args, env }) => {
    record({ call: { args, tool: 'git' }, env })
    if (args[0] === 'status') return ok(porcelainOf({ paths: state.changes }))
    if (args[0] === 'rev-parse') return ok(`${branch}\n`)
    if (args[0] === 'commit') state.changes = []
    if (args[0] === 'ls-remote') {
      const ref = args.at(-1)
      const held = remote.includes(ref.replace('refs/heads/updates/', ''))
      return ok(held ? `0123abc\t${ref}\n` : '')
    }
    if (args[0] === 'merge' && args[1] !== '--abort' && conflicts.length > 0)
      return {
        status: FAILED,
        stderr: `CONFLICT (content): Merge conflict in ${conflicts[0]}`,
        stdout: ''
      }
    if (args[0] === 'diff')
      return ok(conflicts.map((path) => `${path}\n`).join(''))
    return ok()
  }
  const gh = ({ args, env }) => {
    record({ call: { args, tool: 'gh' }, env })
    if (args[0] === 'repo') return ok(`${BASE}\n`)
    if (args[0] === 'label' && args[1] === 'list')
      return ok(JSON.stringify(labels))
    if (args[0] === 'pr' && args[1] === 'list') {
      const id = args[args.indexOf('--head') + 1].replace('updates/', '')
      return ok(
        JSON.stringify(
          (pulls[id] ?? []).map((number) => ({ number }))
        )
      )
    }
    if (args[0] === 'pr' && args[1] === 'create')
      return ok('https://github.com/acme/app/pull/12\n')
    return ok()
  }
  return { calls, gh, git, sh }
}

const runWith = ({ context = contextOf(), fake, ...options }) => {
  const lines = { errors: [], out: [] }
  const { code } = runUpdaters({
    context,
    env: ENV,
    gh: fake.gh,
    git: fake.git,
    print: (line) => lines.out.push(line),
    sh: fake.sh,
    warn: (line) => lines.errors.push(line),
    ...options
  })
  return { code, ...lines }
}

const indexesOf = ({ args, flag }) =>
  args
    .map((arg, index) => (arg === flag ? index : -1))
    .filter((index) => index !== -1)

// A call as a short line, the long texts of a commit (its second message)
// and of a pull request (its body) replaced by BODY so the order reads at
// a glance.
const lineOf = (call) => {
  if (call.tool === 'sh') return `sh ${call.command}`
  const [, body] = indexesOf({ args: call.args, flag: '--message' })
  const hidden = new Set(
    [...indexesOf({ args: call.args, flag: '--body' }), body]
      .filter((index) => index !== undefined)
      .map((index) => index + 1)
  )
  return [
    call.tool,
    ...call.args.map((arg, index) => (hidden.has(index) ? BODY : arg))
  ].join(' ')
}

const linesOf = ({ fake }) => fake.calls.map(lineOf)

const valueAfter = ({ call, flag, nth = 0 }) =>
  call.args[indexesOf({ args: call.args, flag })[nth] + 1]

const callNamed = ({ fake, tool, words }) =>
  fake.calls.find(
    (call) =>
      call.tool === tool &&
      words.every((word, index) => call.args[index] === word)
  )

const STATUS = `git ${STATUS_ARGS.join(' ')}`
const PREPARE = [
  STATUS,
  'git rev-parse --abbrev-ref HEAD',
  'gh repo view --json defaultBranchRef --jq .defaultBranchRef.name'
]
const lookUp = ({ id }) => [
  `git fetch origin refs/heads/${BASE}:refs/remotes/origin/${BASE}`,
  `git ls-remote --heads origin refs/heads/updates/${id}`
]
const switchTo = ({ id }) => [
  ...lookUp({ id }),
  `git checkout --detach origin/${BASE}`
]
const mergeInto = ({ id }) => [
  ...lookUp({ id }),
  `git fetch origin refs/heads/updates/${id}:refs/remotes/origin/updates/${id}`,
  `git checkout --detach origin/updates/${id}`,
  `git merge --no-edit origin/${BASE}`
]
const commitAndPush = ({ id }) => [
  'git add --all',
  `git commit --message chore(updates): run the ${id} updater --message ${BODY}`,
  `git push origin HEAD:refs/heads/updates/${id}`,
  `gh pr list --head updates/${id} --state open --json number`
]
const LABEL_DESCRIPTION =
  'An updater proposes a rule change; the owner decides it'
const LABEL_LIST = `gh label list --search ${RULE_PROPOSAL_LABEL} --json name,color,description`
const LABEL_CREATE = `gh label create ${RULE_PROPOSAL_LABEL} --color b60205 --description ${LABEL_DESCRIPTION}`
const LABEL_EDIT = `gh label edit ${RULE_PROPOSAL_LABEL} --color b60205 --description ${LABEL_DESCRIPTION}`

test('a current updater runs its check and nothing else', () => {
  const fake = fakeOf()

  const result = runWith({ fake, where: 'ci' })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(linesOf({ fake }), ['sh pnpm mcp:docs --check'])
  assert.ok(result.out.includes('updaters: mcp-docs is current'), result.out)
})

test('an updater that does not run where the run does is skipped and runs nothing', () => {
  const fake = fakeOf({ checks: { 'pnpm mcp:docs': OUTDATED } })

  const result = runWith({ fake })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(fake.calls, [])
  assert.ok(
    result.out.includes('updaters: mcp-docs runs in ci, not local; skipped'),
    result.out
  )
})

test('--only runs that updater alone', () => {
  const fake = fakeOf()

  const result = runWith({
    context: contextOf({ updaters: [MCP_DOCS, SKILLS] }),
    fake,
    only: 'skills',
    where: 'ci'
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(linesOf({ fake }), ['sh pnpm skills:sync --check'])
})

test('--only naming no updater exits 1 and runs nothing', () => {
  const fake = fakeOf()

  const result = runWith({ fake, only: 'dependencies', where: 'ci' })

  assert.equal(result.code, FAILED)
  assert.deepEqual(fake.calls, [])
  assert.deepEqual(result.errors, [
    `updaters: no updater of ${UPDATERS_FILE} has the id "dependencies"; it holds mcp-docs`
  ])
})

test('a registry the gate refuses runs nothing and exits 1', () => {
  const fake = fakeOf()

  const result = runWith({
    context: contextOf({
      updaters: [{ ...MCP_DOCS, writes: ['AGENTS.md'] }]
    }),
    fake,
    where: 'ci'
  })

  assert.equal(result.code, FAILED)
  assert.deepEqual(fake.calls, [])
  assert.equal(
    result.errors[0],
    `updaters: ${UPDATERS_FILE} has 1 problem(s), so no updater ran (pnpm verify:updaters):`
  )
  assert.match(result.errors[1], /mcp-docs: writes AGENTS\.md, the LAWs/u)
})

test('an out-of-date updater opens one pull request from updates/<id>', () => {
  const fake = fakeOf({
    checks: { 'pnpm mcp:docs': OUTDATED },
    updates: {
      'pnpm mcp:docs': {
        stdout: 'mcp-docs: expo expo-mcp 0.3.0 (was 0.2.0)\nreview: docs/expo.md\n',
        writes: ['docs/mcp.md']
      }
    }
  })

  const result = runWith({ fake, where: 'ci' })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(linesOf({ fake }), [
    'sh pnpm mcp:docs --check',
    ...PREPARE,
    ...switchTo({ id: 'mcp-docs' }),
    'sh pnpm mcp:docs',
    STATUS,
    'sh pnpm verify:mcp-docs',
    ...commitAndPush({ id: 'mcp-docs' }),
    `gh pr create --base ${BASE} --head updates/mcp-docs --title chore(updates): run the mcp-docs updater --body ${BODY}`,
    `git checkout ${BASE}`
  ])
  const commit = callNamed({ fake, tool: 'git', words: ['commit'] })
  const message = valueAfter({ call: commit, flag: '--message', nth: 1 })
  assert.match(message, /found mcp-docs out of date and ran pnpm mcp:docs/u)
  assert.ok(
    message.split('\n').every((line) => line.length <= 100),
    message
  )
  assert.doesNotMatch(message, /co-authored-by|generated with/iu)
  const create = callNamed({ fake, tool: 'gh', words: ['pr', 'create'] })
  const body = valueAfter({ call: create, flag: '--body' })
  assert.match(body, /- `docs\/mcp\.md`/u)
  assert.match(body, /## Review\n\n- `docs\/expo\.md`/u)
  assert.match(body, /never merges, approves or enables auto-merge/u)
  assert.ok(!body.includes(LAW), body)
  assert.ok(!create.args.includes('--draft'), create.args)
  assert.ok(
    result.out.includes(
      'updaters: mcp-docs opened https://github.com/acme/app/pull/12'
    ),
    result.out
  )
})

test('an out-of-date updater with an open pull request updates it', () => {
  const fake = fakeOf({
    checks: { 'pnpm mcp:docs': OUTDATED },
    pulls: { 'mcp-docs': [7] },
    updates: { 'pnpm mcp:docs': { writes: ['docs/mcp.md'] } }
  })

  const result = runWith({ fake, where: 'ci' })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(linesOf({ fake }).slice(-2), [
    `gh pr edit 7 --title chore(updates): run the mcp-docs updater --body ${BODY}`,
    `git checkout ${BASE}`
  ])
  assert.equal(
    callNamed({ fake, tool: 'gh', words: ['pr', 'create'] }),
    undefined
  )
  assert.ok(
    result.out.includes('updaters: mcp-docs updated pull request #7'),
    result.out
  )
})

test('an update that changes nothing commits nothing and opens nothing', () => {
  const fake = fakeOf({
    checks: { 'pnpm mcp:docs': OUTDATED },
    updates: { 'pnpm mcp:docs': { writes: [] } }
  })

  const result = runWith({ fake, where: 'ci' })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(linesOf({ fake }), [
    'sh pnpm mcp:docs --check',
    ...PREPARE,
    ...switchTo({ id: 'mcp-docs' }),
    'sh pnpm mcp:docs',
    STATUS,
    `git checkout ${BASE}`
  ])
  assert.ok(
    result.out.includes(
      `updaters: mcp-docs changed nothing against ${BASE}; no pull request`
    ),
    result.out
  )
})

test('a working tree with changes is refused before any branch moves', () => {
  const fake = fakeOf({
    checks: { 'pnpm mcp:docs': OUTDATED },
    dirty: ['apps/web/src/app/page.tsx']
  })

  const result = runWith({ fake, where: 'ci' })

  assert.equal(result.code, FAILED)
  assert.deepEqual(linesOf({ fake }), ['sh pnpm mcp:docs --check', STATUS])
  assert.match(
    result.errors.join('\n'),
    /the working tree has changes \(apps\/web\/src\/app\/page\.tsx\)/u
  )
})

test('a diff that touches a rule path opens a draft labelled rule-proposal that quotes the LAW', () => {
  const fake = fakeOf({
    checks: { 'pnpm mcp:docs': OUTDATED },
    updates: {
      'pnpm mcp:docs': {
        writes: ['docs/mcp.md', '.agents/contracts/mcp-servers.json']
      }
    }
  })

  const result = runWith({ fake, where: 'ci' })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(linesOf({ fake }).slice(-5), [
    'gh pr list --head updates/mcp-docs --state open --json number',
    LABEL_LIST,
    LABEL_CREATE,
    `gh pr create --base ${BASE} --head updates/mcp-docs --title chore(updates): run the mcp-docs updater --body ${BODY} --draft --label ${RULE_PROPOSAL_LABEL}`,
    `git checkout ${BASE}`
  ])
  const create = callNamed({ fake, tool: 'gh', words: ['pr', 'create'] })
  const body = valueAfter({ call: create, flag: '--body' })
  assert.match(
    body,
    /- `\.agents\/contracts\/mcp-servers\.json`, a contract/u
  )
  assert.ok(body.includes(`> **${LAW} — LAW** (\`AGENTS.md\`)`), body)
  assert.ok(body.includes(`> ${LAW_TEXT}`), body)
})

test('an updater that declares proposal true opens a draft labelled rule-proposal', () => {
  const fake = fakeOf({
    checks: { 'pnpm skills:sync': OUTDATED },
    updates: { 'pnpm skills:sync': { writes: ['docs/skills.md'] } }
  })

  const result = runWith({
    context: contextOf({ updaters: [SKILLS] }),
    fake,
    where: 'local'
  })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  const create = callNamed({ fake, tool: 'gh', words: ['pr', 'create'] })
  assert.deepEqual(create.args.slice(-3), [
    '--draft',
    '--label',
    RULE_PROPOSAL_LABEL
  ])
  const body = valueAfter({ call: create, flag: '--body' })
  assert.match(body, /Its updater declares `proposal: true`/u)
  assert.ok(body.includes(LAW_TEXT), body)
})

test('an open pull request that becomes a rule proposal is labelled and turned into a draft', () => {
  const fake = fakeOf({
    checks: { 'pnpm mcp:docs': OUTDATED },
    pulls: { 'mcp-docs': [7] },
    updates: { 'pnpm mcp:docs': { writes: ['AGENTS.md'] } }
  })

  const result = runWith({ fake, where: 'ci' })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(linesOf({ fake }).slice(-5), [
    LABEL_LIST,
    LABEL_CREATE,
    `gh pr edit 7 --title chore(updates): run the mcp-docs updater --body ${BODY} --add-label ${RULE_PROPOSAL_LABEL}`,
    'gh pr ready 7 --undo',
    `git checkout ${BASE}`
  ])
})

test('a failed check opens nothing, reports the failure and the run checks the next updater', () => {
  const fake = fakeOf({ checks: { 'pnpm mcp:docs': FAILED } })

  const result = runWith({
    context: contextOf({ updaters: [MCP_DOCS, SKILLS] }),
    fake,
    where: 'ci'
  })

  assert.equal(result.code, FAILED)
  assert.deepEqual(linesOf({ fake }), [
    'sh pnpm mcp:docs --check',
    'sh pnpm skills:sync --check'
  ])
  assert.ok(
    result.errors.includes(
      'updaters: mcp-docs failed its check (`pnpm mcp:docs --check` exited 1); no pull request opened'
    ),
    result.errors
  )
  assert.ok(result.out.includes('updaters: skills is current'), result.out)
})

test('a failing verify command commits nothing and opens nothing', () => {
  const fake = fakeOf({
    checks: { 'pnpm mcp:docs': OUTDATED, 'pnpm skills:sync': OUTDATED },
    updates: { 'pnpm mcp:docs': { writes: ['docs/mcp.md'] } },
    verifies: { 'pnpm verify:mcp-docs': FAILED }
  })

  const result = runWith({
    context: contextOf({ updaters: [MCP_DOCS, SKILLS] }),
    fake,
    where: 'ci'
  })

  assert.equal(result.code, FAILED)
  assert.deepEqual(linesOf({ fake }), [
    'sh pnpm mcp:docs --check',
    ...PREPARE,
    ...switchTo({ id: 'mcp-docs' }),
    'sh pnpm mcp:docs',
    STATUS,
    'sh pnpm verify:mcp-docs'
  ])
  assert.match(
    result.errors.join('\n'),
    /mcp-docs: `pnpm verify:mcp-docs` exited 1: drift; nothing was committed and no pull request opened; the tree is left detached where the update of updates\/mcp-docs ran/u
  )
})

test('an existing updates/<id> gets the default branch merged in and the update on top, pushed without force', () => {
  const fake = fakeOf({
    checks: { 'pnpm mcp:docs': OUTDATED },
    pulls: { 'mcp-docs': [7] },
    remote: ['mcp-docs'],
    updates: { 'pnpm mcp:docs': { writes: ['docs/mcp.md'] } }
  })

  const result = runWith({ fake, where: 'ci' })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(linesOf({ fake }), [
    'sh pnpm mcp:docs --check',
    ...PREPARE,
    ...mergeInto({ id: 'mcp-docs' }),
    'sh pnpm mcp:docs',
    STATUS,
    'sh pnpm verify:mcp-docs',
    ...commitAndPush({ id: 'mcp-docs' }),
    `gh pr edit 7 --title chore(updates): run the mcp-docs updater --body ${BODY}`,
    `git checkout ${BASE}`
  ])
  const commit = callNamed({ fake, tool: 'git', words: ['commit'] })
  assert.match(
    valueAfter({ call: commit, flag: '--message', nth: 1 }),
    /on updates\/mcp-docs, with main\smerged in\./u
  )
})

test('a merge that conflicts opens nothing, names the branch and the conflict, and exits 1', () => {
  const fake = fakeOf({
    checks: { 'pnpm mcp:docs': OUTDATED },
    conflicts: ['docs/mcp.md'],
    remote: ['mcp-docs'],
    updates: { 'pnpm mcp:docs': { writes: ['docs/mcp.md'] } }
  })

  const result = runWith({
    context: contextOf({ updaters: [MCP_DOCS, SKILLS] }),
    fake,
    where: 'ci'
  })

  assert.equal(result.code, FAILED)
  assert.deepEqual(linesOf({ fake }), [
    'sh pnpm mcp:docs --check',
    ...PREPARE,
    ...mergeInto({ id: 'mcp-docs' }),
    'git diff --name-only --diff-filter=U',
    'git merge --abort',
    `git checkout ${BASE}`,
    'sh pnpm skills:sync --check'
  ])
  assert.deepEqual(result.errors, [
    'updaters: mcp-docs: origin/main does not merge into updates/mcp-docs, a conflict in ' +
      'docs/mcp.md; the merge was aborted, nothing was committed and no pull request opened'
  ])
})

test('a rule-proposal label whose colour or description differs is edited, and a current one is left', () => {
  const edited = fakeOf({
    checks: { 'pnpm skills:sync': OUTDATED },
    labels: [
      { color: 'FFFFFF', description: 'old', name: RULE_PROPOSAL_LABEL },
      { color: 'b60205', description: '', name: `${RULE_PROPOSAL_LABEL}-old` }
    ],
    updates: { 'pnpm skills:sync': { writes: ['docs/skills.md'] } }
  })
  const current = fakeOf({
    checks: { 'pnpm skills:sync': OUTDATED },
    labels: [
      {
        color: 'B60205',
        description: LABEL_DESCRIPTION,
        name: RULE_PROPOSAL_LABEL
      }
    ],
    updates: { 'pnpm skills:sync': { writes: ['docs/skills.md'] } }
  })

  const context = contextOf({ updaters: [SKILLS] })
  runWith({ context, fake: edited, where: 'ci' })
  runWith({ context, fake: current, where: 'ci' })

  const labelLines = ({ fake }) =>
    linesOf({ fake }).filter((line) => line.startsWith('gh label'))
  assert.deepEqual(labelLines({ fake: edited }), [LABEL_LIST, LABEL_EDIT])
  assert.deepEqual(labelLines({ fake: current }), [LABEL_LIST])
})

test('a dry run prints the plan and runs no git or gh', () => {
  const fake = fakeOf({ checks: { 'pnpm mcp:docs': OUTDATED } })

  const result = runWith({ dryRun: true, fake, where: 'ci' })

  assert.equal(result.code, PASSED, result.errors.join('\n'))
  assert.deepEqual(linesOf({ fake }), ['sh pnpm mcp:docs --check'])
  assert.ok(
    result.out.includes(
      'updaters: [dry run] mcp-docs would merge the default branch into updates/mcp-docs, or ' +
        'start it from the default branch, run pnpm mcp:docs, then pnpm verify:mcp-docs, commit ' +
        '"chore(updates): run the mcp-docs updater", push updates/mcp-docs without force and open ' +
        'or update one pull request, ready for review, or a draft ' +
        `labelled ${RULE_PROPOSAL_LABEL} if its diff touches a rule path`
    ),
    result.out
  )
  assert.ok(
    result.out.includes('updaters: dry run; no git or gh command ran'),
    result.out
  )
})

const runRunner = ({ args, updaters }) =>
  withScratchTree({
    files: {
      [POLICY_FILE]: POLICY_TEXT,
      [UPDATERS_FILE]: JSON.stringify({ updaters }),
      'package.json': JSON.stringify({ scripts: SCRIPTS })
    },
    prefix: 'updaters-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [RUNNER, '--root', root, ...args], {
        encoding: 'utf8'
      })
  })

test('the runner as a process skips an updater of another place and refuses an unknown --where', () => {
  const skipped = runRunner({ args: ['--where', 'local'], updaters: [MCP_DOCS] })
  const refused = runRunner({
    args: ['--where', 'nightly'],
    updaters: [MCP_DOCS]
  })

  assert.equal(skipped.status, PASSED, skipped.stderr)
  assert.match(skipped.stdout, /updaters: mcp-docs runs in ci, not local; skipped/u)
  assert.equal(refused.status, FAILED, refused.stdout)
  assert.match(
    refused.stderr,
    /updaters: --where must be one of ci, local, not "nightly"/u
  )
})

test('no run merges, approves, enables auto-merge, pushes the default branch or sets ATL_WRITE_GUARD', () => {
  const pushes = everyCall.filter(
    ({ args, tool }) => tool === 'git' && args[0] === 'push'
  )
  assert.ok(pushes.length > 0, 'the suite pushed nothing to judge')
  pushes.forEach(({ args }) =>
    assert.match(args.at(-1), /^HEAD:refs\/heads\/updates\/[a-z0-9-]+$/u)
  )
  everyCall
    .filter(({ tool }) => tool === 'gh')
    .forEach(({ args }) => {
      assert.ok(
        !(args[0] === 'pr' && ['merge', 'review'].includes(args[1])),
        args.join(' ')
      )
      assert.ok(!args.includes('--auto'), args.join(' '))
      assert.ok(!args.includes('--approve'), args.join(' '))
    })
  everyCall
    .filter(({ tool }) => tool === 'git')
    .forEach(({ args }) => {
      assert.ok(
        !(args[0] === 'push' && args.some((arg) => arg.endsWith(BASE))),
        args.join(' ')
      )
      // A merge only ever brings the default branch into the detached
      // update, or aborts that merge.
      assert.ok(
        args[0] !== 'merge' ||
          args[1] === '--abort' ||
          args.at(-1) === `origin/${BASE}`,
        args.join(' ')
      )
    })
  everyCall.forEach(({ env }) => {
    assert.equal(env, ENV)
    assert.ok(!Object.hasOwn(env, 'ATL_WRITE_GUARD'))
  })
})

test('no call of any run passes a force option or a + refspec', () => {
  assert.ok(
    everyCall.some(({ args }) => args?.[0] === 'merge'),
    'the suite merged nothing to judge'
  )
  everyCall.forEach(({ args, command, tool }) => {
    const words = tool === 'sh' ? command.split(' ') : [tool, ...args]
    assert.equal(forceOf({ words }), undefined, words.join(' '))
    assert.ok(!words.some((word) => word.startsWith('+')), words.join(' '))
  })
})
