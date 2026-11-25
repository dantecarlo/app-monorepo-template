// ---------------------------------------------------------------------------
// contract — reads `.agents/contracts/process-reaper.json`, the families of
// processes the reaper may end, through a closed schema: a key it does not
// name, a missing field, an id used twice or a pattern that does not compile
// throws, naming the file and the entry, so the reaper ends nothing from a
// contract it cannot read.
//
// A family is { id, match, what, wrapper? }. Each entry of `match` holds an
// `exe` pattern, read against the process's own executable path, and may
// hold a `script` pattern, read against the script an interpreter runs, and
// an `args` pattern, read against the arguments after it (plan.mjs reads
// those three from the command line); every pattern compiles
// case-insensitive. The optional `spare` list names, in the same shape
// without `wrapper`, the processes the reaper never ends, nor any tree that
// holds one.
// ---------------------------------------------------------------------------

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const CONTRACT = '.agents/contracts/process-reaper.json'

const TOP_KEYS = ['$comment', 'boundSeconds', 'families', 'graceSeconds', 'spare']
const FAMILY_KEYS = ['id', 'match', 'what', 'wrapper']
const REQUIRED_TEXT_KEYS = ['id', 'what']
const MATCH_KEYS = ['args', 'exe', 'script']
const SECONDS_KEYS = ['boundSeconds', 'graceSeconds']
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const PATTERN_FLAGS = 'iu'
const FAMILIES = 'families'

const refuse = ({ problem }) => {
  throw new Error(`${CONTRACT}: ${problem}`)
}

const isObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const unknownKeys = ({ allowed, value }) =>
  Object.keys(value).filter((key) => !allowed.includes(key))

const compile = ({ label, pattern, where }) => {
  try {
    return new RegExp(pattern, PATTERN_FLAGS)
  } catch (error) {
    return refuse({
      problem: `family ${label}: ${where} does not compile (${error.message})`
    })
  }
}

const parseMatch = ({ entry, index, label }) => {
  const where = `match[${index}]`
  if (!isObject(entry)) refuse({ problem: `family ${label}: ${where} is not an object` })
  const unknown = unknownKeys({ allowed: MATCH_KEYS, value: entry })
  if (unknown.length > 0) {
    refuse({ problem: `family ${label}: ${where}: unknown key ${unknown.join(', ')}` })
  }
  if (typeof entry.exe !== 'string' || entry.exe.trim() === '') {
    refuse({ problem: `family ${label}: ${where} has no exe pattern` })
  }
  return Object.fromEntries(
    MATCH_KEYS.filter((key) => entry[key] !== undefined).map((key) => {
      if (typeof entry[key] !== 'string') {
        refuse({ problem: `family ${label}: ${where}.${key} is not a pattern` })
      }
      return [key, compile({ label, pattern: entry[key], where: `${where}.${key}` })]
    })
  )
}

const parseFamily = ({ family, index, list }) => {
  if (!isObject(family)) refuse({ problem: `${list}[${index}] is not an object` })
  const label = typeof family.id === 'string' ? family.id : `${list}[${index}]`
  const allowed =
    list === FAMILIES ? FAMILY_KEYS : FAMILY_KEYS.filter((key) => key !== 'wrapper')
  const unknown = unknownKeys({ allowed, value: family })
  if (unknown.length > 0) {
    refuse({ problem: `family ${label}: unknown key ${unknown.join(', ')}` })
  }
  const missing = REQUIRED_TEXT_KEYS.filter(
    (key) => typeof family[key] !== 'string' || family[key].trim() === ''
  )
  if (missing.length > 0) {
    refuse({ problem: `family ${label}: missing ${missing.join(', ')}` })
  }
  if (!ID.test(family.id)) {
    refuse({ problem: `family ${family.id}: the id is not kebab-case` })
  }
  if (family.wrapper !== undefined && family.wrapper !== true) {
    refuse({ problem: `family ${family.id}: wrapper is true or absent` })
  }
  if (!Array.isArray(family.match) || family.match.length === 0) {
    refuse({ problem: `family ${family.id}: match must be a non-empty list` })
  }
  return {
    id: family.id,
    match: family.match.map((entry, at) =>
      parseMatch({ entry, index: at, label: family.id })
    ),
    what: family.what,
    wrapper: family.wrapper === true
  }
}

/** The contract in `text`, or a throw naming the file and what is wrong. */
export const parseContract = ({ text }) => {
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return refuse({ problem: `does not parse (${error.message})` })
  }
  if (!isObject(parsed)) refuse({ problem: 'is not a JSON object' })
  const unknown = unknownKeys({ allowed: TOP_KEYS, value: parsed })
  if (unknown.length > 0) refuse({ problem: `unknown key ${unknown.join(', ')}` })
  SECONDS_KEYS.forEach((key) => {
    if (!Number.isInteger(parsed[key]) || parsed[key] <= 0) {
      refuse({ problem: `${key} must be a positive whole number of seconds` })
    }
  })
  if (!Array.isArray(parsed.families) || parsed.families.length === 0) {
    refuse({ problem: 'families must be a non-empty list' })
  }
  if (parsed.spare !== undefined && !Array.isArray(parsed.spare)) {
    refuse({ problem: 'spare must be a list' })
  }
  const families = parsed.families.map((family, index) =>
    parseFamily({ family, index, list: FAMILIES })
  )
  const spare = (parsed.spare ?? []).map((family, index) =>
    parseFamily({ family, index, list: 'spare' })
  )
  const seen = new Set()
  ;[...families, ...spare].forEach(({ id }) => {
    if (seen.has(id)) refuse({ problem: `family ${id} is listed twice` })
    seen.add(id)
  })
  return {
    boundSeconds: parsed.boundSeconds,
    families,
    graceSeconds: parsed.graceSeconds,
    spare
  }
}

export const loadContract = ({ root }) =>
  parseContract({ text: readFileSync(join(root, CONTRACT), 'utf8') })
