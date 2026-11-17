import { ObservabilityLevelEnum } from '@app/core'
import {
  type IObservabilityPortHarness,
  runObservabilityPortContract
} from '@app/tooling/observability-port-contract'
import { afterEach, describe, expect, test, vi } from 'vitest'

// The SDK is replaced at its module: the client initialises this object and
// hands it to the adapter as the PostHog client.
const sdk = vi.hoisted(() => ({
  addExceptionStep: vi.fn(),
  captureException: vi.fn(),
  captureLog: vi.fn(),
  identify: vi.fn(),
  init: vi.fn(),
  reset: vi.fn()
}))

vi.mock('posthog-js', () => ({ default: sdk }))

const KEY = 'phc_contract_key'
const EMAIL = 'user@example.com'
const REDACTED = '[redacted]'

// The client reads the key when its module loads, so each adapter comes from
// a fresh module registry under its own environment.
const loadAdapter = async ({ key }: { key?: string }) => {
  Object.values(sdk).forEach((mock) => mock.mockClear())
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', key)
  vi.resetModules()
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
    context: { email: EMAIL, source: 'queryCache' },
    error
  })

  expect(sdk.captureException).toHaveBeenCalledExactlyOnceWith(error, {
    email: REDACTED,
    source: 'queryCache'
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
    data: { email: EMAIL, route: '/items' },
    message: 'opened the items'
  })

  expect(sdk.addExceptionStep).toHaveBeenCalledExactlyOnceWith(
    'opened the items',
    {
      category: 'navigation',
      email: REDACTED,
      level: ObservabilityLevelEnum.INFO,
      route: '/items'
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

const lastCallOrder = (mock: typeof sdk.identify): number =>
  mock.mock.invocationCallOrder.at(-1) ?? 0

const postHogHarness: IObservabilityPortHarness = {
  create: ({ enabled }) => loadAdapter({ key: enabled ? KEY : undefined }),
  currentUser: () => {
    if (lastCallOrder(sdk.identify) <= lastCallOrder(sdk.reset))
      return null
    const [id, properties] = sdk.identify.mock.calls.at(-1) ?? []
    return { ...(properties as object), id }
  },
  delivered: () => DELIVERING_CALLS.flatMap((mock) => mock.mock.calls),
  delivers: true
}

describe('the observability port contract', () => {
  runObservabilityPortContract({ harness: postHogHarness, test })
})
