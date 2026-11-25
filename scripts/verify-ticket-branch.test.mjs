#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-ticket-branch. The template's own branches carry no
// ticket id, so the check never runs over this repository: these cases are
// the only evidence that it passes a ticket branch and refuses everything
// else.
//
// Each case is one branch name and one pull request body, handed to the
// check's `run` as data, with the project layer and the flags it judges
// under when the case needs them: no layer judges under the defaults. The
// checks then run the check as a process, as a project's CI would, over a
// scratch working directory in the OS temp directory that `withScratchTree`
// removes, and read the template's own gate registry, which `validate` runs:
// it runs this test and never the check.
//
// Usage:
//   node --test scripts/verify-ticket-branch.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { planRun, PROFILES, REGISTRY_FILE } from './gate/registry.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import {
  BRANCH_SHAPE,
  FINDING_KIND,
  gate,
  TICKET_TYPES
} from './verify-ticket-branch.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CHECK = join(HERE, 'verify-ticket-branch.mjs')
const PACKAGE_JSON = join(HERE, '..', 'package.json')
const GATE_REGISTRY = join(HERE, '..', REGISTRY_FILE)
// The profile `pnpm validate` runs, and the one that runs every step.
const [DEFAULT_PROFILE] = PROFILES
const EVERY_PROFILE = PROFILES.at(-1)
const FAILED = 1
const PASSED = 0
// Where a project keeps its layer, which the check reads by default.
const LAYER_PATH = 'docs/process/ticket-flow.md'

const ISSUE_BRANCH = 'feature/123-add-sign-in'
const KEYED_BRANCH = 'fix/PROJ-42-null-total'
const ISSUE_BODY = 'Adds the sign-in form.\n\nRefs #123\n'
const KEYED_BODY = 'Fixes the null total.\n\nTicket: PROJ-42\n'

const DEFAULT_ID_PATTERN = '\\d+|[A-Z][A-Z0-9]*-\\d+'
const DEFAULT_TYPES = ['feature', 'fix', 'tech', 'chore']
const BLOCK_OPEN = '```json ticket-identity'
const BLOCK_CLOSE = '```'

// A downstream ticket identity, as a downstream project reported it on
// 2026-11-17: ids `TASK-<slug>`, branches that start with the Conventional
// Commit type, and an optional slug. An example layer, never a default.
const TASK_SLUG = {
  branchTypes: [
    'feat',
    'fix',
    'chore',
    'refactor',
    'perf',
    'test',
    'build',
    'ci',
    'docs'
  ],
  idPattern: 'TASK-[a-z0-9]+(?:-[a-z0-9]+)*',
  slug: 'optional'
}
const TASK_SLUG_ID = 'TASK-min-app-version-app'
const TASK_SLUG_BRANCH = `feat/${TASK_SLUG_ID}`
const TASK_SLUG_BODY = `Adds the minimum app version.\n\nTicket: ${TASK_SLUG_ID}\n`

// A project layer whose Ticket identity section holds `blocks`, each the
// text of one fenced block, JSON or not.
const layerText = ({ blocks }) =>
  [
    '# Ticket flow — a project',
    '',
    '## Ticket identity',
    '',
    "- **Id:** the project's own",
    '',
    ...blocks.flatMap((block) => [BLOCK_OPEN, block, BLOCK_CLOSE, '']),
    '## Branch check in CI',
    ''
  ].join('\n')

const blockOf = ({ identity }) => JSON.stringify(identity, null, 2)

const layerOf = ({ blocks }) => ({
  path: LAYER_PATH,
  text: layerText({ blocks })
})

const identityLayer = ({ identity }) =>
  layerOf({ blocks: [blockOf({ identity })] })

const TASK_SLUG_LAYER = identityLayer({ identity: TASK_SLUG })

const DEFAULTS = {
  branchTypes: DEFAULT_TYPES,
  idPattern: DEFAULT_ID_PATTERN,
  slug: 'required'
}

const pair =
  ({ body, branch, flags, layer }) =>
  () => ({ body, branch, flags, layer })

