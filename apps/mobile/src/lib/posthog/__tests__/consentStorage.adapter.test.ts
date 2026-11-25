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
// `real` keeps the device's own calls, for a test that replaces one.
const load = async () => {
  vi.resetModules()
  const device = createMemoryKeyValueStorage()
  const real = { ...device }
  vi.doMock('@/lib/storage', () => ({ keyValueStorage: device }))
  vi.spyOn(device, 'setItem')
  const { createConsentStorage } =
    await import('@/lib/posthog/consentStorage.adapter')
  const onDevice = (key: string) => device.getItem({ key })
  return { createConsentStorage, device, onDevice, real }
}

// A promise the test settles by hand.
const gate = () => {
  const handle: { open?: () => void } = {}
  const opened = new Promise<void>((resolve) => {
    handle.open = resolve
  })
  return { open: () => handle.open?.(), opened }
}

const REFUSED = new Error('the device refused it')

afterEach(() => {
  vi.restoreAllMocks()
})

test('keeps every value off the device before a grant', async () => {
  const { createConsentStorage, device, onDevice } = await load()
  const storage = createConsentStorage()

  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  expect(await storage.getItem(EVENTS_KEY)).toBeNull()
  expect(await storage.isGranted()).toBe(false)
  expect(device.setItem).not.toHaveBeenCalled()
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
})

test('writes the grant marker and every later value to the device after a grant', async () => {
  const { createConsentStorage, onDevice } = await load()
  const storage = createConsentStorage()
  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  await storage.open()
  await storage.setItem(LOGS_KEY, LOGS_PAYLOAD)

  expect(await storage.isGranted()).toBe(true)
  expect(await onDevice(MARKER_ON_DEVICE)).toBe('true')
  expect(await onDevice(LOGS_ON_DEVICE)).toBe(LOGS_PAYLOAD)
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
  expect(await onDevice(LOGS_KEY)).toBeNull()
})

test('keeps the grant in memory for this launch when the device refuses it', async () => {
  const { createConsentStorage, device, onDevice } = await load()
  vi.mocked(device.setItem).mockRejectedValue(REFUSED)
  const storage = createConsentStorage()

  await expect(storage.open()).resolves.toBeUndefined()
  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  expect(await storage.isGranted()).toBe(true)
  expect(await storage.getItem(EVENTS_KEY)).toBe(EVENTS_PAYLOAD)
  expect(vi.mocked(device.setItem)).toHaveBeenCalledOnce()
  expect(await onDevice(MARKER_ON_DEVICE)).toBeNull()
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
  expect(await createConsentStorage().isGranted()).toBe(false)
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

test('removes every key only after the writes it already issued land', async () => {
  const { createConsentStorage, device, onDevice, real } = await load()
  const storage = createConsentStorage()
  await storage.open()
  const landing = gate()
  vi.mocked(device.setItem).mockImplementationOnce(async (params) => {
    await landing.opened
    await real.setItem(params)
  })
  const written = storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  const closed = storage.close()
  landing.open()
  await Promise.all([closed, written])

  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
  expect(await onDevice(MARKER_ON_DEVICE)).toBeNull()
})

test('goes on removing the other keys when the device refuses one', async () => {
  const { createConsentStorage, device, onDevice, real } = await load()
  const storage = createConsentStorage()
  await storage.open()
  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)
  await storage.setItem(LOGS_KEY, LOGS_PAYLOAD)
  vi.spyOn(device, 'removeItem').mockImplementation(async ({ key }) => {
    if (key === EVENTS_ON_DEVICE) throw REFUSED
    await real.removeItem({ key })
  })

  await expect(storage.close()).resolves.toBeUndefined()

  expect(await storage.isGranted()).toBe(false)
  expect(await onDevice(MARKER_ON_DEVICE)).toBeNull()
  expect(await onDevice(LOGS_ON_DEVICE)).toBeNull()
  expect(await storage.getItem(EVENTS_KEY)).toBeNull()
})

test('writes to the device again on a grant after a revoke', async () => {
  const { createConsentStorage, onDevice } = await load()
  const storage = createConsentStorage()
  await storage.open()
  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)
  await storage.close()
  // What a client dropped by the revoke writes while it shuts down.
  await storage.setItem(EVENTS_KEY, EVENTS_PAYLOAD)

  await storage.open()
  await storage.setItem(LOGS_KEY, LOGS_PAYLOAD)

  expect(await storage.isGranted()).toBe(true)
  expect(await onDevice(MARKER_ON_DEVICE)).toBe('true')
  expect(await onDevice(LOGS_ON_DEVICE)).toBe(LOGS_PAYLOAD)
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
  expect(await storage.getItem(EVENTS_KEY)).toBeNull()
})

