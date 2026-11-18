import AsyncStorage from '@react-native-async-storage/async-storage'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { createConsentStorage } from '@/lib/posthog/consentStorage.adapter'

// The two files PostHog keeps, and what it writes into them.
const EVENTS_KEY = '.posthog-rn.json'
const LOGS_KEY = '.posthog-rn-logs.json'
const EVENTS_PAYLOAD = '{"version":"v1","content":{"anonymous_id":"a1"}}'
const LOGS_PAYLOAD = '{"version":"v1","content":{}}'

// Where each lands on the device once consent is granted.
const MARKER_ON_DEVICE = 'posthog-consent:granted'
const EVENTS_ON_DEVICE = `posthog-consent:${EVENTS_KEY}`
const LOGS_ON_DEVICE = `posthog-consent:${LOGS_KEY}`

const onDevice = (key: string) => AsyncStorage.getItem(key)

beforeEach(async () => {
  await AsyncStorage.clear()
  vi.spyOn(AsyncStorage, 'setItem')
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('keeps every value off the device before a grant', async () => {
  const storage = createConsentStorage()

  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  expect(await storage.getItem(EVENTS_KEY)).toBe(EVENTS_PAYLOAD)
  expect(await storage.isGranted()).toBe(false)
  expect(AsyncStorage.setItem).not.toHaveBeenCalled()
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
})

test('writes the held values and every later one to the device after a grant', async () => {
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
  const earlier = createConsentStorage()
  await earlier.open()
  await earlier.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  const storage = createConsentStorage()

  expect(await storage.isGranted()).toBe(true)
  expect(await storage.getItem(EVENTS_KEY)).toBe(EVENTS_PAYLOAD)
})

test('removes every value it wrote on a revoke and writes none after', async () => {
  const earlier = createConsentStorage()
  await earlier.open()
  await earlier.setItem(EVENTS_KEY, EVENTS_PAYLOAD)
  // A later launch reads the events file back and writes the logs one.
  const storage = createConsentStorage()
  await storage.getItem(EVENTS_KEY)
  await storage.setItem(LOGS_KEY, LOGS_PAYLOAD)

  await storage.close()
  vi.mocked(AsyncStorage.setItem).mockClear()
  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  expect(await storage.isGranted()).toBe(false)
  expect(await onDevice(MARKER_ON_DEVICE)).toBeNull()
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
  expect(await onDevice(LOGS_ON_DEVICE)).toBeNull()
  expect(AsyncStorage.setItem).not.toHaveBeenCalled()
  expect(await createConsentStorage().isGranted()).toBe(false)
})
