import { createMemoryKeyValueStorage } from '@app/core'
import { afterEach, expect, test, vi } from 'vitest'

// The two files PostHog keeps, and what it writes into them.
const EVENTS_KEY = '.posthog-rn.json'
const LOGS_KEY = '.posthog-rn-logs.json'
const EVENTS_PAYLOAD = '{"version":"v1","content":{"anonymous_id":"a1"}}'
const LOGS_PAYLOAD = '{"version":"v1","content":{}}'

// Where each lands on the device once consent is granted.
const MARKER_ON_DEVICE = 'posthog-consent:granted'
const EVENTS_ON_DEVICE = `posthog-consent:${EVENTS_KEY}`
const LOGS_ON_DEVICE = `posthog-consent:${LOGS_KEY}`

// A fresh device for each test: the project module that owns the device
// storage is replaced by the in-memory storage of @app/core.
const load = async () => {
  vi.resetModules()
  const device = createMemoryKeyValueStorage()
  vi.doMock('@/lib/storage', () => ({ keyValueStorage: device }))
  vi.spyOn(device, 'setItem')
  const { createConsentStorage } =
    await import('@/lib/posthog/consentStorage.adapter')
  const onDevice = (key: string) => device.getItem({ key })
  return { createConsentStorage, device, onDevice }
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('keeps every value off the device before a grant', async () => {
  const { createConsentStorage, device, onDevice } = await load()
  const storage = createConsentStorage()

  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  expect(await storage.getItem(EVENTS_KEY)).toBe(EVENTS_PAYLOAD)
  expect(await storage.isGranted()).toBe(false)
  expect(device.setItem).not.toHaveBeenCalled()
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
})

test('writes the held values and every later one to the device after a grant', async () => {
  const { createConsentStorage, onDevice } = await load()
  const storage = createConsentStorage()
  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  await storage.open()
  await storage.setItem(LOGS_KEY, LOGS_PAYLOAD)

  expect(await storage.isGranted()).toBe(true)
  expect(await onDevice(MARKER_ON_DEVICE)).toBe('true')
  expect(await onDevice(EVENTS_ON_DEVICE)).toBe(EVENTS_PAYLOAD)
  expect(await onDevice(LOGS_ON_DEVICE)).toBe(LOGS_PAYLOAD)
  expect(await onDevice(EVENTS_KEY)).toBeNull()
})

test('reads a grant from an earlier launch back from the device', async () => {
  const { createConsentStorage } = await load()
  const earlier = createConsentStorage()
  await earlier.open()
  await earlier.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  const storage = createConsentStorage()

  expect(await storage.isGranted()).toBe(true)
  expect(await storage.getItem(EVENTS_KEY)).toBe(EVENTS_PAYLOAD)
})

test('removes every value it wrote on a revoke and writes none after', async () => {
  const { createConsentStorage, device, onDevice } = await load()
  const earlier = createConsentStorage()
  await earlier.open()
  await earlier.setItem(EVENTS_KEY, EVENTS_PAYLOAD)
  // A later launch reads the events file back and writes the logs one.
  const storage = createConsentStorage()
  await storage.getItem(EVENTS_KEY)
  await storage.setItem(LOGS_KEY, LOGS_PAYLOAD)

  await storage.close()
  vi.mocked(device.setItem).mockClear()
  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  expect(await storage.isGranted()).toBe(false)
  expect(await onDevice(MARKER_ON_DEVICE)).toBeNull()
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
  expect(await onDevice(LOGS_ON_DEVICE)).toBeNull()
  expect(device.setItem).not.toHaveBeenCalled()
  expect(await createConsentStorage().isGranted()).toBe(false)
})
