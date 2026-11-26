#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for `pnpm verify:updaters`. The template's registry is healthy,
// so these cases are the only evidence the gate can go red.
//
// Each case hands the gate's `run` a synthetic registry and root scripts,
// differing from a healthy entry by one thing, under the write guard's real
// policy, so a rule file is the one the guard itself would ask about. The
// checks then assert what the findings say, prove the rule files come from
// the policy and not from a list of the gate's own, run the gate as a
// process over a scratch tree in the OS temp directory (which
// `withScratchTree` removes) and over the repository, and re-run every red
// case against a blinded gate.
//
// Usage:
//   node --test scripts/verify-updaters.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { POLICY_FILE } from './agent-harness/write-guard/policy.mjs'
import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { gate, UPDATERS_FILE } from './verify-updaters.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')
const GATE = join(HERE, 'verify-updaters.mjs')
const FAILED = 1
const PASSED = 0

const POLICY_TEXT = readFileSync(join(REPO_ROOT, POLICY_FILE), 'utf8')
const POLICY = JSON.parse(POLICY_TEXT)

const SCRIPTS = {
  'mcp:docs': 'node scripts/update-mcp-docs.mjs',
  'verify:mcp-docs': 'node scripts/verify-mcp-docs.mjs'
}

const ENTRY = {
  command: 'pnpm mcp:docs',
  id: 'mcp-docs',
  network: ['registry.npmjs.org'],
  proposal: false,
  runsIn: ['ci'],
  secrets: [],
  verify: ['pnpm verify:mcp-docs'],
  writes: ['docs/mcp.md']
}

const RULE_FILE = '.agents/contracts/mcp-servers.json'

const without = ({ key }) =>
  Object.fromEntries(Object.entries(ENTRY).filter(([name]) => name !== key))

const context =
  ({
    entries = [ENTRY],
    policy = POLICY,
    registry,
    scripts = SCRIPTS
  } = {}) =>
  () => ({
    policy,
    registry: registry ?? { updaters: entries },
    scripts
  })

const withFields = ({ fields }) => [{ ...ENTRY, ...fields }]

