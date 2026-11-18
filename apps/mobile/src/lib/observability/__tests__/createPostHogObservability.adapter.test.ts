import {
  createMemoryKeyValueStorage,
  ObservabilityLevelEnum
} from '@app/core'
import {
  type IObservabilityPortHarness,
  runObservabilityPortContract
} from '@app/tooling/observability-port-contract'
import { afterEach, describe, expect, test, vi } from 'vitest'

// The SDK is replaced at its module: every client the module builds calls
// these spies.
const sdk = vi.hoisted(() => ({
  addExceptionStep: vi.fn(),
  captureException: vi.fn(),
  captureLog: vi.fn(),
  construct: vi.fn(),
  identify: vi.fn(),
  optIn: vi.fn(async () => undefined),
  reset: vi.fn()
}))

vi.mock('posthog-react-native', () => ({
  PostHog: class {
    addExceptionStep = sdk.addExceptionStep
    captureException = sdk.captureException
    captureLog = sdk.captureLog
    identify = sdk.identify
    optIn = sdk.optIn
    reset = sdk.reset
    constructor(...args: unknown[]) {
      sdk.construct(...args)
    }
  }
}))

const KEY = 'phc_contract_key'
const EMAIL = 'user@example.com'
const REDACTED = '[redacted]'

// The client reads the key when its module loads, so each adapter comes from
// a fresh module registry under its own environment.
const loadAdapter = async ({
  consent,
  key
}: {
  consent?: string
  key?: string
}) => {
  Object.values(sdk).forEach((mock) => mock.mockClear())
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_CONSENT', consent)
  vi.resetModules()
  // A fresh device: the project module that owns the device storage is
  // replaced by the in-memory storage of @app/core.
  const device = createMemoryKeyValueStorage()
  vi.doMock('@/lib/storage', () => ({ keyValueStorage: device }))
  const { createPostHogObservability } =
    await import('@/lib/observability/createPostHogObservability.adapter')
  return createPostHogObservability()
}

afterEach(() => {
  vi.unstubAllEnvs()
})

test('captureError sends the exception with the scrubbed context', async () => {
  const adapter = await loadAdapter({ key: KEY })
  const error = new Error('boom')

  adapter.captureError({
    context: { email: EMAIL, screen: 'Home' },
    error
  })

  expect(sdk.captureException).toHaveBeenCalledExactlyOnceWith(error, {
    email: REDACTED,
    screen: 'Home'
  })
})

test('captureMessage sends a log record at the mapped level', async () => {
  const adapter = await loadAdapter({ key: KEY })

  adapter.captureMessage?.({
    context: { email: EMAIL, step: 'checkout' },
    level: ObservabilityLevelEnum.WARNING,
    message: 'slow response'
  })

  expect(sdk.captureLog).toHaveBeenCalledExactlyOnceWith({
    attributes: { email: REDACTED, step: 'checkout' },
    body: 'slow response',
    level: 'warn'
  })
})

test('addBreadcrumb adds an exception step with the scrubbed data', async () => {
  const adapter = await loadAdapter({ key: KEY })

  adapter.addBreadcrumb?.({
    category: 'navigation',
    data: { email: EMAIL, screen: 'Items' },
    message: 'opened the items'
  })

  expect(sdk.addExceptionStep).toHaveBeenCalledExactlyOnceWith(
    'opened the items',
    {
      category: 'navigation',
      email: REDACTED,
      level: ObservabilityLevelEnum.INFO,
      screen: 'Items'
    }
  )
})

test('setUser identifies the id with the scrubbed rest', async () => {
  const adapter = await loadAdapter({ key: KEY })

  adapter.setUser?.({ user: { email: EMAIL, id: 'u1' } })
  adapter.setUser?.({ user: { id: 'u2' } })

  expect(sdk.identify.mock.calls).toEqual([
    ['u1', { email: REDACTED }],
    ['u2', undefined]
  ])
  expect(sdk.reset).not.toHaveBeenCalled()
})

test('setUser(null) resets the identity', async () => {
  const adapter = await loadAdapter({ key: KEY })

  adapter.setUser?.({ user: null })

  expect(sdk.reset).toHaveBeenCalledOnce()
  expect(sdk.identify).not.toHaveBeenCalled()
})

// What reached PostHog: every capture call, and the identity the last
// identify or reset left.
const DELIVERING_CALLS = [
  sdk.addExceptionStep,
  sdk.captureException,
  sdk.captureLog,
  sdk.identify
]

test('drops every call in opt-in mode before a grant', async () => {
  const adapter = await loadAdapter({ consent: 'opt-in', key: KEY })

  adapter.captureError({ error: new Error('before consent') })
  adapter.captureMessage?.({
    level: ObservabilityLevelEnum.WARNING,
    message: 'before consent'
  })
  adapter.addBreadcrumb?.({ message: 'before consent' })
  adapter.setUser?.({ user: { id: 'u1' } })
  adapter.setUser?.({ user: null })
  const { createPostHogConsent } =
    await import('@/lib/observability/createPostHogConsent.adapter')
  await createPostHogConsent().grant()

  expect(sdk.construct).toHaveBeenCalledOnce()
  expect(sdk.optIn).toHaveBeenCalledOnce()
  DELIVERING_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
  expect(sdk.reset).not.toHaveBeenCalled()
})

const lastCallOrder = (mock: typeof sdk.identify): number =>
  mock.mock.invocationCallOrder.at(-1) ?? 0

const postHogHarness: IObservabilityPortHarness = {
  create: ({ enabled }) => loadAdapter({ key: enabled ? KEY : undefined }),
  currentUser: () => {
    if (lastCallOrder(sdk.identify) <= lastCallOrder(sdk.reset)) {
      return null
    }
    const [id, properties] = sdk.identify.mock.calls.at(-1) ?? []
    return { ...(properties as object), id }
  },
  delivered: () => DELIVERING_CALLS.flatMap((mock) => mock.mock.calls),
  delivers: true
}

describe('the observability port contract', () => {
  runObservabilityPortContract({ harness: postHogHarness, test })
})
