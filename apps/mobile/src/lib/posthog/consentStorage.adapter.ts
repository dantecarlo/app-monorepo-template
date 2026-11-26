import type { IStorageItemParams } from '@app/core'

import {
  CONSENT_GRANTED_KEY,
  CONSENT_GRANTED_VALUE,
  CONSENT_STORAGE_PREFIX
} from '@/lib/posthog/consentStorage.constant'
import type { IPostHogConsentStorage } from '@/lib/posthog/consentStorage.type'
import { SDK_STORAGE_FILES } from '@/lib/posthog/sdkStorage.constant'
import { keyValueStorage } from '@/lib/storage'

const deviceKeyOf = ({ key }: { key: string }): string =>
  `${CONSENT_STORAGE_PREFIX}${key}`

// PostHog's own files under the prefix, which an earlier grant may have left
// on the device whether or not this launch read them.
const SDK_DEVICE_KEYS = SDK_STORAGE_FILES.map((key) =>
  deviceKeyOf({ key })
)

const ignore = (): void => undefined

/**
 * The storage PostHog persists through in opt-in mode. While consent is not
 * granted it keeps nothing: it reads no value and drops every value it is
 * handed. `open` first clears PostHog's files under its prefix, and every
 * key a `close` could not remove, then writes the grant marker to the
 * device's key-value storage and, once the device holds it, every value from
 * then on, under its own prefix; when the device refuses one of those
 * removals or the marker, the grant and every later value stay in memory for
 * this launch, so nothing from before it is read. `close` stops writing to
 * the device, forgets every value, waits for every device write already
 * issued and then removes the marker, PostHog's files and every key PostHog
 * wrote or read, keeping each removal the device refuses for the next
 * `open`. The next launch reads the marker back. Neither flip rejects, and
 * each waits for the one before it.
 */
export const createConsentStorage = (): IPostHogConsentStorage => {
  // Where a value goes: nowhere before a grant, to the device once it holds
  // the marker, to memory when it refused it.
  const consent = { isGranted: false, isOnDevice: false }
  const memory = new Map<string, string>()
  const handledKeys = new Set<string>()
  const pendingWrites = new Set<Promise<void>>()
  // The device keys a close could not remove: an open removes them first, or
  // keeps the grant in memory.
  const unremoved = new Set<string>()

  // Every device write is tracked until it lands or fails, so a close can
  // wait for it before it removes the keys.
  const writeToDevice = (item: IStorageItemParams): Promise<void> => {
    const write = keyValueStorage.setItem(item)
    const settled = write.then(ignore, ignore)
    pendingWrites.add(settled)
    void settled.then(() => pendingWrites.delete(settled))
    return write
  }

  // Removes every key, going on past a refusal; resolves to whether the
  // device holds none of them now, and remembers each it still holds.
  const removeFromDevice = async ({
    keys
  }: {
    keys: string[]
  }): Promise<boolean> => {
    const unique = [...new Set(keys)]
    const results = await Promise.allSettled(
      unique.map((key) => keyValueStorage.removeItem({ key }))
    )
    results.forEach(({ status }, index) => {
      const key = unique[index]
      if (key === undefined) return
      if (status === 'rejected') unremoved.add(key)
      else unremoved.delete(key)
    })
    return results.every(({ status }) => status === 'fulfilled')
  }

  const ready = keyValueStorage
    .getItem({ key: CONSENT_GRANTED_KEY })
    .then((value) => {
      consent.isGranted = value === CONSENT_GRANTED_VALUE
      consent.isOnDevice = consent.isGranted
    })
    .catch(ignore)

  // A flip starts once the launch has read the marker and the flip before it
  // has settled, so two never interleave.
  const flips = { last: ready }
  const flip = ({ run }: { run: () => Promise<void> }): Promise<void> => {
    const next = flips.last.then(run)
    flips.last = next.catch(ignore)
    return next
  }

  // Keeps a value PostHog hands over: on the device once it holds the
  // marker, in memory after a refused one, nowhere before a grant.
  const keepValue = async ({
    key,
    value
  }: IStorageItemParams): Promise<void> => {
    await ready
    handledKeys.add(key)
    if (consent.isOnDevice) {
      await writeToDevice({ key: deviceKeyOf({ key }), value })
      return
    }
    if (consent.isGranted) memory.set(key, value)
  }

  return {
    close: () =>
      flip({
        run: async () => {
          consent.isGranted = false
          consent.isOnDevice = false
          memory.clear()
          await Promise.allSettled([...pendingWrites])
          const handled = [...handledKeys].map((key) =>
            deviceKeyOf({ key })
          )
          await removeFromDevice({
            keys: [CONSENT_GRANTED_KEY, ...SDK_DEVICE_KEYS, ...handled]
          })
        }
      }),

    getItem: async (key: string): Promise<string | null> => {
      await ready
      handledKeys.add(key)
      if (consent.isOnDevice) {
        return keyValueStorage.getItem({ key: deviceKeyOf({ key }) })
      }
      return memory.get(key) ?? null
    },

    isGranted: async (): Promise<boolean> => {
      await ready
      return consent.isGranted
    },

    open: () =>
      flip({
        run: async () => {
          if (consent.isGranted) return
          consent.isGranted = true
          // The device holds no marker: what is left under the prefix is an
          // earlier grant's, which no new client may read.
          const isCleared = await removeFromDevice({
            keys: [...SDK_DEVICE_KEYS, ...unremoved]
          })
          // A key the device will not remove keeps the grant in memory for
          // this launch, as a refused marker does.
          if (!isCleared) return
          try {
            await writeToDevice({
              key: CONSENT_GRANTED_KEY,
              value: CONSENT_GRANTED_VALUE
            })
          } catch {
            // The device refused the marker: the grant holds for this launch,
            // in memory, and the next launch reads no grant.
            return
          }
          consent.isOnDevice = true
          const held = [...memory]
          memory.clear()
          await Promise.allSettled(
            held.map(([key, value]) =>
              writeToDevice({ key: deviceKeyOf({ key }), value })
            )
          )
        }
      }),

    // PostHog's customStorage calls setItem with the key and the value as two
    // arguments: they arrive as one list and are kept as one item.
    setItem: (...[key, value]: [key: string, value: string]) =>
      keepValue({ key, value })
  }
}
