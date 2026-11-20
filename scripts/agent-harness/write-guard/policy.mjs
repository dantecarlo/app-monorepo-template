// ---------------------------------------------------------------------------
// policy — what the write guard reads: the rule files and the switch-off
// variable of `.agents/contracts/write-guard.json`, and who the payload's
// caller is under `.agents/agent-context.json`.
//
// A file that cannot be read loads as an Error rather than throwing, so the
// decision engine can still refuse or ask instead of letting a crash wave
// the call through: a PreToolUse hook that throws lets the call run.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { globToRegExp } from '../../manifest.mjs'

export const POLICY_FILE = '.agents/contracts/write-guard.json'
export const AGENT_CONTEXT_FILE = '.agents/agent-context.json'

// The way out when the policy itself cannot be read: the same variable the
// policy names, which a test holds equal to it.
export const SWITCH_OFF = Object.freeze({
  value: 'off',
  variable: 'ATL_WRITE_GUARD'
})

export const ACTOR_KIND = Object.freeze({
  main: 'main',
  readOnly: 'read-only',
  surface: 'surface',
  unknown: 'unknown',
  writer: 'writer'
})

const readJson = ({ path, root }) => {
  try {
    return JSON.parse(readFileSync(join(root, path), 'utf8'))
  } catch (error) {
    return new Error(`${path} cannot be read: ${error.message}`)
  }
}

export const loadGuardFiles = ({ root }) => ({
  agentContext: readJson({ path: AGENT_CONTEXT_FILE, root }),
  policy: readJson({ path: POLICY_FILE, root })
})

const isRecord = ({ value }) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const isText = ({ value }) =>
  typeof value === 'string' && value.trim() !== ''

const policyProblem = ({ policy }) => {
  if (policy instanceof Error) return policy.message
  if (!isRecord({ value: policy })) return 'it is not an object'
  const { ruleFiles, switchOff } = policy
  if (!Array.isArray(ruleFiles) || ruleFiles.length === 0) {
    return 'ruleFiles is not a non-empty list'
  }
  const bad = ruleFiles.find(
    (rule) =>
      !isRecord({ value: rule }) ||
      !isText({ value: rule.glob }) ||
      !isText({ value: rule.what })
  )
  if (bad !== undefined) {
    return `the rule ${JSON.stringify(bad)} needs a glob and a what`
  }
  return isRecord({ value: switchOff }) &&
    isText({ value: switchOff.variable }) &&
    isText({ value: switchOff.value })
    ? null
    : 'switchOff needs a variable and a value'
}

export const assertPolicy = ({ policy }) => {
  const problem = policyProblem({ policy })
  if (problem !== null) {
    throw new Error(
      problem.startsWith(POLICY_FILE)
        ? problem
        : `${POLICY_FILE} is malformed: ${problem}`
    )
  }
}

// A glob that starts `~/` names a file of the home folder, matched against
// the path relative to it; every other glob is read relative to a checkout.
const HOME_PREFIX = '~/'

// A `.git` below a checkout root moves the root every glob is read from, so
// it is a rule path whatever the policy lists. It is not a policy entry,
// so no edit of the policy can drop it.
export const GIT_RULE = Object.freeze({
  glob: '**/.git',
  what: 'a .git file or folder, which moves the root every rule glob is read from'
})

const GIT_SEGMENT = /(?:^|\/)\.git(?:\/|$)/iu

const globMatches = ({ glob, path }) =>
  globToRegExp({ pattern: glob.toLowerCase() }).test(path.toLowerCase())

const asRule = ({ rule }) =>
  rule === undefined ? undefined : { glob: rule.glob, what: rule.what }

// The rule a checkout-relative path falls under, or undefined.
export const ruleFor = ({ policy, relative }) =>
  GIT_SEGMENT.test(relative)
    ? { ...GIT_RULE }
    : asRule({
        rule: policy.ruleFiles.find(
          ({ glob }) =>
            !glob.startsWith(HOME_PREFIX) &&
            globMatches({ glob, path: relative })
        )
      })

// The rule a path relative to the home folder falls under, or undefined.
export const homeRuleFor = ({ policy, relative }) =>
  asRule({
    rule: policy.ruleFiles.find(
      ({ glob }) =>
        glob.startsWith(HOME_PREFIX) &&
        globMatches({
          glob: glob.slice(HOME_PREFIX.length),
          path: relative
        })
    )
  })

// Read without anything that can throw: an unreadable policy still leaves
// the documented variable to switch the guard off.
export const isSwitchedOff = ({ env, policy }) => {
  const { value, variable } =
    policyProblem({ policy }) === null ? policy.switchOff : SWITCH_OFF
  const set = env?.[variable]
  return (
    typeof set === 'string' &&
    set.trim().toLowerCase() === value.toLowerCase()
  )
}

const unknown = ({ name, problem }) => ({
  kind: ACTOR_KIND.unknown,
  name,
  problem
})

const folderOf = ({ prefix }) =>
  prefix.replaceAll('\\', '/').replace(/\/+$/u, '').toLowerCase()

/**
 * Who makes the call. Claude Code sets `agent_type` inside a subagent, and
 * the main session carries none, so the main session needs no agent
 * context. An agent the context does not list is a writer; one whose entry
 * cannot be read is unknown, and the engine refuses it.
 */
export const actorFor = ({ agentContext, payload }) => {
  const name = payload?.agent_type
  if (typeof name !== 'string')
    return { kind: ACTOR_KIND.main, name: null }
  if (agentContext instanceof Error) {
    return unknown({ name, problem: agentContext.message })
  }
  const agents = agentContext?.agents
  if (!isRecord({ value: agents })) {
    return unknown({
      name,
      problem: `${AGENT_CONTEXT_FILE} holds no "agents" object`
    })
  }
  if (!Object.hasOwn(agents, name)) {
    return { kind: ACTOR_KIND.writer, name }
  }
  const entry = agents[name]
  const problem = `${AGENT_CONTEXT_FILE} has a malformed entry for ${name}`
  if (!isRecord({ value: entry })) return unknown({ name, problem })
  if (
    Object.hasOwn(entry, 'writes') &&
    typeof entry.writes !== 'boolean'
  ) {
    return unknown({ name, problem })
  }
  if (entry.writes === false) return { kind: ACTOR_KIND.readOnly, name }
  if (!Object.hasOwn(entry, 'surface')) {
    return { kind: ACTOR_KIND.writer, name }
  }
  const { surface } = entry
  if (
    !Array.isArray(surface) ||
    surface.length === 0 ||
    !surface.every((prefix) => isText({ value: prefix }))
  ) {
    return unknown({ name, problem })
  }
  return {
    kind: ACTOR_KIND.surface,
    name,
    surface: surface.map((prefix) => folderOf({ prefix }))
  }
}
