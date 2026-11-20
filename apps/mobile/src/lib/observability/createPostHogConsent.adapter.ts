import {
  ConsentStatusEnum,
  type ConsentStatusType,
  type IConsentPort
} from '@app/core'

import {
  posthogConsentStorage,
  startPostHogClient,
  stopPostHogClient
} from '@/lib/posthog/posthogClient.adapter'

/**
 * PostHog adapter for IConsentPort, the default of the consent composition
 * root. Only the opt-in mode asks consent, and only it has a consent storage:
 * a grant opens the storage, constructs the client and then opts PostHog in;
 * a revoke drops the client at once, so every later call is dropped, and a
 * launch's restore of an earlier grant with it, then opts it out, empties
 * its queues and shuts it down, so nothing captured before the revoke is
 * sent after it, while it closes the storage, which removes what PostHog
 * stored and keeps nothing more; the refusal holds for this launch only. A later grant constructs a new client, which reads nothing the
 * dropped one stored. In any other mode, and without a key, every call
 * changes nothing and the status is not-required.
 */
export const createPostHogConsent = (): IConsentPort => {
  const consentStorage = posthogConsentStorage
  const choice = { isRevoked: false }

  return {
    getStatus: async (): Promise<ConsentStatusType> => {
      if (!consentStorage) return ConsentStatusEnum.NOT_REQUIRED
      if (await consentStorage.isGranted())
        return ConsentStatusEnum.GRANTED
      return choice.isRevoked
        ? ConsentStatusEnum.DENIED
        : ConsentStatusEnum.PENDING
    },

    grant: async (): Promise<void> => {
      if (!consentStorage) return
      choice.isRevoked = false
      await consentStorage.open()
      await startPostHogClient()?.optIn()
    },

    revoke: async (): Promise<void> => {
      if (!consentStorage) return
      choice.isRevoked = true
      // The client is dropped before the storage closes, so no call made
      // while it closes reaches PostHog.
      await Promise.all([stopPostHogClient(), consentStorage.close()])
    }
  }
}
