import { createMemoryKeyValueStorage } from '@app/core'
import { afterEach, expect, test, vi } from 'vitest'

// The SDK is replaced at its module: every client the module builds calls
// these spies.
const sdk = vi.hoisted(() => ({
  construct: vi.fn(),
  optIn: vi.fn(async () => undefined),
  optOut: vi.fn(async () => undefined),
  reset: vi.fn()
}))

vi.mock('posthog-react-native', () => ({
  PostHog: class {
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
  key
}: {
  consent?: string
  key?: string
}) => {
  Object.values(sdk).forEach((mock) => mock.mockClear())
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_CONSENT', consent)
  vi.resetModules()
  const device = createMemoryKeyValueStorage()
  vi.doMock('@/lib/storage', () => ({ keyValueStorage: device }))
  const { createPostHogConsent } =
    await import('@/lib/observability/createPostHogConsent.adapter')
  return { adapter: createPostHogConsent(), device }
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

test('reads pending and opts nothing in before a choice in opt-in mode', async () => {
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })

  expect(await adapter.getStatus()).toBe('pending')
  expect(sdk.optIn).not.toHaveBeenCalled()
  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBeNull()
})

test('grant opens the consent storage, opts PostHog in and reads granted', async () => {
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })

  await adapter.grant()

  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBe('true')
  expect(sdk.optIn).toHaveBeenCalledOnce()
  expect(await adapter.getStatus()).toBe('granted')
})

test('revoke closes the consent storage, opts PostHog out, resets it and reads denied', async () => {
  const { adapter, device } = await loadConsent({
    consent: 'opt-in',
    key: KEY
  })
  await adapter.grant()

  await adapter.revoke()

  expect(await device.getItem({ key: MARKER_ON_DEVICE })).toBeNull()
  expect(sdk.optOut).toHaveBeenCalledOnce()
  expect(sdk.reset).toHaveBeenCalledExactlyOnceWith([])
  expect(await adapter.getStatus()).toBe('denied')
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
