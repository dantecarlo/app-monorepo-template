import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  OBSERVABILITY_PORT_CONTRACT,
  runObservabilityPortContract
} from '../observability-port-contract.mjs'

const REDACTED = '[redacted]'
const PII_KEY = 'email'

const DISABLED_CASE = 'every method is safe while the provider is disabled'
const CLEAR_CASE = 'setUser(null) clears the user'
const SCRUB_CASES = [
  'captureError hands on the context with its PII scrubbed',
  'captureMessage hands on the context with its PII scrubbed',
  'addBreadcrumb hands on the data with its PII scrubbed',
  'setUser hands on the user with its PII scrubbed and its id kept'
]

const scrub = (value) => {
  if (Array.isArray(value)) return value.map(scrub)
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      key === PII_KEY ? REDACTED : scrub(entry)
    ])
  )
}

// An in-memory provider behind an adapter with one flaw switched on at a
// time, so each case can be seen to fail for its own reason.
const createReferenceHarness = ({
  clearsUser = true,
  delivers = true,
  scrubs = true,
  throwsWhileDisabled = false
} = {}) => {
  const state = { delivered: [], user: null }
  const prepare = scrubs ? scrub : (value) => value

  const send = ({ enabled, payload }) => {
    if (!enabled) {
      if (throwsWhileDisabled) throw new Error('provider is disabled')
      return
    }
    if (delivers) state.delivered.push(prepare(payload))
  }

  return {
    create: ({ enabled }) => {
      state.delivered = []
      state.user = null
      return {
        addBreadcrumb: (params) => send({ enabled, payload: params }),
        captureError: (params) => send({ enabled, payload: params }),
        captureMessage: (params) => send({ enabled, payload: params }),
        setUser: ({ user }) => {
          send({ enabled, payload: { user } })
          if (!enabled || !delivers) return
          if (user === null && !clearsUser) return
          state.user = user === null ? null : prepare(user)
        }
      }
    },
    currentUser: () => state.user,
    delivered: () => state.delivered,
    delivers: true
  }
}

const runCase = ({ harness, title }) =>
  OBSERVABILITY_PORT_CONTRACT.find((entry) => entry.title === title).run({
    harness
  })

test('the contract registers one test per case, by its title', () => {
  const titles = []
  runObservabilityPortContract({
    harness: createReferenceHarness(),
    test: (title) => titles.push(title)
  })

  assert.deepEqual(titles, [DISABLED_CASE, ...SCRUB_CASES, CLEAR_CASE])
})

test('an adapter that keeps the contract passes every case', async () => {
  for (const { run } of OBSERVABILITY_PORT_CONTRACT) {
    await run({ harness: createReferenceHarness() })
  }
})

test('an adapter that hands nothing on passes as a silent provider', async () => {
  const harness = { ...createReferenceHarness(), delivers: false }
  const silent = {
    ...harness,
    create: () => ({
      addBreadcrumb: () => undefined,
      captureError: () => undefined,
      captureMessage: () => undefined,
      setUser: () => undefined
    })
  }

  for (const { run } of OBSERVABILITY_PORT_CONTRACT) {
    await run({ harness: silent })
  }
})

test('an adapter that throws while disabled fails the disabled case', async () => {
  await assert.rejects(
    runCase({
      harness: createReferenceHarness({ throwsWhileDisabled: true }),
      title: DISABLED_CASE
    }),
    /threw while the provider is disabled/
  )
})

test('an adapter that hands on a raw email fails the scrub cases', async () => {
  for (const title of SCRUB_CASES) {
    await assert.rejects(
      runCase({
        harness: createReferenceHarness({ scrubs: false }),
        title
      }),
      /raw PII/,
      title
    )
  }
})

test('an adapter that drops what it should deliver fails the scrub cases', async () => {
  for (const title of SCRUB_CASES) {
    await assert.rejects(
      runCase({
        harness: createReferenceHarness({ delivers: false }),
        title
      }),
      /did not reach the provider/,
      title
    )
  }
})

test('an adapter that keeps the user after setUser(null) fails the clear case', async () => {
  await assert.rejects(
    runCase({
      harness: createReferenceHarness({ clearsUser: false }),
      title: CLEAR_CASE
    }),
    /still holds a user/
  )
})
