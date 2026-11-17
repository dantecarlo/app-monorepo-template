import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { POSTHOG_INGESTION_HOST_FALLBACK } from '@/lib/posthog/posthogClient.constant'

const { init } = vi.hoisted(() => ({ init: vi.fn() }))

vi.mock('posthog-js', () => ({ default: { init } }))

const KEY = 'phc_contract_key'
const HOST = 'https://eu.i.posthog.com'

// The client reads the environment once, when its module loads: each test
// loads a fresh copy under its own environment.
const loadClient = async ({
  host,
  key
}: {
  host?: string
  key?: string
}) => {
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', key)
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', host)
  vi.resetModules()
  return import('@/lib/posthog/posthogClient.adapter')
}

const initOptions = () => init.mock.calls[0]?.[1]

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
