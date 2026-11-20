import { createMemoryKeyValueStorage } from '@app/core'
import { afterEach, expect, test, vi } from 'vitest'

import type { IPostHogConsentStorage } from '@/lib/posthog/consentStorage.type'

// The SDK is replaced at its module: every client the module builds calls
// these spies.
const sdk = vi.hoisted(() => ({
  captureException: vi.fn(),
  construct: vi.fn(),
  optIn: vi.fn(async (): Promise<void> => undefined),
  optOut: vi.fn(async (): Promise<void> => undefined),
  reset: vi.fn(),
  setPersistedProperty: vi.fn(),
  shutdown: vi.fn(async (): Promise<void> => undefined)
}))

// The persisted properties of the SDK that hold what it has not sent yet,
// under the names the SDK gives them.
const QUEUES = vi.hoisted(() => ({
  AiCaptureQueue: 'ai_capture_queue',
  AiQueue: 'ai_queue',
  LogsQueue: 'logs_queue',
  Queue: 'queue'
}))

vi.mock('posthog-react-native', () => ({
  PostHog: class {
    captureException = sdk.captureException
    optIn = sdk.optIn
    optOut = sdk.optOut
    reset = sdk.reset
    setPersistedProperty = sdk.setPersistedProperty
    shutdown = sdk.shutdown
    constructor(...args: unknown[]) {
      sdk.construct(...args)
    }
  },
  PostHogPersistedProperty: QUEUES
}))

const KEY = 'phc_contract_key'
const MARKER_ON_DEVICE = 'posthog-consent:granted'

const CONSENT_CALLS = [
  sdk.optIn,
  sdk.optOut,
  sdk.reset,
  sdk.setPersistedProperty,
  sdk.shutdown
]

// The file PostHog keeps its ids in, and what a client writes into it.
const EVENTS_KEY = '.posthog-rn.json'
const EVENTS_PAYLOAD = '{"version":"v1","content":{"anonymous_id":"a1"}}'

interface IConstructedOptions {
  customStorage?: IPostHogConsentStorage
}

// The consent storage a client was constructed with, by the order it was.
const storageOf = ({ client }: { client: number }) =>
  (
    sdk.construct.mock.calls[client]?.[1] as
      | IConstructedOptions
      | undefined
  )?.customStorage

const orderOf = (mock: { mock: { invocationCallOrder: number[] } }) =>
  mock.mock.invocationCallOrder

// The client reads the environment when its module loads, so each adapter
// comes from a fresh module registry under its own environment, with a fresh
// device: the project module that owns the device storage is replaced by the
// in-memory storage of @app/core.
const loadConsent = async ({
  consent,
  deviceRead,
  grantedEarlier = false,
  key,
  refusesRemovals = false
}: {
  consent?: string
  deviceRead?: Promise<void>
  grantedEarlier?: boolean
  key?: string
  refusesRemovals?: boolean
}) => {
  Object.values(sdk).forEach((mock) => mock.mockClear())
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_CONSENT', consent)
  vi.resetModules()
  const device = createMemoryKeyValueStorage()
  if (grantedEarlier) {
    await device.setItem({ key: MARKER_ON_DEVICE, value: 'true' })
  }
  // A test that passes deviceRead holds every read of the device until it
  // settles.
  // One that passes refusesRemovals has a device that refuses every removal.
  const keyValueStorage = {
    ...device,
    getItem: async (params: { key: string }) => {
      await deviceRead
      return device.getItem(params)
    },
    removeItem: async (params: { key: string }) => {
      if (refusesRemovals) throw new Error('the device refused it')
      await device.removeItem(params)
    }
  }
  vi.doMock('@/lib/storage', () => ({ keyValueStorage }))
  const { createPostHogConsent } =
    await import('@/lib/observability/createPostHogConsent.adapter')
  const { createPostHogObservability } =
    await import('@/lib/observability/createPostHogObservability.adapter')
  return {
    adapter: createPostHogConsent(),
    device,
    observability: createPostHogObservability()
  }
}

// Grants, revokes and reads the status once, as a banner would.
const exercise = async ({
  adapter
}: Pick<Awaited<ReturnType<typeof loadConsent>>, 'adapter'>) => {
  await adapter.grant()
  await adapter.revoke()
  return adapter.getStatus()
}

afterEach(() => {
  vi.unstubAllEnvs()
})

test('reads pending and constructs no client before a choice in opt-in mode', async () => {
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })

  expect(sdk.construct).not.toHaveBeenCalled()
  expect(await adapter.getStatus()).toBe('pending')
  expect(sdk.optIn).not.toHaveBeenCalled()
  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBeNull()
})

test('grant constructs the client once, opens the consent storage, opts PostHog in and reads granted', async () => {
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })
  expect(sdk.construct).not.toHaveBeenCalled()

  await adapter.grant()
  await adapter.grant()

  expect(sdk.construct).toHaveBeenCalledOnce()
  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBe('true')
  expect(sdk.optIn).toHaveBeenCalled()
  expect(await adapter.getStatus()).toBe('granted')
})

