import { ObservabilityLevelEnum } from '@app/core'
import {
  type IObservabilityPortHarness,
  runObservabilityPortContract
} from '@app/tooling/observability-port-contract'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { POSTHOG_PENDING_CALLS_LIMIT } from '@/lib/posthog/posthogClient.constant'

// The SDK is replaced at its module: the client initialises this object and
// hands it to the adapter as the PostHog client.
const sdk = vi.hoisted(() => ({
  addExceptionStep: vi.fn(),
  captureException: vi.fn(),
  captureLog: vi.fn(),
  identify: vi.fn(),
  init: vi.fn(),
  opt_in_capturing: vi.fn(),
  reset: vi.fn()
}))

// How the SDK module loads, afresh for each registry: once `gate` settles,
// and failing when `fails`.
const sdkModule = vi.hoisted(() => ({
  fails: false,
  gate: Promise.resolve()
}))

const KEY = 'phc_contract_key'
const EMAIL = 'user@example.com'
const REDACTED = '[redacted]'

// Holds the SDK module until the test releases it.
const holdSdk = () => {
  const gate: { release?: () => void } = {}
  sdkModule.gate = new Promise<void>((resolve) => {
    gate.release = resolve
  })
  return gate
}

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
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_CONSENT', consent)
  vi.resetModules()
  vi.doMock('posthog-js', async () => {
    await sdkModule.gate
    if (sdkModule.fails) throw new Error('the SDK chunk failed to load')
    return { default: sdk }
  })
  const { createPostHogObservability } =
    await import('@/lib/observability/createPostHogObservability.adapter')
  return createPostHogObservability()
}

// Waits for the load the client started, in the same module registry.
const settleClient = async () => {
  const { startPostHogClient } =
    await import('@/lib/posthog/posthogClient.adapter')
  return startPostHogClient()
}

// The adapter once the SDK has loaded, as the app holds it after its start.
const loadLoadedAdapter = async (params: { key?: string }) => {
  const adapter = await loadAdapter(params)
  await settleClient()
  return adapter
}

afterEach(() => {
  vi.unstubAllEnvs()
  sdkModule.fails = false
  sdkModule.gate = Promise.resolve()
  localStorage.clear()
})

test('captureError sends the exception with the scrubbed context', async () => {
  const adapter = await loadLoadedAdapter({ key: KEY })
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
  const adapter = await loadLoadedAdapter({ key: KEY })

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
  const adapter = await loadLoadedAdapter({ key: KEY })

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
  const adapter = await loadLoadedAdapter({ key: KEY })

  adapter.setUser?.({ user: { email: EMAIL, id: 'u1' } })
  adapter.setUser?.({ user: { id: 'u2' } })

  expect(sdk.identify.mock.calls).toEqual([
    ['u1', { email: REDACTED }],
    ['u2', undefined]
  ])
  expect(sdk.reset).not.toHaveBeenCalled()
})

test('setUser(null) resets the identity', async () => {
  const adapter = await loadLoadedAdapter({ key: KEY })

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

const firstCallOrder = (mock: typeof sdk.identify): number =>
  mock.mock.invocationCallOrder[0] ?? 0

test('hands the calls made while PostHog loads to it in order, scrubbed', async () => {
  const sdkLoad = holdSdk()
  const adapter = await loadAdapter({ key: KEY })
  const error = new Error('boom')

  adapter.captureError({ context: { email: EMAIL }, error })
  adapter.captureMessage?.({
    context: { email: EMAIL },
    message: 'slow response'
  })
  adapter.addBreadcrumb?.({
    data: { email: EMAIL },
    message: 'opened the items'
  })
  adapter.setUser?.({ user: { email: EMAIL, id: 'u1' } })
  DELIVERING_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
  sdkLoad.release?.()
  await settleClient()

  expect(sdk.captureException).toHaveBeenCalledExactlyOnceWith(error, {
    email: REDACTED
  })
  expect(sdk.captureLog).toHaveBeenCalledExactlyOnceWith({
    attributes: { email: REDACTED },
    body: 'slow response',
    level: 'info'
  })
  expect(sdk.addExceptionStep).toHaveBeenCalledExactlyOnceWith(
    'opened the items',
    { email: REDACTED, level: ObservabilityLevelEnum.INFO }
  )
  expect(sdk.identify).toHaveBeenCalledExactlyOnceWith('u1', {
    email: REDACTED
  })
  // The SDK received them in the order the app made them.
  const [exception, log, step, identify] = [
    sdk.captureException,
    sdk.captureLog,
    sdk.addExceptionStep,
    sdk.identify
  ].map(firstCallOrder)
  expect(exception).toBeLessThan(log ?? 0)
  expect(log).toBeLessThan(step ?? 0)
  expect(step).toBeLessThan(identify ?? 0)
})

test('drops the oldest call when the queue is full', async () => {
  const sdkLoad = holdSdk()
  const adapter = await loadAdapter({ key: KEY })
  const errors = [...Array(POSTHOG_PENDING_CALLS_LIMIT + 1).keys()].map(
    (index) => new Error(`boom ${index}`)
  )

  errors.forEach((error) => adapter.captureError({ error }))
  sdkLoad.release?.()
  await settleClient()

  expect(sdk.captureException.mock.calls.map(([error]) => error)).toEqual(
    errors.slice(1)
  )
})

test('drops the held calls when PostHog fails to load', async () => {
  sdkModule.fails = true
  const adapter = await loadAdapter({ key: KEY })

  adapter.captureError({ error: new Error('before the failure') })
  expect(await settleClient()).toBeUndefined()
  adapter.captureError({ error: new Error('after the failure') })

  expect(sdk.init).not.toHaveBeenCalled()
  DELIVERING_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
})

test('drops every call in opt-in mode before a grant', async () => {
  const adapter = await loadAdapter({ consent: 'opt-in', key: KEY })

  adapter.captureError({ error: new Error('before consent') })
  const { createPostHogConsent } =
    await import('@/lib/observability/createPostHogConsent.adapter')
  await createPostHogConsent().grant()

  expect(sdk.init).toHaveBeenCalledOnce()
  expect(sdk.opt_in_capturing).toHaveBeenCalledOnce()
  DELIVERING_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
})

const lastCallOrder = (mock: typeof sdk.identify): number =>
  mock.mock.invocationCallOrder.at(-1) ?? 0

const postHogHarness: IObservabilityPortHarness = {
  create: ({ enabled }) =>
    loadLoadedAdapter({ key: enabled ? KEY : undefined }),
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
