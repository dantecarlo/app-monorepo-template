import { createMemoryKeyValueStorage } from '@app/core'
import { afterEach, expect, test, vi } from 'vitest'

// The SDK is replaced at its module: every client the module builds calls
// these spies.
const sdk = vi.hoisted(() => ({
  captureException: vi.fn(),
  construct: vi.fn(),
  optIn: vi.fn(async () => undefined),
  optOut: vi.fn(async () => undefined),
  reset: vi.fn()
}))

vi.mock('posthog-react-native', () => ({
  PostHog: class {
    captureException = sdk.captureException
    optIn = sdk.optIn
    optOut = sdk.optOut
    reset = sdk.reset
    constructor(...args: unknown[]) {
      sdk.construct(...args)
    }
  }
}))

const KEY = 'phc_contract_key'
const MARKER_ON_DEVICE = 'posthog-consent:granted'

const CONSENT_CALLS = [sdk.optIn, sdk.optOut, sdk.reset]

// The client reads the environment when its module loads, so each adapter
// comes from a fresh module registry under its own environment, with a fresh
// device: the project module that owns the device storage is replaced by the
// in-memory storage of @app/core.
const loadConsent = async ({
  consent,
  deviceRead,
  grantedEarlier = false,
  key
}: {
  consent?: string
  deviceRead?: Promise<void>
  grantedEarlier?: boolean
  key?: string
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
  const keyValueStorage = {
    ...device,
    getItem: async (params: { key: string }) => {
      await deviceRead
      return device.getItem(params)
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

test('revoke closes the consent storage, drops the client, opts it out, resets it and reads denied', async () => {
  const { adapter, device, observability } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })
  await adapter.grant()

  await adapter.revoke()
  observability.captureError({ error: new Error('after the revoke') })

  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBeNull()
  expect(sdk.optOut).toHaveBeenCalledOnce()
  expect(sdk.reset).toHaveBeenCalledExactlyOnceWith([])
  expect(sdk.captureException).not.toHaveBeenCalled()
  expect(await adapter.getStatus()).toBe('denied')
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
