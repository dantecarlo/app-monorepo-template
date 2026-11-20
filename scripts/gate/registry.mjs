// ---------------------------------------------------------------------------
// The gate registry — what `pnpm validate` runs, as data.
//
// .agents/contracts/gates.json lists every step of the gate in the order it
// runs (scripts/validate.mjs runs them). It is a contract, so the write
// guard asks before anyone edits it: dropping a step drops a gate. A step
// runs the root package.json script its `id` names, as `pnpm <id>`, unless
// it carries a `command`. Each step names:
//
//   capability  the owner whose prune removes it: `core`, never pruned, or
//               a capability of template.manifest.json
//   stage       preflight, workspace or repository; the stages run in that
//               order, so structural drift fails before anything expensive
//               builds
//   profile     the lowest quality profile that runs it: standard runs under
//               every profile, strict only under strict
//   cost        instant, seconds or minutes: what one run takes, declared
//   blind       on the one step that blinds a gate: exported-cases, its
//               companion exports CASES, which scripts/validate.test.mjs
//               re-runs against `blindGate`; they must then fail
//
// Every root script named `verify:*` or `*:test` is a step, or an entry of
// `outside`: `{ script, capability, reason }`, a gate script `pnpm validate`
// deliberately does not run, and why. A gate added to package.json and never
// registered is a finding, not a gate that silently stops running.
//
// An absent capability takes every step and outside entry it owns, the way it takes the
// entries of the dependency registry it owns (docs/manifest.md), so a prune
// removes its gates by data and never edits a command chain.
//
// Pure: the runner reads the files and hands their contents in.
// ---------------------------------------------------------------------------

export const REGISTRY_FILE = '.agents/contracts/gates.json'
export const CORE_CAPABILITY = 'core'

// In run order: a step's stage is never earlier than the stage above it.
export const STAGES = Object.freeze([
  'preflight',
  'workspace',
  'repository'
])

// From the lightest: a profile runs every step whose profile is at or
// before its own.
export const PROFILES = Object.freeze(['standard', 'strict'])

export const COSTS = Object.freeze(['instant', 'seconds', 'minutes'])

export const BLIND = Object.freeze({ exported: 'exported-cases' })

const BLINDS = Object.values(BLIND)
const REQUIRED_KEYS = ['capability', 'cost', 'id', 'profile', 'stage']
const KNOWN_KEYS = new Set([...REQUIRED_KEYS, 'blind', 'command'])

const isText = (value) => typeof value === 'string' && value.trim() !== ''

const isObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const quoted = (value) => JSON.stringify(value)

const oneOf = ({ field, known, name, value }) =>
  known.includes(value)
    ? []
    : [
        `${name}: ${field} ${quoted(value)} is not one of ${known.join(', ')}`
      ]

// The findings of one step, judged alone. `name` is how a finding names it.
const stepProblems = ({ capabilities, entry, name, scripts }) => {
  const unknown = Object.keys(entry).filter((key) => !KNOWN_KEYS.has(key))
  const command = entry.command === undefined ? [] : [entry.command]
  return [
    ...unknown.map(
      (key) =>
        `${name}: key ${quoted(key)} is not one the registry knows (${[...KNOWN_KEYS].sort().join(', ')})`
    ),
    ...(isText(entry.id)
      ? []
      : [`${name}: id must be a non-empty string`]),
    ...command
      .filter((value) => !isText(value))
      .map(() => `${name}: command must be a non-empty string`),
    ...oneOf({
      field: 'capability',
      known: [CORE_CAPABILITY, ...capabilities],
      name,
      value: entry.capability
    }).map(
      (detail) =>
        `${detail}: name the capability whose prune removes the step, which template.manifest.json declares`
    ),
    ...oneOf({ field: 'stage', known: STAGES, name, value: entry.stage }),
    ...oneOf({
      field: 'profile',
      known: PROFILES,
      name,
      value: entry.profile
    }),
    ...oneOf({ field: 'cost', known: COSTS, name, value: entry.cost }),
    ...(entry.blind === undefined
      ? []
      : oneOf({
          field: 'blind',
          known: BLINDS,
          name,
          value: entry.blind
        })),
    ...(command.length === 0 &&
    isText(entry.id) &&
    !Object.hasOwn(scripts, entry.id)
      ? [
          `${name}: the root package.json defines no script ${quoted(entry.id)}, so pnpm ${entry.id} cannot run; a prune that unsets a script must take its step too`
        ]
      : [])
  ]
}

// The findings across steps: one id per step, and stages in run order.
const orderProblems = ({ steps }) => {
  const seen = new Set()
  let stage = 0
  return steps.flatMap((entry) => {
    const problems = []
    if (seen.has(entry.id)) {
      problems.push({
        detail: `${entry.id}: two steps share this id`,
        id: entry.id
      })
    }
    seen.add(entry.id)
    const rank = STAGES.indexOf(entry.stage)
    if (rank >= 0 && rank < stage) {
      problems.push({
        detail: `${entry.id}: its stage ${entry.stage} runs before ${STAGES[stage]}, the stage of a step above it; move it up to its stage`,
        id: entry.id
      })
    }
    stage = Math.max(stage, rank)
    return problems
  })
}

// A root script that judges the repository or runs a suite: the registry
// runs it as a step or lists it in `outside` with the reason it does not.
export const GATE_SCRIPT = /^verify:|:test$/u

const OUTSIDE_KEYS = new Set(['capability', 'reason', 'script'])

