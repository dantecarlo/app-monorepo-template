import { createMemoryKeyValueStorage } from '@app/core'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { POSTHOG_INGESTION_HOST_FALLBACK } from '@/lib/posthog/posthogClient.constant'

const { construct, optIn } = vi.hoisted(() => ({
  construct: vi.fn(),
  optIn: vi.fn()
}))

// The client is built from this stand-in, in place of the shared one of
// vitest.config.ts: it records how the client was constructed.
vi.mock('posthog-react-native', () => ({
  PostHog: class {
    optIn = optIn
    constructor(...args: unknown[]) {
      construct(...args)
    }
  }
}))

const KEY = 'phc_contract_key'
const HOST = 'https://eu.i.posthog.com'

// The client reads the environment once, when its module loads: each test
// loads a fresh copy under its own environment.
const loadClient = async ({
  consent,
  grantedEarlier = false,
  host,
  key,
  platform
}: {
  consent?: string
  grantedEarlier?: boolean
  host?: string
  key?: string
  platform?: string
}) => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_HOST', host)
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_CONSENT', consent)
  vi.stubEnv('EXPO_OS', platform)
  vi.resetModules()
  // A fresh device: the project module that owns the device storage is
  // replaced by the in-memory storage of @app/core.
  const device = createMemoryKeyValueStorage()
  vi.doMock('@/lib/storage', () => ({ keyValueStorage: device }))
  if (grantedEarlier) {
    await device.setItem({
      key: 'posthog-consent:granted',
      value: 'true'
    })
  }
  return import('@/lib/posthog/posthogClient.adapter')
}

const options = () => construct.mock.calls[0]?.[1]

// The options the client had before the consent mode existed, on native.
const GRANTED_OPTIONS = {
  captureAppLifecycleEvents: false,
  enableSessionReplay: false,
  errorTracking: {
    autocapture: {
      console: false,
      uncaughtExceptions: true,
      unhandledRejections: true
    }
  },
  host: 'https://us.i.posthog.com'
}

const CONSENT_MODES = ['granted', 'opt-in', 'memory']

