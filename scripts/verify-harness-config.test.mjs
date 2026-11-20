#!/usr/bin/env node
// ---------------------------------------------------------------------------
// Companion for verify-harness-config. The gate ships with zero findings in
// the repository, so its cases are the only evidence it can go red at all.
//
// The cases hand the gate's `run` the repository's own schema and a config
// that holds the template's values, each case differing from it by one
// thing, so they prove that the contract this repository ships refuses each
// defect. The checks then run the gate as a process over a scratch tree in
// the OS temp directory, which `withScratchTree` removes, and over the
// repository itself, and hold the schema's merge policies to the ones the
// ticket skills name.
//
// Usage:
//   node --test scripts/verify-harness-config.test.mjs
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate } from './gate/gate.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import {
  collectContext,
  FINDING_KIND,
  gate,
  HARNESS_CONFIG,
  HARNESS_CONFIG_SCHEMA,
  MERGE_POLICY_KEY
} from './verify-harness-config.mjs'
import { DEFAULT_MERGE_POLICY, MERGE_POLICIES } from './verify-skills.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const GATE = join(HERE, 'verify-harness-config.mjs')
const REPO_ROOT = join(HERE, '..')
const FAILED = 1
const PASSED = 0
const INDENT = 2

// The schema this repository ships: every case judges against it.
const SCHEMA = JSON.parse(
  readFileSync(join(REPO_ROOT, HARNESS_CONFIG_SCHEMA), 'utf8')
)

// A config every rule passes, holding the template's values.
const HEALTHY = {
  $schema: './contracts/harness-config.schema.json',
  backend: { databaseTests: 'linked', kind: 'supabase' },
  delivery: { mergePolicy: 'manual' },
  workflow: { mode: 'sdd' }
}

// A copy of `value` with `edit` applied to it; the original stays whole.
const edited = ({ edit, value }) => {
  const copy = structuredClone(value)
  edit({ copy })
  return copy
}

const textOf = ({ value }) => JSON.stringify(value, null, INDENT)

// The context the gate's collector would gather. A text of null is a file
// that is not there; a text given as is stands for a file that does not
// parse.
const contextOf =
  ({
    config = HEALTHY,
    configText = textOf({ value: config }),
    schema = SCHEMA,
    schemaText = textOf({ value: schema })
  } = {}) =>
  () => ({
    config: { path: HARNESS_CONFIG, text: configText },
    schema: { path: HARNESS_CONFIG_SCHEMA, text: schemaText }
  })

const configWith = ({ edit }) =>
  contextOf({ config: edited({ edit, value: HEALTHY }) })

const schemaWith = ({ edit }) =>
  contextOf({ schema: edited({ edit, value: SCHEMA }) })

const mergePolicyOf = ({ schema }) =>
  schema.properties.delivery.properties.mergePolicy

const findingsOf = ({ context }) => gate.run(context())

// The gate as `pnpm verify:harness-config` runs it, over a scratch tree
// holding the repository's schema and the config given.
const runGate = ({ config }) =>
  withScratchTree({
    files: {
      [HARNESS_CONFIG_SCHEMA]: textOf({ value: SCHEMA }),
      ...(config === null
        ? {}
        : { [HARNESS_CONFIG]: textOf({ value: config }) })
    },
    prefix: 'harness-config-run-',
    use: ({ root }) =>
      spawnSync(process.execPath, [GATE, '--root', root], {
        encoding: 'utf8'
      })
  })

