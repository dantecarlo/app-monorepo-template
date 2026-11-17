// ---------------------------------------------------------------------------
// observability-port-contract — the cases every adapter of the observability
// port passes, whatever provider stands behind it (PostHog, Sentry, the
// console, none).
//
// The suite imports no test runner and no workspace package: the caller hands
// it its runner's `test` and a harness, so the same cases run under Vitest in
// the apps and packages/core and under node:test here. The harness builds the
// adapter with its provider's SDK replaced at the module boundary and reports
// what reached that SDK:
//
//   create({ enabled })  the adapter, its provider configured or not; it also
//                        forgets everything delivered before
//   delivered()          every payload handed to the provider since create()
//   currentUser()        the user the provider holds now, or null
//   delivers             false for an adapter with no provider behind it (the
//                        no-op one): nothing may ever reach a provider
//
// A raw PII value must reach the provider nowhere, the rest of a payload must
// reach it, and setUser(null) must leave the provider holding no user. A
// method the port leaves optional and the adapter omits has nothing to check.
// ---------------------------------------------------------------------------

const RAW_EMAIL = 'contract.person@example.com'
const KEPT_VALUE = 'contract-kept-value'
const USER_ID = 'contract-user-id'
const ERROR_MESSAGE = 'contract error'
const MESSAGE = 'contract message'
const CATEGORY = 'contract'
const LEVEL_INFO = 'info'
const LEVEL_WARNING = 'warning'

const PII_PAYLOAD = Object.freeze({ email: RAW_EMAIL, kept: KEPT_VALUE })
const PII_USER = Object.freeze({ email: RAW_EMAIL, id: USER_ID })

const fail = ({ message }) => {
  throw new Error(`observability port contract: ${message}`)
}

// Every string a payload holds, an error's message included. Each object is
// walked once, so a cyclic payload ends.
const collectStrings = ({ seen, strings, value }) => {
  if (typeof value === 'string') {
    strings.push(value)
    return strings
  }
  if (value === null || typeof value !== 'object' || seen.has(value)) {
    return strings
  }
  seen.add(value)
  if (value instanceof Error) strings.push(value.message)
  Object.values(value).forEach((entry) =>
    collectStrings({ seen, strings, value: entry })
  )
  return strings
}

const holds = ({ text, value }) =>
  collectStrings({ seen: new Set(), strings: [], value }).some((entry) =>
    entry.includes(text)
  )

const assertNothingDelivered = ({ harness, what }) => {
  if (harness.delivered().length > 0) {
    fail({ message: `${what} handed a payload to the provider` })
  }
  if (harness.currentUser()) {
    fail({ message: `${what} left the provider holding a user` })
  }
}

// What reached the provider holds no raw PII and, when the adapter has a
// provider, holds `kept`: the payload was scrubbed, not dropped.
const assertScrubbedDelivery = ({ harness, kept, what }) => {
  const reached = [harness.delivered(), harness.currentUser()]
  if (holds({ text: RAW_EMAIL, value: reached })) {
    fail({ message: `${what} handed raw PII to the provider` })
  }
  if (!harness.delivers) {
    assertNothingDelivered({ harness, what })
    return
  }
  if (!kept()) {
    fail({
      message: `${what}: the scrubbed payload did not reach the provider`
    })
  }
}

const keptInDelivery =
  ({ harness }) =>
  () =>
    holds({ text: KEPT_VALUE, value: harness.delivered() })

export const OBSERVABILITY_PORT_CONTRACT = Object.freeze([
  {
    run: async ({ harness }) => {
      const port = await harness.create({ enabled: false })
      try {
        port.captureError({
          context: PII_PAYLOAD,
          error: new Error(ERROR_MESSAGE)
        })
        port.captureMessage?.({
          context: PII_PAYLOAD,
          level: LEVEL_WARNING,
          message: MESSAGE
        })
        port.addBreadcrumb?.({
          category: CATEGORY,
          data: PII_PAYLOAD,
          level: LEVEL_INFO,
          message: MESSAGE
        })
        port.setUser?.({ user: PII_USER })
        port.setUser?.({ user: null })
      } catch (error) {
        fail({
          message: `a method threw while the provider is disabled: ${error.message}`
        })
      }
      assertNothingDelivered({ harness, what: 'a disabled provider' })
    },
    title: 'every method is safe while the provider is disabled'
  },
  {
    run: async ({ harness }) => {
      const port = await harness.create({ enabled: true })
      port.captureError({
        context: PII_PAYLOAD,
        error: new Error(ERROR_MESSAGE)
      })
      assertScrubbedDelivery({
        harness,
        kept: keptInDelivery({ harness }),
        what: 'captureError'
      })
    },
    title: 'captureError hands on the context with its PII scrubbed'
  },
  {
    run: async ({ harness }) => {
      const port = await harness.create({ enabled: true })
      if (!port.captureMessage) return
      port.captureMessage({
        context: PII_PAYLOAD,
        level: LEVEL_WARNING,
        message: MESSAGE
      })
      assertScrubbedDelivery({
        harness,
        kept: keptInDelivery({ harness }),
        what: 'captureMessage'
      })
    },
    title: 'captureMessage hands on the context with its PII scrubbed'
  },
  {
    run: async ({ harness }) => {
      const port = await harness.create({ enabled: true })
      if (!port.addBreadcrumb) return
      port.addBreadcrumb({
        category: CATEGORY,
        data: PII_PAYLOAD,
        level: LEVEL_INFO,
        message: MESSAGE
      })
      assertScrubbedDelivery({
        harness,
        kept: keptInDelivery({ harness }),
        what: 'addBreadcrumb'
      })
    },
    title: 'addBreadcrumb hands on the data with its PII scrubbed'
  },
  {
    run: async ({ harness }) => {
      const port = await harness.create({ enabled: true })
      if (!port.setUser) return
      port.setUser({ user: PII_USER })
      assertScrubbedDelivery({
        harness,
        kept: () => harness.currentUser()?.id === USER_ID,
        what: 'setUser'
      })
    },
    title:
      'setUser hands on the user with its PII scrubbed and its id kept'
  },
  {
    run: async ({ harness }) => {
      const port = await harness.create({ enabled: true })
      if (!port.setUser) return
      port.setUser({ user: PII_USER })
      port.setUser({ user: null })
      if (harness.currentUser()) {
        fail({
          message: 'after setUser(null) the provider still holds a user'
        })
      }
    },
    title: 'setUser(null) clears the user'
  }
])

/** Registers one test per contract case, through the caller's runner. */
export const runObservabilityPortContract = ({ harness, test }) => {
  OBSERVABILITY_PORT_CONTRACT.forEach(({ run, title }) => {
    test(title, () => run({ harness }))
  })
}