// An earlier grant leaves PostHog's files under the prefix: a revoke removes
// them whether or not this launch read them, and a grant on a device with no
// marker clears them before any read.
test('removes the PostHog files under its prefix on a revoke, read or not', async () => {
  const { createConsentStorage, onDevice } = await load()
  const earlier = createConsentStorage()
  await earlier.open()
  await earlier.setItem(EVENTS_KEY, EVENTS_PAYLOAD)
  await earlier.setItem(LOGS_KEY, LOGS_PAYLOAD)
  const storage = createConsentStorage()

  await storage.close()

  expect(await onDevice(MARKER_ON_DEVICE)).toBeNull()
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
  expect(await onDevice(LOGS_ON_DEVICE)).toBeNull()
})

test('clears the PostHog files under its prefix before a grant on a device with no marker', async () => {
  const { createConsentStorage, device, onDevice } = await load()
  await device.setItem({ key: EVENTS_ON_DEVICE, value: EVENTS_PAYLOAD })
  const storage = createConsentStorage()

  await storage.open()

  expect(await storage.getItem(EVENTS_KEY)).toBeNull()
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
  expect(await onDevice(MARKER_ON_DEVICE)).toBe('true')
})

test('keeps a grant in memory while a key a revoke could not remove stays on the device', async () => {
  const { createConsentStorage, device, onDevice, real } = await load()
  const earlier = createConsentStorage()
  await earlier.open()
  await earlier.setItem(EVENTS_KEY, EVENTS_PAYLOAD)
  vi.spyOn(device, 'removeItem').mockImplementation(async ({ key }) => {
    if (key === EVENTS_ON_DEVICE) throw REFUSED
    await real.removeItem({ key })
  })
  const storage = createConsentStorage()
  await storage.close()

  await storage.open()
  await storage.setItem(LOGS_KEY, LOGS_PAYLOAD)

  expect(await storage.isGranted()).toBe(true)
  expect(await storage.getItem(EVENTS_KEY)).toBeNull()
  expect(await storage.getItem(LOGS_KEY)).toBe(LOGS_PAYLOAD)
  expect(await onDevice(EVENTS_ON_DEVICE)).toBe(EVENTS_PAYLOAD)
  expect(await onDevice(MARKER_ON_DEVICE)).toBeNull()
  expect(await onDevice(LOGS_ON_DEVICE)).toBeNull()
})

test('writes to the device again once the key a revoke could not remove goes', async () => {
  const { createConsentStorage, device, onDevice, real } = await load()
  const earlier = createConsentStorage()
  await earlier.open()
  await earlier.setItem(EVENTS_KEY, EVENTS_PAYLOAD)
  vi.spyOn(device, 'removeItem')
    .mockRejectedValueOnce(REFUSED)
    .mockImplementation(real.removeItem)
  const storage = createConsentStorage()
  await storage.close()

  await storage.open()

  expect(await storage.getItem(EVENTS_KEY)).toBeNull()
  expect(await onDevice(EVENTS_ON_DEVICE)).toBeNull()
  expect(await onDevice(MARKER_ON_DEVICE)).toBe('true')
})