// A branch and a body the defaults pass, judged under `layer`: every
// finding is the layer's.
const underLayer = ({ layer }) =>
  pair({ body: ISSUE_BODY, branch: ISSUE_BRANCH, layer })

export const CASES = [
  {
    context: pair({ body: ISSUE_BODY, branch: ISSUE_BRANCH }),
    expected: 0,
    name: 'a ticket branch whose pull request body names its issue passes'
  },
  {
    context: pair({ body: KEYED_BODY, branch: KEYED_BRANCH }),
    expected: 0,
    name: 'a branch with a keyed id and a body that names the key passes'
  },
  {
    context: pair({
      body: 'Refs #123 and depends on #120\n',
      branch: 'tech/123-split-the-query-hooks'
    }),
    expected: 0,
    name: 'a body that names other tickets beside its own passes'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: 'feature/add-sign-in' }),
    expected: 1,
    name: 'a branch with no id is refused'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: 'feat/123-add-sign-in' }),
    expected: 1,
    name: 'a branch with an unknown type is refused'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: 'feature/123' }),
    expected: 1,
    name: 'a branch missing the slug is refused'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: 'feature/123-Add_Sign_In' }),
    expected: 1,
    name: 'a slug that is not lower-case kebab is refused'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: '123-add-sign-in' }),
    expected: 1,
    name: 'a branch with no type is refused'
  },
  {
    context: pair({ body: 'Refs #124\n', branch: ISSUE_BRANCH }),
    expected: 1,
    name: 'a body that names another id is refused'
  },
  {
    context: pair({ body: 'Refs #1234\n', branch: ISSUE_BRANCH }),
    expected: 1,
    name: 'a body that names a longer id is refused'
  },
  {
    context: pair({ body: 'Ticket: PROJ-421\n', branch: KEYED_BRANCH }),
    expected: 1,
    name: 'a body that names a longer key is refused'
  },
  {
    context: pair({ body: 'Refs 123\n', branch: ISSUE_BRANCH }),
    expected: 1,
    name: 'a body that names a number without its hash is refused'
  },
  {
    context: pair({ body: 'Refs #124\n', branch: 'feat/123' }),
    expected: 3,
    name: 'every defect of one branch is named on its own'
  },
  {
    context: pair({
      body: TASK_SLUG_BODY,
      branch: TASK_SLUG_BRANCH,
      layer: TASK_SLUG_LAYER
    }),
    expected: 0,
    name: 'a TASK-slug branch and body pass under its layer'
  },
  {
    context: pair({ body: TASK_SLUG_BODY, branch: TASK_SLUG_BRANCH }),
    expected: 2,
    name: 'a TASK-slug branch is refused under the defaults'
  },
  {
    context: pair({
      body: ISSUE_BODY,
      branch: 'feature/123',
      layer: identityLayer({ identity: { ...DEFAULTS, slug: 'optional' } })
    }),
    expected: 0,
    name: 'an optional slug that is absent passes'
  },
  {
    context: pair({
      body: ISSUE_BODY,
      branch: ISSUE_BRANCH,
      layer: identityLayer({ identity: { ...DEFAULTS, slug: 'optional' } })
    }),
    expected: 0,
    name: 'an optional slug that is present passes'
  },
  {
    context: underLayer({
      layer: identityLayer({
        identity: { ...DEFAULTS, branchTypes: ['feat', 'fix'] }
      })
    }),
    expected: 1,
    name: "a branch type outside the layer's branchTypes is refused"
  },
  {
    context: underLayer({
      layer: identityLayer({
        identity: { ...DEFAULTS, idPattern: 'TASK-\\d+' }
      })
    }),
    expected: 1,
    name: "an id the layer's pattern does not match is refused"
  },
  {
    context: pair({
      body: 'Ticket: TASK-abc\n',
      branch: 'feat/TASK-abc',
      layer: identityLayer({
        identity: {
          branchTypes: ['feat'],
          idPattern: 'TASK-[a-z0-9]+',
          slug: 'required'
        }
      })
    }),
    expected: 1,
    name: 'a required slug missing under a layer is refused'
  },
  {
    context: pair({
      body: 'Ticket: TASK-min-app-version\n',
      branch: 'feat/TASK-min-app',
      layer: TASK_SLUG_LAYER
    }),
    expected: 1,
    name: 'a body that names a longer id under the layer is refused'
  },
  {
    context: pair({ body: ISSUE_BODY, branch: ISSUE_BRANCH, layer: null }),
    expected: 0,
    name: 'with no layer file, the defaults apply'
  },
  {
    context: underLayer({ layer: layerOf({ blocks: [] }) }),
    expected: 0,
    name: 'a layer with no ticket-identity block judges under the defaults'
  },
  {
    context: underLayer({
      layer: identityLayer({ identity: { ...DEFAULTS, slug: 'sometimes' } })
    }),
    expected: 1,
    name: 'a block whose slug is neither required nor optional is refused'
  },
  {
    context: underLayer({
      layer: layerOf({ blocks: ['{ "idPattern": "\\\\d+", '] })
    }),
    expected: 1,
    name: 'a block that is not JSON is refused'
  },
  {
    context: underLayer({
      layer: identityLayer({
        identity: { idPattern: DEFAULT_ID_PATTERN, slug: 'required' }
      })
    }),
    expected: 1,
    name: 'a block missing a field is refused'
  },
  {
    context: underLayer({
      layer: identityLayer({
        identity: {
          branchTypes: DEFAULT_TYPES,
          idPatern: DEFAULT_ID_PATTERN,
          slug: 'required'
        }
      })
    }),
    expected: 2,
    name: 'a block with an unknown field is refused'
  },
  {
    context: underLayer({
      layer: identityLayer({ identity: { ...DEFAULTS, idPattern: 'TASK-(' } })
    }),
    expected: 1,
    name: 'a block whose idPattern does not compile is refused'
  },
  {
    context: underLayer({
      layer: identityLayer({ identity: { ...DEFAULTS, idPattern: '\\d*' } })
    }),
    expected: 1,
    name: 'a block whose idPattern matches the empty string is refused'
  },
  {
    context: underLayer({
      layer: identityLayer({ identity: { ...DEFAULTS, branchTypes: [] } })
    }),
    expected: 1,
    name: 'a block whose branchTypes is empty is refused'
  },
  {
    context: underLayer({
      layer: layerOf({
        blocks: [
          blockOf({ identity: DEFAULTS }),
          blockOf({ identity: TASK_SLUG })
        ]
      })
    }),
    expected: 1,
    name: 'a layer with two ticket-identity blocks is refused'
  },
  {
    context: underLayer({
      layer: { path: 'docs/process/elsewhere.md', text: null }
    }),
    expected: 1,
    name: 'a layer that --layer names and that is not there is refused'
  },
  {
    context: pair({
      body: 'Ticket: TASK-abc\n',
      branch: 'feature/TASK-abc',
      flags: { types: 'feature' },
      layer: TASK_SLUG_LAYER
    }),
    expected: 0,
    name: 'a flag overrides a single field of the layer'
  },
  {
    context: pair({
      body: 'Ticket: TASK-abc\n',
      branch: 'feat/TASK-abc',
      flags: { types: 'feature' },
      layer: TASK_SLUG_LAYER
    }),
    expected: 1,
    name: 'a type the flag replaced is refused'
  },
  {
    context: pair({
      body: ISSUE_BODY,
      branch: ISSUE_BRANCH,
      flags: { slug: 'sometimes' }
    }),
    expected: 1,
    name: 'a malformed flag is refused'
  }
]

