import type { IStorageItemParams } from '@app/core'

import {
  CONSENT_GRANTED_KEY,
  CONSENT_GRANTED_VALUE,
  CONSENT_STORAGE_PREFIX
} from '@/lib/posthog/consentStorage.constant'
import type { IPostHogConsentStorage } from '@/lib/posthog/consentStorage.type'
import { keyValueStorage } from '@/lib/storage'

const deviceKeyOf = ({ key }: { key: string }): string =>
  `${CONSENT_STORAGE_PREFIX}${key}`

const ignore = (): void => undefined

/**
 * The storage PostHog persists through in opt-in mode. While consent is not
 * granted it keeps nothing: it reads no value and drops every value it is
 * handed. `open` writes the grant marker to the device's key-value storage
 * and, once the device holds it, every value from then on, under its own
 * prefix; when the device refuses the marker, the grant and every later
 * value stay in memory for this launch. `close` stops writing to the device,
 * forgets every value, waits for every device write already issued and then
 * removes the marker and every key PostHog wrote or read, going on past a
 * removal the device refuses. The next launch reads the marker back. Neither
 * flip rejects, and each waits for the one before it.
 */
export const createConsentStorage = (): IPostHogConsentStorage => {
  // Where a value goes: nowhere before a grant, to the device once it holds
  // the marker, to memory when it refused it.
  const consent = { isGranted: false, isOnDevice: false }
  const memory = new Map<string, string>()
  const handledKeys = new Set<string>()
  const pendingWrites = new Set<Promise<void>>()

  // Every device write is tracked until it lands or fails, so a close can
  // wait for it before it removes the keys.
  const writeToDevice = (item: IStorageItemParams): Promise<void> => {
    const write = keyValueStorage.setItem(item)
    const settled = write.then(ignore, ignore)
    pendingWrites.add(settled)
    void settled.then(() => pendingWrites.delete(settled))
    return write
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

  return {
    close: () =>
      flip({
        run: async () => {
          consent.isGranted = false
          consent.isOnDevice = false
          memory.clear()
          await Promise.allSettled([...pendingWrites])
          const deviceKeys = [...handledKeys].map((key) =>
            deviceKeyOf({ key })
          )
          await Promise.allSettled(
            [CONSENT_GRANTED_KEY, ...deviceKeys].map((key) =>
              keyValueStorage.removeItem({ key })
            )
          )
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

    // eslint-disable-next-line local/single-object-params -- PostHog's customStorage contract is setItem(key, value)
    setItem: async (key: string, value: string): Promise<void> => {
      await ready
      handledKeys.add(key)
      if (consent.isOnDevice) {
        await writeToDevice({ key: deviceKeyOf({ key }), value })
        return
      }
      if (consent.isGranted) memory.set(key, value)
    }
  }
}
