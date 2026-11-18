import {
  ConsentStatusEnum,
  type ConsentStatusType,
  type IConsentPort
} from '@app/core'

import { POSTHOG_REVOKE_KEPT_PROPERTIES } from '@/lib/observability/createPostHogConsent.constant'
import {
  getPostHogClient,
  posthogConsentStorage,
  startPostHogClient,
  stopPostHogClient
} from '@/lib/posthog/posthogClient.adapter'

/**
 * PostHog adapter for IConsentPort, the default of the consent composition
 * root. Only the opt-in mode asks consent, and only it has a consent storage:
 * a grant constructs the client, opens the storage and then opts PostHog in;
 * a revoke closes the storage, which removes what PostHog stored, drops the
 * client so every later call is dropped, and then opts it out and resets it,
 * so the refusal holds for this launch only. A later grant constructs a new
 * client. In any other mode, and without a key, every call changes nothing
 * and the status is not-required.
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
      const client = startPostHogClient()
      await consentStorage.open()
      await client?.optIn()
    },

    revoke: async (): Promise<void> => {
      if (!consentStorage) return
      choice.isRevoked = true
      await consentStorage.close()
      const client = getPostHogClient()
      stopPostHogClient()
      if (!client) return
      await client.optOut()
      client.reset(POSTHOG_REVOKE_KEPT_PROPERTIES)
    }
  }
}
