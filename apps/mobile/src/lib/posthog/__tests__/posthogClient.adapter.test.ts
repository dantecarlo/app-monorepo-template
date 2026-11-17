import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { POSTHOG_INGESTION_HOST_FALLBACK } from '@/lib/posthog/posthogClient.constant'

const { construct } = vi.hoisted(() => ({ construct: vi.fn() }))

// The real package cannot load under the test environment; the client is
// built from this stand-in, which records how it was constructed.
vi.mock('posthog-react-native', () => ({
  PostHog: class {
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
  host,
  key,
  platform
}: {
  host?: string
  key?: string
  platform?: string
}) => {
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('EXPO_PUBLIC_POSTHOG_HOST', host)
  vi.stubEnv('EXPO_OS', platform)
  vi.resetModules()
  return import('@/lib/posthog/posthogClient.adapter')
}

const options = () => construct.mock.calls[0]?.[1]

beforeEach(() => {
  construct.mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

test('does not construct a client without a key', async () => {
  const { posthogClient } = await loadClient({})

  expect(construct).not.toHaveBeenCalled()
  expect(posthogClient).toBeUndefined()
})

test('constructs one client with the key and the host from the environment', async () => {
  const { posthogClient } = await loadClient({ host: HOST, key: KEY })

  expect(construct).toHaveBeenCalledOnce()
  expect(construct.mock.calls[0]?.[0]).toBe(KEY)
  expect(options().host).toBe(HOST)
  expect(posthogClient).toBeDefined()
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