// The findings of the `outside` list: each entry names a script the root
// package.json defines and no step runs, the owner whose prune removes the
// entry, and why `pnpm validate` does not run the script.
const outsideProblems = ({ capabilities, outside, scripts, stepIds }) => {
  if (outside === undefined) return []
  if (!Array.isArray(outside)) {
    return [
      {
        detail: `${REGISTRY_FILE}: "outside" must be an array of { script, capability, reason }`,
        id: REGISTRY_FILE
      }
    ]
  }
  return outside.flatMap((entry, index) => {
    if (!isObject(entry)) {
      return [
        {
          detail: `outside entry ${index + 1} is not an object`,
          id: `outside ${index + 1}`
        }
      ]
    }
    const name = isText(entry.script)
      ? entry.script
      : `outside entry ${index + 1}`
    const known = isText(entry.script)
    return [
      ...Object.keys(entry)
        .filter((key) => !OUTSIDE_KEYS.has(key))
        .map(
          (key) =>
            `${name}: key ${quoted(key)} is not one an outside entry knows (${[...OUTSIDE_KEYS].sort().join(', ')})`
        ),
      ...(known ? [] : [`${name}: script must be a non-empty string`]),
      ...(isText(entry.reason)
        ? []
        : [
            `${name}: reason must say why pnpm validate does not run the script`
          ]),
      ...oneOf({
        field: 'capability',
        known: [CORE_CAPABILITY, ...capabilities],
        name,
        value: entry.capability
      }),
      ...(known && !Object.hasOwn(scripts, entry.script)
        ? [
            `${name}: the root package.json defines no such script, so the entry is stale; a prune that unsets a script must take its entry too`
          ]
        : []),
      ...(known && stepIds.has(entry.script)
        ? [`${name}: a step runs it, so it cannot also be listed outside`]
        : [])
    ].map((detail) => ({ detail, id: name }))
  })
}

// Every gate script of the root package.json that no step runs and no
// outside entry lists: a gate added to package.json and never registered.
const coverageProblems = ({ outside, scripts, stepIds }) => {
  const listed = new Set(
    (Array.isArray(outside) ? outside : [])
      .filter(isObject)
      .map(({ script }) => script)
  )
  return Object.keys(scripts)
    .filter((name) => GATE_SCRIPT.test(name))
    .filter((name) => !stepIds.has(name) && !listed.has(name))
    .map((name) => ({
      detail: `${name}: the root package.json defines this gate script, but ${REGISTRY_FILE} neither runs it as a step nor lists it in "outside" with the reason it does not run`,
      id: name
    }))
}

// Every problem of a registry, as findings `{ detail, id }`. `capabilities`
// are the ids template.manifest.json declares, `scripts` the scripts of the
// root package.json.
export const analyzeRegistry = ({ capabilities, registry, scripts }) => {
  if (!isObject(registry) || !Array.isArray(registry.steps)) {
    return [
      {
        detail: `${REGISTRY_FILE} holds no "steps" array, so the gate would run nothing`,
        id: REGISTRY_FILE
      }
    ]
  }
  if (registry.steps.length === 0) {
    return [
      {
        detail: `${REGISTRY_FILE} lists no step, and a gate that runs nothing reports a green over nothing`,
        id: REGISTRY_FILE
      }
    ]
  }

  const shaped = registry.steps.filter(isObject)
  const misshapen = registry.steps
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !isObject(entry))
    .map(({ index }) => ({
      detail: `step ${index + 1} is not an object`,
      id: `step ${index + 1}`
    }))

  const single = registry.steps.flatMap((entry, index) => {
    if (!isObject(entry)) return []
    const name = isText(entry.id) ? entry.id : `step ${index + 1}`
    return stepProblems({ capabilities, entry, name, scripts }).map(
      (detail) => ({ detail, id: name })
    )
  })

  const across = orderProblems({
    steps: shaped.filter(({ id }) => isText(id))
  })

  const stepIds = new Set(
    shaped
      .filter((entry) => entry.command === undefined)
      .map(({ id }) => id)
  )
  const listed = outsideProblems({
    capabilities,
    outside: registry.outside,
    scripts,
    stepIds
  })
  const unregistered = coverageProblems({
    outside: registry.outside,
    scripts,
    stepIds
  })

  return [...misshapen, ...single, ...across, ...listed, ...unregistered]
}

// The registry without the steps and outside entries `capability` owns, the
// rest in order.
export const pruneRegistry = ({ capability, registry }) => ({
  ...registry,
  ...(Array.isArray(registry.outside)
    ? {
        outside: registry.outside.filter(
          (entry) => entry.capability !== capability
        )
      }
    : {}),
  steps: registry.steps.filter((entry) => entry.capability !== capability)
})

export const stepCommand = ({ step }) => step.command ?? `pnpm ${step.id}`

// The steps a profile runs, in registry order, each with the command it
// runs.
export const planRun = ({ profile, registry }) => {
  const rank = PROFILES.indexOf(profile)
  return registry.steps
    .filter((entry) => PROFILES.indexOf(entry.profile) <= rank)
    .map((entry) => ({ ...entry, command: stepCommand({ step: entry }) }))
}

// `node <file>.mjs [args]` reaches <file>.mjs; `node --test <file>.test.mjs`
// reaches <file>.mjs, the module its one companion judges. A glob, several
// files or another program reach no module.
const NODE_MODULE =
  /^node (?:(?<test>--test) )?(?<file>[\w@./-]+?)(?:\.test)?\.mjs(?:\s+(?<rest>.*))?$/u

export const gateModuleOf = ({ script }) => {
  const groups = NODE_MODULE.exec(script.trim())?.groups
  if (!groups) return null
  if (groups.test && groups.rest) return null
  return `${groups.file}.mjs`
}