// The check as a process. `cwd` is required: run from the repository's own
// working directory, the check would read a project layer that a downstream
// project declares, and the case would judge that layer, not its own input.
const runCheck = ({ args = [], body, branch, cwd }) => {
  if (!cwd) throw new Error('runCheck needs the scratch tree it runs in')
  return spawnSync(
    process.execPath,
    [CHECK, '--branch', branch, '--body', body, ...args],
    { cwd, encoding: 'utf8' }
  )
}

// The check as a process whose working directory is a scratch tree
// holding `files`, docs/process/ticket-flow.md among them or not.
const runIn = ({ args, body, branch, files }) =>
  withScratchTree({
    files,
    prefix: 'verify-ticket-branch-run-',
    use: ({ root }) => runCheck({ args, body, branch, cwd: root })
  })

const TASK_SLUG_FILES = { [LAYER_PATH]: TASK_SLUG_LAYER.text }

const checks = [
  {
    name: 'a finding names the branch and the shape it owes',
    run: () => {
      const [finding] = gate.run({ body: ISSUE_BODY, branch: 'feature/add' })
      assert.equal(finding.kind, FINDING_KIND.id)
      assert.ok(
        finding.detail.includes('feature/add'),
        `the finding does not name the branch: ${finding.detail}`
      )
      assert.ok(
        finding.detail.includes(BRANCH_SHAPE),
        `the finding does not name the shape: ${finding.detail}`
      )
    }
  },
  {
    name: 'an unknown type is named with the four types',
    run: () => {
      const [finding] = gate.run({
        body: ISSUE_BODY,
        branch: 'feat/123-add-sign-in'
      })
      assert.equal(finding.kind, FINDING_KIND.type)
      TICKET_TYPES.forEach((type) =>
        assert.ok(
          finding.detail.includes(type),
          `the finding does not name ${type}: ${finding.detail}`
        )
      )
    }
  },
  {
    name: 'a body that names another id is told the id it owes and the one it names',
    run: () => {
      const [finding] = gate.run({ body: 'Refs #124\n', branch: ISSUE_BRANCH })
      assert.equal(finding.kind, FINDING_KIND.body)
      assert.match(finding.detail, /#123/u)
      assert.match(finding.detail, /#124/u)
    }
  },
  {
    name: 'a malformed block is named with its file and field',
    run: () => {
      const findings = gate.run(
        underLayer({
          layer: identityLayer({
            identity: { ...DEFAULTS, slug: 'sometimes' }
          })
        })()
      )
      assert.equal(findings.length, 1, JSON.stringify(findings))
      const [finding] = findings
      assert.equal(finding.kind, FINDING_KIND.identity)
      assert.ok(
        finding.detail.startsWith(`${LAYER_PATH}: `),
        `the finding does not name the layer: ${finding.detail}`
      )
      assert.match(finding.detail, /\bslug\b/u)
      assert.match(finding.detail, /sometimes/u)
    }
  },
  {
    name: 'a malformed flag is named with the flag and its field',
    run: () => {
      const [finding] = gate.run(
        pair({
          body: ISSUE_BODY,
          branch: ISSUE_BRANCH,
          flags: { slug: 'sometimes' }
        })()
      )
      assert.equal(finding.kind, FINDING_KIND.identity)
      assert.ok(
        finding.detail.startsWith('--slug'),
        `the finding does not name the flag: ${finding.detail}`
      )
      assert.match(finding.detail, /\bslug\b.*required or optional/u)
    }
  },
  {
    name: 'an id is matched in the body literally, not as a pattern',
    run: () => {
      const findings = gate.run(
        pair({
          body: 'Ticket: REL-1x2\n',
          branch: 'feature/REL-1.2-notes',
          layer: identityLayer({
            identity: { ...DEFAULTS, idPattern: 'REL-\\d+\\.\\d+' }
          })
        })()
      )
      assert.deepEqual(
        findings.map(({ kind }) => kind),
        [FINDING_KIND.body],
        JSON.stringify(findings)
      )
      assert.match(findings[0].detail, /REL-1\.2/u)
    }
  },
  {
    name: 'the check reads the layer of its working directory',
    run: () => {
      const result = runIn({
        body: TASK_SLUG_BODY,
        branch: TASK_SLUG_BRANCH,
        files: TASK_SLUG_FILES
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-ticket-branch: PASS/u)
      assert.ok(
        result.stdout.includes(LAYER_PATH),
        `the pass line does not name the layer: ${result.stdout}`
      )
    }
  },
  {
    name: 'the check reads the layer --layer names',
    run: () =>
      withScratchTree({
        files: { 'layers/task-slug.md': TASK_SLUG_LAYER.text },
        prefix: 'verify-ticket-branch-layer-',
        use: ({ root }) => {
          const layer = join(root, 'layers', 'task-slug.md')
          const result = runCheck({
            args: ['--layer', layer],
            body: TASK_SLUG_BODY,
            branch: TASK_SLUG_BRANCH,
            cwd: root
          })
          assert.equal(result.status, PASSED, result.stderr)
          assert.ok(
            result.stdout.includes(layer),
            `the pass line does not name the layer: ${result.stdout}`
          )
        }
      })
  },
  {
    name: 'the check with no layer file judges under the defaults',
    run: () => {
      const result = runIn({
        body: ISSUE_BODY,
        branch: ISSUE_BRANCH,
        files: {}
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /the default ticket identity/u)
      const refused = runIn({
        body: TASK_SLUG_BODY,
        branch: TASK_SLUG_BRANCH,
        files: {}
      })
      assert.equal(refused.status, FAILED, refused.stdout)
    }
  },
  {
    name: 'the check takes a flag over one field of the layer',
    run: () => {
      const result = runIn({
        args: ['--types', 'feature'],
        body: 'Ticket: TASK-abc\n',
        branch: 'feature/TASK-abc',
        files: TASK_SLUG_FILES
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.ok(
        result.stdout.includes(LAYER_PATH),
        `the pass line does not name the layer: ${result.stdout}`
      )
      assert.match(result.stdout, /--types/u)
    }
  },
  {
    name: 'the cases fail against a gate that finds nothing',
    run: () => {
      const failures = runCases({ cases: CASES, gate: blindGate({ gate }) })
      assert.ok(failures.length > 0, 'every case passed a blinded gate')
    }
  },
  {
    name: 'the check exits 1 and names the id the body owes',
    run: () => {
      const result = runIn({
        body: 'Refs #124\n',
        branch: ISSUE_BRANCH,
        files: {}
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /#123/u)
      assert.match(result.stderr, /verify-ticket-branch: 1 problem/u)
    }
  },
  {
    name: 'the check exits 0 and states what it judged',
    run: () => {
      const result = runIn({
        body: ISSUE_BODY,
        branch: ISSUE_BRANCH,
        files: {}
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-ticket-branch: PASS/u)
      assert.ok(
        result.stdout.includes(ISSUE_BRANCH),
        `the pass line does not name the branch: ${result.stdout}`
      )
      assert.match(result.stdout, /NOT covered: /u)
    }
  },
  {
    name: 'the check run with no arguments refuses an empty branch and body',
    run: () => {
      const result = withScratchTree({
        files: {},
        prefix: 'verify-ticket-branch-bare-',
        use: ({ root }) =>
          spawnSync(process.execPath, [CHECK], { cwd: root, encoding: 'utf8' })
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.ok(
        result.stderr.includes(BRANCH_SHAPE),
        `the refusal does not name the shape: ${result.stderr}`
      )
    }
  },
  {
    name: "the template's validate runs the tests and not the check",
    run: () => {
      const { scripts } = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8'))
      const registry = JSON.parse(readFileSync(GATE_REGISTRY, 'utf8'))
      const commands = ({ profile }) =>
        planRun({ profile, registry }).map(({ command }) => command)
      assert.equal(scripts.validate, 'node scripts/validate.mjs')
      assert.ok(
        commands({ profile: DEFAULT_PROFILE }).includes(
          'pnpm verify:ticket-branch:test'
        ),
        'validate does not run pnpm verify:ticket-branch:test'
      )
      assert.ok(
        !commands({ profile: EVERY_PROFILE }).includes(
          'pnpm verify:ticket-branch'
        ),
        'validate runs pnpm verify:ticket-branch, which fails on every ' +
          'branch of the template: they carry no ticket id'
      )
      assert.equal(
        scripts['verify:ticket-branch'],
        'node scripts/verify-ticket-branch.mjs'
      )
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