export const CASES = [
  {
    context: contextOf(),
    expected: 0,
    name: "the template's harness config passes"
  },
  {
    context: contextOf({ configText: null }),
    expected: 1,
    name: 'a missing harness config is caught, not skipped'
  },
  {
    context: contextOf({ configText: '{ "workflow": ' }),
    expected: 1,
    name: 'a harness config that does not parse is refused'
  },
  {
    context: contextOf({ schemaText: null }),
    expected: 1,
    name: 'a missing schema is caught, not skipped'
  },
  {
    context: contextOf({ schemaText: '{ "type": ' }),
    expected: 1,
    name: 'a schema that does not parse is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.review = { mode: 'strict' }
      }
    }),
    expected: 1,
    name: 'a section the schema does not declare is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.delivery.mergeMethod = 'squash'
      }
    }),
    expected: 1,
    name: 'a setting its section does not declare is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        delete copy.backend
      }
    }),
    expected: 1,
    name: 'a missing section is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        delete copy.workflow.mode
      }
    }),
    expected: 1,
    name: 'a missing workflow mode is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.delivery = 'manual'
      }
    }),
    expected: 1,
    name: 'a section that is not an object is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.$comment = 42
      }
    }),
    expected: 1,
    name: 'a comment that is not text is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.$schema = 'https://example.com/another.schema.json'
      }
    }),
    expected: 1,
    name: 'a $schema that names another schema is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.delivery.mergePolicy = 'auto'
      }
    }),
    expected: 1,
    name: 'a merge policy the schema does not allow is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.workflow.mode = 'kanban'
      }
    }),
    expected: 1,
    name: 'a workflow mode the schema does not allow is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.backend = { kind: 'firebase' }
      }
    }),
    expected: 1,
    name: 'a backend kind the schema does not allow is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.backend.databaseTests = 'remote'
      }
    }),
    expected: 1,
    name: 'a database-test mode the schema does not allow is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        delete copy.backend.databaseTests
      }
    }),
    expected: 1,
    name: 'a supabase backend with no database-test mode is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.backend.kind = 'own'
      }
    }),
    expected: 1,
    name: 'a database-test mode under an own backend is refused'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.backend = { kind: 'own' }
      }
    }),
    expected: 0,
    name: 'an own backend with no database-test mode passes'
  },
  {
    context: configWith({
      edit: ({ copy }) => {
        copy.backend = { kind: 'none' }
      }
    }),
    expected: 0,
    name: 'no backend, with no database-test mode, passes'
  },
  {
    context: schemaWith({
      edit: ({ copy }) => {
        mergePolicyOf({ schema: copy }).pattern = '^m'
      }
    }),
    expected: 1,
    name: 'a schema keyword the gate does not read is refused'
  },
  {
    context: schemaWith({
      edit: ({ copy }) => {
        copy.properties.workflow.type = 'array'
      }
    }),
    expected: 1,
    name: 'a schema type the gate does not read is refused'
  },
  {
    context: schemaWith({
      edit: ({ copy }) => {
        copy.properties.workflow.required = 'mode'
      }
    }),
    expected: 1,
    name: 'a schema keyword whose value the gate cannot read is refused'
  },
  {
    context: schemaWith({
      edit: ({ copy }) => {
        mergePolicyOf({ schema: copy }).default = 'auto'
      }
    }),
    expected: 1,
    name: 'a schema default its own values refuse is refused'
  }
]

