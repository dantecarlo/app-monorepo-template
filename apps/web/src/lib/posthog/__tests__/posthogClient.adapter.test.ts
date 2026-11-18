import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { POSTHOG_INGESTION_HOST_FALLBACK } from '@/lib/posthog/posthogClient.constant'

const { init } = vi.hoisted(() => ({ init: vi.fn() }))

vi.mock('posthog-js', () => ({ default: { init } }))

const KEY = 'phc_contract_key'
const HOST = 'https://eu.i.posthog.com'

// The client reads the environment once, when its module loads: each test
// loads a fresh copy under its own environment.
const loadClient = async ({
  consent,
  host,
  key
}: {
  consent?: string
  host?: string
  key?: string
}) => {
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', host)
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_CONSENT', consent)
  vi.resetModules()
  return import('@/lib/posthog/posthogClient.adapter')
}

const initOptions = () => init.mock.calls[0]?.[1]

// The options the client had before the consent mode existed, with the copy
// of the scrub the freshly loaded client imported.
const grantedOptions = async () => {
  const { scrubCaptureUrls } =
    await import('@/lib/posthog/scrubCaptureUrls.helper')
  return {
    api_host: 'https://us.i.posthog.com',
    autocapture: false,
    before_send: scrubCaptureUrls,
    capture_dead_clicks: false,
    capture_exceptions: {
      capture_console_errors: false,
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true
    },
    disable_session_recording: true
  }
}

const CONSENT_MODES = ['granted', 'opt-in', 'memory']

beforeEach(() => {
  init.mockClear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

test('does not initialise PostHog without a key', async () => {
  const { posthogClient } = await loadClient({})

  expect(init).not.toHaveBeenCalled()
  expect(posthogClient).toBeUndefined()
})

test('initialises PostHog with the key and the host from the environment', async () => {
  const { posthogClient } = await loadClient({ host: HOST, key: KEY })

  expect(init).toHaveBeenCalledOnce()
  expect(init.mock.calls[0]?.[0]).toBe(KEY)
  expect(initOptions().api_host).toBe(HOST)
  expect(posthogClient).toBeDefined()
})

test('falls back to the US ingestion host', async () => {
  await loadClient({ host: '', key: KEY })

  expect(POSTHOG_INGESTION_HOST_FALLBACK).toBe('https://us.i.posthog.com')
  expect(initOptions().api_host).toBe(POSTHOG_INGESTION_HOST_FALLBACK)
})

test('does not initialise PostHog on the server', async () => {
  vi.stubGlobal('window', undefined)
  const { posthogClient } = await loadClient({ key: KEY })

  expect(init).not.toHaveBeenCalled()
  expect(posthogClient).toBeUndefined()
})

test('turns session recording and autocapture off', async () => {
  await loadClient({ key: KEY })

  expect(initOptions().disable_session_recording).toBe(true)
  expect(initOptions().autocapture).toBe(false)
  expect(initOptions().capture_dead_clicks).toBe(false)
})

test('captures unhandled errors but not console errors', async () => {
  await loadClient({ key: KEY })

  expect(initOptions().capture_exceptions).toEqual({
    capture_console_errors: false,
    capture_unhandled_errors: true,
    capture_unhandled_rejections: true
  })
})

test('runs the URL scrub before every event', async () => {
  await loadClient({ key: KEY })
  // The copy of the scrub the freshly loaded client imported.
  const { scrubCaptureUrls } =
    await import('@/lib/posthog/scrubCaptureUrls.helper')

  expect(initOptions().before_send).toBe(scrubCaptureUrls)
})

test('keeps the granted options when no consent mode is set', async () => {
  await loadClient({ key: KEY })

  expect(initOptions()).toEqual(await grantedOptions())
})

test('starts the granted mode with the same options as no setting', async () => {
  await loadClient({ consent: 'granted', key: KEY })

  expect(initOptions()).toEqual(await grantedOptions())
})

test('starts opt-in mode opted out of capture and persistence', async () => {
  await loadClient({ consent: 'opt-in', key: KEY })

  expect(initOptions()).toEqual({
    ...(await grantedOptions()),
    opt_out_capturing_by_default: true,
    opt_out_persistence_by_default: true
  })
})

test('starts memory mode with memory persistence', async () => {
  await loadClient({ consent: 'memory', key: KEY })

  expect(initOptions()).toEqual({
    ...(await grantedOptions()),
    persistence: 'memory'
  })
})

test('keeps the privacy defaults under every consent mode', async () => {
  for (const consent of CONSENT_MODES) {
    init.mockClear()
    await loadClient({ consent, key: KEY })

    expect(initOptions()).toMatchObject(await grantedOptions())
  }
})

test('refuses to load with an unknown consent mode, on the server too', async () => {
  await expect(
    loadClient({ consent: 'opt_in', key: KEY })
  ).rejects.toThrow('NEXT_PUBLIC_POSTHOG_CONSENT')
  vi.stubGlobal('window', undefined)
  await expect(
    loadClient({ consent: 'opt_in', key: KEY })
  ).rejects.toThrow('NEXT_PUBLIC_POSTHOG_CONSENT')
  expect(init).not.toHaveBeenCalled()
})

test('does not read the consent mode without a key', async () => {
  const { posthogClient } = await loadClient({ consent: 'opt_in' })

  expect(init).not.toHaveBeenCalled()
  expect(posthogClient).toBeUndefined()
})
