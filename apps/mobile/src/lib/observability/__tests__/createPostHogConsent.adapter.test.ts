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

// Like posthog-react-native 4.87.0, a client reads both of its files through
// its storage as it is constructed; every read lands here.
const construction = vi.hoisted(() => ({
  files: ['.posthog-rn.json', '.posthog-rn-logs.json'],
  reads: [] as Promise<string | null>[]
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
      const storage = (
        args[1] as { customStorage?: IPostHogConsentStorage } | undefined
      )?.customStorage
      construction.files.forEach((file) => {
        if (storage) construction.reads.push(storage.getItem(file))
      })
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

// Where an earlier grant left both files on the device, with a queue that
// was never sent.
const EVENTS_ON_DEVICE = `posthog-consent:${EVENTS_KEY}`
const LOGS_ON_DEVICE = 'posthog-consent:.posthog-rn-logs.json'
const OLD_BLOB =
  '{"version":"v1","content":{"queue":[{"message":{"event":"before-revoke"}}]}}'

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
  refusesRemovalOf,
  refusesRemovals = false,
  storedEarlier = false
}: {
  consent?: string
  deviceRead?: Promise<void>
  grantedEarlier?: boolean
  key?: string
  refusesRemovalOf?: string
  refusesRemovals?: boolean
  storedEarlier?: boolean
}) => {
  Object.values(sdk).forEach((mock) => mock.mockClear())
  construction.reads.length = 0
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_CONSENT', consent)
  vi.resetModules()
  const device = createMemoryKeyValueStorage()
  if (grantedEarlier || storedEarlier) {
    await device.setItem({ key: MARKER_ON_DEVICE, value: 'true' })
  }
  if (storedEarlier) {
    await device.setItem({ key: EVENTS_ON_DEVICE, value: OLD_BLOB })
    await device.setItem({ key: LOGS_ON_DEVICE, value: OLD_BLOB })
  }
  // A test that passes deviceRead holds every read of the device until it
  // settles. One that passes refusesRemovals has a device that refuses every
  // removal, and refusesRemovalOf the removal of one key. holdRemovals holds
  // every removal from then on until the release it returns.
  const removals: { held?: Promise<void> } = {}
  const keyValueStorage = {
    ...device,
    getItem: async (params: { key: string }) => {
      await deviceRead
      return device.getItem(params)
    },
    removeItem: async (params: { key: string }) => {
      await removals.held
      if (refusesRemovals || params.key === refusesRemovalOf) {
        throw new Error('the device refused it')
      }
      await device.removeItem(params)
    }
  }
  const holdRemovals = () => {
    const release: { open?: () => void } = {}
    removals.held = new Promise<void>((resolve) => {
      release.open = resolve
    })
    return () => release.open?.()
  }
  vi.doMock('@/lib/storage', () => ({ keyValueStorage }))
  const { createPostHogConsent } =
    await import('@/lib/observability/createPostHogConsent.adapter')
  const { createPostHogObservability } =
    await import('@/lib/observability/createPostHogObservability.adapter')
  return {
    adapter: createPostHogConsent(),
    device,
    holdRemovals,
    observability: createPostHogObservability()
  }
}

// A device read the test settles by hand.
const heldRead = () => {
  const gate: { open?: () => void } = {}
  const deviceRead = new Promise<void>((resolve) => {
    gate.open = resolve
  })
  return { deviceRead, open: () => gate.open?.() }
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

// The stop overtakes the launch's restore, as a web stop overtakes a load.
test('a revoke while the launch restores an earlier grant keeps PostHog from starting', async () => {
  const read = heldRead()
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    deviceRead: read.deviceRead,
    grantedEarlier: true,
    key: KEY
  })

  const revoked = adapter.revoke()
  read.open()
  await revoked
  await new Promise((resolve) => setTimeout(resolve))

  expect(sdk.construct).not.toHaveBeenCalled()
  expect(sdk.optIn).not.toHaveBeenCalled()
  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBeNull()
  expect(await adapter.getStatus()).toBe('denied')
})