export const CASES = [
  {
    context: context(),
    expected: 0,
    name: 'a registry whose every entry is declared passes'
  },
  {
    context: context({ entries: withFields({ fields: { schedule: 'daily' } }) }),
    expected: 1,
    name: 'an entry with a key the registry does not know fires'
  },
  {
    context: context({ entries: [without({ key: 'verify' })] }),
    expected: 1,
    name: 'an entry without its verify key fires'
  },
  {
    context: context({
      entries: [
        Object.fromEntries(
          Object.entries(ENTRY).filter(
            ([name]) => name !== 'network' && name !== 'secrets'
          )
        )
      ]
    }),
    expected: 2,
    name: 'an entry without network and without secrets fires once for each'
  },
  {
    context: context({
      entries: withFields({ fields: { runsIn: ['ci', 'nightly'] } })
    }),
    expected: 1,
    name: 'a runsIn value other than ci or local fires'
  },
  {
    context: context({ entries: withFields({ fields: { runsIn: [] } }) }),
    expected: 1,
    name: 'an empty runsIn fires'
  },
  {
    context: context({ entries: withFields({ fields: { runsIn: 'ci' } }) }),
    expected: 1,
    name: 'a runsIn that is not a list fires'
  },
  {
    context: context({
      entries: withFields({ fields: { runsIn: ['ci', 'local'] } })
    }),
    expected: 0,
    name: 'an updater that runs in ci and local passes'
  },
  {
    context: context({ entries: withFields({ fields: { id: 'McpDocs' } }) }),
    expected: 1,
    name: 'an id that is not kebab-case fires'
  },
  {
    context: context({ entries: [ENTRY, ENTRY] }),
    expected: 1,
    name: 'an id listed twice fires'
  },
  {
    context: context({
      entries: withFields({ fields: { command: 'pnpm docs:refresh' } })
    }),
    expected: 1,
    name: 'a command naming a script package.json does not define fires'
  },
  {
    context: context({
      entries: withFields({
        fields: { verify: ['pnpm verify:mcp-docs', 'pnpm verify:docs'] }
      })
    }),
    expected: 1,
    name: 'a verify entry naming a script package.json does not define fires'
  },
  {
    context: context({
      entries: withFields({
        fields: { command: 'node scripts/update-mcp-docs.mjs' }
      })
    }),
    expected: 1,
    name: 'a command that is not pnpm and one script fires'
  },
  {
    context: context({
      entries: withFields({ fields: { command: 'pnpm mcp:docs --check' } })
    }),
    expected: 1,
    name: 'a command that passes its own arguments fires'
  },
  {
    context: context({ entries: withFields({ fields: { verify: [] } }) }),
    expected: 0,
    name: 'an updater with no verify command passes'
  },
  {
    context: context({
      entries: withFields({ fields: { writes: ['docs/mcp.md', RULE_FILE] } })
    }),
    expected: 1,
    name: 'a writes path the write guard calls a rule file fires while proposal is false'
  },
  {
    context: context({
      entries: withFields({
        fields: { proposal: true, writes: ['docs/mcp.md', RULE_FILE] }
      })
    }),
    expected: 0,
    name: 'the same rule-file path passes with proposal true'
  },
  {
    context: context({
      entries: withFields({ fields: { writes: ['.github/workflows/ci.yml'] } })
    }),
    expected: 1,
    name: 'a workflow file written by an updater that proposes nothing fires'
  },
  {
    context: context({
      entries: withFields({ fields: { writes: ['DOCS/MCP.md', 'AGENTS.MD'] } })
    }),
    expected: 1,
    name: 'a rule file in another letter case fires, as the write guard reads it'
  },
  {
    context: context({ entries: withFields({ fields: { writes: ['docs/**'] } }) }),
    expected: 1,
    name: 'a wildcard writes path fires while proposal is false'
  },
  {
    context: context({
      entries: withFields({ fields: { proposal: true, writes: ['docs/**'] } })
    }),
    expected: 0,
    name: 'a wildcard writes path passes with proposal true'
  },
  {
    context: context({
      entries: withFields({
        fields: { writes: ['../outside.md', '/etc/hosts', 'docs\\mcp.md'] }
      })
    }),
    expected: 3,
    name: 'a writes path that is not repository-relative fires once for each'
  },
  {
    context: context({ entries: withFields({ fields: { proposal: 'no' } }) }),
    expected: 1,
    name: 'a proposal that is not true or false fires'
  },
  {
    context: context({
      entries: withFields({ fields: { network: 'registry.npmjs.org' } })
    }),
    expected: 1,
    name: 'a network that is not a list of names fires'
  },
  {
    context: context({ entries: withFields({ fields: { secrets: [''] } }) }),
    expected: 1,
    name: 'a secrets list holding a blank name fires'
  },
  {
    context: context({ entries: ['mcp-docs'] }),
    expected: 1,
    name: 'an entry that is not an object fires'
  },
  {
    context: context({ registry: { servers: [] } }),
    expected: 2,
    name: 'a registry with no updaters list and a key it does not know fires twice'
  },
  {
    context: context({
      registry: new Error(`${UPDATERS_FILE} does not parse: Unexpected end`)
    }),
    expected: 1,
    name: 'a registry that cannot be read fires'
  },
  {
    context: context({
      policy: new Error(`${POLICY_FILE} cannot be read: ENOENT`)
    }),
    expected: 1,
    name: "a write-guard policy that cannot be read fires"
  },
  {
    context: context({ policy: { ruleFiles: [] } }),
    expected: 1,
    name: 'a write-guard policy with no rule files fires'
  }
]

const detailsOf = ({ entries, policy, registry, scripts }) =>
  gate
    .run(context({ entries, policy, registry, scripts })())
    .map(({ detail }) => detail)