const checks = [
  {
    name: 'a finding names the file, the setting and the values it allows',
    run: () => {
      const [finding] = findingsOf({
        context: configWith({
          edit: ({ copy }) => {
            copy.delivery.mergePolicy = 'auto'
          }
        })
      })
      assert.equal(finding.kind, FINDING_KIND.value)
      assert.equal(finding.path, HARNESS_CONFIG)
      assert.ok(
        finding.detail.startsWith(
          `${HARNESS_CONFIG}: \`${MERGE_POLICY_KEY}\` is "auto"`
        ),
        finding.detail
      )
      assert.match(finding.detail, /`manual`, `low-risk`/u)
    }
  },
  {
    name: 'an undeclared setting is named with the settings its section declares',
    run: () => {
      const [finding] = findingsOf({
        context: configWith({
          edit: ({ copy }) => {
            copy.delivery.mergeMethod = 'squash'
          }
        })
      })
      assert.equal(finding.kind, FINDING_KIND.unknownKey)
      assert.match(finding.detail, /`delivery\.mergeMethod`/u)
      assert.match(finding.detail, /`mergePolicy`/u)
    }
  },
  {
    name: 'a database-test mode under an own backend says why it is refused',
    run: () => {
      const [finding] = findingsOf({
        context: configWith({
          edit: ({ copy }) => {
            copy.backend.kind = 'own'
          }
        })
      })
      assert.equal(finding.kind, FINDING_KIND.forbidden)
      assert.match(finding.detail, /`backend\.databaseTests`/u)
      assert.match(finding.detail, /supabase backend's only/u)
    }
  },
  {
    name: 'a missing setting is named as missing',
    run: () => {
      const [finding] = findingsOf({
        context: configWith({
          edit: ({ copy }) => {
            delete copy.workflow.mode
          }
        })
      })
      assert.equal(finding.kind, FINDING_KIND.required)
      assert.match(finding.detail, /`workflow\.mode` is missing/u)
    }
  },
  {
    name: 'a schema it cannot read is reported alone, and no setting is judged',
    run: () => {
      const findings = findingsOf({
        context: contextOf({
          config: edited({
            edit: ({ copy }) => {
              copy.delivery.mergePolicy = 'auto'
            },
            value: HEALTHY
          }),
          schemaText: null
        })
      })
      assert.equal(findings.length, 1, JSON.stringify(findings))
      assert.equal(findings[0].kind, FINDING_KIND.missing)
      assert.equal(findings[0].path, HARNESS_CONFIG_SCHEMA)
    }
  },
  {
    name: 'a schema keyword it does not read is named with where it sits',
    run: () => {
      const [finding] = findingsOf({
        context: schemaWith({
          edit: ({ copy }) => {
            mergePolicyOf({ schema: copy }).pattern = '^m'
          }
        })
      })
      assert.equal(finding.kind, FINDING_KIND.keyword)
      assert.equal(finding.path, HARNESS_CONFIG_SCHEMA)
      assert.match(
        finding.detail,
        /#\/properties\/delivery\/properties\/mergePolicy uses `pattern`/u
      )
    }
  },
  {
    name: 'the cases fail against a gate that finds nothing',
    run: () => {
      const failures = runCases({
        cases: CASES,
        gate: blindGate({ gate })
      })
      assert.ok(failures.length > 0, 'every case passed a blinded gate')
    }
  },
  {
    name: "the schema's merge policies are the ones the ticket skills name, manual the default",
    run: () => {
      const [section, setting] = MERGE_POLICY_KEY.split('.')
      const policy = SCHEMA.properties[section].properties[setting]
      assert.deepEqual(policy.enum, MERGE_POLICIES)
      assert.equal(policy.default, DEFAULT_MERGE_POLICY)
    }
  },
  {
    name: "the repository's harness config passes",
    run: () =>
      assert.deepEqual(
        gate
          .run(collectContext({ root: REPO_ROOT }))
          .map(({ detail }) => detail),
        []
      )
  },
  {
    name: 'the gate exits 0 over the repository and states what it judged',
    run: () => {
      const result = spawnSync(process.execPath, [GATE], {
        encoding: 'utf8'
      })
      assert.equal(result.status, PASSED, result.stderr)
      assert.match(result.stdout, /verify-harness-config: PASS/u)
      assert.match(result.stdout, /4 setting\(s\)/u)
      assert.match(result.stdout, /NOT covered: /u)
    }
  },
  {
    name: 'the gate run over a planted bad value exits 1 and names it',
    run: () => {
      const result = runGate({
        config: edited({
          edit: ({ copy }) => {
            copy.delivery.mergePolicy = 'auto'
          },
          value: HEALTHY
        })
      })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(result.stderr, /verify-harness-config: 1 problem/u)
      assert.match(result.stderr, /`delivery\.mergePolicy` is "auto"/u)
    }
  },
  {
    name: 'the gate run over a tree with no harness config exits 1 and names the file',
    run: () => {
      const result = runGate({ config: null })
      assert.equal(result.status, FAILED, result.stdout)
      assert.match(
        result.stderr,
        /\.agents\/harness\.config\.json is missing/u
      )
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