// The SDK's reset keeps its queues and its flush sends them whatever the
// opt-out says, so a revoke empties them before it shuts the client down.
test('revoke closes the consent storage, drops the client, opts it out, empties its queues, shuts it down and reads denied', async () => {
  const { adapter, device, observability } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })
  await adapter.grant()

  await adapter.revoke()
  observability.captureError({ error: new Error('after the revoke') })

  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBeNull()
  expect(sdk.optOut).toHaveBeenCalledOnce()
  expect(sdk.setPersistedProperty.mock.calls).toHaveLength(
    Object.values(QUEUES).length
  )
  expect(sdk.setPersistedProperty.mock.calls).toEqual(
    expect.arrayContaining(
      Object.values(QUEUES).map((queue) => [queue, null])
    )
  )
  expect(sdk.shutdown).toHaveBeenCalledOnce()
  expect(orderOf(sdk.optOut)[0]).toBeLessThan(
    orderOf(sdk.setPersistedProperty)[0] ?? 0
  )
  expect(orderOf(sdk.setPersistedProperty).at(-1)).toBeLessThan(
    orderOf(sdk.shutdown)[0] ?? 0
  )
  expect(sdk.reset).not.toHaveBeenCalled()
  expect(sdk.captureException).not.toHaveBeenCalled()
  expect(await adapter.getStatus()).toBe('denied')
})

test('a revoke whose storage removals fail still stops the client and reads denied', async () => {
  const { adapter, observability } = await loadConsent({
    consent: 'opt-in',
    key: KEY,
    refusesRemovals: true
  })
  await adapter.grant()

  await expect(adapter.revoke()).resolves.toBeUndefined()
  observability.captureError({ error: new Error('after the revoke') })

  expect(sdk.optOut).toHaveBeenCalledOnce()
  expect(sdk.shutdown).toHaveBeenCalledOnce()
  expect(sdk.captureException).not.toHaveBeenCalled()
  expect(await adapter.getStatus()).toBe('denied')
})

// The real SDK reads its file back when it is constructed and writes it
// soon after, through the consent storage.
test('grant opens the consent storage before it constructs the client, so its first write reaches the device', async () => {
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })
  sdk.construct.mockImplementationOnce((...args: unknown[]) => {
    const [, options] = args as [string, IConstructedOptions]
    void options.customStorage?.setItem(EVENTS_KEY, EVENTS_PAYLOAD)
  })

  await adapter.grant()

  await vi.waitFor(async () =>
    expect(
      await device.getItem({ key: `posthog-consent:${EVENTS_KEY}` })
    ).toBe(EVENTS_PAYLOAD)
  )
})

test('a revoke while the launch restores an earlier grant leaves PostHog opted out', async () => {
  const gate: { open?: () => void } = {}
  const deviceRead = new Promise<void>((resolve) => {
    gate.open = resolve
  })
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    deviceRead,
    grantedEarlier: true,
    key: KEY
  })

  const revoked = adapter.revoke()
  gate.open?.()
  await revoked

  expect(sdk.optIn).toHaveBeenCalledOnce()
  expect(sdk.optOut).toHaveBeenCalledOnce()
  expect(sdk.optOut.mock.invocationCallOrder[0]).toBeGreaterThan(
    sdk.optIn.mock.invocationCallOrder.at(-1) ?? 0
  )
  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBeNull()
  expect(await adapter.getStatus()).toBe('denied')
})

test('a grant after a revoke constructs a new client and opts it in', async () => {
  const { adapter } = await loadConsent({ consent: 'opt-in', key: KEY })
  await adapter.grant()
  await adapter.revoke()

  await adapter.grant()

  expect(sdk.construct).toHaveBeenCalledTimes(2)
  expect(sdk.optIn).toHaveBeenCalledTimes(2)
  expect(await adapter.getStatus()).toBe('granted')
})

test('a grant after a revoke starts a client that reads nothing the dropped one stored', async () => {
  const { adapter } = await loadConsent({ consent: 'opt-in', key: KEY })
  await adapter.grant()
  // The dropped client writes its ids while it opts out and shuts down.
  const write = async () => {
    await storageOf({ client: 0 })?.setItem(EVENTS_KEY, EVENTS_PAYLOAD)
  }
  sdk.optOut.mockImplementationOnce(write)
  sdk.shutdown.mockImplementationOnce(write)
  await adapter.revoke()

  await adapter.grant()

  expect(sdk.construct).toHaveBeenCalledTimes(2)
  expect(await storageOf({ client: 1 })?.getItem(EVENTS_KEY)).toBeNull()
})

test('changes nothing and reads not-required outside opt-in mode', async () => {
  for (const consent of ['granted', 'memory']) {
    const { adapter } = await loadConsent({ consent, key: KEY })

    expect(await exercise({ adapter })).toBe('not-required')
    CONSENT_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
  }
})

test('changes nothing and reads not-required without a key', async () => {
  const { adapter } = await loadConsent({ consent: 'opt-in' })

  expect(await exercise({ adapter })).toBe('not-required')
  expect(sdk.construct).not.toHaveBeenCalled()
  CONSENT_CALLS.forEach((mock) => expect(mock).not.toHaveBeenCalled())
})