const runGate = ({ files }) =>
  withScratchTree({
    files,
    prefix: 'verify-updaters-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

const treeOf = ({ entries }) => ({
  [POLICY_FILE]: POLICY_TEXT,
  [UPDATERS_FILE]: JSON.stringify({ updaters: entries }, null, 2),
  'package.json': JSON.stringify({ scripts: SCRIPTS })
})

const checks = [
  {
    name: 'every finding names its updater and what to do',
    run: () => {
      assert.deepEqual(
        detailsOf({ entries: withFields({ fields: { schedule: 'daily' } }) }),
        [
          `${UPDATERS_FILE}: mcp-docs: key "schedule" is not one an updater knows (command, id, network, proposal, runsIn, secrets, verify, writes)`
        ]
      )
      assert.deepEqual(detailsOf({ entries: [without({ key: 'verify' })] }), [
        `${UPDATERS_FILE}: mcp-docs: has no verify; every updater declares command, id, network, proposal, runsIn, secrets, verify and writes`
      ])
      assert.deepEqual(
        detailsOf({ entries: withFields({ fields: { runsIn: ['nightly'] } }) }),
        [
          `${UPDATERS_FILE}: mcp-docs: runsIn "nightly" is not one of ci, local`
        ]
      )
      assert.deepEqual(
        detailsOf({ entries: withFields({ fields: { id: 'McpDocs' } }) }),
        [
          `${UPDATERS_FILE}: McpDocs: id must be kebab-case (lower-case words joined by -), since it names the branch updates/<id>`
        ]
      )
      assert.deepEqual(detailsOf({ entries: [ENTRY, ENTRY] }), [
        `${UPDATERS_FILE}: mcp-docs: two updaters share this id`
      ])
      assert.deepEqual(
        detailsOf({
          entries: withFields({ fields: { command: 'pnpm docs:refresh' } })
        }),
        [
          `${UPDATERS_FILE}: mcp-docs: command "pnpm docs:refresh" runs the script docs:refresh, which the root package.json does not define`
        ]
      )
      assert.deepEqual(
        detailsOf({
          entries: withFields({
            fields: { command: 'node scripts/update-mcp-docs.mjs' }
          })
        }),
        [
          `${UPDATERS_FILE}: mcp-docs: command "node scripts/update-mcp-docs.mjs" is not pnpm <script>, one root script and no argument`
        ]
      )
      assert.deepEqual(
        detailsOf({ entries: withFields({ fields: { writes: [RULE_FILE] } }) }),
        [
          `${UPDATERS_FILE}: mcp-docs: writes ${RULE_FILE}, a contract (.agents/contracts/** in ${POLICY_FILE}), so its pull request proposes a rule change: set proposal: true`
        ]
      )
      assert.deepEqual(
        detailsOf({ entries: withFields({ fields: { writes: ['docs/**'] } }) }),
        [
          `${UPDATERS_FILE}: mcp-docs: writes docs/**, a wildcard the write guard cannot classify, so it counts as a rule path: name each file, or set proposal: true`
        ]
      )
    }
  },
  {
    name: "the gate reads the rule files from the write guard's policy",
    run: () => {
      const entries = withFields({ fields: { writes: ['docs/rules/policy.md'] } })
      const listing = {
        ruleFiles: [{ glob: 'docs/rules/**', what: 'a policy document' }]
      }
      const silent = {
        ruleFiles: [{ glob: 'AGENTS.md', what: 'the LAWs and the router' }]
      }
      assert.deepEqual(detailsOf({ entries, policy: listing }), [
        `${UPDATERS_FILE}: mcp-docs: writes docs/rules/policy.md, a policy document (docs/rules/** in ${POLICY_FILE}), so its pull request proposes a rule change: set proposal: true`
      ])
      assert.deepEqual(detailsOf({ entries, policy: silent }), [])
      assert.deepEqual(
        detailsOf({
          entries: withFields({ fields: { writes: ['packages/x/.git/config'] } }),
          policy: silent
        }).length,
        1,
        'a .git path is a rule path whatever the policy lists'
      )
    }
  },
  {
    name: 'the gate exits 1 over a tree whose updater writes a rule file and names it',
    run: () => {
      const result = runGate({
        files: treeOf({
          entries: withFields({ fields: { writes: ['docs/mcp.md', 'AGENTS.md'] } })
        })
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-updaters: 1 problem\(s\) across 1 updater/u)
      assert.match(result.stderr, /mcp-docs: writes AGENTS\.md, the LAWs and the router/u)
    }
  },
  {
    name: 'the gate exits 1 over a tree with no registry and names the file',
    run: () => {
      const files = treeOf({ entries: [ENTRY] })
      delete files[UPDATERS_FILE]
      const result = runGate({ files })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /\.agents\/contracts\/updaters\.json cannot be read/u)
    }
  },
  {
    name: 'the gate exits 0 over the repository and states what it judged',
    run: () => {
      const result = spawnSync(process.execPath, [GATE], { encoding: 'utf8' })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(
        result.stdout,
        /verify-updaters: PASS — \d+ updater\(s\) of \.agents\/contracts\/updaters\.json, \d+ written path\(s\) classified by the write guard's \d+ rule glob\(s\)\./u
      )
      assert.match(result.stdout, /NOT covered: /u)
    }
  },
  {
    name: 'every red case fails against a blinded gate',
    run: () => {
      const red = CASES.filter(({ expected }) => expected > 0)
      assert.equal(
        runCases({ cases: red, gate: blindGate({ gate }) }).length,
        red.length
      )
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
