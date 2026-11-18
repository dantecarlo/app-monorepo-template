import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  CONSENT_GRANTED_KEY,
  CONSENT_GRANTED_VALUE,
  CONSENT_STORAGE_PREFIX
} from '@/lib/posthog/consentStorage.constant'
import type { IPostHogConsentStorage } from '@/lib/posthog/consentStorage.type'

const deviceKeyOf = ({ key }: { key: string }): string =>
  `${CONSENT_STORAGE_PREFIX}${key}`

/**
 * The storage PostHog persists through in opt-in mode. Until consent is
 * granted it holds every value in memory and writes nothing to the device.
 * `open` writes the grant marker, the held values and every later value to
 * AsyncStorage; `close` stops writing there and removes the marker and every
 * key PostHog wrote or read. The next launch reads the marker back. Each flip
 * issues its writes or removals before any later value, so none lands out of
 * order.
 */
export const createConsentStorage = (): IPostHogConsentStorage => {
  const held = new Map<string, string>()
  const handledKeys = new Set<string>()
  const consent = { isGranted: false }
  const ready = AsyncStorage.getItem(CONSENT_GRANTED_KEY)
    .then((value) => {
      consent.isGranted = value === CONSENT_GRANTED_VALUE
    })
    .catch(() => {
      consent.isGranted = false
    })

  return {
    close: async (): Promise<void> => {
      await ready
      consent.isGranted = false
      held.clear()
      const deviceKeys = [...handledKeys].map((key) =>
        deviceKeyOf({ key })
      )
      await Promise.all(
        [CONSENT_GRANTED_KEY, ...deviceKeys].map((deviceKey) =>
          AsyncStorage.removeItem(deviceKey)
        )
      )
    },

    getItem: async (key: string): Promise<string | null> => {
      await ready
      handledKeys.add(key)
      if (consent.isGranted)
        return AsyncStorage.getItem(deviceKeyOf({ key }))
      return held.get(key) ?? null
    },

    isGranted: async (): Promise<boolean> => {
      await ready
      return consent.isGranted
    },

    open: async (): Promise<void> => {
      await ready
      if (consent.isGranted) return
      consent.isGranted = true
      const writes = [
        AsyncStorage.setItem(CONSENT_GRANTED_KEY, CONSENT_GRANTED_VALUE),
        ...[...held].map(([key, value]) =>
          AsyncStorage.setItem(deviceKeyOf({ key }), value)
        )
      ]
      held.clear()
      await Promise.all(writes)
    },

    // eslint-disable-next-line local/single-object-params -- PostHog's customStorage contract is setItem(key, value)
    setItem: async (key: string, value: string): Promise<void> => {
      await ready
      handledKeys.add(key)
      if (consent.isGranted) {
        await AsyncStorage.setItem(deviceKeyOf({ key }), value)
        return
      }
      held.set(key, value)
    }
  }
}