// The verifier's probes, P1 to P7: a client reads both of its files as it is
// constructed, and a queue an earlier grant left must not reach a later one.
test('a revoke during the launch restore removes what the earlier launch stored', async () => {
  const read = heldRead()
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    deviceRead: read.deviceRead,
    key: KEY,
    storedEarlier: true
  })

  const revoked = adapter.revoke()
  read.open()
  await revoked
  await Promise.allSettled(construction.reads)

  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBeNull()
  expect(await device.getItem({ key: EVENTS_ON_DEVICE })).toBeNull()
  expect(await device.getItem({ key: LOGS_ON_DEVICE })).toBeNull()
})

test('a grant after a revoke during the launch restore reads nothing the earlier launch stored', async () => {
  const read = heldRead()
  const { adapter } = await loadConsent({
    consent: 'opt-in',
    deviceRead: read.deviceRead,
    key: KEY,
    storedEarlier: true
  })
  const revoked = adapter.revoke()
  read.open()
  await revoked
  await Promise.allSettled(construction.reads)
  construction.reads.length = 0

  await adapter.grant()

  expect(await Promise.all(construction.reads)).toEqual([null, null])
})

test('a revoke after the launch settled removes what the earlier launch stored', async () => {
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    key: KEY,
    storedEarlier: true
  })
  await vi.waitFor(() => expect(sdk.optIn).toHaveBeenCalled())
  await Promise.allSettled(construction.reads)

  await adapter.revoke()

  expect(await device.getItem({ key: EVENTS_ON_DEVICE })).toBeNull()
  expect(await device.getItem({ key: LOGS_ON_DEVICE })).toBeNull()
})

test('a re-grant in the same launch after a refused removal reads nothing from before the revoke', async () => {
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    key: KEY,
    refusesRemovalOf: EVENTS_ON_DEVICE,
    storedEarlier: true
  })
  await vi.waitFor(() => expect(sdk.optIn).toHaveBeenCalled())
  await Promise.allSettled(construction.reads)
  await adapter.revoke()
  expect(await device.getItem({ key: EVENTS_ON_DEVICE })).toBe(OLD_BLOB)
  construction.reads.length = 0

  await adapter.grant()

  expect(await Promise.all(construction.reads)).toEqual([null, null])
  expect(await adapter.getStatus()).toBe('granted')
})

test('a call made while the revoke closes the storage never reaches PostHog', async () => {
  const { adapter, holdRemovals, observability } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })
  await adapter.grant()
  const release = holdRemovals()

  const revoked = adapter.revoke()
  await new Promise((resolve) => setTimeout(resolve))
  observability.captureError({ error: new Error('during the revoke') })
  expect(await adapter.getStatus()).toBe('denied')
  release()
  await revoked

  expect(sdk.captureException).not.toHaveBeenCalled()
})

test('an opt-in launch after a grant keeps the consent storage values', async () => {
  const { device } = await loadConsent({
    consent: 'opt-in',
    key: KEY,
    storedEarlier: true
  })
  await vi.waitFor(() => expect(sdk.optIn).toHaveBeenCalled())
  const reads = await Promise.all(construction.reads)
  await new Promise((resolve) => setTimeout(resolve))

  expect(reads).toEqual([OLD_BLOB, OLD_BLOB])
  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBe('true')
  expect(await device.getItem({ key: EVENTS_ON_DEVICE })).toBe(OLD_BLOB)
})

test('a later launch that grants reads nothing a revoked earlier launch left on the device', async () => {
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })
  await device.setItem({ key: EVENTS_ON_DEVICE, value: OLD_BLOB })
  await device.setItem({ key: LOGS_ON_DEVICE, value: OLD_BLOB })

  await adapter.grant()

  expect(await Promise.all(construction.reads)).toEqual([null, null])
})

test('a grant reads nothing a revoked earlier grant left under the consent prefix', async () => {
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })
  await device.setItem({ key: EVENTS_ON_DEVICE, value: EVENTS_PAYLOAD })
  const reads: Promise<string | null>[] = []
  sdk.construct.mockImplementationOnce((...args: unknown[]) => {
    const [, options] = args as [string, IConstructedOptions]
    if (options.customStorage) {
      reads.push(options.customStorage.getItem(EVENTS_KEY))
    }
  })

  await adapter.grant()

  expect(await Promise.all(reads)).toEqual([null])
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