beforeEach(() => {
  construct.mockClear()
  optIn.mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

test('does not construct a client without a key', async () => {
  const { getPostHogClient, startPostHogClient } = await loadClient({})

  expect(construct).not.toHaveBeenCalled()
  expect(startPostHogClient()).toBeUndefined()
  expect(construct).not.toHaveBeenCalled()
  expect(getPostHogClient()).toBeUndefined()
})

test('constructs one client with the key and the host from the environment', async () => {
  const { getPostHogClient, startPostHogClient } = await loadClient({
    host: HOST,
    key: KEY
  })

  expect(construct).toHaveBeenCalledOnce()
  expect(startPostHogClient()).toBe(getPostHogClient())
  expect(construct).toHaveBeenCalledOnce()
  expect(construct.mock.calls[0]?.[0]).toBe(KEY)
  expect(options().host).toBe(HOST)
  expect(getPostHogClient()).toBeDefined()
})

test('falls back to the US ingestion host', async () => {
  await loadClient({ host: '', key: KEY })

  expect(POSTHOG_INGESTION_HOST_FALLBACK).toBe('https://us.i.posthog.com')
  expect(options().host).toBe(POSTHOG_INGESTION_HOST_FALLBACK)
})

test('turns session replay and lifecycle events off', async () => {
  await loadClient({ key: KEY })

  expect(options().enableSessionReplay).toBe(false)
  expect(options().captureAppLifecycleEvents).toBe(false)
})

test('captures uncaught exceptions and unhandled rejections on native, not console errors', async () => {
  await loadClient({ key: KEY })

  expect(options().errorTracking).toEqual({
    autocapture: {
      console: false,
      uncaughtExceptions: true,
      unhandledRejections: true
    }
  })
})

// On web, PostHog's uncaught-exception handler defers the rethrow Expo's
// chunk loader needs, so a route chunk loaded on demand would report as an
// uncaught error.
test('leaves uncaught exception capture off in a web bundle', async () => {
  await loadClient({ key: KEY, platform: 'web' })

  expect(options().errorTracking).toEqual({
    autocapture: {
      console: false,
      uncaughtExceptions: false,
      unhandledRejections: true
    }
  })
})

test('keeps the granted options when no consent mode is set', async () => {
  const { posthogConsentStorage } = await loadClient({ key: KEY })

  expect(options()).toStrictEqual(GRANTED_OPTIONS)
  expect(posthogConsentStorage).toBeUndefined()
})

test('starts the granted mode with the same options as no setting', async () => {
  const { posthogConsentStorage } = await loadClient({
    consent: 'granted',
    key: KEY
  })

  expect(options()).toStrictEqual(GRANTED_OPTIONS)
  expect(posthogConsentStorage).toBeUndefined()
})

test('constructs no client in opt-in mode before a grant', async () => {
  const { getPostHogClient, posthogConsentStorage } = await loadClient({
    consent: 'opt-in',
    key: KEY
  })

  expect(construct).not.toHaveBeenCalled()
  // The launch has read the consent storage, which holds no grant, and
  // every task it queued has run.
  expect(await posthogConsentStorage?.isGranted()).toBe(false)
  await new Promise((resolve) => setTimeout(resolve))
  expect(construct).not.toHaveBeenCalled()
  expect(getPostHogClient()).toBeUndefined()
})

test('starts opt-in mode opted out, writing through the consent storage', async () => {
  const { posthogConsentStorage, startPostHogClient } = await loadClient({
    consent: 'opt-in',
    key: KEY
  })

  startPostHogClient()

  expect(posthogConsentStorage).toBeDefined()
  expect(options()).toStrictEqual({
    ...GRANTED_OPTIONS,
    customStorage: posthogConsentStorage,
    defaultOptIn: false
  })
  expect(await posthogConsentStorage?.isGranted()).toBe(false)
  expect(optIn).not.toHaveBeenCalled()
})

test('opts in at launch after a grant from an earlier launch', async () => {
  const { getPostHogClient } = await loadClient({
    consent: 'opt-in',
    grantedEarlier: true,
    key: KEY
  })

  await vi.waitFor(() => expect(optIn).toHaveBeenCalledOnce())
  expect(construct).toHaveBeenCalledOnce()
  expect(getPostHogClient()).toBeDefined()
})

// The launch restores the grant on its own, with no caller to hear of a
// failure: one left unhandled would reach PostHog's own capture of
// unhandled rejections.
test('rejects nothing when the launch fails to opt in again', async () => {
  const unhandled = vi.fn()
  process.on('unhandledRejection', unhandled)
  optIn.mockRejectedValueOnce(new Error('the SDK refused the opt-in'))

  try {
    await loadClient({ consent: 'opt-in', grantedEarlier: true, key: KEY })
    await vi.waitFor(() => expect(optIn).toHaveBeenCalledOnce())
    await new Promise((resolve) => setTimeout(resolve))

    expect(unhandled).not.toHaveBeenCalled()
  } finally {
    process.off('unhandledRejection', unhandled)
  }
})

test('starts memory mode with memory persistence', async () => {
  const { posthogConsentStorage } = await loadClient({
    consent: 'memory',
    key: KEY
  })

  expect(options()).toStrictEqual({
    ...GRANTED_OPTIONS,
    persistence: 'memory'
  })
  expect(posthogConsentStorage).toBeUndefined()
})

test('keeps the privacy defaults under every consent mode', async () => {
  for (const consent of CONSENT_MODES) {
    construct.mockClear()
    const { startPostHogClient } = await loadClient({ consent, key: KEY })
    startPostHogClient()

    expect(options()).toMatchObject(GRANTED_OPTIONS)
  }
})

test('refuses to load with an unknown consent mode', async () => {
  await expect(
    loadClient({ consent: 'opt_in', key: KEY })
  ).rejects.toThrow('EXPO_PUBLIC_POSTHOG_CONSENT')
  expect(construct).not.toHaveBeenCalled()
})

test('does not read the consent mode without a key', async () => {
  const { getPostHogClient } = await loadClient({ consent: 'opt_in' })

  expect(construct).not.toHaveBeenCalled()
  expect(getPostHogClient()).toBeUndefined()
})
