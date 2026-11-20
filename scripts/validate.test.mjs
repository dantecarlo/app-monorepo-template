// ---------------------------------------------------------------------------
// The companion of the gate registry (scripts/gate/registry.json) and of its
// runner, scripts/validate.mjs.
//
// CASES drive the registry gate through `gate.run` over synthetic contexts.
// The checks run the runner as a process over scratch trees, a fake `pnpm`
// first on the PATH, and judge the real registry: it passes its gate, a
// capability's prune drops the steps it owns and leaves a registry the
// pruned package.json can run, and every gate the run reaches is blinded
// exactly once.
// ---------------------------------------------------------------------------

import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, readFileSync } from 'node:fs'
import { delimiter, dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { registerCases, runCases } from './gate/cases.mjs'
import { blindGate, defineGate } from './gate/gate.mjs'
import {
  BLIND,
  CORE_CAPABILITY,
  gateModuleOf,
  planRun,
  pruneRegistry,
  REGISTRY_FILE
} from './gate/registry.mjs'
import { withScratchTree } from './gate/scratch.mjs'
import { withHookGitDir } from './hook-git-dir.mjs'
import { matchesAny } from './manifest.mjs'
import { gate } from './validate.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(HERE, '..')
const VALIDATE = join(HERE, 'validate.mjs')
const STANDARD = 'standard'
const STRICT = 'strict'
const REFUSED = 1
const FAILING_CODE = 3
const EXECUTABLE_MODE = 0o755
const LOG_FILE = 'log.txt'
const MANIFEST_FILE = 'template.manifest.json'
const PACKAGE_FILE = 'package.json'
const SCRATCH_PREFIX = 'gate-registry-'

// ---------------------------------------------------------------------------
// CASES — the registry gate over synthetic contexts.
// ---------------------------------------------------------------------------

const SCRIPTS = { 'verify:a': 'node a.mjs', 'verify:b': 'node b.mjs' }

const step = (fields) => ({
  capability: CORE_CAPABILITY,
  cost: 'seconds',
  id: 'verify:a',
  profile: STANDARD,
  stage: 'preflight',
  ...fields
})

const judged =
  ({ registry }) =>
  () => ({ capabilities: ['sdd'], registry, scripts: SCRIPTS })

const listing = ({ steps }) => judged({ registry: { steps } })

export const CASES = [
  {
    context: listing({
      steps: [
        step({}),
        step({
          blind: BLIND.exported,
          capability: 'sdd',
          id: 'verify:b',
          stage: 'repository'
        }),
        step({
          command: 'turbo run lint',
          id: 'turbo',
          stage: 'repository'
        })
      ]
    }),
    expected: 0,
    name: 'a registry of known steps passes'
  },
  {
    context: judged({ registry: {} }),
    expected: 1,
    name: 'a registry with no steps array is refused'
  },
  {
    context: listing({ steps: [] }),
    expected: 1,
    name: 'a registry with no step is refused'
  },
  {
    context: listing({ steps: ['verify:a'] }),
    expected: 1,
    name: 'a step that is not an object is refused'
  },
  {
    context: listing({ steps: [step({ after: 'verify:b' })] }),
    expected: 1,
    name: 'a step with a key the registry does not know is refused'
  },
  {
    context: listing({ steps: [step({ id: '' })] }),
    expected: 1,
    name: 'a step with no id is refused'
  },
  {
    context: listing({ steps: [step({}), step({})] }),
    expected: 1,
    name: 'two steps with one id are refused'
  },
  {
    context: listing({ steps: [step({ capability: 'sentry' })] }),
    expected: 1,
    name: 'a capability the manifest does not declare is refused'
  },
  {
    context: listing({ steps: [step({ stage: 'deploy' })] }),
    expected: 1,
    name: 'a stage the registry does not know is refused'
  },
  {
    context: listing({
      steps: [
        step({ stage: 'repository' }),
        step({ id: 'verify:b', stage: 'preflight' })
      ]
    }),
    expected: 1,
    name: 'a step whose stage runs before the stage above it is refused'
  },
  {
    context: listing({ steps: [step({ profile: 'lenient' })] }),
    expected: 1,
    name: 'a profile the registry does not know is refused'
  },
  {
    context: listing({ steps: [step({ cost: 'hours' })] }),
    expected: 1,
    name: 'a cost the registry does not know is refused'
  },
  {
    context: listing({ steps: [step({ blind: 'private-cases' })] }),
    expected: 1,
    name: 'a blind the registry does not know is refused'
  },
  {
    context: listing({ steps: [step({ id: 'verify:c' })] }),
    expected: 1,
    name: 'a step whose script package.json does not define is refused'
  },
  {
    context: listing({ steps: [step({ command: ' ', id: 'turbo' })] }),
    expected: 1,
    name: 'a step with an empty command is refused'
  }
]

// ---------------------------------------------------------------------------
// The runner as a process, over a scratch tree whose `pnpm` is a fake that
// logs what it was asked and fails the one script FAKE_FAIL names.
// ---------------------------------------------------------------------------

const FAKE_PNPM = [
  "import { appendFileSync } from 'node:fs'",
  "const asked = process.argv.slice(2).join(' ')",
  "appendFileSync('log.txt', `pnpm ${asked}\\n`)",
  "const [failing, code] = (process.env.FAKE_FAIL ?? '').split('=')",
  'process.exit(asked === failing ? Number(code) : 0)'
].join('\n')

const NOTE = [
  "import { appendFileSync } from 'node:fs'",
  "appendFileSync('log.txt', `${process.argv[2]}\\n`)"
].join('\n')

const POSIX_SHIM = '#!/bin/sh\nexec node "$(dirname "$0")/pnpm.mjs" "$@"\n'
const WINDOWS_SHIM = '@node "%~dp0pnpm.mjs" %*\r\n'

const PATH_KEY =
  Object.keys(process.env).find((key) => key.toUpperCase() === 'PATH') ??
  'PATH'

const SCRATCH_SCRIPTS = {
  'verify:a': 'node a.mjs',
  'verify:b': 'node b.mjs'
}

const SCRATCH_STEPS = [
  step({}),
  step({
    command: 'node note.mjs turbo',
    id: 'turbo',
    stage: 'workspace'
  }),
  step({ id: 'verify:b', stage: 'repository' }),
  step({ command: 'node note.mjs last', id: 'last', stage: 'repository' })
]

const scratchFiles = ({ omit = [], overrides = {}, steps }) =>
  Object.fromEntries(
    Object.entries({
      'bin/pnpm': POSIX_SHIM,
      'bin/pnpm.cmd': WINDOWS_SHIM,
      'bin/pnpm.mjs': FAKE_PNPM,
      'note.mjs': NOTE,
      [PACKAGE_FILE]: JSON.stringify({ scripts: SCRATCH_SCRIPTS }),
      [REGISTRY_FILE]: JSON.stringify({ steps }),
      [MANIFEST_FILE]: JSON.stringify({ capabilities: [{ id: 'sdd' }] }),
      ...overrides
    }).filter(([name]) => !omit.includes(name))
  )

// Runs the runner over a fresh scratch tree and hands back its result and
// the lines the fake pnpm and the notes logged, in order.
const runInScratch = ({ args = [], env = {}, omit, overrides, steps }) =>
  withScratchTree({
    files: scratchFiles({ omit, overrides, steps }),
    prefix: SCRATCH_PREFIX,
    use: ({ root }) => {
      chmodSync(join(root, 'bin/pnpm'), EXECUTABLE_MODE)
      const result = spawnSync(
        process.execPath,
        [VALIDATE, '--root', root, ...args],
        {
          cwd: root,
          encoding: 'utf8',
          env: {
            ...process.env,
            ...env,
            [PATH_KEY]: `${join(root, 'bin')}${delimiter}${process.env[PATH_KEY]}`
          }
        }
      )
      const logFile = join(root, LOG_FILE)
      const logged = existsSync(logFile)
        ? readFileSync(logFile, 'utf8').split('\n').filter(Boolean)
        : []
      return { logged, result }
    }
  })

// ---------------------------------------------------------------------------
// The real registry, package.json and manifest.
// ---------------------------------------------------------------------------

const readJson = ({ path }) =>
  JSON.parse(readFileSync(join(REPO_ROOT, path), 'utf8'))

const repository = () => {
  const manifest = readJson({ path: MANIFEST_FILE })
  return {
    capabilities: manifest.capabilities.map(({ id }) => id),
    manifest,
    registry: readJson({ path: REGISTRY_FILE }),
    scripts: readJson({ path: PACKAGE_FILE }).scripts
  }
}

const SDD_STEPS = [
  'verify:specs:test',
  'verify:specs',
  'report:spec-drift:test',
  'report:spec-drift'
]

const SCRIPT_PATH = /^scripts\.(?<name>.+)$/u

// The root scripts a capability's prune unsets with `patch-json`.
const scriptsUnsetBy = ({ capability }) =>
  (capability.onAbsent ?? [])
    .filter(
      ({ file, op, verb }) =>
        verb === 'patch-json' && file === PACKAGE_FILE && op === 'unset'
    )
    .map(({ path }) => SCRIPT_PATH.exec(path)?.groups?.name)
    .filter(Boolean)

const pathsRemovedBy = ({ capability }) => [
  ...capability.claims,
  ...(capability.onAbsent ?? [])
    .filter(({ verb }) => verb === 'remove')
    .flatMap(({ paths }) => paths)
]

const PATH_TOKEN = /[^\s"']+\/[^\s"']+/gu

const ids = ({ steps }) => steps.map(({ id }) => id)

// The gate a module exports, or null when it defines none.
const gateIn = async ({ module }) => {
  const file = join(REPO_ROOT, module)
  if (!existsSync(file)) return null
  if (!readFileSync(file, 'utf8').includes('defineGate(')) return null
  const exported = await import(pathToFileURL(file).href)
  return typeof exported.gate?.run === 'function' ? exported.gate : null
}

const COMPANION_SUFFIX = '.test.mjs'

// What blinding one gate module needs: its gate, the one step of those
// reaching it that carries `blind`, and its companion's exported CASES; or
// the problems that stop it from being blinded at all. A companion registers
// its tests only as the entry point (registerCases), so importing it here
// runs none of them.
const loadBlinding = async ({ module, steps }) => {
  const found = await gateIn({ module })
  const carriers = steps.filter(({ blind }) => blind !== undefined)
  if (!found) {
    return {
      problems: carriers.map(
        ({ id }) => `${id} carries blind, but ${module} defines no gate`
      )
    }
  }
  if (carriers.length !== 1) {
    return {
      problems: [
        `${module} is blinded by ${carriers.length} step(s) of ${ids({ steps }).join(', ')}; exactly one must carry blind`
      ]
    }
  }
  const [{ id }] = carriers
  const companion = module.replace(/\.mjs$/u, COMPANION_SUFFIX)
  const companionFile = join(REPO_ROOT, companion)
  if (!existsSync(companionFile)) {
    return {
      problems: [`${id}: its companion ${companion} does not exist`]
    }
  }
  const { CASES: cases } = await import(pathToFileURL(companionFile).href)
  if (!Array.isArray(cases)) {
    return { problems: [`${id}: ${companion} exports no CASES to blind`] }
  }
  return {
    blinded: { cases, companion, gate: found, id, module },
    problems: []
  }
}

const blindedProblems = ({
  cases,
  companion,
  gate: judged,
  id,
  module
}) =>
  runCases({ cases, gate: blindGate({ gate: judged }) }).length > 0
    ? []
    : [`${id}: ${companion} still passes with ${module} blinded`]

// ---------------------------------------------------------------------------
// Checks.
// ---------------------------------------------------------------------------

const checks = [
  {
    name: 'pruning a capability drops every step it owns and keeps the rest in order',
    run: () => {
      const registry = {
        steps: [
          step({}),
          step({ capability: 'sdd', id: 'verify:b' }),
          step({ id: 'verify:c' }),
          step({ capability: 'sdd', id: 'verify:d' })
        ]
      }
      const pruned = pruneRegistry({ capability: 'sdd', registry })
      assert.deepEqual(ids(pruned), ['verify:a', 'verify:c'])
      assert.deepEqual(ids(registry), [
        'verify:a',
        'verify:b',
        'verify:c',
        'verify:d'
      ])
    }
  },
  {
    name: 'the run keeps the registry order, runs a script step as pnpm <id>, and a strict step only under the strict profile',
    run: () => {
      const registry = {
        steps: [
          step({}),
          step({ id: 'verify:b', profile: STRICT }),
          step({ command: 'turbo run lint', id: 'turbo' })
        ]
      }
      const commands = ({ profile }) =>
        planRun({ profile, registry }).map(({ command }) => command)
      assert.deepEqual(commands({ profile: STANDARD }), [
        'pnpm verify:a',
        'turbo run lint'
      ])
      assert.deepEqual(commands({ profile: STRICT }), [
        'pnpm verify:a',
        'pnpm verify:b',
        'turbo run lint'
      ])
    }
  },
  {
    name: 'a step reaches the module it runs, or the gate of the one companion it runs',
    run: () => {
      const expected = {
        'knip --no-progress': null,
        'node --test eslint-local-rules/index.test.mjs':
          'eslint-local-rules/index.mjs',
        'node --test scripts/a.test.mjs scripts/b.test.mjs': null,
        'node --test scripts/agent-harness/*.test.mjs': null,
        'node --test scripts/verify-skills.test.mjs':
          'scripts/verify-skills.mjs',
        'node scripts/build-diagrams.mjs --check':
          'scripts/build-diagrams.mjs',
        'node scripts/verify-english.mjs': 'scripts/verify-english.mjs'
      }
      Object.entries(expected).forEach(([script, module]) =>
        assert.equal(gateModuleOf({ script }), module, script)
      )
    }
  },
  {
    name: 'a companion whose cases still pass against the blinded gate is reported',
    run: () => {
      const planted = defineGate({
        claims: 'a planted gate',
        id: 'planted',
        notCovered: 'everything',
        run: ({ bad }) => (bad ? ['bad'] : [])
      })
      const blinded = ({ expected }) =>
        blindedProblems({
          cases: [
            { context: () => ({ bad: expected > 0 }), expected, name: 'x' }
          ],
          companion: 'planted.test.mjs',
          gate: planted,
          id: 'verify:planted',
          module: 'planted.mjs'
        })
      assert.deepEqual(blinded({ expected: 0 }), [
        'verify:planted: planted.test.mjs still passes with planted.mjs blinded'
      ])
      assert.deepEqual(blinded({ expected: 1 }), [])
    }
  },
  {
    name: 'the runner runs every step in order, a script step through pnpm, and exits 0',
    run: () => {
      const { logged, result } = runInScratch({ steps: SCRATCH_STEPS })
      assert.equal(result.status, 0, result.stderr)
      assert.deepEqual(logged, [
        'pnpm verify:a',
        'turbo',
        'pnpm verify:b',
        'last'
      ])
      assert.match(result.stdout, /validate: PASS — 4 step\(s\)/u)
    }
  },
  {
    name: 'the runner stops at the first failing step and exits with its code',
    run: () => {
      const { logged, result } = runInScratch({
        env: { FAKE_FAIL: `verify:b=${FAILING_CODE}` },
        steps: SCRATCH_STEPS
      })
      assert.equal(result.status, FAILING_CODE)
      assert.deepEqual(logged, ['pnpm verify:a', 'turbo', 'pnpm verify:b'])
      assert.match(
        result.stderr,
        /verify:b failed with exit code 3 \(step 3 of 4\); 1 step\(s\) not run/u
      )
    }
  },
  {
    name: 'the runner refuses a registry its gate refuses, before any step runs',
    run: () => {
      const { logged, result } = runInScratch({
        steps: [...SCRATCH_STEPS, step({ capability: 'sentry', id: 'x' })]
      })
      assert.equal(result.status, REFUSED)
      assert.deepEqual(logged, [])
      assert.match(result.stderr, /no step ran/u)
      assert.match(result.stderr, /"sentry"/u)
    }
  },
  {
    name: 'the runner refuses a registry, a package.json or a manifest it cannot read, naming it',
    run: () => {
      ;[
        { omit: [REGISTRY_FILE], named: REGISTRY_FILE },
        { named: PACKAGE_FILE, overrides: { [PACKAGE_FILE]: '{' } },
        { named: MANIFEST_FILE, omit: [MANIFEST_FILE] }
      ].forEach(({ named, omit, overrides }) => {
        const { logged, result } = runInScratch({
          omit,
          overrides,
          steps: SCRATCH_STEPS
        })
        assert.equal(result.status, REFUSED, named)
        assert.deepEqual(logged, [], named)
        assert.ok(result.stderr.includes(named), result.stderr)
      })
    }
  },
  {
    name: '--list prints every step of the run with its fields and runs none',
    run: () => {
      const { logged, result } = runInScratch({
        args: ['--list'],
        steps: SCRATCH_STEPS
      })
      assert.equal(result.status, 0, result.stderr)
      assert.deepEqual(logged, [])
      const lines = result.stdout.trim().split('\n')
      assert.equal(lines.length, SCRATCH_STEPS.length)
      assert.match(
        lines[0],
        /^preflight\s+verify:a\s+core\s+standard\s+seconds\s+pnpm verify:a$/u
      )
      assert.match(lines[1], /\snode note\.mjs turbo$/u)
    }
  },
  {
    name: 'a strict step runs only under --profile strict, and an unknown profile or flag is refused',
    run: () => {
      const steps = [
        step({}),
        step({
          command: 'node note.mjs strict',
          id: 'deep',
          profile: STRICT
        })
      ]
      assert.deepEqual(runInScratch({ steps }).logged, ['pnpm verify:a'])
      assert.deepEqual(
        runInScratch({ args: ['--profile', STRICT], steps }).logged,
        ['pnpm verify:a', 'strict']
      )
      const lenient = runInScratch({
        args: ['--profile', 'lenient'],
        steps
      })
      assert.equal(lenient.result.status, REFUSED)
      assert.match(lenient.result.stderr, /lenient/u)
      assert.deepEqual(lenient.logged, [])
      const unknown = runInScratch({ args: ['--fast'], steps })
      assert.equal(unknown.result.status, REFUSED)
      assert.deepEqual(unknown.logged, [])
    }
  },
  {
    name: 'the registry of this repository passes its gate',
    run: () => {
      const { capabilities, registry, scripts } = repository()
      assert.deepEqual(gate.run({ capabilities, registry, scripts }), [])
    }
  },
  {
    name: 'the validate chain runs the steps of the registry, in order',
    run: () => {
      const { registry, scripts } = repository()
      assert.deepEqual(
        scripts.validate.split(' && '),
        planRun({ profile: STANDARD, registry }).map(
          ({ command }) => command
        )
      )
    }
  },
  {
    name: 'the sdd prune drops its four steps from the run and keeps every other step in order',
    run: () => {
      const { registry } = repository()
      const before = ids({ steps: planRun({ profile: STRICT, registry }) })
      const after = ids({
        steps: planRun({
          profile: STRICT,
          registry: pruneRegistry({ capability: 'sdd', registry })
        })
      })
      assert.deepEqual(
        before.filter((id) => !after.includes(id)),
        SDD_STEPS
      )
      assert.deepEqual(
        after,
        before.filter((id) => !SDD_STEPS.includes(id))
      )
    }
  },
  {
    name: "every capability's prune leaves a registry the pruned package.json runs, and no step running a removed file",
    run: () => {
      const { capabilities, manifest, registry, scripts } = repository()
      manifest.capabilities.forEach((capability) => {
        const unset = scriptsUnsetBy({ capability })
        const kept = Object.fromEntries(
          Object.entries(scripts).filter(([name]) => !unset.includes(name))
        )
        const pruned = pruneRegistry({
          capability: capability.id,
          registry
        })
        assert.deepEqual(
          gate.run({ capabilities, registry: pruned, scripts: kept }),
          [],
          capability.id
        )
        const removed = pathsRemovedBy({ capability })
        planRun({ profile: STRICT, registry: pruned }).forEach(
          ({ id }) => {
            const named = (kept[id] ?? '').match(PATH_TOKEN) ?? []
            named.forEach((path) =>
              assert.ok(
                !matchesAny({ path, patterns: removed }),
                `${capability.id} removes ${path}, which ${id} still runs`
              )
            )
          }
        )
        // Without the prune, the same scripts leave a step with no script.
        if (unset.some((name) => ids(registry).includes(name))) {
          assert.ok(
            gate.run({ capabilities, registry, scripts: kept }).length > 0,
            `${capability.id}: an unpruned registry is not refused`
          )
        }
      })
    }
  },
  {
    name: 'every gate the run reaches is blinded by exactly one step, through its companion',
    run: async () => {
      const { registry, scripts } = repository()
      const byModule = new Map()
      registry.steps.forEach((entry) => {
        const module = scripts[entry.id]
          ? gateModuleOf({ script: scripts[entry.id] })
          : null
        if (module === null) {
          assert.equal(
            entry.blind,
            undefined,
            `${entry.id} reaches no module`
          )
          return
        }
        byModule.set(module, [...(byModule.get(module) ?? []), entry])
      })
      const loaded = await Promise.all(
        [...byModule].map(([module, steps]) =>
          loadBlinding({ module, steps })
        )
      )
      // The companions' cases build scratch trees and some start git, so
      // they run as a git hook would run them, against a decoy repository.
      const { decoyWritten, result } = withHookGitDir({
        use: () =>
          loaded.flatMap(({ blinded, problems }) => [
            ...problems,
            ...(blinded ? blindedProblems(blinded) : [])
          ])
      })
      assert.deepEqual(result, [])
      assert.equal(decoyWritten, false)
      assert.ok(
        loaded.filter(({ blinded }) => blinded).length > 0,
        'no gate was blinded'
      )
    }
  }
]

registerCases({ cases: CASES, checks, gate, meta: import.meta })
