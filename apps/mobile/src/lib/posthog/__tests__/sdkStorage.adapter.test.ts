import { createMemoryKeyValueStorage } from '@app/core'
import { afterEach, expect, test, vi } from 'vitest'

// The files posthog-react-native keeps on its own, under `granted`.
const EVENTS_FILE = '.posthog-rn.json'
const LOGS_FILE = '.posthog-rn-logs.json'
const SDK_FILES = [EVENTS_FILE, LOGS_FILE]

// What the consent storage and the app keep, which stay.
const CONSENT_VALUE = `posthog-consent:${EVENTS_FILE}`
const APP_VALUE = 'app.theme'

const REFUSED = new Error('the device refused it')

// A fresh module registry under the platform given, with a device that
// holds what `granted`, the consent storage and the app stored: the project
// module that owns the device storage is replaced by the in-memory storage
// of @app/core. The document directory is the stand-in of vitest.config.ts,
// whose files a test makes exist through File.prototype.
const load = async ({ platform }: { platform?: string }) => {
  vi.stubEnv('EXPO_OS', platform)
  vi.resetModules()
  const device = createMemoryKeyValueStorage()
  await Promise.all(
    [...SDK_FILES, CONSENT_VALUE, APP_VALUE].map((key) =>
      device.setItem({ key, value: 'stored' })
    )
  )
  vi.doMock('@/lib/storage', () => ({ keyValueStorage: device }))
  const { File, Paths } = await import('expo-file-system')
  const { removeSdkStorage } =
    await import('@/lib/posthog/sdkStorage.adapter')
  const onDevice = (key: string) => device.getItem({ key })
  return { File, Paths, device, onDevice, removeSdkStorage }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

test('removes the files PostHog kept in the document directory on a native platform', async () => {
  const { File, Paths, onDevice, removeSdkStorage } = await load({})
  vi.spyOn(File.prototype, 'exists', 'get').mockReturnValue(true)
  const deleted = vi.spyOn(File.prototype, 'delete').mockReturnValue()

  await removeSdkStorage()

  const files = deleted.mock.contexts as InstanceType<typeof File>[]
  expect(files.map(({ name }) => name)).toEqual(SDK_FILES)
  files.forEach((file) =>
    expect(file.parentDirectory.uri).toBe(Paths.document.uri)
  )
  expect(await onDevice(EVENTS_FILE)).toBeNull()
  expect(await onDevice(LOGS_FILE)).toBeNull()
  expect(await onDevice(CONSENT_VALUE)).toBe('stored')
  expect(await onDevice(APP_VALUE)).toBe('stored')
})

test('deletes no file the document directory does not hold', async () => {
  const { File, removeSdkStorage } = await load({})
  const deleted = vi.spyOn(File.prototype, 'delete')

  await expect(removeSdkStorage()).resolves.toBeUndefined()

  expect(deleted).not.toHaveBeenCalled()
})

// On web posthog-react-native keeps them in the key-value storage, and
// expo-file-system does not run.
test('removes only the key-value storage in a web bundle', async () => {
  const { File, onDevice, removeSdkStorage } = await load({
    platform: 'web'
  })
  const read = vi.spyOn(File.prototype, 'exists', 'get')

  await removeSdkStorage()

  expect(read).not.toHaveBeenCalled()
  expect(await onDevice(EVENTS_FILE)).toBeNull()
  expect(await onDevice(LOGS_FILE)).toBeNull()
  expect(await onDevice(APP_VALUE)).toBe('stored')
})

test('rejects nothing when the device refuses a removal', async () => {
  const { File, device, removeSdkStorage } = await load({})
  vi.spyOn(File.prototype, 'exists', 'get').mockReturnValue(true)
  vi.spyOn(File.prototype, 'delete').mockImplementation(() => {
    throw REFUSED
  })
  vi.spyOn(device, 'removeItem').mockRejectedValue(REFUSED)

  await expect(removeSdkStorage()).resolves.toBeUndefined()
})
